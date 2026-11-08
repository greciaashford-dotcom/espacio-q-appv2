import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createBookingAtomic, calculateAvailableSlots } from "@/lib/domain/booking";
import { processDueJobsAndCampaigns } from "@/lib/jobs/worker";
import { sendSalonContactNotice } from "@/lib/email/notices";

const SERVICE = "svc-corte-autor";
const PRO = "pro-clara-mendoza";

function nextOpenDates(count: number): string[] {
  const out: string[] = [];
  const d = new Date(Date.now() + 3 * 24 * 3600 * 1000);
  while (out.length < count) {
    const dow = d.getUTCDay();
    if (dow >= 2 && dow <= 5) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

describe("Fase 2: bienvenida única a cliente nuevo y avisos internos al salón", () => {
  const email = `welcome.${Date.now()}@example.com`;
  const apptIds: string[] = [];
  let prevNotice: string | null = null;
  let prevContact: string | null = null;

  beforeAll(async () => {
    const s = await prisma.salonSettings.findUnique({ where: { id: "default" } });
    prevNotice = s?.noticeEmail ?? null;
    prevContact = s?.contactEmail ?? null;
    await prisma.salonSettings.update({ where: { id: "default" }, data: { noticeEmail: "avisos.salon@example.com" } });
  });

  afterAll(async () => {
    await prisma.notificationJob.deleteMany({ where: { appointmentId: { in: apptIds } } });
    await prisma.emailDelivery.deleteMany({ where: { OR: [{ appointmentId: { in: apptIds } }, { toEmail: email }, { dedupKey: { startsWith: "salon-notice-contact:test-" } }] } });
    await prisma.appointment.deleteMany({ where: { id: { in: apptIds } } });
    await prisma.client.deleteMany({ where: { emailNormalized: email } });
    await prisma.salonSettings.update({ where: { id: "default" }, data: { noticeEmail: prevNotice, contactEmail: prevContact } });
  });

  async function book(dateStr: string) {
    const av = await calculateAvailableSlots({ serviceId: SERVICE, dateStr, professionalId: PRO, bypassAdvanceNotice: true });
    const slot = av.slots[Math.floor(av.slots.length / 2)];
    const res = await createBookingAtomic({
      serviceId: SERVICE,
      professionalId: PRO,
      dateStr,
      startTime: slot.time,
      customerName: "Lucía Bienvenida",
      customerEmail: email,
      customerPhone: "600111222",
      bypassAdvanceNotice: true,
    });
    expect(res.ok).toBe(true);
    const id = (res as any).appointment.id as string;
    apptIds.push(id);
    return id;
  }

  it("primera cita → CLIENT_WELCOME + aviso al salón; segunda cita → sin segunda bienvenida", async () => {
    const [d1, d2] = nextOpenDates(2);
    const first = await book(d1);
    const jobs1 = await prisma.notificationJob.findMany({ where: { appointmentId: first } });
    const keys1 = jobs1.map((j: any) => (j.payloadJson as any).templateKey);
    expect(keys1).toContain("CLIENT_WELCOME");
    expect(keys1).toContain("SALON_NOTICE_BOOKING");

    for (let i = 0; i < 3; i++) await processDueJobsAndCampaigns({ batchSize: 200 });

    const welcome = await prisma.emailDelivery.findMany({ where: { templateKey: "CLIENT_WELCOME", toEmail: email } });
    expect(welcome).toHaveLength(1);
    expect(welcome[0].htmlBody).toContain("Te damos la bienvenida");
    const notice = await prisma.emailDelivery.findMany({ where: { templateKey: "SALON_NOTICE_BOOKING", appointmentId: first } });
    expect(notice).toHaveLength(1);
    expect(notice[0].toEmail).toBe("avisos.salon@example.com");
    expect(notice[0].htmlBody).toContain("Lucía Bienvenida");
    expect(notice[0].htmlBody).toContain("600111222");

    const second = await book(d2);
    const jobs2 = await prisma.notificationJob.findMany({ where: { appointmentId: second } });
    const keys2 = jobs2.map((j: any) => (j.payloadJson as any).templateKey);
    expect(keys2).not.toContain("CLIENT_WELCOME");
    expect(keys2).toContain("SALON_NOTICE_BOOKING");
    await processDueJobsAndCampaigns({ batchSize: 200 });
    expect(await prisma.emailDelivery.count({ where: { templateKey: "CLIENT_WELCOME", toEmail: email } })).toBe(1);
  });

  it("aviso de contacto con Reply-To del remitente; sin dirección configurada se omite", async () => {
    const res = await sendSalonContactNotice({ id: `test-${Date.now()}`, name: "Ana", email: "ana@example.com", phone: null, subject: "Duda", message: "Hola, ¿abrís el sábado?" });
    expect((res as any).status).toBe("SIMULATED_LOCAL");

    await prisma.salonSettings.update({ where: { id: "default" }, data: { noticeEmail: null, contactEmail: null } });
    const skipped = await sendSalonContactNotice({ id: `test-skip-${Date.now()}`, name: "Ana", email: "ana@example.com", message: "Hola" });
    expect((skipped as any).skipped).toBe(true);
  });
});
