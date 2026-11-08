import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { madridLocalToUtc } from "@/lib/domain/timezone";
import { intersectTimeIntervals } from "@/lib/domain/schedule";
import { calculateAvailableSlots } from "@/lib/domain/booking";

describe("Huso horario Europe/Madrid (DST), turnos partidos y buffers", () => {
  let prevSettings: { publicBookingEnabled: boolean; scheduleConfirmed: boolean } | null = null;
  let categoryId = "";
  let serviceId = "";
  let proId = "";
  const testDate = "2027-05-11"; // Martes (día 2)

  beforeAll(async () => {
    const s = await prisma.salonSettings.findUnique({ where: { id: "default" } });
    prevSettings = s
      ? {
          publicBookingEnabled: s.publicBookingEnabled,
          scheduleConfirmed: s.scheduleConfirmed,
        }
      : null;

    await prisma.salonSettings.upsert({
      where: { id: "default" },
      update: { scheduleConfirmed: true, publicBookingEnabled: true, slotIntervalMin: 15 },
      create: { id: "default", scheduleConfirmed: true, publicBookingEnabled: true, slotIntervalMin: 15 },
    });

    // Excepción de horario partido en el salón para testDate: 10:00-14:00 y 16:00-20:00
    await prisma.scheduleException.create({
      data: {
        targetType: "SALON",
        dateStr: testDate,
        isClosed: false,
        intervalsJson: [
          { start: "10:00", end: "14:00" },
          { start: "16:00", end: "20:00" },
        ],
        reason: "Test turno partido",
        source: "MANUAL",
        authorized: true,
      },
    });

    const cat = await prisma.serviceCategory.create({
      data: { name: "Test Cat TZ", slug: `test-cat-tz-${Date.now()}` },
    });
    categoryId = cat.id;

    // Servicio de 45 min + 5 min buffer pre + 15 min buffer post = 65 min totales dentro del turno
    const srv = await prisma.service.create({
      data: {
        categoryId: cat.id,
        name: "Test Servicio Buffers",
        slug: `test-srv-tz-${Date.now()}`,
        shortDescription: "Corto",
        description: "Descripción test",
        durationMin: 45,
        bufferBeforeMin: 5,
        bufferAfterMin: 15,
        priceType: "FIXED",
        priceCents: 5500,
        active: true,
      },
    });
    serviceId = srv.id;

    const pro = await prisma.professional.create({
      data: {
        name: "Profesional Test TZ",
        slug: `test-pro-tz-${Date.now()}`,
        roleTitle: "Estilista",
        specialties: [],
        active: true,
        services: { create: [{ serviceId: srv.id, active: true }] },
      },
    });
    proId = pro.id;

    // Turno del profesional más amplio que el salón (08:00-22:00): NO debe ampliar el horario del salón
    await prisma.scheduleException.create({
      data: {
        targetType: "PROFESSIONAL",
        professionalId: pro.id,
        dateStr: testDate,
        isClosed: false,
        intervalsJson: [{ start: "08:00", end: "22:00" }],
        source: "MANUAL",
        authorized: true,
      },
    });
  });

  afterAll(async () => {
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

  it("rechaza la hora inexistente del cambio de hora de primavera en Europe/Madrid (2026-03-29 02:30)", () => {
    const invalidSpringDst = madridLocalToUtc("2026-03-29", "02:30");
    expect(invalidSpringDst.ok).toBe(false);

    const winterValid = madridLocalToUtc("2026-01-15", "10:00");
    expect(winterValid.ok).toBe(true);
    if (winterValid.ok) {
      expect(winterValid.utcDate.toISOString()).toBe("2026-01-15T09:00:00.000Z");
    }

    const summerValid = madridLocalToUtc("2026-07-15", "10:00");
    expect(summerValid.ok).toBe(true);
    if (summerValid.ok) {
      expect(summerValid.utcDate.toISOString()).toBe("2026-07-15T08:00:00.000Z");
    }
  });

  it("interseca turnos asegurando que un profesional nunca amplíe el horario del salón", () => {
    const effective = intersectTimeIntervals(
      [
        { start: "10:00", end: "14:00" },
        { start: "16:00", end: "20:00" },
      ],
      [{ start: "08:00", end: "18:30" }]
    );

    expect(effective).toEqual([
      { start: "10:00", end: "14:00" },
      { start: "16:00", end: "18:30" },
    ]);
  });

  it("calcula huecos respetando pausa de mediodía y exigiendo que buffers pre y post quepan dentro del turno", async () => {
    const res = await calculateAvailableSlots({
      serviceId,
      dateStr: testDate,
      professionalId: proId,
      bypassAdvanceNotice: true,
    });

    expect(res.bookingReady).toBe(true);
    const times = res.slots.map((s) => s.time);

    // 10:00 requiere bufferBefore de 5 min (09:55), por lo que 10:00 no cabe; el primero es 10:15
    expect(times).not.toContain("09:00");
    expect(times).not.toContain("10:00");
    expect(times).toContain("10:15");

    // Último hueco de mañana: start + 45 + 15 <= 14:00 -> 13:00 es válido, 13:15 excede las 14:00
    expect(times).toContain("13:00");
    expect(times).not.toContain("13:15");

    // Ningún hueco durante el cierre de mediodía 14:00-16:00 ni a las 16:00 exactas (por bufferBefore 5 min)
    expect(times).not.toContain("14:30");
    expect(times).not.toContain("16:00");
    expect(times).toContain("16:15");
    expect(times).toContain("19:00");
    expect(times).not.toContain("19:15");
  });
});
