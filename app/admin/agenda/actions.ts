"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, canAccessProfessionalAgenda } from "@/lib/auth/session";
import {
  cancelBookingAtomic,
  createBookingAtomic,
  rescheduleBookingAtomic,
} from "@/lib/domain/booking";
import { madridLocalToUtc } from "@/lib/domain/timezone";

const createApptSchema = z.object({
  serviceId: z.string().min(1, "Selecciona un servicio"),
  professionalId: z.string().min(1, "Selecciona un profesional"),
  dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  customerName: z.string().trim().min(2, "Nombre del cliente obligatorio").max(140),
  customerEmail: z.string().trim().email("Email inválido").optional().or(z.literal("")),
  customerPhone: z.string().trim().max(40).optional().or(z.literal("")),
  internalNotes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function createAdminAppointmentAction(input: z.infer<typeof createApptSchema>) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesión expirada." };

  const parsed = createApptSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos de cita inválidos." };
  }

  const d = parsed.data;
  if (user.role === "PROFESSIONAL") {
    if (!user.professionalId || d.professionalId !== user.professionalId) {
      return {
        ok: false,
        error: "Como perfil Profesional solo puedes registrar citas en tu propia agenda.",
      };
    }
  }

  const res = await createBookingAtomic({
    serviceId: d.serviceId,
    professionalId: d.professionalId,
    dateStr: d.dateStr,
    startTime: d.startTime,
    customerName: d.customerName,
    customerEmail: d.customerEmail || null,
    customerPhone: d.customerPhone || null,
    internalNotes: d.internalNotes || null,
    actorType: "ADMIN",
    actorId: user.id,
    bypassAdvanceNotice: true,
  });

  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/clientes");
  return { ok: true, referenceCode: res.appointment.referenceCode };
}

export async function rescheduleAdminAppointmentAction(params: {
  appointmentId: string;
  newDateStr: string;
  newStartTime: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const appt = await prisma.appointment.findUnique({
    where: { id: params.appointmentId },
    select: { professionalId: true },
  });
  if (!appt) return { ok: false, error: "Cita no encontrada." };

  if (!canAccessProfessionalAgenda(user, appt.professionalId)) {
    return { ok: false, error: "No tienes permisos sobre la agenda de este profesional." };
  }

  const res = await rescheduleBookingAtomic({
    appointmentId: params.appointmentId,
    newDateStr: params.newDateStr,
    newStartTime: params.newStartTime,
    actorType: "ADMIN",
    actorId: user.id,
    bypassPolicyWindow: true,
  });

  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/admin");
  revalidatePath("/admin/agenda");
  return { ok: true };
}

export async function updateAppointmentStatusAction(params: {
  appointmentId: string;
  newStatus: "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";
  reason?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const appt = await prisma.appointment.findUnique({
    where: { id: params.appointmentId },
  });
  if (!appt) return { ok: false, error: "Cita no encontrada." };

  if (!canAccessProfessionalAgenda(user, appt.professionalId)) {
    return { ok: false, error: "No tienes permisos sobre la agenda de este profesional." };
  }

  if (params.newStatus === "CANCELLED") {
    const cancelRes = await cancelBookingAtomic({
      appointmentId: appt.id,
      reason: params.reason || "Cancelada desde el panel",
      actorType: "ADMIN",
      actorId: user.id,
      bypassPolicyWindow: true,
    });
    if (!cancelRes.ok) return { ok: false, error: cancelRes.error };
    revalidatePath("/admin");
    revalidatePath("/admin/agenda");
    return { ok: true };
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const nextVer = appt.version + 1;
    await tx.appointment.update({
      where: { id: appt.id },
      data: {
        status: params.newStatus,
        version: nextVer,
      },
    });

    await tx.appointmentEvent.create({
      data: {
        appointmentId: appt.id,
        eventType: `STATUS_${params.newStatus}`,
        fromStatus: appt.status,
        toStatus: params.newStatus,
        actorType: "ADMIN",
        actorId: user.id,
      },
    });

    // Si estaba pendiente de aprobación y se confirma ahora, encolar confirmación y recordatorios
    if (
      appt.status === "PENDING_APPROVAL" &&
      params.newStatus === "CONFIRMED" &&
      appt.customerEmail
    ) {
      await tx.notificationJob.create({
        data: {
          jobType: "SEND_TRANSACTIONAL_EMAIL",
          dedupKey: `appt-approved:${appt.id}:v${nextVer}`,
          appointmentId: appt.id,
          appointmentVer: nextVer,
          scheduledAtUtc: now,
          nextAttemptUtc: now,
          payloadJson: {
            templateKey: "APPOINTMENT_CONFIRMATION",
            toEmail: appt.customerEmail,
            appointmentId: appt.id,
          },
        },
      });

      const rem24h = new Date(appt.startAtUtc.getTime() - 24 * 60 * 60 * 1000);
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
              toEmail: appt.customerEmail,
              appointmentId: appt.id,
            },
          },
        });
      }
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/informes");
  return { ok: true };
}

const blockSchema = z.object({
  professionalId: z.string().min(1),
  dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().trim().max(240).optional().or(z.literal("")),
});

export async function createManualBlockAction(input: z.infer<typeof blockSchema>) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const parsed = blockSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos de bloqueo inválidos." };
  }

  const d = parsed.data;
  if (!canAccessProfessionalAgenda(user, d.professionalId)) {
    return { ok: false, error: "No tienes permisos para bloquear tramos de otro profesional." };
  }

  const startConv = madridLocalToUtc(d.dateStr, d.startTime);
  const endConv = madridLocalToUtc(d.dateStr, d.endTime);

  if (!startConv.ok || !endConv.ok || startConv.utcDate >= endConv.utcDate) {
    return {
      ok: false,
      error: "El rango horario del bloqueo no es válido en Europe/Madrid.",
    };
  }

  try {
    await prisma.occupancy.create({
      data: {
        professionalId: d.professionalId,
        reason: "MANUAL_BLOCK",
        startAtUtc: startConv.utcDate,
        endAtUtc: endConv.utcDate,
        active: true,
        notes: d.notes?.trim() || "Bloqueo manual en agenda",
      },
    });
  } catch {
    return {
      ok: false,
      error:
        "No se puede bloquear esa franja porque ya existe una cita activa u otro bloqueo solapado.",
    };
  }

  revalidatePath("/admin/agenda");
  revalidatePath("/reservar");
  return { ok: true };
}

export async function releaseManualBlockAction(occupancyId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const occ = await prisma.occupancy.findUnique({ where: { id: occupancyId } });
  if (!occ || occ.appointmentId) {
    return { ok: false, error: "Bloqueo no encontrado." };
  }

  if (!canAccessProfessionalAgenda(user, occ.professionalId)) {
    return { ok: false, error: "No autorizado." };
  }

  await prisma.occupancy.update({
    where: { id: occupancyId },
    data: { active: false },
  });

  revalidatePath("/admin/agenda");
  revalidatePath("/reservar");
  return { ok: true };
}
