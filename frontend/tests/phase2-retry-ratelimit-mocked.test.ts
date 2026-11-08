// T1 iteration_3: mocked-fetch checks for provider 429 cooldown, 5xx/network queue retries, stale cancelled-appointment jobs
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";

const RUN = `t1it3-${Date.now()}`;
const TO = `delivered+${RUN}@resend.dev`;
const dedups: string[] = [];
const jobIds: string[] = [];
const realFetch = globalThis.fetch;

function mockFetch(status: number, body: any) {
  const fn = vi.fn(async (url: any, init?: any) => {
    if (String(url).includes("integrations.emergentagent.com")) {
      return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
    }
    return realFetch(url, init);
  });
  globalThis.fetch = fn as any;
  return fn;
}

describe("T1 it3: reintentos y límite del proveedor (fetch simulado)", () => {
  let provider: typeof import("@/lib/email/provider");
  let worker: typeof import("@/lib/jobs/worker");

  beforeAll(async () => {
    process.env.EMERGENT_EMAIL_KEY = "test-key";
    process.env.EMAIL_FROM_NAME = "ESPACIO Q Test";
    vi.resetModules();
    provider = await import("@/lib/email/provider");
    worker = await import("@/lib/jobs/worker");
  });

  afterAll(async () => {
    globalThis.fetch = realFetch;
    process.env.EMERGENT_EMAIL_KEY = "";
    await prisma.notificationJob.deleteMany({ where: { OR: [{ id: { in: jobIds } }, { dedupKey: { in: dedups.map((d) => `retry:${d}`) } }] } });
    await prisma.emailDelivery.deleteMany({ where: { dedupKey: { in: dedups } } });
  });

  const send = (key: string) => {
    const dedupKey = `${RUN}:${key}`;
    dedups.push(dedupKey);
    return provider.dispatchEmailWithAudit({
      dedupKey, category: "TRANSACTIONAL", templateKey: "CONTACT_ACK", toEmail: TO,
      subject: "Prueba", htmlBody: "<p>Hola</p>", textBody: "Hola", retryViaQueue: true, replyTo: "x@resend.dev",
    });
  };

  it("5xx -> FAILED con texto real y job RETRY_EMAIL_DELIVERY", async () => {
    mockFetch(503, { code: "upstream_error", message: "Service unavailable" });
    const r = await send("5xx");
    expect(r.status).toBe("FAILED");
    expect(r.errorMessage).toContain("Service unavailable");
    expect(r.rateLimited).toBe(false);
    const job = await prisma.notificationJob.findUnique({ where: { dedupKey: `retry:${RUN}:5xx` } });
    expect(job?.jobType).toBe("RETRY_EMAIL_DELIVERY");
    expect(job?.status).toBe("PENDING");
    expect((job?.payloadJson as any).replyTo).toBe("x@resend.dev");
  });

  it("error de red -> job de reintento; 400 no reintentable -> sin job", async () => {
    globalThis.fetch = vi.fn(async () => { throw new Error("ECONNRESET simulated"); }) as any;
    const r = await send("net");
    expect(r.status).toBe("FAILED");
    expect(await prisma.notificationJob.count({ where: { dedupKey: `retry:${RUN}:net` } })).toBe(1);
    mockFetch(422, { code: "validation_error", message: "Invalid to" });
    const r2 = await send("422");
    expect(r2.status).toBe("FAILED");
    expect(await prisma.notificationJob.count({ where: { dedupKey: `retry:${RUN}:422` } })).toBe(0);
  });

  it("worker: RETRY job reenvía la entrega FAILED y la completa (ACCEPTED)", async () => {
    const job = await prisma.notificationJob.findUnique({ where: { dedupKey: `retry:${RUN}:5xx` } });
    await prisma.notificationJob.update({ where: { id: job!.id }, data: { nextAttemptUtc: new Date(Date.now() - 1000) } });
    const f = mockFetch(200, { id: "msg_mock_123" });
    await worker.processDueJobsAndCampaigns({ batchSize: 50 });
    const after = await prisma.notificationJob.findUnique({ where: { id: job!.id } });
    expect(after?.status).toBe("COMPLETED");
    const d = await prisma.emailDelivery.findUnique({ where: { dedupKey: `${RUN}:5xx` } });
    expect(d?.status).toBe("ACCEPTED");
    expect(d?.providerMessageId).toBe("msg_mock_123");
    const sent = JSON.parse((f.mock.calls.find((c) => String(c[0]).includes("integrations"))![1] as any).body);
    expect(sent.contact_email).toBe("x@resend.dev");
  });

  it("worker: 429 -> job vuelve a PENDING sin consumir intento, +~11 min, y se detiene el lote", async () => {
    const job = await prisma.notificationJob.findUnique({ where: { dedupKey: `retry:${RUN}:net` } });
    await prisma.notificationJob.update({ where: { id: job!.id }, data: { nextAttemptUtc: new Date(Date.now() - 1000) } });
    // segundo job vencido que NO debe procesarse tras el 429
    const extraKey = `${RUN}:extra`;
    dedups.push(extraKey);
    await prisma.emailDelivery.create({ data: { dedupKey: extraKey, category: "TRANSACTIONAL", templateKey: "CONTACT_ACK", toEmail: TO, subject: "s", htmlBody: "<p>x</p>", textBody: "x", status: "FAILED", providerName: "RESEND" } });
    const extra = await prisma.notificationJob.create({ data: { jobType: "RETRY_EMAIL_DELIVERY", dedupKey: `retry:${extraKey}`, scheduledAtUtc: new Date(Date.now() + 1000 * 0), nextAttemptUtc: new Date(Date.now() - 1000), maxAttempts: 8, payloadJson: { deliveryDedupKey: extraKey } } });
    jobIds.push(extra.id);
    const before = await prisma.notificationJob.findUnique({ where: { id: job!.id } });
    const f = mockFetch(429, { code: "rate_limited", message: "Too many requests" });
    const t0 = Date.now();
    await worker.processDueJobsAndCampaigns({ batchSize: 50 });
    const calls = f.mock.calls.filter((c) => String(c[0]).includes("integrations")).length;
    expect(calls).toBe(1);
    const after = await prisma.notificationJob.findUnique({ where: { id: job!.id } });
    expect(after?.status).toBe("PENDING");
    expect(after?.attempts).toBe(before!.attempts);
    const delta = after!.nextAttemptUtc.getTime() - t0;
    expect(delta).toBeGreaterThan(10 * 60 * 1000);
    expect(delta).toBeLessThan(12 * 60 * 1000);
    expect(after?.lastError).toContain("Too many requests");
    const d = await prisma.emailDelivery.findUnique({ where: { dedupKey: `${RUN}:net` } });
    expect(d?.status).toBe("FAILED");
    expect(d?.errorMessage).toContain("rate_limited");
    const ex = await prisma.notificationJob.findUnique({ where: { id: extra.id } });
    expect(ex?.status).toBe("PENDING");
    expect(ex?.attempts).toBe(0);
    expect(provider.isProviderCoolingDown()).toBe(true);
  });

  it("durante la pausa: envío directo no llama al proveedor, queda FAILED y reintento a ~11 min", async () => {
    const f = mockFetch(200, { id: "should-not-be-called" });
    const t0 = Date.now();
    const r = await send("cool");
    expect(r.status).toBe("FAILED");
    expect(r.rateLimited).toBe(true);
    expect(f.mock.calls.filter((c) => String(c[0]).includes("integrations")).length).toBe(0);
    const job = await prisma.notificationJob.findUnique({ where: { dedupKey: `retry:${RUN}:cool` } });
    expect(job!.nextAttemptUtc.getTime() - t0).toBeGreaterThan(10 * 60 * 1000);
  });

  it("campaña con 0 aceptados -> FAILED, sin sentAtUtc, errorText real", async () => {
    const em = `${RUN}.camp@resend.dev`;
    const sub = await prisma.subscriber.create({ data: { email: em, emailNormalized: em, status: "ACTIVE", confirmedAt: new Date(), unsubscribeTokenHash: `${RUN}-uh`, tags: [] } });
    const camp = await prisma.campaign.create({ data: { name: `TEST_${RUN}`, subject: "S", heading: "H", bodyText: "Body", segmentFilterJson: {}, status: "SCHEDULED", scheduledAtUtc: new Date(Date.now() - 1000), totalRecipients: 1 } });
    await prisma.campaignRecipient.create({ data: { campaignId: camp.id, subscriberId: sub.id, emailNormalized: em } });
    dedups.push(`campaign:${camp.id}:sub:${sub.id}`);
    try {
      await worker.processDueJobsAndCampaigns({ batchSize: 1 });
      const c = await prisma.campaign.findUnique({ where: { id: camp.id } });
      expect(c?.status).toBe("FAILED");
      expect(c?.sentAtUtc).toBeNull();
      const rec = await prisma.campaignRecipient.findFirst({ where: { campaignId: camp.id } });
      expect(rec?.status).toBe("FAILED");
      expect(rec?.errorText).toBe(provider.MANAGED_MARKETING_BLOCKED_MESSAGE);
    } finally {
      await prisma.campaign.delete({ where: { id: camp.id } });
      await prisma.subscriber.delete({ where: { id: sub.id } });
    }
  });

  it("cita cancelada antes de procesar: confirmación/bienvenida descartadas, cancelación enviada", async () => {
    vi.resetModules(); // nuevo módulo de proveedor: sin la pausa del test 429
    worker = await import("@/lib/jobs/worker");
    const { createBookingAtomic, calculateAvailableSlots, cancelBookingAtomic } = await import("@/lib/domain/booking");
    const em = `${RUN}.stale@example.com`;
    const d = new Date(Date.now() + 9 * 24 * 3600 * 1000);
    while (!(d.getUTCDay() >= 2 && d.getUTCDay() <= 5)) d.setUTCDate(d.getUTCDate() + 1);
    const dateStr = d.toISOString().slice(0, 10);
    const av = await calculateAvailableSlots({ serviceId: "svc-corte-autor", dateStr, professionalId: "pro-clara-mendoza", bypassAdvanceNotice: true });
    const slot = av.slots[av.slots.length - 1];
    const res: any = await createBookingAtomic({ serviceId: "svc-corte-autor", professionalId: "pro-clara-mendoza", dateStr, startTime: slot.time, customerName: "TEST_Stale", customerEmail: em, customerPhone: "600000000", bypassAdvanceNotice: true });
    expect(res.ok).toBe(true);
    const apptId = res.appointment.id;
    try {
      const c = await cancelBookingAtomic({ appointmentId: apptId, actorType: "ADMIN", bypassPolicyWindow: true });
      expect(c.ok).toBe(true);
      await worker.processDueJobsAndCampaigns({ batchSize: 50 });
      const jobs = await prisma.notificationJob.findMany({ where: { appointmentId: apptId } });
      const byTpl = Object.fromEntries(jobs.map((j) => [String((j.payloadJson as any)?.templateKey ?? j.jobType), j]));
      const init = jobs.find((j) => j.dedupKey.startsWith("appt-init:"))!;
      expect(init.status).toBe("CANCELLED");
      expect(init.lastError).toContain("cancelada");
      expect(byTpl["CLIENT_WELCOME"]?.status).toBe("COMPLETED");
      expect(byTpl["APPOINTMENT_CANCELLED"]?.status).toBe("COMPLETED");
      const dels = await prisma.emailDelivery.findMany({ where: { appointmentId: apptId } });
      const tpls = dels.map((x) => x.templateKey);
      expect(tpls).toContain("APPOINTMENT_CANCELLED");
      expect(tpls).not.toContain("APPOINTMENT_CONFIRMATION");
      expect(tpls).toContain("CLIENT_WELCOME");
      console.log("stale jobs:", jobs.map((j) => `${(j.payloadJson as any)?.templateKey}:${j.status}`).join(", "));
    } finally {
      await prisma.notificationJob.deleteMany({ where: { appointmentId: apptId } });
      await prisma.emailDelivery.deleteMany({ where: { appointmentId: apptId } });
      await prisma.appointment.delete({ where: { id: apptId } }).catch(() => {});
      await prisma.client.deleteMany({ where: { emailNormalized: em } });
    }
  });
});
