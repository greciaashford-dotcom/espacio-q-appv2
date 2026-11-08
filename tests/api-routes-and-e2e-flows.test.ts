import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { POST as postContact } from "@/app/api/v1/contact/route";
import { GET as getAvailability } from "@/app/api/v1/bookings/availability/route";
import { POST as postBooking } from "@/app/api/v1/bookings/route";
import { POST as postManageBooking } from "@/app/api/v1/bookings/manage/route";
import { POST as postNewsletterSubscribe } from "@/app/api/v1/newsletter/subscribe/route";
import { POST as postNewsletterAction } from "@/app/api/v1/newsletter/action/route";
import { POST as postInternalJobs } from "@/app/api/internal/jobs/route";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

describe("Endpoints HTTP E2E: Contacto, Disponibilidad, Reservas, Gestión por token, Newsletter, Cron y SEO", () => {
  const suffix = `${Date.now()}`;
  const testDate = "2027-07-14"; // Miércoles
  const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;

  let savedSettings: {
    publicBookingEnabled: boolean;
    bookingApprovalMode: string;
    scheduleConfirmed: boolean;
    activeScheduleSource: "MANUAL" | "GOOGLE_BUSINESS" | "GOOGLE_PLACES";
    minAdvanceNoticeMin: number;
    maxBookingHorizonDays: number;
    cancellationFreeHours: number;
    rescheduleFreeHours: number;
    slotIntervalMin: number;
  } | null = null;

  let exceptionId = "";
  let categoryId = "";
  let activeServiceId = "";
  let activeServiceSlug = "";
  let inactiveServiceId = "";
  let inactiveServiceSlug = "";
  let assignedProId = "";
  let unassignedProId = "";
  let inactiveProId = "";

  const createdContactEmails: string[] = [];
  const createdBookingEmails: string[] = [];
  const createdNewsletterEmails: string[] = [];

  function buildJsonRequest(
    url: string,
    body: unknown,
    extraHeaders?: Record<string, string>
  ): Request {
    return new Request(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "x-forwarded-for": testIp,
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    });
  }

  beforeAll(async () => {
    const current = await prisma.salonSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", brandName: "ESPACIO Q" },
    });
    savedSettings = {
      publicBookingEnabled: current.publicBookingEnabled,
      bookingApprovalMode: current.bookingApprovalMode,
      scheduleConfirmed: current.scheduleConfirmed,
      activeScheduleSource: current.activeScheduleSource,
      minAdvanceNoticeMin: current.minAdvanceNoticeMin,
      maxBookingHorizonDays: current.maxBookingHorizonDays,
      cancellationFreeHours: current.cancellationFreeHours,
      rescheduleFreeHours: current.rescheduleFreeHours,
      slotIntervalMin: current.slotIntervalMin,
    };

    await prisma.salonSettings.update({
      where: { id: "default" },
      data: {
        publicBookingEnabled: true,
        bookingApprovalMode: "AUTOMATIC",
        scheduleConfirmed: true,
        activeScheduleSource: "MANUAL",
        minAdvanceNoticeMin: 60,
        maxBookingHorizonDays: 1200,
        cancellationFreeHours: 24,
        rescheduleFreeHours: 24,
        slotIntervalMin: 30,
      },
    });

    const exc = await prisma.scheduleException.create({
      data: {
        targetType: "SALON",
        dateStr: testDate,
        isClosed: false,
        intervalsJson: [{ start: "10:00", end: "15:00" }],
        source: "MANUAL",
        authorized: true,
      },
    });
    exceptionId = exc.id;

    const cat = await prisma.serviceCategory.create({
      data: {
        name: `Cat API E2E ${suffix}`,
        slug: `cat-api-e2e-${suffix}`,
        active: true,
      },
    });
    categoryId = cat.id;

    activeServiceSlug = `srv-activo-e2e-${suffix}`;
    const activeSrv = await prisma.service.create({
      data: {
        categoryId,
        name: "Servicio Activo E2E",
        slug: activeServiceSlug,
        shortDescription: "Servicio activo para test E2E",
        description: "Descripción completa de servicio activo para test E2E.",
        durationMin: 60,
        bufferBeforeMin: 0,
        bufferAfterMin: 10,
        priceType: "FIXED",
        priceCents: 5200,
        active: true,
      },
    });
    activeServiceId = activeSrv.id;

    inactiveServiceSlug = `srv-inactivo-e2e-${suffix}`;
    const inactiveSrv = await prisma.service.create({
      data: {
        categoryId,
        name: "Servicio Inactivo E2E",
        slug: inactiveServiceSlug,
        shortDescription: "Servicio desactivado",
        description: "Descripción de servicio desactivado.",
        durationMin: 45,
        priceType: "CONSULT",
        active: false,
      },
    });
    inactiveServiceId = inactiveSrv.id;

    const pAssigned = await prisma.professional.create({
      data: {
        name: `Pro Asignada ${suffix}`,
        slug: `pro-asignada-${suffix}`,
        roleTitle: "Estilista",
        specialties: ["Corte"],
        active: true,
        publicVisible: true,
      },
    });
    assignedProId = pAssigned.id;

    const pUnassigned = await prisma.professional.create({
      data: {
        name: `Pro Sin Servicio ${suffix}`,
        slug: `pro-sin-servicio-${suffix}`,
        roleTitle: "Colorista",
        specialties: ["Color"],
        active: true,
        publicVisible: true,
      },
    });
    unassignedProId = pUnassigned.id;

    const pInactive = await prisma.professional.create({
      data: {
        name: `Pro Inactiva ${suffix}`,
        slug: `pro-inactiva-${suffix}`,
        roleTitle: "Estilista",
        specialties: [],
        active: false,
        publicVisible: false,
      },
    });
    inactiveProId = pInactive.id;

    // Asignamos el servicio activo a assignedPro y a inactivePro (para verificar que la inactiva tampoco oferta huecos)
    await prisma.professionalService.createMany({
      data: [
        { professionalId: assignedProId, serviceId: activeServiceId, active: true },
        { professionalId: inactiveProId, serviceId: activeServiceId, active: true },
      ],
    });
  });

  afterAll(async () => {
    for (const email of createdContactEmails) {
      const msgs = await prisma.contactMessage.findMany({ where: { email } });
      for (const m of msgs) {
        await prisma.emailDelivery.deleteMany({
          where: { dedupKey: `contact-ack:${m.id}` },
        });
      }
      await prisma.contactMessage.deleteMany({ where: { email } });
    }

    for (const email of createdBookingEmails) {
      const appts = await prisma.appointment.findMany({
        where: { customerEmail: email },
      });
      for (const a of appts) {
        await prisma.notificationJob.deleteMany({
          where: { appointmentId: a.id },
        });
        await prisma.emailDelivery.deleteMany({
          where: { appointmentId: a.id },
        });
        await prisma.occupancy.deleteMany({
          where: { appointmentId: a.id },
        });
        await prisma.appointmentEvent.deleteMany({
          where: { appointmentId: a.id },
        });
        await prisma.appointment.delete({ where: { id: a.id } });
      }
      await prisma.client.deleteMany({ where: { emailNormalized: email } });
    }

    for (const email of createdNewsletterEmails) {
      await prisma.emailDelivery.deleteMany({ where: { toEmail: email } });
      await prisma.suppression.deleteMany({
        where: { emailNormalized: email },
      });
      await prisma.subscriber.deleteMany({
        where: { emailNormalized: email },
      });
      await prisma.client.deleteMany({ where: { emailNormalized: email } });
    }

    if (exceptionId) {
      await prisma.scheduleException
        .delete({ where: { id: exceptionId } })
        .catch(() => null);
    }

    await prisma.professionalService.deleteMany({
      where: {
        serviceId: { in: [activeServiceId, inactiveServiceId].filter(Boolean) },
      },
    });
    await prisma.professional.deleteMany({
      where: {
        id: {
          in: [assignedProId, unassignedProId, inactiveProId].filter(Boolean),
        },
      },
    });
    await prisma.service.deleteMany({
      where: {
        id: { in: [activeServiceId, inactiveServiceId].filter(Boolean) },
      },
    });
    if (categoryId) {
      await prisma.serviceCategory
        .delete({ where: { id: categoryId } })
        .catch(() => null);
    }

    await prisma.rateLimitHit.deleteMany({
      where: { createdAt: { gte: new Date(Date.now() - 120_000) } },
    });

    if (savedSettings) {
      await prisma.salonSettings.update({
        where: { id: "default" },
        data: savedSettings,
      });
    }
  });

  it("valida CSRF, privacidad y honeypot en POST /api/v1/contact y persiste consultas legítimas con acuse", async () => {
    const email = `contacto.e2e.${suffix}@example.com`;
    createdContactEmails.push(email);

    // 1. Rechazo CSRF cross-origin
    const csrfRes = await postContact(
      buildJsonRequest(
        "http://localhost:3000/api/v1/contact",
        {
          name: "Lucía Prueba",
          email,
          message: "Consulta sobre tratamiento de hidratación en Madrid.",
          privacyAccepted: true,
        },
        { origin: "https://sitio-externo-malicioso.example" }
      )
    );
    expect(csrfRes.status).toBe(403);

    // 2. Rechazo por honeypot relleno
    const honeypotRes = await postContact(
      buildJsonRequest("http://localhost:3000/api/v1/contact", {
        name: "Bot Spam",
        email,
        message: "Mensaje automático con campo señuelo relleno.",
        privacyAccepted: true,
        website: "https://spam.example",
      })
    );
    expect(honeypotRes.status).toBe(400);

    // 3. Rechazo sin aceptar política de privacidad
    const noPrivacyRes = await postContact(
      buildJsonRequest("http://localhost:3000/api/v1/contact", {
        name: "Lucía Prueba",
        email,
        message: "Consulta válida pero sin marcar privacidad.",
        privacyAccepted: false,
      })
    );
    expect(noPrivacyRes.status).toBe(400);

    // 4. Envío válido
    const validRes = await postContact(
      buildJsonRequest("http://localhost:3000/api/v1/contact", {
        name: "Lucía Prueba",
        email,
        phone: "+34 600 111 222",
        subject: "Información de ritual capilar",
        message:
          "Hola, me gustaría consultar disponibilidad para la próxima semana.",
        privacyAccepted: true,
        website: "",
      })
    );
    expect(validRes.status).toBe(200);

    const saved = await prisma.contactMessage.findFirst({ where: { email } });
    expect(saved).not.toBeNull();
    expect(saved?.subject).toBe("Información de ritual capilar");

    const ackDelivery = await prisma.emailDelivery.findUnique({
      where: { dedupKey: `contact-ack:${saved!.id}` },
    });
    expect(ackDelivery).not.toBeNull();
    expect(ackDelivery?.templateKey).toBe("CONTACT_ACK");
  });

  it("excluye servicios inactivos, profesionales inactivos y profesionales sin el servicio asignado en disponibilidad", async () => {
    // Profesional no asignada al servicio -> 0 huecos
    const resUnassigned = await getAvailability(
      new Request(
        `http://localhost:3000/api/v1/bookings/availability?serviceId=${activeServiceId}&date=${testDate}&professionalId=${unassignedProId}`
      )
    );
    expect(resUnassigned.status).toBe(200);
    expect(resUnassigned.headers.get("cache-control")).toContain("no-store");
    const jsonUnassigned = await resUnassigned.json();
    expect(jsonUnassigned.slots).toHaveLength(0);

    // Profesional inactiva -> 0 huecos aunque tenga relación en ProfessionalService
    const resInactivePro = await getAvailability(
      new Request(
        `http://localhost:3000/api/v1/bookings/availability?serviceId=${activeServiceId}&date=${testDate}&professionalId=${inactiveProId}`
      )
    );
    const jsonInactivePro = await resInactivePro.json();
    expect(jsonInactivePro.slots).toHaveLength(0);

    // Servicio inactivo -> no reservable
    const resInactiveSrv = await getAvailability(
      new Request(
        `http://localhost:3000/api/v1/bookings/availability?serviceId=${inactiveServiceId}&date=${testDate}&professionalId=any`
      )
    );
    const jsonInactiveSrv = await resInactiveSrv.json();
    expect(jsonInactiveSrv.slots).toHaveLength(0);

    // Profesional activa y asignada -> devuelve huecos reales sin PII
    const resValid = await getAvailability(
      new Request(
        `http://localhost:3000/api/v1/bookings/availability?serviceId=${activeServiceId}&date=${testDate}&professionalId=${assignedProId}`
      )
    );
    const jsonValid = await resValid.json();
    expect(jsonValid.bookingReady).toBe(true);
    expect(jsonValid.slots.length).toBeGreaterThan(0);
    expect(JSON.stringify(jsonValid)).not.toContain("@");
  });

  it("completa el ciclo HTTP de reserva -> replay idempotente -> confirmar asistencia -> reprogramar -> cancelar por token", async () => {
    const email = `reserva.e2e.${suffix}@example.com`;
    createdBookingEmails.push(email);
    const idemKey = `http-booking-idem-${suffix}`;

    // 1. Crear reserva
    const createRes = await postBooking(
      buildJsonRequest("http://localhost:3000/api/v1/bookings", {
        serviceId: activeServiceId,
        professionalId: assignedProId,
        dateStr: testDate,
        startTime: "10:00",
        customerName: "Elena Reserva E2E",
        customerEmail: email,
        customerPhone: "+34611223344",
        customerNotes: "Prefiero agua templada",
        termsAccepted: true,
        marketingOptIn: false,
        idempotencyKey: idemKey,
      })
    );
    expect(createRes.status).toBe(200);
    const createJson = await createRes.json();
    expect(createJson.ok).toBe(true);
    expect(createJson.idempotentReplay).toBe(false);
    expect(createJson.manageUrl).toMatch(/^\/reservar\/gestion\/.+/);

    const rawToken = decodeURIComponent(
      String(createJson.manageUrl).replace("/reservar/gestion/", "")
    );
    const appointmentId = createJson.appointment.id as string;

    // 2. Replay idempotente con la misma clave -> devuelve la misma cita sin duplicar
    const replayRes = await postBooking(
      buildJsonRequest("http://localhost:3000/api/v1/bookings", {
        serviceId: activeServiceId,
        professionalId: assignedProId,
        dateStr: testDate,
        startTime: "10:00",
        customerName: "Elena Reserva E2E",
        customerEmail: email,
        customerPhone: "+34611223344",
        termsAccepted: true,
        marketingOptIn: false,
        idempotencyKey: idemKey,
      })
    );
    expect(replayRes.status).toBe(200);
    const replayJson = await replayRes.json();
    expect(replayJson.idempotentReplay).toBe(true);
    expect(replayJson.appointment.id).toBe(appointmentId);

    // 3. Confirmar asistencia por token (dato separado del estado de la cita)
    const confirmAttRes = await postManageBooking(
      buildJsonRequest("http://localhost:3000/api/v1/bookings/manage", {
        action: "confirm_attendance",
        token: rawToken,
      })
    );
    expect(confirmAttRes.status).toBe(200);
    const afterAtt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    expect(afterAtt?.attendanceConfirmedAt).not.toBeNull();
    expect(afterAtt?.status).toBe("CONFIRMED");

    // 4. Reprogramar a las 12:00 del mismo día
    const reschedRes = await postManageBooking(
      buildJsonRequest("http://localhost:3000/api/v1/bookings/manage", {
        action: "reschedule",
        token: rawToken,
        newDateStr: testDate,
        newStartTime: "12:00",
      })
    );
    expect(reschedRes.status).toBe(200);
    const afterResched = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    expect(afterResched?.version).toBe(2);

    // 5. Cancelar cita por token
    const cancelRes = await postManageBooking(
      buildJsonRequest("http://localhost:3000/api/v1/bookings/manage", {
        action: "cancel",
        token: rawToken,
        reason: "Cambio de agenda laboral",
      })
    );
    expect(cancelRes.status).toBe(200);

    const afterCancel = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { occupancy: true },
    });
    expect(afterCancel?.status).toBe("CANCELLED");
    expect(afterCancel?.occupancy?.active).toBe(false);

    // 6. Token inexistente -> 404
    const badTokenRes = await postManageBooking(
      buildJsonRequest("http://localhost:3000/api/v1/bookings/manage", {
        action: "confirm_attendance",
        token: "token_inexistente_1234567890abcdef",
      })
    );
    expect(badTokenRes.status).toBe(404);
  });

  it("no filtra el token de verificación en POST /api/v1/newsletter/subscribe y procesa baja vía POST", async () => {
    const email = `news.http.${suffix}@example.com`;
    createdNewsletterEmails.push(email);

    const subRes = await postNewsletterSubscribe(
      buildJsonRequest("http://localhost:3000/api/v1/newsletter/subscribe", {
        email,
        firstName: "Marta",
        consentAccepted: true,
        source: "footer_form",
      })
    );
    expect(subRes.status).toBe(200);
    const subJson = await subRes.json();
    expect(subJson.ok).toBe(true);
    expect(subJson.state).toBe("PENDING_VERIFICATION");
    // Prohibido exponer verifyToken en la respuesta HTTP al navegador
    expect(subJson.verifyToken).toBeUndefined();
    expect(JSON.stringify(subJson)).not.toContain("verifyToken");

    const unsubRes = await postNewsletterAction(
      buildJsonRequest("http://localhost:3000/api/v1/newsletter/action", {
        action: "unsubscribe",
        email,
      })
    );
    expect(unsubRes.status).toBe(200);

    const suppression = await prisma.suppression.findUnique({
      where: { emailNormalized: email },
    });
    expect(suppression).not.toBeNull();
  });

  it("protege POST /api/internal/jobs con Bearer CRON_SECRET en tiempo constante", async () => {
    const unauthorizedRes = await postInternalJobs(
      new Request("http://localhost:3000/api/internal/jobs", {
        method: "POST",
        headers: { authorization: "Bearer secreto-incorrecto" },
      })
    );
    expect(unauthorizedRes.status).toBe(401);

    const cronSecret = process.env.CRON_SECRET?.trim();
    expect(cronSecret && cronSecret.length >= 16).toBe(true);

    const authorizedRes = await postInternalJobs(
      new Request("http://localhost:3000/api/internal/jobs", {
        method: "POST",
        headers: { authorization: `Bearer ${cronSecret}` },
      })
    );
    expect(authorizedRes.status).toBe(200);
    const json = await authorizedRes.json();
    expect(json.ok).toBe(true);
    expect(json.jobStats).toBeDefined();
  });

  it("genera sitemap.xml solo con rutas públicas activas (incluidas las 5 legales) y bloquea rutas privadas en robots.txt", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    // Rutas públicas y legales obligatorias
    expect(urls.some((u) => u.endsWith("/servicios"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/reservar"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/aviso-legal"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/terminos-y-condiciones"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/condiciones-reserva"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/privacidad"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/cookies"))).toBe(true);
    expect(urls.some((u) => u.endsWith(`/servicios/${activeServiceSlug}`))).toBe(
      true
    );

    // Servicio inactivo y rutas privadas nunca deben aparecer en sitemap
    expect(
      urls.some((u) => u.endsWith(`/servicios/${inactiveServiceSlug}`))
    ).toBe(false);
    expect(urls.some((u) => u.includes("/admin"))).toBe(false);
    expect(urls.some((u) => u.includes("/acceso"))).toBe(false);
    expect(urls.some((u) => u.includes("/reservar/gestion"))).toBe(false);
    expect(urls.some((u) => u.includes("/newsletter/"))).toBe(false);

    const robotsCfg = robots();
    const rules = Array.isArray(robotsCfg.rules)
      ? robotsCfg.rules[0]
      : robotsCfg.rules;
    const disallow = Array.isArray(rules.disallow)
      ? rules.disallow
      : [rules.disallow];
    expect(disallow).toContain("/admin");
    expect(disallow).toContain("/acceso");
    expect(disallow).toContain("/api/");
    expect(disallow).toContain("/reservar/gestion/");
    expect(disallow).toContain("/newsletter/");
  });
});
