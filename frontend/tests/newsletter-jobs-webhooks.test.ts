import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  confirmNewsletterSubscription,
  requestNewsletterSubscription,
  unsubscribeMarketing,
} from "@/lib/domain/newsletter";
import {
  cancelBookingAtomic,
  createBookingAtomic,
} from "@/lib/domain/booking";
import { processDueJobsAndCampaigns } from "@/lib/jobs/worker";
import {
  processSignedEmailWebhook,
  signWebhookPayload,
} from "@/lib/email/webhook";

describe("Newsletter double opt-in, baja inmediata en worker de campañas y webhooks firmados idempotentes", () => {
  const subEmail = `sub.${Date.now()}@espacioq-test.es`;
  const bounceEmail = `bounce.${Date.now()}@espacioq-test.es`;
  const apptEmail = `rem.${Date.now()}@espacioq-test.es`;

  let prevSettings: { publicBookingEnabled: boolean; scheduleConfirmed: boolean } | null = null;
  let categoryId = "";
  let serviceId = "";
  let proId = "";
  let campaignId = "";
  const testDate = "2027-08-19";

  beforeAll(async () => {
    process.env.EMAIL_WEBHOOK_SECRET = "test_webhook_secret_32_characters_min_ok";

    const s = await prisma.salonSettings.findUnique({ where: { id: "default" } });
    prevSettings = s
      ? {
          publicBookingEnabled: s.publicBookingEnabled,
          scheduleConfirmed: s.scheduleConfirmed,
        }
      : null;

    await prisma.salonSettings.update({
      where: { id: "default" },
      data: { scheduleConfirmed: true, publicBookingEnabled: true },
    });

    await prisma.scheduleException.create({
      data: {
        targetType: "SALON",
        dateStr: testDate,
        isClosed: false,
        intervalsJson: [{ start: "10:00", end: "19:00" }],
        source: "MANUAL",
        authorized: true,
      },
    });

    const cat = await prisma.serviceCategory.create({
      data: { name: "Test Cat Jobs", slug: `test-cat-jobs-${Date.now()}` },
    });
    categoryId = cat.id;

    const srv = await prisma.service.create({
      data: {
        categoryId: cat.id,
        name: "Test Servicio Jobs",
        slug: `test-srv-jobs-${Date.now()}`,
        shortDescription: "Corto",
        description: "Desc",
        durationMin: 30,
        bufferBeforeMin: 0,
        bufferAfterMin: 10,
        priceType: "FIXED",
        priceCents: 4000,
        active: true,
      },
    });
    serviceId = srv.id;

    const pro = await prisma.professional.create({
      data: {
        name: "Profesional Test Jobs",
        slug: `test-pro-jobs-${Date.now()}`,
        roleTitle: "Estilista",
        specialties: [],
        active: true,
        services: { create: [{ serviceId: srv.id, active: true }] },
      },
    });
    proId = pro.id;
  });

  afterAll(async () => {
    if (campaignId) {
      await prisma.emailDelivery.deleteMany({ where: { campaignId } });
      await prisma.campaign.deleteMany({ where: { id: campaignId } });
    }
    await prisma.emailDelivery.deleteMany({
      where: { toEmail: { in: [subEmail, bounceEmail, apptEmail] } },
    });
    await prisma.consentEvent.deleteMany({
      where: { email: { in: [subEmail, bounceEmail, apptEmail] } },
    });
    await prisma.suppression.deleteMany({
      where: { emailNormalized: { in: [subEmail, bounceEmail, apptEmail] } },
    });
    await prisma.subscriber.deleteMany({
      where: { emailNormalized: { in: [subEmail, bounceEmail] } },
    });

    const appts = await prisma.appointment.findMany({
      where: { professionalId: proId },
      select: { id: true },
    });
    const apptIds = appts.map((a) => a.id);
    await prisma.notificationJob.deleteMany({ where: { appointmentId: { in: apptIds } } });
    await prisma.emailDelivery.deleteMany({ where: { appointmentId: { in: apptIds } } });
    await prisma.appointment.deleteMany({ where: { id: { in: apptIds } } });
    await prisma.client.deleteMany({ where: { emailNormalized: apptEmail } });
    await prisma.scheduleException.deleteMany({ where: { dateStr: testDate } });
    if (proId) await prisma.professional.deleteMany({ where: { id: proId } });
    if (serviceId) await prisma.service.deleteMany({ where: { id: serviceId } });
    if (categoryId) await prisma.serviceCategory.deleteMany({ where: { id: categoryId } });
    if (prevSettings) {
      await prisma.salonSettings.update({
        where: { id: "default" },
        data: prevSettings,
      });
    }
  });

  it("completa el flujo double opt-in y omite el envío de campaña si el contacto se da de baja antes del despacho", async () => {
    const noConsent = await requestNewsletterSubscription({
      email: subEmail,
      consentAccepted: false,
    });
    expect(noConsent.ok).toBe(false);

    const requested = await requestNewsletterSubscription({
      email: subEmail,
      firstName: "Lucía",
      consentAccepted: true,
    });
    expect(requested.ok).toBe(true);
    if (!requested.ok) return;

    const pendingRecord = await prisma.subscriber.findUnique({
      where: { emailNormalized: subEmail },
    });
    expect(pendingRecord?.status).toBe("PENDING");
    expect(pendingRecord?.confirmedAt).toBeNull();

    const confirmed = await confirmNewsletterSubscription(
      requested.verifyTokenForTest!
    );
    expect(confirmed.ok).toBe(true);

    const activeRecord = await prisma.subscriber.findUnique({
      where: { emailNormalized: subEmail },
    });
    expect(activeRecord?.status).toBe("ACTIVE");
    expect(activeRecord?.confirmedAt).not.toBeNull();

    // Crear campaña programada con este destinatario ya segmentado
    const campaign = await prisma.campaign.create({
      data: {
        name: "Campaña Test Supresión",
        subject: "Notas de temporada",
        heading: "Cuidado en Madrid",
        bodyText: "Contenido informativo sin descuentos ficticios.",
        segmentFilterJson: { onlyConfirmed: true },
        status: "SCHEDULED",
        scheduledAtUtc: new Date(Date.now() - 1000),
        totalRecipients: 1,
        recipients: {
          create: [
            {
              subscriberId: activeRecord!.id,
              emailNormalized: subEmail,
              status: "PENDING",
            },
          ],
        },
      },
    });
    campaignId = campaign.id;

    // Antes de que el worker envíe la campaña, la usuaria solicita la baja
    const unsubRes = await unsubscribeMarketing({ email: subEmail });
    expect(unsubRes.ok).toBe(true);

    // Ejecutar worker: debe revalidar Suppression en tiempo real y omitir el envío
    await processDueJobsAndCampaigns({ nowUtc: new Date() });

    const recipientAfter = await prisma.campaignRecipient.findFirst({
      where: { campaignId: campaign.id, subscriberId: activeRecord!.id },
    });
    expect(recipientAfter?.status).toBe("SUPPRESSED_SKIPPED");

    const campaignEmailsSent = await prisma.emailDelivery.count({
      where: { campaignId: campaign.id, toEmail: subEmail },
    });
    expect(campaignEmailsSent).toBe(0);
  });

  it("no envía recordatorios programados cuando una cita ha sido cancelada previamente", async () => {
    const booked = await createBookingAtomic({
      serviceId,
      professionalId: proId,
      dateStr: testDate,
      startTime: "12:00",
      customerName: "Cliente Recordatorio",
      customerEmail: apptEmail,
      bypassAdvanceNotice: true,
    });
    expect(booked.ok).toBe(true);
    if (!booked.ok) return;

    const cancelled = await cancelBookingAtomic({
      appointmentId: booked.appointment.id,
      actorType: "CLIENT",
      bypassPolicyWindow: true,
    });
    expect(cancelled.ok).toBe(true);

    // Forzar cualquier recordatorio asociado a estado vencido o comprobar que fueron cancelados
    const futureTime = new Date("2027-08-19T11:00:00.000Z");
    await processDueJobsAndCampaigns({ nowUtc: futureTime });

    const reminderDeliveries = await prisma.emailDelivery.count({
      where: {
        appointmentId: booked.appointment.id,
        templateKey: { startsWith: "APPOINTMENT_REMINDER" },
      },
    });
    expect(reminderDeliveries).toBe(0);
  });

  it("rechaza webhooks con firma inválida y procesa rebotes duros de forma idempotente", async () => {
    const providerMsgId = `msg_bounce_${Date.now()}`;
    await prisma.emailDelivery.create({
      data: {
        dedupKey: `test-bounce-delivery-${Date.now()}`,
        category: "MARKETING",
        templateKey: "TEST_BOUNCE",
        toEmail: bounceEmail,
        subject: "Test rebote",
        htmlBody: "<p>Hola</p>",
        textBody: "Hola",
        status: "ACCEPTED",
        providerMessageId: providerMsgId,
        campaignId: campaignId || null,
      },
    });

    const rawBody = JSON.stringify({
      type: "email.bounced",
      data: {
        email_id: providerMsgId,
        to: [bounceEmail],
      },
    });

    const nowMs = Date.now();
    const tsSec = Math.floor(nowMs / 1000);

    // 1. Firma falsa rechazada con 401
    const invalidSig = await processSignedEmailWebhook({
      rawBody,
      signatureHeader: "deadbeef0000",
      timestampHeader: String(tsSec),
      nowMs,
    });
    expect(invalidSig.ok).toBe(false);
    if (!invalidSig.ok) {
      expect(invalidSig.status).toBe(401);
    }

    // 2. Firma HMAC válida
    const validSig = signWebhookPayload(
      rawBody,
      tsSec,
      process.env.EMAIL_WEBHOOK_SECRET!
    );
    const firstProcess = await processSignedEmailWebhook({
      rawBody,
      signatureHeader: validSig,
      timestampHeader: String(tsSec),
      nowMs,
    });
    expect(firstProcess.ok).toBe(true);
    if (firstProcess.ok) {
      expect(firstProcess.idempotentReplay).toBe(false);
    }

    const sup = await prisma.suppression.findUnique({
      where: { emailNormalized: bounceEmail },
    });
    expect(sup?.reason).toBe("HARD_BOUNCE");

    // 3. Reintento del mismo evento: idempotente sin duplicar contadores
    const campaignBeforeReplay = campaignId
      ? await prisma.campaign.findUnique({ where: { id: campaignId } })
      : null;

    const replayProcess = await processSignedEmailWebhook({
      rawBody,
      signatureHeader: validSig,
      timestampHeader: String(tsSec),
      nowMs,
    });
    expect(replayProcess.ok).toBe(true);
    if (replayProcess.ok) {
      expect(replayProcess.idempotentReplay).toBe(true);
    }

    if (campaignId && campaignBeforeReplay) {
      const campaignAfterReplay = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });
      expect(campaignAfterReplay?.bouncedCount).toBe(
        campaignBeforeReplay.bouncedCount
      );
    }
  });
});
