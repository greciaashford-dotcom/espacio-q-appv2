// Garantía anti-solapamiento sin transacciones (sustituye a EXCLUDE USING gist de PostgreSQL).
// Cada Occupancy / ResourceReservation activa posee un documento de bloqueo por minuto [start, end)
// en la colección `slotLocks`, con índice único (resource, minute). Dos intervalos activos del mismo
// profesional/recurso que se solapen comparten al menos un minuto → el segundo insert falla (E11000).
import type { Db as MongoDb } from "mongodb";
import { MODEL_META } from "@/lib/db/schema.generated";
import { getMongoDb } from "@/lib/db/prisma";
import { DbError } from "@/lib/db/errors";

export type LockSpec = { resource: string; start: Date; end: Date } | null;

export const LOCKED_MODELS: Record<string, ((doc: any) => LockSpec) | undefined> = {
  occupancy: (d) =>
    d.active ? { resource: `PRO:${d.professionalId}`, start: new Date(d.startAtUtc), end: new Date(d.endAtUtc) } : null,
  resourceReservation: (d) =>
    d.active ? { resource: `RES:${d.resourceKey}`, start: new Date(d.startAtUtc), end: new Date(d.endAtUtc) } : null,
};

const COLLECTION = "slotLocks";
const STALE_MS = 30_000;
const MINUTE = 60_000;

export async function ensureSlotLockIndexes(db: MongoDb) {
  const c = db.collection(COLLECTION);
  await c.createIndex({ resource: 1, minute: 1 }, { unique: true, name: "uniq_resource_minute" });
  await c.createIndex({ owner: 1 }, { name: "idx_owner" });
}

function minutesOf(spec: NonNullable<LockSpec>): number[] {
  const from = Math.floor(spec.start.getTime() / MINUTE);
  const to = Math.ceil(spec.end.getTime() / MINUTE);
  if (!(to > from)) throw new DbError("P2004", "Intervalo inválido: start debe ser anterior a end.");
  return Array.from({ length: to - from }, (_, i) => from + i);
}

export class SlotOverlapError extends DbError {
  constructor(resource: string) {
    super("P2004", `Solapamiento detectado en ${resource}: la franja ya está ocupada.`, { resource });
  }
}

async function isStale(db: MongoDb, lock: any): Promise<boolean> {
  if (Date.now() - new Date(lock.createdAt).getTime() < STALE_MS) return false;
  const meta = (MODEL_META as any)[lock.model];
  const owner = meta ? await db.collection(meta.collection).findOne({ _id: lock.owner }) : null;
  const spec = owner ? LOCKED_MODELS[lock.model]?.(owner) ?? null : null;
  if (!spec || spec.resource !== lock.resource) return true;
  return !minutesOf(spec).includes(lock.minute);
}

/**
 * Reserva los minutos de `spec` para `owner` (inserción ordenada: el primer minuto decide la carrera).
 * Los minutos que ya pertenecen al mismo owner se reutilizan (reprogramaciones solapadas consigo mismas).
 * Si otro owner posee algún minuto → se compensan (borran) los insertados y se lanza SlotOverlapError.
 * `releaseOthers` elimina además los bloqueos del owner fuera de `spec` (o todos si spec es null).
 */
export async function acquireSlotLocks(model: string, owner: string, spec: LockSpec, opts: { releaseOthers?: boolean } = {}) {
  const db = await getMongoDb();
  const c = db.collection(COLLECTION);
  if (spec) {
    const minutes = minutesOf(spec);
    const inserted: number[] = [];
    const createdAt = new Date();
    let i = 0;
    let staleRetries = 0;
    while (i < minutes.length) {
      const batch = minutes.slice(i).map((minute) => ({ resource: spec.resource, minute, owner, model, createdAt }));
      try {
        await c.insertMany(batch, { ordered: true });
        inserted.push(...minutes.slice(i));
        break;
      } catch (err: any) {
        const okCount: number = err?.result?.insertedCount ?? err?.insertedCount ?? 0;
        if (err?.code !== 11000 && !err?.writeErrors?.length) {
          await c.deleteMany({ owner, resource: spec.resource, minute: { $in: inserted.concat(minutes.slice(i, i + okCount)) } });
          throw err;
        }
        inserted.push(...minutes.slice(i, i + okCount));
        const failIdx = i + okCount;
        const existing = await c.findOne({ resource: spec.resource, minute: minutes[failIdx] });
        if (existing?.owner === owner) {
          i = failIdx + 1;
          continue;
        }
        if (!existing || (staleRetries < 3 && (await isStale(db, existing)))) {
          if (existing) await c.deleteMany({ owner: existing.owner, createdAt: { $lte: new Date(Date.now() - STALE_MS) } });
          staleRetries++;
          i = failIdx;
          continue;
        }
        if (inserted.length) await c.deleteMany({ owner, resource: spec.resource, minute: { $in: inserted } });
        throw new SlotOverlapError(spec.resource);
      }
    }
  }
  if (opts.releaseOthers) {
    if (!spec) await c.deleteMany({ owner });
    else {
      const minutes = minutesOf(spec);
      await c.deleteMany({
        owner,
        $or: [{ resource: { $ne: spec.resource } }, { minute: { $lt: minutes[0] } }, { minute: { $gt: minutes[minutes.length - 1] } }],
      });
    }
  }
}

export async function releaseSlotLocks(owner: string) {
  const db = await getMongoDb();
  await db.collection(COLLECTION).deleteMany({ owner });
}

/** Limpieza de bloqueos huérfanos (owner inexistente/inactivo) con antigüedad > 30 s. */
export async function sweepOrphanSlotLocks(): Promise<number> {
  const db = await getMongoDb();
  const c = db.collection(COLLECTION);
  const owners = await c
    .aggregate([
      { $match: { createdAt: { $lte: new Date(Date.now() - STALE_MS) } } },
      { $group: { _id: { owner: "$owner", model: "$model" }, resource: { $first: "$resource" }, minute: { $first: "$minute" }, createdAt: { $first: "$createdAt" } } },
    ])
    .toArray();
  let removed = 0;
  for (const o of owners) {
    const lock = { owner: o._id.owner, model: o._id.model, resource: o.resource, minute: o.minute, createdAt: o.createdAt };
    if (await isStale(db, lock)) {
      const r = await c.deleteMany({ owner: lock.owner });
      removed += r.deletedCount;
    }
  }
  return removed;
}
