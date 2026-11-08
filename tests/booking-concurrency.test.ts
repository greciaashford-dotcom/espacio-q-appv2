import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  createBookingAtomic,
  rescheduleBookingAtomic,
} from "@/lib/domain/booking";
import { detectScheduleConflictsForFutureAppointments } from "@/lib/domain/schedule";

describe("Concurrencia real PostgreSQL GIST, idempotencia, reprogramación atómica y conflictos", () => {
  let prevSettings: { publicBookingEnabled: boolean; scheduleConfirmed: boolean } | null = null;
  let categoryId = "";
  let serviceId = "";
  let proId = "";
  const createdClientEmails: string[] = [];
  const testDate = "2027-06-15";

  beforeAll(async () => {
    const s = await prisma.salonSettings.findUnique({ where: { id: "default" } });
    prevSettings = s
      ? {
          publicBookingEnabled: s.publicBookingEnabled,
          scheduleConfirmed: s.scheduleConfirmed,
        }
      : null;

    await prisma.salonSettings.update({
      where: { id: "default" },
      data: {
        scheduleConfirmed: true,
        publicBookingEnabled: true,
        bookingApprovalMode: "AUTOMATIC",
        slotIntervalMin: 15,
      },
    });

    await prisma.scheduleException.create({
      data: {
        targetType: "SALON",
        dateStr: testDate,
        isClosed: false,
        intervalsJson: [{ start: "10:00", end: "20:00" }],
        source: "MANUAL",
        authorized: true,
      },
    });

    const cat = await prisma.serviceCategory.create({
      data: { name: "Test Cat Concurrency", slug: `test-cat-conc-${Date.now()}` },
    });
    categoryId = cat.id;

    const srv = await prisma.service.create({
      data: {
        categoryId: cat.id,
        name: "Test Servicio GIST",
        slug: `test-srv-conc-${Date.now()}`,
        shortDescription: "Corto",
        description: "Desc",
        durationMin: 45,
        bufferBeforeMin: 0,
        bufferAfterMin: 15,
        priceType: "FIXED",
        priceCents: 6000,
        active: true,
      },
    });
    serviceId = srv.id;

    const pro = await prisma.professional.create({
      data: {
        name: "Profesional Test GIST",
        slug: `test-pro-conc-${Date.now()}`,
        roleTitle: "Colorista",
        specialties: [],
        active: true,
        services: { create: [{ serviceId: srv.id, active: true }] },
      },
    });
    proId = pro.id;
  });

  afterAll(async () => {
    const appts = await prisma.appointment.findMany({
      where: { professionalId: proId },
      select: { id: true },
    });
    const apptIds = appts.map((a) => a.id);

    await prisma.notificationJob.deleteMany({ where: { appointmentId: { in: apptIds } } });
    await prisma.emailDelivery.deleteMany({ where: { appointmentId: { in: apptIds } } });
    await prisma.scheduleConflictAlert.deleteMany({ where: { appointmentId: { in: apptIds } } });
    await prisma.appointment.deleteMany({ where: { id: { in: apptIds } } });
    await prisma.client.deleteMany({ where: { emailNormalized: { in: createdClientEmails } } });
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

  it("impide doble reserva cuando entran dos peticiones simultáneas para el mismo profesional y franja solapada", async () => {
    const emailA = `conc-a-${Date.now()}@espacioq-test.es`;
    const emailB = `conc-b-${Date.now()}@espacioq-test.es`;
    createdClientEmails.push(emailA, emailB);

    const [resA, resB] = await Promise.all([
      createBookingAtomic({
        serviceId,
        professionalId: proId,
        dateStr: testDate,
        startTime: "11:00",
        customerName: "Cliente Concurrente A",
        customerEmail: emailA,
        bypassAdvanceNotice: true,
      }),
      createBookingAtomic({
        serviceId,
        professionalId: proId,
        dateStr: testDate,
        startTime: "11:15", // Solapa con 11:00-12:00
        customerName: "Cliente Concurrente B",
        customerEmail: emailB,
        bypassAdvanceNotice: true,
      }),
    ]);

    const successes = [resA, resB].filter((r) => r.ok);
    const conflicts = [resA, resB].filter((r) => !r.ok);

    expect(successes).toHaveLength(1);
    expect(conflicts).toHaveLength(1);
    if (!conflicts[0].ok) {
      expect(conflicts[0].status).toBe(409);
    }
  });

  it("garantiza idempotencia ante reintentos de red sin duplicar cita ni notificaciones", async () => {
    const emailIdem = `idem-${Date.now()}@espacioq-test.es`;
    createdClientEmails.push(emailIdem);
    const idemKey = `idem-key-${Date.now()}`;

    const first = await createBookingAtomic({
      serviceId,
      professionalId: proId,
      dateStr: testDate,
      startTime: "13:00",
      customerName: "Cliente Idempotente",
      customerEmail: emailIdem,
      idempotencyKey: idemKey,
      bypassAdvanceNotice: true,
    });

    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const jobsBefore = await prisma.notificationJob.count({
      where: { appointmentId: first.appointment.id },
    });

    const replay = await createBookingAtomic({
      serviceId,
      professionalId: proId,
      dateStr: testDate,
      startTime: "13:00",
      customerName: "Cliente Idempotente",
      customerEmail: emailIdem,
      idempotencyKey: idemKey,
      bypassAdvanceNotice: true,
    });

    expect(replay.ok).toBe(true);
    if (replay.ok) {
      expect(replay.idempotentReplay).toBe(true);
      expect(replay.appointment.id).toBe(first.appointment.id);
    }

    const jobsAfter = await prisma.notificationJob.count({
      where: { appointmentId: first.appointment.id },
    });
    expect(jobsAfter).toBe(jobsBefore);
  });

  it("mantiene intacta la cita original si una reprogramación falla por conflicto de franja", async () => {
    const emailMove = `move-${Date.now()}@espacioq-test.es`;
    createdClientEmails.push(emailMove);

    const created = await createBookingAtomic({
      serviceId,
      professionalId: proId,
      dateStr: testDate,
      startTime: "16:00",
      customerName: "Cliente Reprogramar",
      customerEmail: emailMove,
      bypassAdvanceNotice: true,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    // Intentar mover a las 13:00, que ya está ocupada por la prueba anterior
    const failedMove = await rescheduleBookingAtomic({
      appointmentId: created.appointment.id,
      newDateStr: testDate,
      newStartTime: "13:00",
      actorType: "ADMIN",
      bypassPolicyWindow: true,
    });

    expect(failedMove.ok).toBe(false);
    if (!failedMove.ok) {
      expect(failedMove.status).toBe(409);
    }

    const reloaded = await prisma.appointment.findUnique({
      where: { id: created.appointment.id },
      include: { occupancy: true },
    });
    expect(reloaded?.startTimeMadrid).toBe("16:00");
    expect(reloaded?.occupancy?.active).toBe(true);
  });

  it("genera alerta de conflicto cuando un cambio de horario afecta a una cita futura sin cancelarla automáticamente", async () => {
    // Cerrar el salón en testDate tras tener citas confirmadas
    await prisma.scheduleException.updateMany({
      where: { targetType: "SALON", dateStr: testDate },
      data: { isClosed: true, intervalsJson: [] },
    });

    const conflicts = await detectScheduleConflictsForFutureAppointments("TEST_CLOSURE");
    expect(conflicts.conflictCount).toBeGreaterThanOrEqual(1);

    const appts = await prisma.appointment.findMany({
      where: { professionalId: proId, dateStrMadrid: testDate },
    });
    for (const a of appts) {
      expect(a.status).toBe("CONFIRMED");
    }
  });
});
