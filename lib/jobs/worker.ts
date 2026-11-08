import { prisma } from "@/lib/db/prisma";
import {
  dispatchEmailWithAudit,
  renderZenLinenEmailLayout,
} from "@/lib/email/provider";
import { formatPrice } from "@/lib/utils";
import { signUnsubscribeToken } from "@/lib/security/crypto";

export async function processDueJobsAndCampaigns(params?: {
  nowUtc?: Date;
  batchSize?: number;
}): Promise<{
  processedJobs: number;
  completedJobs: number;
  skippedOrCancelledJobs: number;
  failedJobs: number;
  campaignsProcessed: number;
}> {
  const now = params?.nowUtc ?? new Date();
  const batchSize = params?.batchSize ?? 25;
  const leaseUntil = new Date(now.getTime() + 2 * 60 * 1000);

  let processedJobs = 0;
  let completedJobs = 0;
  let skippedOrCancelledJobs = 0;
  let failedJobs = 0;

  // 1. Buscar jobs pendientes o con lease expirado cuyo nextAttemptUtc <= now
  const candidates = await prisma.notificationJob.findMany({
    where: {
      OR: [
        { status: "PENDING" },
        {
          status: "PROCESSING",
          lockedUntilUtc: { lt: now },
        },
      ],
      scheduledAtUtc: { lte: now },
      nextAttemptUtc: { lte: now },
    },
    orderBy: { scheduledAtUtc: "asc" },
    take: batchSize,
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  for (const candidate of candidates) {
    // Reclamo atómico por ID y estado/lease
    const claimed = await prisma.notificationJob.updateMany({
      where: {
        id: candidate.id,
        OR: [
          { status: "PENDING" },
          { status: "PROCESSING", lockedUntilUtc: { lt: now } },
        ],
      },
      data: {
        status: "PROCESSING",
        lockedUntilUtc: leaseUntil,
        attempts: { increment: 1 },
      },
    });

    if (claimed.count === 0) continue;
    processedJobs++;

    const payload = (candidate.payloadJson ?? {}) as Record<string, any>;

    try {
      if (
        candidate.jobType === "SEND_TRANSACTIONAL_EMAIL" ||
        candidate.jobType === "APPOINTMENT_REMINDER"
      ) {
        const apptId = candidate.appointmentId || payload.appointmentId;
        const appt = apptId
          ? await prisma.appointment.findUnique({
              where: { id: apptId },
              include: { professional: true },
            })
          : null;

        // Validación estricta para recordatorios: comprobar estado y versión actual de la cita
        if (candidate.jobType === "APPOINTMENT_REMINDER") {
          if (
            !appt ||
            appt.status !== "CONFIRMED" ||
            (candidate.appointmentVer &&
              appt.version !== candidate.appointmentVer) ||
            appt.startAtUtc <= now
          ) {
            await prisma.notificationJob.update({
              where: { id: candidate.id },
              data: {
                status: "CANCELLED",
                lockedUntilUtc: null,
                lastError:
                  "Descartado: la cita fue cancelada, reprogramada o ya ha pasado.",
              },
            });
            skippedOrCancelledJobs++;
            continue;
          }
        }

        if (!appt) {
          await prisma.notificationJob.update({
            where: { id: candidate.id },
            data: {
              status: "CANCELLED",
              lockedUntilUtc: null,
              lastError: "Cita asociada no encontrada.",
            },
          });
          skippedOrCancelledJobs++;
          continue;
        }

        const templateKey = String(
          payload.templateKey || "APPOINTMENT_CONFIRMATION"
        );
        const toEmail = String(payload.toEmail || appt.customerEmail || "");
        if (!toEmail) {
          await prisma.notificationJob.update({
            where: { id: candidate.id },
            data: {
              status: "CANCELLED",
              lockedUntilUtc: null,
            },
          });
          skippedOrCancelledJobs++;
          continue;
        }

        const detailsBox = [
          { label: "Código de referencia", value: appt.referenceCode },
          { label: "Servicio", value: appt.serviceNameSnapshot },
          { label: "Profesional", value: appt.professional.name },
          {
            label: "Fecha y hora (Madrid)",
            value: `${appt.dateStrMadrid} · ${appt.startTimeMadrid} - ${appt.endTimeMadrid}`,
          },
          {
            label: "Duración estimada",
            value: `${appt.durationMinSnapshot} min`,
          },
          {
            label: "Importe orientativo",
            value: formatPrice(
              appt.priceTypeSnapshot,
              appt.priceCentsSnapshot,
              appt.currencySnapshot
            ),
          },
        ];

        let heading = "Confirmación de tu cita en ESPACIO Q";
        let subject = `Cita confirmada (${appt.referenceCode}) · ESPACIO Q Madrid`;
        let paragraphs = [
          `Hola ${appt.customerName},`,
          "Tu cita en ESPACIO Q ha quedado confirmada con los siguientes detalles:",
        ];

        if (templateKey === "APPOINTMENT_REQUEST_PENDING") {
          heading = "Solicitud de cita recibida (Pendiente de confirmación)";
          subject = `Solicitud recibida (${appt.referenceCode}) · ESPACIO Q Madrid`;
          paragraphs = [
            `Hola ${appt.customerName},`,
            "Hemos recibido tu solicitud de cita. Ten en cuenta que todavía está pendiente de validación por parte del salón; te enviaremos un nuevo correo en cuanto quede confirmada.",
          ];
        } else if (templateKey === "APPOINTMENT_REMINDER_24H") {
          heading = "Recordatorio: tu cita de mañana en ESPACIO Q";
          subject = `Recordatorio de tu cita mañana (${appt.startTimeMadrid}) · ESPACIO Q`;
          paragraphs = [
            `Hola ${appt.customerName},`,
            "Te recordamos que mañana te esperamos en ESPACIO Q Madrid para tu cita programada:",
          ];
        } else if (templateKey === "APPOINTMENT_REMINDER_2H") {
          heading = "Tu cita en ESPACIO Q comienza pronto";
          subject = `Tu cita de hoy a las ${appt.startTimeMadrid} · ESPACIO Q`;
          paragraphs = [
            `Hola ${appt.customerName},`,
            "Faltan pocas horas para tu visita de hoy en ESPACIO Q Madrid:",
          ];
        } else if (templateKey === "APPOINTMENT_RESCHEDULED") {
          heading = "Tu cita ha sido reprogramada";
          subject = `Cambio de fecha/hora (${appt.referenceCode}) · ESPACIO Q`;
          paragraphs = [
            `Hola ${appt.customerName},`,
            "Tu cita en ESPACIO Q ha sido reprogramada correctamente con el nuevo horario:",
          ];
        } else if (templateKey === "APPOINTMENT_CANCELLED") {
          heading = "Confirmación de cancelación de cita";
          subject = `Cita cancelada (${appt.referenceCode}) · ESPACIO Q`;
          paragraphs = [
            `Hola ${appt.customerName},`,
            "Te confirmamos que tu cita en ESPACIO Q ha quedado cancelada y la franja horaria ha sido liberada.",
          ];
        }

        const manageUrl = payload.manageToken
          ? `${appUrl}/reservar/gestion/${encodeURIComponent(payload.manageToken)}`
          : `${appUrl}/reservar`;

        const rendered = renderZenLinenEmailLayout({
          heading,
          preheader: subject,
          paragraphs,
          detailsBox,
          cta:
            templateKey !== "APPOINTMENT_CANCELLED"
              ? {
                  label: payload.manageToken
                    ? "Ver o gestionar mi cita"
                    : "Ir a ESPACIO Q",
                  url: manageUrl,
                }
              : undefined,
        });

        const dispatchRes = await dispatchEmailWithAudit({
          dedupKey: candidate.dedupKey,
          category: "TRANSACTIONAL",
          templateKey,
          toEmail,
          subject,
          htmlBody: rendered.html,
          textBody: rendered.text,
          appointmentId: appt.id,
        });

        if (dispatchRes.status === "FAILED") {
          throw new Error("El proveedor de email devolvió estado FAILED.");
        }

        await prisma.notificationJob.update({
          where: { id: candidate.id },
          data: {
            status: "COMPLETED",
            completedAtUtc: now,
            lockedUntilUtc: null,
            lastError: null,
          },
        });
        completedJobs++;
      } else {
        await prisma.notificationJob.update({
          where: { id: candidate.id },
          data: {
            status: "COMPLETED",
            completedAtUtc: now,
            lockedUntilUtc: null,
          },
        });
        completedJobs++;
      }
    } catch (err: any) {
      const nextAttempts = candidate.attempts + 1;
      const isExhausted = nextAttempts >= candidate.maxAttempts;
      const backoffMs = Math.min(30, Math.pow(2, nextAttempts)) * 60 * 1000;

      await prisma.notificationJob.update({
        where: { id: candidate.id },
        data: {
          status: isExhausted ? "FAILED" : "PENDING",
          lockedUntilUtc: null,
          nextAttemptUtc: new Date(now.getTime() + backoffMs),
          lastError: err?.message ?? "Error procesando trabajo",
        },
      });
      failedJobs++;
    }
  }

  // 2. Procesar campañas de marketing programadas (SCHEDULED / SENDING)
  const dueCampaigns = await prisma.campaign.findMany({
    where: {
      OR: [
        { status: "SCHEDULED", scheduledAtUtc: { lte: now } },
        { status: "SENDING" },
      ],
    },
    take: 5,
  });

  let campaignsProcessed = 0;

  for (const campaign of dueCampaigns) {
    campaignsProcessed++;
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "SENDING" },
    });

    const pendingRecipients = await prisma.campaignRecipient.findMany({
      where: {
        campaignId: campaign.id,
        status: "PENDING",
      },
      include: { subscriber: true },
      take: 50,
    });

    let acceptedDelta = 0;

    for (const recipient of pendingRecipients) {
      // Revalidación obligatoria justo antes de cada envío (Sección 13)
      const suppressed = await prisma.suppression.findUnique({
        where: { emailNormalized: recipient.emailNormalized },
      });

      if (
        suppressed ||
        recipient.subscriber.status !== "ACTIVE" ||
        !recipient.subscriber.confirmedAt
      ) {
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "SUPPRESSED_SKIPPED",
            errorText:
              "Omitido antes del envío: contacto dado de baja, en lista de supresión o sin consentimiento activo.",
          },
        });
        continue;
      }

      const unsubUrl = `${appUrl}/newsletter/baja?token=${encodeURIComponent(
        signUnsubscribeToken(recipient.subscriberId)
      )}`;

      const rendered = renderZenLinenEmailLayout({
        heading: campaign.heading,
        preheader: campaign.preheader ?? campaign.subject,
        paragraphs: campaign.bodyText
          .split(/\n+/)
          .map((p) => p.trim())
          .filter(Boolean),
        cta:
          campaign.ctaLabel && campaign.ctaUrl
            ? { label: campaign.ctaLabel, url: campaign.ctaUrl }
            : undefined,
        unsubscribeUrl: unsubUrl,
      });

      const sendRes = await dispatchEmailWithAudit({
        dedupKey: `campaign:${campaign.id}:sub:${recipient.subscriberId}`,
        category: "MARKETING",
        templateKey: `CAMPAIGN_${campaign.id}`,
        toEmail: recipient.emailNormalized,
        subject: campaign.subject,
        htmlBody: rendered.html,
        textBody: rendered.text,
        campaignId: campaign.id,
      });

      if (sendRes.status === "FAILED") {
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "FAILED",
            errorText: "Error al despachar en proveedor.",
          },
        });
      } else {
        acceptedDelta++;
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "ACCEPTED",
            providerMessageId: sendRes.providerMessageId ?? null,
            sentAt: now,
          },
        });
      }
    }

    const remainingCount = await prisma.campaignRecipient.count({
      where: { campaignId: campaign.id, status: "PENDING" },
    });

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        acceptedCount: { increment: acceptedDelta },
        status: remainingCount === 0 ? "COMPLETED" : "SENDING",
        sentAtUtc: remainingCount === 0 ? now : campaign.sentAtUtc,
      },
    });
  }

  return {
    processedJobs,
    completedJobs,
    skippedOrCancelledJobs,
    failedJobs,
    campaignsProcessed,
  };
}
