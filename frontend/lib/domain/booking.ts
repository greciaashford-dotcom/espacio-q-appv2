import { prisma, sequentialWrites } from "@/lib/db/prisma";
import { newId } from "@/lib/db/id";
import {
  getEffectiveProfessionalIntervals,
  type TimeIntervalStr,
} from "@/lib/domain/schedule";
import {
  madridLocalToUtc,
  minutesToTimeStr,
  timeStrToMinutes,
  utcToMadridParts,
} from "@/lib/domain/timezone";
import {
  calculateDiscountedCents,
  validatePromoCoupon,
  type ValidatedPromoCoupon,
} from "@/lib/domain/promo-coupon";
import { generateOpaqueToken, hashToken } from "@/lib/security/crypto";
import { formatPrice, normalizeEmail, normalizePhone } from "@/lib/utils";
import type { PrismaClient, Prisma } from "@/lib/db/prisma";

type DbClient = PrismaClient | Prisma.TransactionClient;

export type AvailableSlot = {
  time: string; // "HH:mm" en Europe/Madrid
  endTime: string; // "HH:mm" fin del servicio (sin contar buffer posterior para mostrar al cliente)
  startAtUtc: string;
  endAtUtc: string;
  availableProfessionalIds: string[];
};

/** Compensación de una reserva a medio escribir: no deja citas, jobs ni ocupaciones (bloqueos) huérfanos. */
async function compensateFailedBooking(ids: {
  appointmentId: string;
  occupancyId: string;
  createdClientId: string | null;
}): Promise<void> {
  const steps: Array<() => Promise<unknown>> = [
    () => prisma.notificationJob.deleteMany({ where: { appointmentId: ids.appointmentId } }),
    () => prisma.outboxEvent.deleteMany({ where: { AggregateId: ids.appointmentId } }),
    () => prisma.appointmentEvent.deleteMany({ where: { appointmentId: ids.appointmentId } }),
    () => prisma.occupancy.deleteMany({ where: { id: ids.occupancyId } }),
    () => prisma.appointment.deleteMany({ where: { id: ids.appointmentId } }),
    async () => {
      if (!ids.createdClientId) return;
      const others = await prisma.appointment.count({ where: { clientId: ids.createdClientId } });
      if (others === 0) await prisma.client.deleteMany({ where: { id: ids.createdClientId } });
    },
  ];
  for (const step of steps) {
    await step().catch((e) => console.error("[booking] compensación fallida", e));
  }
}

export async function purgeExpiredHolds(db: DbClient = prisma): Promise<void> {
  const now = new Date();
  await db.occupancy.updateMany({
    where: {
      active: true,
      expiresAtUtc: { not: null, lte: now },
    },
    data: { active: false },
  });
}

/**
 * Calcula los horarios realmente disponibles en el servidor para una fecha, servicio y profesional (o "any").
 */
export async function calculateAvailableSlots(params: {
  serviceId: string;
  dateStr: string; // YYYY-MM-DD en Europe/Madrid
  professionalId?: string | "any";
  excludeAppointmentId?: string;
  nowUtc?: Date;
  bypassAdvanceNotice?: boolean;
  db?: DbClient;
}): Promise<{
  bookingReady: boolean;
  standbyReason?: string;
  dateStr: string;
  slots: AvailableSlot[];
}> {
  const db = params.db ?? prisma;
  const now = params.nowUtc ?? new Date();

  await purgeExpiredHolds(db);

  const settings = await db.salonSettings.findUnique({ where: { id: "default" } });
  if (!settings || !settings.scheduleConfirmed) {
    return {
      bookingReady: false,
      standbyReason:
        "Reservas online próximamente: el horario del salón está pendiente de confirmación.",
      dateStr: params.dateStr,
      slots: [],
    };
  }

  const service = await db.service.findFirst({
    where: { id: params.serviceId, active: true },
    include: {
      professionals: {
        where: { active: true, professional: { active: true } },
        include: { professional: true },
      },
    },
  });

  if (!service || service.professionals.length === 0) {
    return {
      bookingReady: false,
      standbyReason:
        "Este servicio no tiene profesionales activos asignados actualmente.",
      dateStr: params.dateStr,
      slots: [],
    };
  }

  // Filtrar por profesional solicitado o todos los habilitados para este servicio
  const candidateLinks =
    params.professionalId && params.professionalId !== "any"
      ? service.professionals.filter(
          (ps: any) => ps.professionalId === params.professionalId
        )
      : service.professionals;

  if (candidateLinks.length === 0) {
    return {
      bookingReady: true,
      dateStr: params.dateStr,
      slots: [],
    };
  }

  // Comprobar horizonte máximo de reserva
  if (!params.bypassAdvanceNotice) {
    const maxHorizonUtc = new Date(
      now.getTime() + settings.maxBookingHorizonDays * 24 * 60 * 60 * 1000
    );
    const dayStartConv = madridLocalToUtc(params.dateStr, "00:00");
    if (!dayStartConv.ok || dayStartConv.utcDate > maxHorizonUtc) {
      return {
        bookingReady: true,
        dateStr: params.dateStr,
        slots: [],
      };
    }
  }

  const minAllowedStartUtc = params.bypassAdvanceNotice
    ? new Date(0)
    : new Date(now.getTime() + settings.minAdvanceNoticeMin * 60 * 1000);

  const slotStepMin = Math.max(5, settings.slotIntervalMin || 15);
  const slotMap = new Map<
    string,
    {
      time: string;
      endTime: string;
      startAtUtc: Date;
      endAtUtc: Date;
      availableProfessionalIds: string[];
    }
  >();

  for (const link of candidateLinks) {
    const proId = link.professionalId;
    const durationMin = link.customDurationMin ?? service.durationMin;
    const bufferBeforeMin = service.bufferBeforeMin;
    const bufferAfterMin = service.bufferAfterMin;

    const proSchedule = await getEffectiveProfessionalIntervals(
      proId,
      params.dateStr,
      db
    );
    if (!proSchedule.isAvailable || proSchedule.intervals.length === 0) {
      continue;
    }

    // Obtener ocupaciones activas del profesional que puedan intersectar este día
    const dayFirstUtc = proSchedule.utcIntervals[0].startUtc;
    const dayLastUtc =
      proSchedule.utcIntervals[proSchedule.utcIntervals.length - 1].endUtc;

    const occupancies = await db.occupancy.findMany({
      where: {
        professionalId: proId,
        active: true,
        ...(params.excludeAppointmentId
          ? {
              OR: [
                { appointmentId: null },
                { appointmentId: { not: params.excludeAppointmentId } },
              ],
            }
          : {}),
        startAtUtc: { lt: dayLastUtc },
        endAtUtc: { gt: dayFirstUtc },
      },
    });

    for (const interval of proSchedule.intervals) {
      const intervalStartMin = timeStrToMinutes(interval.start);
      const intervalEndMin = timeStrToMinutes(interval.end);

      for (
        let startMin = intervalStartMin;
        startMin + durationMin <= intervalEndMin;
        startMin += slotStepMin
      ) {
        const blockStartMin = startMin - bufferBeforeMin;
        const blockEndMin = startMin + durationMin + bufferAfterMin;

        // Regla crítica: la cita COMPLETA, incluidos buffers pre y post, debe caber dentro del intervalo permitido
        if (blockStartMin < intervalStartMin || blockEndMin > intervalEndMin) {
          continue;
        }

        const startTimeStr = minutesToTimeStr(startMin);
        const endTimeStr = minutesToTimeStr(startMin + durationMin);
        const blockStartStr = minutesToTimeStr(blockStartMin);
        const blockEndStr = minutesToTimeStr(blockEndMin);

        const startUtcConv = madridLocalToUtc(params.dateStr, startTimeStr);
        const endUtcConv = madridLocalToUtc(params.dateStr, endTimeStr);
        const blockStartUtcConv = madridLocalToUtc(params.dateStr, blockStartStr);
        const blockEndUtcConv = madridLocalToUtc(params.dateStr, blockEndStr);

        if (
          !startUtcConv.ok ||
          !endUtcConv.ok ||
          !blockStartUtcConv.ok ||
          !blockEndUtcConv.ok
        ) {
          // Si alguna de las horas cae en la hora inexistente del cambio de hora DST, se descarta
          continue;
        }

        const startAtUtc = startUtcConv.utcDate;
        const endAtUtc = endUtcConv.utcDate;
        const blockStartAtUtc = blockStartUtcConv.utcDate;
        const blockEndAtUtc = blockEndUtcConv.utcDate;

        // Validar duración real en UTC (evita anomalías si un servicio cruza el cambio de hora)
        const expectedBlockMs =
          (bufferBeforeMin + durationMin + bufferAfterMin) * 60 * 1000;
        if (blockEndAtUtc.getTime() - blockStartAtUtc.getTime() !== expectedBlockMs) {
          continue;
        }

        if (startAtUtc < minAllowedStartUtc) {
          continue;
        }

        // Comprobar solapamiento semiabierto [blockStartAtUtc, blockEndAtUtc) contra ocupaciones activas
        const hasOverlap = occupancies.some(
          (occ) =>
            blockStartAtUtc < occ.endAtUtc && blockEndAtUtc > occ.startAtUtc
        );

        if (hasOverlap) {
          continue;
        }

        const existingSlot = slotMap.get(startTimeStr);
        if (existingSlot) {
          if (!existingSlot.availableProfessionalIds.includes(proId)) {
            existingSlot.availableProfessionalIds.push(proId);
          }
        } else {
          slotMap.set(startTimeStr, {
            time: startTimeStr,
            endTime: endTimeStr,
            startAtUtc,
            endAtUtc,
            availableProfessionalIds: [proId],
          });
        }
      }
    }
  }

  const sortedSlots: AvailableSlot[] = Array.from(slotMap.values())
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((s) => ({
      time: s.time,
      endTime: s.endTime,
      startAtUtc: s.startAtUtc.toISOString(),
      endAtUtc: s.endAtUtc.toISOString(),
      availableProfessionalIds: s.availableProfessionalIds,
    }));

  return {
    bookingReady: true,
    dateStr: params.dateStr,
    slots: sortedSlots,
  };
}

function generateReferenceCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `EQ-${suffix}`;
}

export type CreateBookingInput = {
  serviceId: string;
  professionalId: string; // ID específico o "any"
  dateStr: string; // YYYY-MM-DD en Europe/Madrid
  startTime: string; // HH:mm en Europe/Madrid
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerNotes?: string | null;
  internalNotes?: string | null;
  couponCode?: string | null;
  idempotencyKey?: string | null;
  actorType?: "CLIENT" | "ADMIN";
  actorId?: string | null;
  bypassAdvanceNotice?: boolean;
  nowUtc?: Date;
};

export type AppliedCouponSummary = {
  code: string;
  discountPercent: number;
  label: string;
  originalPriceCents: number | null;
  finalPriceCents: number | null;
};

export type CreateBookingResult =
  | {
      ok: true;
      idempotentReplay: boolean;
      appointment: {
        id: string;
        referenceCode: string;
        status: string;
        dateStrMadrid: string;
        startTimeMadrid: string;
        endTimeMadrid: string;
        serviceName: string;
        durationMin: number;
        priceType: string;
        priceCents: number | null;
        currency: string;
        professionalId: string;
        professionalName: string;
        customerName: string;
        customerEmail: string | null;
        appliedCoupon?: AppliedCouponSummary | null;
      };
      manageToken?: string;
    }
  | {
      ok: false;
      status: 400 | 404 | 409 | 422;
      code: string;
      error: string;
      alternatives?: AvailableSlot[];
    };

/**
 * Crea una reserva de forma atómica e idempotente, protegiendo contra condiciones de carrera
 * mediante bloqueos atómicos por minuto (índice único en slotLocks) + escrituras compensadas en Occupancy,
 * guardando snapshots del servicio y encolando notificaciones en el Outbox/NotificationJob.
 */
export async function createBookingAtomic(
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  const now = input.nowUtc ?? new Date();
  const normalizedEmail = normalizeEmail(input.customerEmail);
  const normalizedPhone = normalizePhone(input.customerPhone);

  let validatedPromo: ValidatedPromoCoupon | null = null;
  if (input.couponCode && input.couponCode.trim().length > 0) {
    const promoCheck = validatePromoCoupon(input.couponCode);
    if (!promoCheck.valid) {
      return {
        ok: false,
        status: 400,
        code: "INVALID_COUPON",
        error: promoCheck.error,
      };
    }
    validatedPromo = promoCheck;
  }

  // 1. Verificar idempotencia antes de abrir transacción pesada
  if (input.idempotencyKey) {
    const existingByIdem = await prisma.appointment.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { professional: true },
    });
    if (existingByIdem) {
      return {
        ok: true,
        idempotentReplay: true,
        appointment: {
          id: existingByIdem.id,
          referenceCode: existingByIdem.referenceCode,
          status: existingByIdem.status,
          dateStrMadrid: existingByIdem.dateStrMadrid,
          startTimeMadrid: existingByIdem.startTimeMadrid,
          endTimeMadrid: existingByIdem.endTimeMadrid,
          serviceName: existingByIdem.serviceNameSnapshot,
          durationMin: existingByIdem.durationMinSnapshot,
          priceType: existingByIdem.priceTypeSnapshot,
          priceCents: existingByIdem.priceCentsSnapshot,
          currency: existingByIdem.currencySnapshot,
          professionalId: existingByIdem.professionalId,
          professionalName: existingByIdem.professional.name,
          customerName: existingByIdem.customerName,
          customerEmail: existingByIdem.customerEmail,
        },
      };
    }
  }

  try {
    const txResult = await sequentialWrites(async (tx) => {
      const settings = await tx.salonSettings.findUnique({
        where: { id: "default" },
      });

      if (!settings || !settings.scheduleConfirmed) {
        return {
          ok: false as const,
          status: 422 as const,
          code: "BOOKING_NOT_READY",
          error:
            "El sistema de reservas no tiene horario confirmado en este momento.",
        };
      }

      if (input.actorType !== "ADMIN" && !settings.publicBookingEnabled) {
        return {
          ok: false as const,
          status: 422 as const,
          code: "PUBLIC_BOOKING_DISABLED",
          error: "Las reservas online están temporalmente en mantenimiento.",
        };
      }

      const availability = await calculateAvailableSlots({
        serviceId: input.serviceId,
        dateStr: input.dateStr,
        professionalId: input.professionalId,
        nowUtc: now,
        bypassAdvanceNotice: input.bypassAdvanceNotice,
        db: tx,
      });

      const matchingSlot = availability.slots.find(
        (s) => s.time === input.startTime
      );

      if (!matchingSlot || matchingSlot.availableProfessionalIds.length === 0) {
        return {
          ok: false as const,
          status: 409 as const,
          code: "SLOT_UNAVAILABLE",
          error:
            "La franja horaria seleccionada ya no está disponible. Te mostramos las alternativas disponibles para esta fecha.",
          alternatives: availability.slots.slice(0, 8),
        };
      }

      // Resolver profesional real si se pidió "any"
      const assignedAny = input.professionalId === "any";
      const chosenProId = assignedAny
        ? matchingSlot.availableProfessionalIds[0]
        : input.professionalId;

      if (!matchingSlot.availableProfessionalIds.includes(chosenProId)) {
        return {
          ok: false as const,
          status: 409 as const,
          code: "PROFESSIONAL_UNAVAILABLE",
          error: "El profesional seleccionado no está disponible en esa franja.",
          alternatives: availability.slots.slice(0, 8),
        };
      }

      const service = await tx.service.findUniqueOrThrow({
        where: { id: input.serviceId },
      });
      const proLink = await tx.professionalService.findUniqueOrThrow({
        where: {
          professionalId_serviceId: {
            professionalId: chosenProId,
            serviceId: input.serviceId,
          },
        },
        include: { professional: true },
      });

      const durationMin = proLink.customDurationMin ?? service.durationMin;
      const basePriceCents = proLink.customPriceCents ?? service.priceCents;
      const finalPriceCents = validatedPromo
        ? calculateDiscountedCents(basePriceCents, validatedPromo.discountPercent)
        : basePriceCents;
      const bufferBeforeMin = service.bufferBeforeMin;
      const bufferAfterMin = service.bufferAfterMin;

      const startMin = timeStrToMinutes(input.startTime);
      const endTimeStr = minutesToTimeStr(startMin + durationMin);
      const blockStartStr = minutesToTimeStr(startMin - bufferBeforeMin);
      const blockEndStr = minutesToTimeStr(
        startMin + durationMin + bufferAfterMin
      );

      const startUtcConv = madridLocalToUtc(input.dateStr, input.startTime);
      const endUtcConv = madridLocalToUtc(input.dateStr, endTimeStr);
      const blockStartUtcConv = madridLocalToUtc(input.dateStr, blockStartStr);
      const blockEndUtcConv = madridLocalToUtc(input.dateStr, blockEndStr);

      if (
        !startUtcConv.ok ||
        !endUtcConv.ok ||
        !blockStartUtcConv.ok ||
        !blockEndUtcConv.ok
      ) {
        return {
          ok: false as const,
          status: 400 as const,
          code: "INVALID_TIME",
          error: "La hora indicada no es válida en Europe/Madrid.",
        };
      }

      // 1) Bloqueo anti-solapamiento: la Occupancy se crea ANTES que la cita. Su inserción reserva
      // atómicamente los minutos [blockStart, blockEnd) del profesional (índice único en slotLocks).
      // Si otra reserva concurrente ya los tiene, lanza SlotOverlapError → 409 CONCURRENT_OVERLAP.
      const appointmentId = newId();
      const occupancyId = newId();
      await tx.occupancy.create({
        data: {
          id: occupancyId,
          professionalId: chosenProId,
          appointmentId,
          reason: "APPOINTMENT",
          startAtUtc: blockStartUtcConv.utcDate,
          endAtUtc: blockEndUtcConv.utcDate,
          active: true,
        },
      });

      // 2) Resto de escrituras secuenciales; ante cualquier fallo se compensa (sin ocupaciones huérfanas).
      let createdClientId: string | null = null;
      try {
      // Buscar o crear cliente en el CRM (sin suscribir a marketing por reservar)
      let client = normalizedEmail
        ? await tx.client.findFirst({
            where: { emailNormalized: normalizedEmail, status: "ACTIVE" },
          })
        : null;

      if (!client) {
        const nameParts = input.customerName.trim().split(/\s+/);
        const firstName = nameParts[0] || "Cliente";
        const lastName =
          nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

        client = await tx.client.create({
          data: {
            firstName,
            lastName,
            email: normalizedEmail,
            emailNormalized: normalizedEmail,
            phone: input.customerPhone?.trim() || null,
            phoneNormalized: normalizedPhone,
            tags: ["reserva-web"],
            marketingConsent: false,
          },
        });
        createdClientId = client.id;
      }

      const rawManageToken = generateOpaqueToken(32);
      const manageTokenHash = hashToken(rawManageToken);
      const manageTokenExpiresAt = new Date(
        blockEndUtcConv.utcDate.getTime() + 7 * 24 * 60 * 60 * 1000
      );

      const initialStatus =
        settings.bookingApprovalMode === "MANUAL" && input.actorType !== "ADMIN"
          ? "PENDING_APPROVAL"
          : "CONFIRMED";

      const promoInternalNote = validatedPromo
        ? basePriceCents !== null
          ? `[Cupón ${validatedPromo.code} (−${validatedPromo.discountPercent}% Black Friday) aplicado · PVP base: ${formatPrice("FIXED", basePriceCents, service.currency)} → Final: ${formatPrice("FIXED", finalPriceCents, service.currency)}]`
          : `[Cupón ${validatedPromo.code} (−${validatedPromo.discountPercent}% Black Friday) aplicado sobre valoración en salón]`
        : null;

      const combinedInternalNotes =
        [input.internalNotes?.trim(), promoInternalNote]
          .filter(Boolean)
          .join(" | ") || null;

      const appointment = await tx.appointment.create({
        data: {
          id: appointmentId,
          referenceCode: generateReferenceCode(),
          clientId: client.id,
          serviceId: service.id,
          professionalId: chosenProId,
          assignedAnyProfessional: assignedAny,
          status: initialStatus,
          dateStrMadrid: input.dateStr,
          startTimeMadrid: input.startTime,
          endTimeMadrid: endTimeStr,
          startAtUtc: startUtcConv.utcDate,
          endAtUtc: endUtcConv.utcDate,
          blockStartAtUtc: blockStartUtcConv.utcDate,
          blockEndAtUtc: blockEndUtcConv.utcDate,
          serviceNameSnapshot: service.name,
          durationMinSnapshot: durationMin,
          bufferBeforeSnapshot: bufferBeforeMin,
          bufferAfterSnapshot: bufferAfterMin,
          priceTypeSnapshot: service.priceType,
          priceCentsSnapshot: finalPriceCents,
          currencySnapshot: service.currency,
          customerName: input.customerName.trim(),
          customerEmail: normalizedEmail,
          customerPhone: input.customerPhone?.trim() || null,
          customerNotes: input.customerNotes?.trim() || null,
          internalNotes: combinedInternalNotes,
          manageTokenHash,
          manageTokenExpiresAt,
          idempotencyKey: input.idempotencyKey || null,
          version: 1,
        },
      });

      await tx.appointmentEvent.create({
        data: {
          appointmentId: appointment.id,
          eventType: "CREATED",
          fromStatus: null,
          toStatus: initialStatus,
          actorType: input.actorType ?? "CLIENT",
          actorId: input.actorId ?? null,
          detailsJson: {
            assignedAny,
            professionalName: proLink.professional.name,
            ...(validatedPromo
              ? {
                  couponCode: validatedPromo.code,
                  discountPercent: validatedPromo.discountPercent,
                  originalPriceCents: basePriceCents,
                  finalPriceCents,
                }
              : {}),
          },
        },
      });

      // Outbox y Jobs de correo dentro de la misma transacción
      await tx.outboxEvent.create({
        data: {
          eventType:
            initialStatus === "CONFIRMED"
              ? "APPOINTMENT_CONFIRMED"
              : "APPOINTMENT_REQUESTED",
          AggregateId: appointment.id,
          payloadJson: {
            appointmentId: appointment.id,
            referenceCode: appointment.referenceCode,
            manageToken: rawManageToken,
          },
        },
      });

      // Aviso interno al salón (la dirección se resuelve al enviar; sin dirección → job cancelado con motivo)
      await tx.notificationJob.create({
        data: {
          jobType: "SEND_TRANSACTIONAL_EMAIL",
          dedupKey: `salon-notice-booking:${appointment.id}`,
          appointmentId: appointment.id,
          appointmentVer: 1,
          scheduledAtUtc: now,
          nextAttemptUtc: now,
          payloadJson: { templateKey: "SALON_NOTICE_BOOKING", appointmentId: appointment.id },
        },
      });

      // Bienvenida única al cliente en su primera cita (dedupKey por cliente: nunca se repite)
      if (normalizedEmail && !client.welcomeSentAt) {
        const previous = await tx.appointment.count({
          where: { clientId: client.id, id: { not: appointment.id } },
        });
        if (previous === 0) {
          await tx.notificationJob
            .create({
              data: {
                jobType: "SEND_TRANSACTIONAL_EMAIL",
                dedupKey: `client-welcome:${client.id}`,
                appointmentId: appointment.id,
                appointmentVer: 1,
                scheduledAtUtc: now,
                nextAttemptUtc: now,
                payloadJson: { templateKey: "CLIENT_WELCOME", toEmail: normalizedEmail, appointmentId: appointment.id },
              },
            })
            .catch((e: any) => {
              if (e?.code !== "P2002") throw e;
            });
        }
      }

      if (normalizedEmail) {
        const templateKey =
          initialStatus === "CONFIRMED"
            ? "APPOINTMENT_CONFIRMATION"
            : "APPOINTMENT_REQUEST_PENDING";

        await tx.notificationJob.create({
          data: {
            jobType: "SEND_TRANSACTIONAL_EMAIL",
            dedupKey: `appt-init:${appointment.id}:v1`,
            appointmentId: appointment.id,
            appointmentVer: 1,
            scheduledAtUtc: now,
            nextAttemptUtc: now,
            payloadJson: {
              templateKey,
              toEmail: normalizedEmail,
              appointmentId: appointment.id,
              manageToken: rawManageToken,
            },
          },
        });

        // Programar recordatorios 24h y 2h antes solo si la cita está CONFIRMED y falta suficiente antelación
        if (initialStatus === "CONFIRMED") {
          const reminder24hUtc = new Date(
            startUtcConv.utcDate.getTime() - 24 * 60 * 60 * 1000
          );
          if (reminder24hUtc > now) {
            await tx.notificationJob.create({
              data: {
                jobType: "APPOINTMENT_REMINDER",
                dedupKey: `appt-rem24h:${appointment.id}:v1`,
                appointmentId: appointment.id,
                appointmentVer: 1,
                scheduledAtUtc: reminder24hUtc,
                nextAttemptUtc: reminder24hUtc,
                payloadJson: {
                  templateKey: "APPOINTMENT_REMINDER_24H",
                  toEmail: normalizedEmail,
                  appointmentId: appointment.id,
                },
              },
            });
          }

          const reminder2hUtc = new Date(
            startUtcConv.utcDate.getTime() - 2 * 60 * 60 * 1000
          );
          if (reminder2hUtc > now) {
            await tx.notificationJob.create({
              data: {
                jobType: "APPOINTMENT_REMINDER",
                dedupKey: `appt-rem2h:${appointment.id}:v1`,
                appointmentId: appointment.id,
                appointmentVer: 1,
                scheduledAtUtc: reminder2hUtc,
                nextAttemptUtc: reminder2hUtc,
                payloadJson: {
                  templateKey: "APPOINTMENT_REMINDER_2H",
                  toEmail: normalizedEmail,
                  appointmentId: appointment.id,
                },
              },
            });
          }
        }
      }

      return {
        ok: true as const,
        idempotentReplay: false,
        appointment: {
          id: appointment.id,
          referenceCode: appointment.referenceCode,
          status: appointment.status,
          dateStrMadrid: appointment.dateStrMadrid,
          startTimeMadrid: appointment.startTimeMadrid,
          endTimeMadrid: appointment.endTimeMadrid,
          serviceName: appointment.serviceNameSnapshot,
          durationMin: appointment.durationMinSnapshot,
          priceType: appointment.priceTypeSnapshot,
          priceCents: appointment.priceCentsSnapshot,
          currency: appointment.currencySnapshot,
          professionalId: chosenProId,
          professionalName: proLink.professional.name,
          customerName: appointment.customerName,
          customerEmail: appointment.customerEmail,
          appliedCoupon: validatedPromo
            ? {
                code: validatedPromo.code,
                discountPercent: validatedPromo.discountPercent,
                label: validatedPromo.label,
                originalPriceCents: basePriceCents,
                finalPriceCents,
              }
            : null,
        },
        manageToken: rawManageToken,
      };
      } catch (err) {
        await compensateFailedBooking({ appointmentId, occupancyId, createdClientId });
        throw err;
      }
    });

    return txResult;
  } catch (err: any) {
    // Si otro hilo concurrente insertó la misma idempotencyKey justo antes
    if (input.idempotencyKey) {
      const existingByIdem = await prisma.appointment.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: { professional: true },
      });
      if (existingByIdem) {
        return {
          ok: true,
          idempotentReplay: true,
          appointment: {
            id: existingByIdem.id,
            referenceCode: existingByIdem.referenceCode,
            status: existingByIdem.status,
            dateStrMadrid: existingByIdem.dateStrMadrid,
            startTimeMadrid: existingByIdem.startTimeMadrid,
            endTimeMadrid: existingByIdem.endTimeMadrid,
            serviceName: existingByIdem.serviceNameSnapshot,
            durationMin: existingByIdem.durationMinSnapshot,
            priceType: existingByIdem.priceTypeSnapshot,
            priceCents: existingByIdem.priceCentsSnapshot,
            currency: existingByIdem.currencySnapshot,
            professionalId: existingByIdem.professionalId,
            professionalName: existingByIdem.professional.name,
            customerName: existingByIdem.customerName,
            customerEmail: existingByIdem.customerEmail,
          },
        };
      }
    }

    // Bloqueo de franja ocupado por otra reserva concurrente (SlotOverlapError) u otro fallo compensado
    const alternatives = await calculateAvailableSlots({
      serviceId: input.serviceId,
      dateStr: input.dateStr,
      professionalId: input.professionalId,
      nowUtc: now,
    }).catch(() => ({ slots: [] as AvailableSlot[] }));

    return {
      ok: false,
      status: 409,
      code: "CONCURRENT_OVERLAP",
      error:
        "Otra reserva acaba de ocupar esta franja horaria de forma simultánea. Tu solicitud no se ha duplicado; por favor elige una de las franjas alternativas.",
      alternatives: alternatives.slots.slice(0, 8),
    };
  }
}

/**
 * Reprograma una cita de forma atómica. Si la nueva franja falla o está ocupada,
 * la cita original y su ocupación permanecen intactas.
 */
export async function rescheduleBookingAtomic(params: {
  appointmentId: string;
  newDateStr: string;
  newStartTime: string;
  actorType: "CLIENT" | "ADMIN";
  actorId?: string;
  bypassPolicyWindow?: boolean;
  nowUtc?: Date;
}): Promise<
  | {
      ok: true;
      appointment: {
        id: string;
        referenceCode: string;
        dateStrMadrid: string;
        startTimeMadrid: string;
        endTimeMadrid: string;
        version: number;
      };
    }
  | {
      ok: false;
      status: 400 | 403 | 404 | 409;
      error: string;
      alternatives?: AvailableSlot[];
    }
> {
  const now = params.nowUtc ?? new Date();

  try {
    return await sequentialWrites(async (tx) => {
      const appt = await tx.appointment.findUnique({
        where: { id: params.appointmentId },
      });

      if (!appt) {
        return {
          ok: false as const,
          status: 404 as const,
          error: "Cita no encontrada.",
        };
      }

      if (
        appt.status === "CANCELLED" ||
        appt.status === "COMPLETED" ||
        appt.status === "NO_SHOW"
      ) {
        return {
          ok: false as const,
          status: 400 as const,
          error: "No es posible reprogramar una cita cancelada o finalizada.",
        };
      }

      const settings = await tx.salonSettings.findUnique({
        where: { id: "default" },
      });

      if (params.actorType === "CLIENT" && !params.bypassPolicyWindow) {
        const minHours = settings?.rescheduleFreeHours ?? 24;
        const limitUtc = new Date(
          appt.startAtUtc.getTime() - minHours * 60 * 60 * 1000
        );
        if (now > limitUtc) {
          return {
            ok: false as const,
            status: 403 as const,
            error: `Las modificaciones online requieren al menos ${minHours} horas de antelación. Por favor, contacta con el salón.`,
          };
        }
      }

      const availability = await calculateAvailableSlots({
        serviceId: appt.serviceId,
        dateStr: params.newDateStr,
        professionalId: appt.professionalId,
        excludeAppointmentId: appt.id,
        nowUtc: now,
        bypassAdvanceNotice: params.actorType === "ADMIN",
        db: tx,
      });

      const slot = availability.slots.find(
        (s) =>
          s.time === params.newStartTime &&
          s.availableProfessionalIds.includes(appt.professionalId)
      );

      if (!slot) {
        return {
          ok: false as const,
          status: 409 as const,
          error:
            "La nueva fecha u hora seleccionada no está disponible. Tu cita original se mantiene intacta.",
          alternatives: availability.slots.slice(0, 8),
        };
      }

      const startMin = timeStrToMinutes(params.newStartTime);
      const endTimeStr = minutesToTimeStr(startMin + appt.durationMinSnapshot);
      const blockStartStr = minutesToTimeStr(
        startMin - appt.bufferBeforeSnapshot
      );
      const blockEndStr = minutesToTimeStr(
        startMin + appt.durationMinSnapshot + appt.bufferAfterSnapshot
      );

      const startUtcConv = madridLocalToUtc(
        params.newDateStr,
        params.newStartTime
      );
      const endUtcConv = madridLocalToUtc(params.newDateStr, endTimeStr);
      const blockStartUtcConv = madridLocalToUtc(
        params.newDateStr,
        blockStartStr
      );
      const blockEndUtcConv = madridLocalToUtc(params.newDateStr, blockEndStr);

      if (
        !startUtcConv.ok ||
        !endUtcConv.ok ||
        !blockStartUtcConv.ok ||
        !blockEndUtcConv.ok
      ) {
        return {
          ok: false as const,
          status: 400 as const,
          error: "La nueva hora no es válida.",
        };
      }

      const nextVer = appt.version + 1;

      // 1) Mover primero la ocupación: adquiere los minutos nuevos (bloqueo único) y libera los antiguos.
      // Si la nueva franja la toma otra reserva concurrente, falla aquí y la cita original queda intacta.
      const previousOcc = await tx.occupancy.findUnique({ where: { appointmentId: appt.id } });
      await tx.occupancy.update({
        where: { appointmentId: appt.id },
        data: {
          startAtUtc: blockStartUtcConv.utcDate,
          endAtUtc: blockEndUtcConv.utcDate,
          active: true,
        },
      });

      let updated;
      try {
        updated = await tx.appointment.update({
        where: { id: appt.id },
        data: {
          dateStrMadrid: params.newDateStr,
          startTimeMadrid: params.newStartTime,
          endTimeMadrid: endTimeStr,
          startAtUtc: startUtcConv.utcDate,
          endAtUtc: endUtcConv.utcDate,
          blockStartAtUtc: blockStartUtcConv.utcDate,
          blockEndAtUtc: blockEndUtcConv.utcDate,
          version: nextVer,
        },
      });
      } catch (err) {
        // Compensación: devolver la ocupación a su franja original.
        if (previousOcc) {
          await tx.occupancy
            .update({
              where: { id: previousOcc.id },
              data: { startAtUtc: previousOcc.startAtUtc, endAtUtc: previousOcc.endAtUtc, active: previousOcc.active },
            })
            .catch((e: unknown) => console.error("[booking] compensación de reprogramación fallida", e));
        }
        throw err;
      }

      await tx.appointmentEvent.create({
        data: {
          appointmentId: appt.id,
          eventType: "RESCHEDULED",
          fromStatus: appt.status,
          toStatus: appt.status,
          actorType: params.actorType,
          actorId: params.actorId ?? null,
          detailsJson: {
            previousDate: appt.dateStrMadrid,
            previousTime: appt.startTimeMadrid,
            newDate: params.newDateStr,
            newTime: params.newStartTime,
          },
        },
      });

      // Anular recordatorios antiguos pendientes y programar nuevos con la versión actualizada
      await tx.notificationJob.updateMany({
        where: {
          appointmentId: appt.id,
          jobType: "APPOINTMENT_REMINDER",
          status: "PENDING",
        },
        data: { status: "CANCELLED" },
      });

      if (updated.customerEmail) {
        await tx.notificationJob.create({
          data: {
            jobType: "SEND_TRANSACTIONAL_EMAIL",
            dedupKey: `appt-resched:${appt.id}:v${nextVer}`,
            appointmentId: appt.id,
            appointmentVer: nextVer,
            scheduledAtUtc: now,
            nextAttemptUtc: now,
            payloadJson: {
              templateKey: "APPOINTMENT_RESCHEDULED",
              toEmail: updated.customerEmail,
              appointmentId: appt.id,
            },
          },
        });

        const rem24h = new Date(
          startUtcConv.utcDate.getTime() - 24 * 60 * 60 * 1000
        );
        if (rem24h > now) {
          await tx.notificationJob.create({
            data: {
              jobType: "APPOINTMENT_REMINDER",
              dedupKey: `appt-rem24h:${appt.id}:v${nextVer}`,
              appointmentId: appt.id,
              appointmentVer: nextVer,
              scheduledAtUtc: rem24h,
              nextAttemptUtc: rem24h,
              payloadJson: {
                templateKey: "APPOINTMENT_REMINDER_24H",
                toEmail: updated.customerEmail,
                appointmentId: appt.id,
              },
            },
          });
        }

        const rem2h = new Date(
          startUtcConv.utcDate.getTime() - 2 * 60 * 60 * 1000
        );
        if (rem2h > now) {
          await tx.notificationJob.create({
            data: {
              jobType: "APPOINTMENT_REMINDER",
              dedupKey: `appt-rem2h:${appt.id}:v${nextVer}`,
              appointmentId: appt.id,
              appointmentVer: nextVer,
              scheduledAtUtc: rem2h,
              nextAttemptUtc: rem2h,
              payloadJson: {
                templateKey: "APPOINTMENT_REMINDER_2H",
                toEmail: updated.customerEmail,
                appointmentId: appt.id,
              },
            },
          });
        }
      }

      return {
        ok: true as const,
        appointment: {
          id: updated.id,
          referenceCode: updated.referenceCode,
          dateStrMadrid: updated.dateStrMadrid,
          startTimeMadrid: updated.startTimeMadrid,
          endTimeMadrid: updated.endTimeMadrid,
          version: updated.version,
        },
      };
    });
  } catch {
    return {
      ok: false,
      status: 409,
      error:
        "Conflicto concurrente al reprogramar la cita. Tu cita original permanece sin cambios.",
    };
  }
}

/**
 * Cancela una cita de forma atómica, liberando la ocupación y cancelando recordatorios pendientes.
 */
export async function cancelBookingAtomic(params: {
  appointmentId: string;
  reason?: string;
  actorType: "CLIENT" | "ADMIN";
  actorId?: string;
  bypassPolicyWindow?: boolean;
  nowUtc?: Date;
}): Promise<
  | { ok: true; referenceCode: string }
  | { ok: false; status: 400 | 403 | 404; error: string }
> {
  const now = params.nowUtc ?? new Date();

  return sequentialWrites(async (tx) => {
    const appt = await tx.appointment.findUnique({
      where: { id: params.appointmentId },
    });

    if (!appt) {
      return { ok: false, status: 404, error: "Cita no encontrada." };
    }

    if (appt.status === "CANCELLED") {
      return { ok: true, referenceCode: appt.referenceCode };
    }

    const settings = await tx.salonSettings.findUnique({
      where: { id: "default" },
    });

    if (params.actorType === "CLIENT" && !params.bypassPolicyWindow) {
      const minHours = settings?.cancellationFreeHours ?? 24;
      const limitUtc = new Date(
        appt.startAtUtc.getTime() - minHours * 60 * 60 * 1000
      );
      if (now > limitUtc) {
        return {
          ok: false,
          status: 403,
          error: `Las cancelaciones online requieren al menos ${minHours} horas de antelación. Por favor, contacta con el salón.`,
        };
      }
    }

    const nextVer = appt.version + 1;

    await tx.appointment.update({
      where: { id: appt.id },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancellationReason: params.reason?.trim() || "Cancelada",
        version: nextVer,
      },
    });

    // Liberar la franja (borra los bloqueos de minutos). Reintento único ante fallo transitorio.
    await tx.occupancy
      .updateMany({ where: { appointmentId: appt.id }, data: { active: false } })
      .catch(() => tx.occupancy.updateMany({ where: { appointmentId: appt.id }, data: { active: false } }));

    await tx.appointmentEvent.create({
      data: {
        appointmentId: appt.id,
        eventType: "CANCELLED",
        fromStatus: appt.status,
        toStatus: "CANCELLED",
        actorType: params.actorType,
        actorId: params.actorId ?? null,
        detailsJson: { reason: params.reason },
      },
    });

    // Anular recordatorios pendientes
    await tx.notificationJob.updateMany({
      where: {
        appointmentId: appt.id,
        jobType: "APPOINTMENT_REMINDER",
        status: "PENDING",
      },
      data: { status: "CANCELLED" },
    });

    if (appt.customerEmail) {
      await tx.notificationJob.create({
        data: {
          jobType: "SEND_TRANSACTIONAL_EMAIL",
          dedupKey: `appt-cancel:${appt.id}:v${nextVer}`,
          appointmentId: appt.id,
          appointmentVer: nextVer,
          scheduledAtUtc: now,
          nextAttemptUtc: now,
          payloadJson: {
            templateKey: "APPOINTMENT_CANCELLED",
            toEmail: appt.customerEmail,
            appointmentId: appt.id,
          },
        },
      });
    }

    return { ok: true, referenceCode: appt.referenceCode };
  });
}
