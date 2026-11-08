// Planificador interno de la cola de notificaciones: procesa trabajos vencidos cada JOB_SCHEDULER_INTERVAL_SEC
// (por defecto 300 s). Un lease en MongoDB evita ejecuciones simultáneas entre instancias; el cron de
// plataforma (/app/.emergent/crons.yml → POST /api/internal/jobs) puede convivir: los jobs se reclaman atómicamente.
import { getMongoDb } from "@/lib/db/prisma";
import { sweepOrphanSlotLocks } from "@/lib/db/slot-locks";
import { processDueJobsAndCampaigns } from "@/lib/jobs/worker";

const g = globalThis as unknown as { __jobScheduler?: NodeJS.Timeout };

async function tick(intervalMs: number) {
  const db = await getMongoDb();
  const now = new Date();
  const leases = db.collection<{ _id: string; until: Date; lastRunAt?: Date; lastResult?: unknown }>("schedulerLeases");
  // Se ejecuta si han pasado ~intervalMs desde la última pasada (persistida: sobrevive a reinicios)
  // y nadie tiene el lease de ejecución (120 s) en este momento.
  const got = await leases
    .findOneAndUpdate(
      {
        _id: "job-queue",
        until: { $lte: now },
        $or: [{ lastRunAt: { $exists: false } }, { lastRunAt: { $lte: new Date(now.getTime() - intervalMs + 10_000) } }],
      },
      { $set: { until: new Date(now.getTime() + 120_000) } },
      { upsert: true, returnDocument: "after" }
    )
    .catch((err: any) => (err?.code === 11000 ? null : Promise.reject(err)));
  if (!got) return;
  const jobStats = await processDueJobsAndCampaigns({ nowUtc: now, batchSize: 50 });
  const orphanLocksRemoved = await sweepOrphanSlotLocks();
  await leases.updateOne({ _id: "job-queue" }, { $set: { lastRunAt: now, until: now, lastResult: { jobStats, orphanLocksRemoved } } });
  if (jobStats.processedJobs > 0) console.log("[scheduler] cola procesada", JSON.stringify(jobStats));
}

export function startJobScheduler() {
  if (g.__jobScheduler || process.env.NODE_ENV === "test") return;
  const intervalSec = Number.parseInt(process.env.JOB_SCHEDULER_INTERVAL_SEC || "300", 10);
  if (!(intervalSec > 0)) return;
  const intervalMs = intervalSec * 1000;
  const run = () => tick(intervalMs).catch((err) => console.error("[scheduler] error procesando la cola:", err));
  setTimeout(run, 15_000);
  // Comprobación cada minuto; la ejecución real ocurre cada intervalMs (lastRunAt en MongoDB)
  g.__jobScheduler = setInterval(run, Math.min(60_000, intervalMs));
}
