import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import * as sessionMod from "@/lib/auth/session";
import { dispatchEmailWithAudit } from "@/lib/email/provider";
import { syncScheduleWithGoogle } from "@/lib/integrations/google";
import { calculateAvailableSlots } from "@/lib/domain/booking";
import { anonymizeClientRgpdAction } from "@/app/admin/clientes/actions";
import { GET as getClientsTemplate } from "@/app/api/v1/admin/clients/template/route";
import { GET as getClientsExport } from "@/app/api/v1/admin/clients/export/route";
import { POST as postClientsImport } from "@/app/api/v1/admin/clients/import/route";
import { POST as postMediaUpload } from "@/app/api/v1/admin/media/upload/route";

function collectJsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectJsFiles(full));
    } else if (entry.isFile() && full.endsWith(".js")) {
      results.push(full);
    }
  }
  return results;
}

describe("Seguridad de secretos, Estados honestos de Email, Fallback Google, DST de otoño, RGPD y RBAC API", () => {
  const suffix = `${Date.now()}`;
  const dstDateStr = "2026-10-25"; // Cambio horario otoño Europe/Madrid (25 horas)
  const createdDeliveryKeys: string[] = [];
  let savedSettings: {
    publicBookingEnabled: boolean;
    scheduleConfirmed: boolean;
    activeScheduleSource: "MANUAL" | "GOOGLE_BUSINESS" | "GOOGLE_PLACES";
    maxBookingHorizonDays: number;
  } | null = null;

  let dstExceptionId = "";
  let dstCategoryId = "";
  let dstServiceId = "";
  let dstProId = "";
  let rgpdOwnerUserId = "";
  let rgpdClientId = "";
  let rgpdApptId = "";

  beforeAll(async () => {
    const s = await prisma.salonSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", brandName: "ESPACIO Q" },
    });
    savedSettings = {
      publicBookingEnabled: s.publicBookingEnabled,
      scheduleConfirmed: s.scheduleConfirmed,
      activeScheduleSource: s.activeScheduleSource,
      maxBookingHorizonDays: s.maxBookingHorizonDays,
    };
  });

  afterAll(async () => {
    vi.restoreAllMocks();

    for (const key of createdDeliveryKeys) {
      await prisma.emailDelivery.deleteMany({ where: { dedupKey: key } });
    }

    if (rgpdApptId) {
      await prisma.occupancy.deleteMany({ where: { appointmentId: rgpdApptId } });
      await prisma.appointmentEvent.deleteMany({
        where: { appointmentId: rgpdApptId },
      });
      await prisma.appointment
        .delete({ where: { id: rgpdApptId } })
        .catch(() => null);
    }
    if (rgpdClientId) {
      await prisma.auditEvent.deleteMany({
        where: { entityType: "Client", entityId: rgpdClientId },
      });
      await prisma.client
        .delete({ where: { id: rgpdClientId } })
        .catch(() => null);
    }
    if (rgpdOwnerUserId) {
      await prisma.user
        .delete({ where: { id: rgpdOwnerUserId } })
        .catch(() => null);
    }

    if (dstExceptionId) {
      await prisma.scheduleException
        .delete({ where: { id: dstExceptionId } })
        .catch(() => null);
    }
    if (dstServiceId && dstProId) {
      await prisma.professionalService.deleteMany({
        where: { serviceId: dstServiceId, professionalId: dstProId },
      });
    }
    if (dstProId) {
      await prisma.professional
        .delete({ where: { id: dstProId } })
        .catch(() => null);
    }
    if (dstServiceId) {
      await prisma.service
        .delete({ where: { id: dstServiceId } })
        .catch(() => null);
    }
    if (dstCategoryId) {
      await prisma.serviceCategory
        .delete({ where: { id: dstCategoryId } })
        .catch(() => null);
    }

    if (savedSettings) {
      await prisma.salonSettings.update({
        where: { id: "default" },
        data: savedSettings,
      });
    }
  });

  it("no expone secretos en .env.example, en variables NEXT_PUBLIC_* ni en los bundles cliente de .next/static", () => {
    const envExample = fs.readFileSync(
      path.resolve(process.cwd(), ".env.example"),
      "utf8"
    );

    expect(envExample).not.toContain("NEXT_PUBLIC_AUTH_SECRET");
    expect(envExample).not.toContain("NEXT_PUBLIC_TOKEN_ENCRYPTION_KEY");
    expect(envExample).not.toContain("NEXT_PUBLIC_CRON_SECRET");
    expect(envExample).not.toContain("NEXT_PUBLIC_DATABASE_URL");
    expect(envExample).not.toContain("NEXT_PUBLIC_EMAIL_PROVIDER_API_KEY");
    expect(envExample).not.toContain("NEXT_PUBLIC_GOOGLE_CLIENT_SECRET");

    for (const key of Object.keys(process.env)) {
      if (key.startsWith("NEXT_PUBLIC_")) {
        expect(key).not.toMatch(/SECRET|PASSWORD|API_KEY|DATABASE|ENCRYPTION/i);
      }
    }

    const staticDir = path.resolve(process.cwd(), ".next/static");
    const jsFiles = collectJsFiles(staticDir);
    const sensitiveValues = [
      process.env.AUTH_SECRET,
      process.env.TOKEN_ENCRYPTION_KEY,
      process.env.CRON_SECRET,
      process.env.DATABASE_URL,
    ].filter((v): v is string => Boolean(v && v.trim().length >= 16));

    for (const file of jsFiles) {
      const content = fs.readFileSync(file, "utf8");
      for (const secretVal of sensitiveValues) {
        expect(content).not.toContain(secretVal);
      }
    }
  });

  it("registra SIMULATED_LOCAL sin proveedor externo y ACCEPTED (nunca DELIVERED prematuro) cuando Resend acepta el envío", async () => {
    const prevApiKey = process.env.EMAIL_PROVIDER_API_KEY;
    const originalFetch = globalThis.fetch;

    try {
      // 1. Sin API key -> SIMULATED_LOCAL
      delete process.env.EMAIL_PROVIDER_API_KEY;
      const localKey = `test-honest-local:${suffix}`;
      createdDeliveryKeys.push(localKey);

      const localRes = await dispatchEmailWithAudit({
        dedupKey: localKey,
        category: "TRANSACTIONAL",
        templateKey: "BOOKING_CREATED",
        toEmail: `honest.local.${suffix}@example.com`,
        subject: "Prueba bandeja local",
        htmlBody: "<p>Hola</p>",
        textBody: "Hola",
      });
      expect(localRes.status).toBe("SIMULATED_LOCAL");

      const localRow = await prisma.emailDelivery.findUnique({
        where: { dedupKey: localKey },
      });
      expect(localRow?.status).toBe("SIMULATED_LOCAL");
      expect(localRow?.providerName).toBe("LOCAL_OUTBOX");

      // 2. Con API key y respuesta 200 del proveedor -> ACCEPTED (solo pasa a DELIVERED vía webhook firmado)
      process.env.EMAIL_PROVIDER_API_KEY = "re_test_ephemeral_key_do_not_persist";
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: `re_msg_${suffix}` }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      ) as unknown as typeof fetch;

      const acceptedKey = `test-honest-accepted:${suffix}`;
      createdDeliveryKeys.push(acceptedKey);

      const acceptedRes = await dispatchEmailWithAudit({
        dedupKey: acceptedKey,
        category: "TRANSACTIONAL",
        templateKey: "BOOKING_CREATED",
        toEmail: `honest.accepted.${suffix}@example.com`,
        subject: "Prueba proveedor aceptado",
        htmlBody: "<p>Hola</p>",
        textBody: "Hola",
      });
      expect(acceptedRes.status).toBe("ACCEPTED");

      const acceptedRow = await prisma.emailDelivery.findUnique({
        where: { dedupKey: acceptedKey },
      });
      expect(acceptedRow?.status).toBe("ACCEPTED");
      expect(acceptedRow?.status).not.toBe("DELIVERED");
      expect(acceptedRow?.providerMessageId).toBe(`re_msg_${suffix}`);
    } finally {
      if (prevApiKey === undefined) {
        delete process.env.EMAIL_PROVIDER_API_KEY;
      } else {
        process.env.EMAIL_PROVIDER_API_KEY = prevApiKey;
      }
      globalThis.fetch = originalFetch;
    }
  });

  it("mantiene fallback MANUAL honesto sin credenciales de Google y rechaza respuestas de Places que no pertenezcan a ESPACIO Q", async () => {
    const prevClientId = process.env.GOOGLE_CLIENT_ID;
    const prevClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const prevPlacesKey = process.env.GOOGLE_PLACES_API_KEY;
    const prevPlaceId = process.env.GOOGLE_PLACE_ID;
    const originalFetch = globalThis.fetch;

    try {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      delete process.env.GOOGLE_PLACES_API_KEY;
      delete process.env.GOOGLE_PLACE_ID;

      const manualFallback = await syncScheduleWithGoogle();
      expect(manualFallback.ok).toBe(false);
      expect(manualFallback.provider).toBe("MANUAL");

      // Simulamos respuesta de Google Places para un comercio equivocado -> debe rechazarse sin sobrescribir horarios
      process.env.GOOGLE_PLACES_API_KEY = "test_places_key_ephemeral";
      process.env.GOOGLE_PLACE_ID = "ChIJ_wrong_place_id";
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "ChIJ_wrong_place_id",
            displayName: { text: "Cafetería Central Madrid" },
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      ) as unknown as typeof fetch;

      const mismatchRes = await syncScheduleWithGoogle();
      expect(mismatchRes.ok).toBe(false);
      expect(mismatchRes.provider).toBe("GOOGLE_PLACES");
      expect(mismatchRes.message).toContain("Cafetería Central Madrid");
    } finally {
      if (prevClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
      else process.env.GOOGLE_CLIENT_ID = prevClientId;
      if (prevClientSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
      else process.env.GOOGLE_CLIENT_SECRET = prevClientSecret;
      if (prevPlacesKey === undefined) delete process.env.GOOGLE_PLACES_API_KEY;
      else process.env.GOOGLE_PLACES_API_KEY = prevPlacesKey;
      if (prevPlaceId === undefined) delete process.env.GOOGLE_PLACE_ID;
      else process.env.GOOGLE_PLACE_ID = prevPlaceId;
      globalThis.fetch = originalFetch;
    }
  });

  it("calcula correctamente los huecos UTC en el cambio de hora de otoño en Europe/Madrid (2026-10-25, día de 25 horas)", async () => {
    await prisma.salonSettings.update({
      where: { id: "default" },
      data: {
        publicBookingEnabled: true,
        scheduleConfirmed: true,
        activeScheduleSource: "MANUAL",
        maxBookingHorizonDays: 1200,
      },
    });

    const exc = await prisma.scheduleException.create({
      data: {
        targetType: "SALON",
        dateStr: dstDateStr,
        isClosed: false,
        intervalsJson: [{ start: "10:00", end: "14:00" }],
        source: "MANUAL",
        authorized: true,
      },
    });
    dstExceptionId = exc.id;

    const cat = await prisma.serviceCategory.create({
      data: {
        name: `Cat DST Otoño ${suffix}`,
        slug: `cat-dst-otono-${suffix}`,
        active: true,
      },
    });
    dstCategoryId = cat.id;

    const srv = await prisma.service.create({
      data: {
        categoryId: dstCategoryId,
        name: "Servicio DST Otoño",
        slug: `srv-dst-otono-${suffix}`,
        shortDescription: "Prueba cambio horario otoño",
        description: "Descripción completa servicio DST otoño.",
        durationMin: 60,
        bufferBeforeMin: 0,
        bufferAfterMin: 0,
        priceType: "FIXED",
        priceCents: 4000,
        active: true,
      },
    });
    dstServiceId = srv.id;

    const pro = await prisma.professional.create({
      data: {
        name: `Pro DST Otoño ${suffix}`,
        slug: `pro-dst-otono-${suffix}`,
        roleTitle: "Estilista",
        specialties: [],
        active: true,
        publicVisible: true,
      },
    });
    dstProId = pro.id;

    await prisma.professionalService.create({
      data: { professionalId: dstProId, serviceId: dstServiceId, active: true },
    });

    const res = await calculateAvailableSlots({
      serviceId: dstServiceId,
      dateStr: dstDateStr,
      professionalId: dstProId,
      nowUtc: new Date("2026-10-01T08:00:00Z"),
    });

    expect(res.bookingReady).toBe(true);
    expect(res.slots.length).toBeGreaterThan(0);

    // En horario de invierno (CET, UTC+1) tras el cambio de las 03:00 -> 02:00, las 10:00 locales equivalen a 09:00 UTC
    const slot10 = res.slots.find((s) => s.time === "10:00");
    expect(slot10).toBeDefined();
    expect(slot10!.startAtUtc).toBe("2026-10-25T09:00:00.000Z");
    expect(slot10!.endAtUtc).toBe("2026-10-25T10:00:00.000Z");
  });

  it("aplica anonimización irreversible RGPD solo para OWNER_ADMIN limpiando PII en Client, Appointment y Subscriber sin borrar el histórico estadístico", async () => {
    const owner = await prisma.user.create({
      data: {
        email: `owner.rgpd.${suffix}@espacioq.test`,
        passwordHash: "hash-no-login",
        name: "Owner RGPD Test",
        role: "OWNER_ADMIN",
        active: true,
      },
    });
    rgpdOwnerUserId = owner.id;

    const clientEmail = `cliente.rgpd.${suffix}@example.com`;
    const client = await prisma.client.create({
      data: {
        firstName: "Valentina",
        lastName: "Pérez",
        email: clientEmail,
        emailNormalized: clientEmail,
        phone: "+34699887766",
        phoneNormalized: "+34699887766",
        tags: ["vip", "color"],
        internalNotes: "Nota interna sensible",
        marketingConsent: true,
        marketingConsentAt: new Date(),
      },
    });
    rgpdClientId = client.id;

    await prisma.subscriber.create({
      data: {
        email: clientEmail,
        emailNormalized: clientEmail,
        firstName: "Valentina",
        status: "ACTIVE",
        unsubscribeTokenHash: `unsub_hash_rgpd_${suffix}`,
      },
    });

    const appt = await prisma.appointment.create({
      data: {
        referenceCode: `EQ-RGPD-${suffix.slice(-6)}`,
        clientId: client.id,
        serviceId: dstServiceId,
        professionalId: dstProId,
        dateStrMadrid: "2027-09-10",
        startTimeMadrid: "12:00",
        endTimeMadrid: "13:00",
        startAtUtc: new Date("2027-09-10T10:00:00Z"),
        endAtUtc: new Date("2027-09-10T11:00:00Z"),
        blockStartAtUtc: new Date("2027-09-10T10:00:00Z"),
        blockEndAtUtc: new Date("2027-09-10T11:00:00Z"),
        serviceNameSnapshot: "Servicio DST Otoño",
        durationMinSnapshot: 60,
        priceTypeSnapshot: "FIXED",
        priceCentsSnapshot: 4000,
        status: "COMPLETED",
        customerName: "Valentina Pérez",
        customerEmail: clientEmail,
        customerPhone: "+34699887766",
        customerNotes: "Observación personal",
        manageTokenHash: `hash_rgpd_${suffix}`,
        manageTokenExpiresAt: new Date("2027-09-15T10:00:00Z"),
      },
    });
    rgpdApptId = appt.id;

    // 1. RECEPTION no puede ejecutar anonimización irreversible RGPD
    const spy = vi.spyOn(sessionMod, "getCurrentUser");
    spy.mockResolvedValueOnce({
      id: "reception-mock",
      email: "recepcion@espacioq.test",
      name: "Recepción",
      role: "RECEPTION",
      professionalId: null,
      canExportData: false,
      canManageMarketing: false,
    });
    const denied = await anonymizeClientRgpdAction(client.id);
    expect(denied.ok).toBe(false);

    // 2. OWNER_ADMIN ejecuta la anonimización irreversible
    spy.mockResolvedValueOnce({
      id: owner.id,
      email: owner.email,
      name: owner.name,
      role: "OWNER_ADMIN",
      professionalId: null,
      canExportData: true,
      canManageMarketing: true,
    });
    const okRes = await anonymizeClientRgpdAction(client.id);
    expect(okRes.ok).toBe(true);

    const scrubbedClient = await prisma.client.findUnique({
      where: { id: client.id },
    });
    expect(scrubbedClient?.status).toBe("ANONYMIZED");
    expect(scrubbedClient?.email).toBeNull();
    expect(scrubbedClient?.emailNormalized).toBeNull();
    expect(scrubbedClient?.phone).toBeNull();
    expect(scrubbedClient?.internalNotes).toBeNull();
    expect(scrubbedClient?.marketingConsent).toBe(false);

    const scrubbedAppt = await prisma.appointment.findUnique({
      where: { id: appt.id },
    });
    // La cita histórica se mantiene para métricas operativas, pero sin PII
    expect(scrubbedAppt).not.toBeNull();
    expect(scrubbedAppt?.status).toBe("COMPLETED");
    expect(scrubbedAppt?.customerName).toBe("Cliente Anonimizado");
    expect(scrubbedAppt?.customerEmail).toBeNull();
    expect(scrubbedAppt?.customerPhone).toBeNull();
    expect(scrubbedAppt?.customerNotes).toBeNull();

    const subCount = await prisma.subscriber.count({
      where: { emailNormalized: clientEmail },
    });
    expect(subCount).toBe(0);
  });

  it("bloquea en servidor (HTTP 403) los endpoints administrativos de Excel y Multimedia sin sesión autenticada", async () => {
    vi.spyOn(sessionMod, "getCurrentUser").mockResolvedValue(null);

    const resTemplate = await getClientsTemplate();
    expect(resTemplate.status).toBe(403);

    const resExport = await getClientsExport(
      new Request("http://localhost:3000/api/v1/admin/clients/export")
    );
    expect(resExport.status).toBe(403);

    const resImport = await postClientsImport(
      new Request("http://localhost:3000/api/v1/admin/clients/import", {
        method: "POST",
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
        },
      })
    );
    expect(resImport.status).toBe(403);

    const resMedia = await postMediaUpload(
      new Request("http://localhost:3000/api/v1/admin/media/upload", {
        method: "POST",
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
          "content-type": "application/json",
        },
        body: JSON.stringify({ url: "https://images.unsplash.com/photo-1" }),
      })
    );
    expect(resMedia.status).toBe(403);
  });
});
