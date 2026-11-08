// Capa de acceso a datos MongoDB con API compatible con el subconjunto de Prisma usado por la app.
// Sin transacciones multi-documento (mongod standalone): escrituras secuenciales + compensación.
// Anti-solapamiento de Occupancy/ResourceReservation mediante documentos de bloqueo por minuto (lib/db/slot-locks.ts).
import { MongoClient, type Db as MongoDb, type Collection } from "mongodb";
import { MODEL_META, type ModelKey } from "@/lib/db/schema.generated";
import { acquireSlotLocks, releaseSlotLocks, ensureSlotLockIndexes, LOCKED_MODELS } from "@/lib/db/slot-locks";
import { newId } from "@/lib/db/id";
import { DbError } from "@/lib/db/errors";

type FieldMeta = {
  name: string;
  type: string;
  kind: "scalar" | "enum" | "relation";
  isList: boolean;
  isOptional: boolean;
  isId?: boolean;
  updatedAt?: boolean;
  default?: { kind: "cuid" | "now" | "value"; value?: unknown };
  fk?: string;
  ref?: string;
  onDelete?: string;
  backFk?: string;
  backRef?: string;
};
type ModelMeta = { name: string; collection: string; fields: Record<string, FieldMeta>; uniques: string[][]; indexes: string[][] };

const META = MODEL_META as unknown as Record<string, ModelMeta>;
const BY_NAME: Record<string, string> = Object.fromEntries(Object.entries(META).map(([k, m]) => [m.name, k]));

export { DbError };

// ---------- Conexión ----------
const g = globalThis as unknown as { __mongo?: { client: MongoClient; db: MongoDb; ready: Promise<void> } };

function connection() {
  if (!g.__mongo) {
    const url = process.env.MONGO_URL;
    const name = process.env.DB_NAME;
    if (!url || !name) {
      console.error("[db] Faltan variables de entorno MONGO_URL y/o DB_NAME.");
      throw new DbError("DB_CONFIG", "MONGO_URL y DB_NAME son obligatorias.");
    }
    const client = new MongoClient(url, { serverSelectionTimeoutMS: 5000, maxPoolSize: 20 });
    const db = client.db(name);
    const ready = ensureIndexes(db).catch((err) => {
      g.__mongo = undefined;
      throw err;
    });
    g.__mongo = { client, db, ready };
  }
  return g.__mongo;
}

export async function getMongoDb(): Promise<MongoDb> {
  const c = connection();
  await c.ready;
  return c.db;
}

async function col(key: string): Promise<Collection<any>> {
  return (await getMongoDb()).collection(META[key].collection);
}

function bsonType(f: FieldMeta) {
  if (f.type === "DateTime") return "date";
  if (f.type === "Int" || f.type === "Float") return "number";
  if (f.type === "Boolean") return "bool";
  return "string";
}

async function ensureIndexes(db: MongoDb) {
  await db.command({ ping: 1 });
  for (const m of Object.values(META)) {
    const c = db.collection(m.collection);
    for (const u of m.uniques) {
      const fields = u.map((n) => m.fields[n]);
      if (fields.some((f) => f.isId)) continue;
      const nullable = fields.filter((f) => f.isOptional);
      await c.createIndex(Object.fromEntries(u.map((n) => [n, 1])), {
        unique: true,
        name: `uniq_${u.join("_")}`,
        ...(nullable.length
          ? { partialFilterExpression: Object.fromEntries(nullable.map((f) => [f.name, { $type: bsonType(f) }])) }
          : {}),
      });
    }
    for (const idx of m.indexes) {
      await c.createIndex(Object.fromEntries(idx.map((n) => [n, 1])), { name: `idx_${idx.join("_")}` });
    }
  }
  await ensureSlotLockIndexes(db);
}

// ---------- Utilidades ----------
const isPlainObject = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const dbField = (f: string) => (f === "id" ? "_id" : f);

function coerce(f: FieldMeta, v: any): any {
  if (v === null || v === undefined) return v;
  if (f.type === "DateTime") {
    if (Array.isArray(v)) return v.map((x) => (x instanceof Date ? x : new Date(x)));
    return v instanceof Date ? v : new Date(v);
  }
  return v;
}

function duplicateError(err: any, key: string): never {
  const pattern = err?.keyPattern ?? err?.writeErrors?.[0]?.err?.keyPattern ?? {};
  const target = Object.keys(pattern);
  throw new DbError("P2002", `Unique constraint failed on ${META[key].name}(${target.join(", ")})`, { target });
}

const isDup = (err: any) => err?.code === 11000 || err?.writeErrors?.some?.((e: any) => e.code === 11000);

// ---------- WHERE ----------
async function compileWhere(key: string, where: any): Promise<Record<string, any>> {
  if (!where) return {};
  const m = META[key];
  const clauses: Record<string, any>[] = [];

  for (const [k, raw] of Object.entries(where)) {
    if (raw === undefined) continue;
    if (k === "AND" || k === "OR" || k === "NOT") {
      const list = Array.isArray(raw) ? raw : [raw];
      const compiled = await Promise.all(list.map((w) => compileWhere(key, w)));
      if (k === "AND") clauses.push(...compiled.filter((c) => Object.keys(c).length));
      else if (k === "OR") clauses.push(compiled.length ? { $or: compiled } : { _id: { $exists: false } });
      else if (compiled.length) clauses.push({ $nor: compiled });
      continue;
    }
    const f = m.fields[k];
    if (!f) {
      const combo = m.uniques.find((u) => u.join("_") === k);
      if (combo && isPlainObject(raw)) {
        clauses.push(await compileWhere(key, raw));
        continue;
      }
      throw new DbError("P2009", `Campo desconocido en where: ${m.name}.${k}`);
    }
    if (f.kind === "relation") {
      clauses.push(await compileRelationFilter(f, raw));
      continue;
    }
    clauses.push(compileScalarFilter(f, raw));
  }
  const nonEmpty = clauses.filter((c) => Object.keys(c).length);
  if (nonEmpty.length === 0) return {};
  if (nonEmpty.length === 1) return nonEmpty[0];
  return { $and: nonEmpty };
}

function compileScalarFilter(f: FieldMeta, raw: any): Record<string, any> {
  const name = dbField(f.name);
  if (raw === null) return { [name]: null };
  if (!isPlainObject(raw) || f.type === "Json") {
    return { [name]: f.isList && Array.isArray(raw) ? { $eq: raw } : coerce(f, raw) };
  }
  const cond: Record<string, any> = {};
  const extra: Record<string, any>[] = [];
  const insensitive = raw.mode === "insensitive";
  for (const [op, v0] of Object.entries(raw)) {
    if (v0 === undefined || op === "mode") continue;
    const v = coerce(f, v0);
    switch (op) {
      case "equals":
        if (v === null) extra.push({ [name]: null });
        else cond.$eq = v;
        break;
      case "in":
        cond.$in = v;
        break;
      case "notIn":
        cond.$nin = [...v, null];
        break;
      case "lt":
      case "lte":
      case "gt":
      case "gte":
        cond[`$${op}`] = v;
        break;
      case "not":
        if (v === null) cond.$ne = null;
        else if (isPlainObject(v)) extra.push({ $nor: [compileScalarFilter(f, v)] }, { [name]: { $ne: null } });
        else cond.$nin = [v, null];
        break;
      case "contains":
        extra.push({ [name]: { $regex: escapeRe(v), ...(insensitive ? { $options: "i" } : {}) } });
        break;
      case "startsWith":
        extra.push({ [name]: { $regex: `^${escapeRe(v)}`, ...(insensitive ? { $options: "i" } : {}) } });
        break;
      case "endsWith":
        extra.push({ [name]: { $regex: `${escapeRe(v)}$`, ...(insensitive ? { $options: "i" } : {}) } });
        break;
      case "has":
        extra.push({ [name]: v });
        break;
      case "hasSome":
        extra.push({ [name]: { $in: v } });
        break;
      case "hasEvery":
        extra.push({ [name]: { $all: v } });
        break;
      case "isEmpty":
        extra.push(v ? { [name]: { $size: 0 } } : { [`${name}.0`]: { $exists: true } });
        break;
      default:
        throw new DbError("P2009", `Operador no soportado: ${op}`);
    }
  }
  if (insensitive && cond.$eq !== undefined) {
    extra.push({ [name]: { $regex: `^${escapeRe(String(cond.$eq))}$`, $options: "i" } });
    delete cond.$eq;
  }
  const all = [...(Object.keys(cond).length ? [{ [name]: cond }] : []), ...extra];
  if (all.length === 0) return {};
  return all.length === 1 ? all[0] : { $and: all };
}

async function distinctValues(key: string, field: string, where: any): Promise<any[]> {
  const filter = await compileWhere(key, where);
  const vals = await (await col(key)).distinct(dbField(field), filter);
  return vals.filter((v: any) => v !== null && v !== undefined);
}

async function compileRelationFilter(f: FieldMeta, raw: any): Promise<Record<string, any>> {
  const target = BY_NAME[f.type];
  if (f.isList) {
    const fk = f.backFk!;
    const out: Record<string, any>[] = [];
    if (raw.some !== undefined) out.push({ _id: { $in: await distinctValues(target, fk, raw.some) } });
    if (raw.none !== undefined) out.push({ _id: { $nin: await distinctValues(target, fk, raw.none) } });
    if (raw.every !== undefined) out.push({ _id: { $nin: await distinctValues(target, fk, { NOT: raw.every }) } });
    return out.length === 1 ? out[0] : { $and: out };
  }
  let sub = raw;
  let negate = false;
  if (isPlainObject(raw) && ("is" in raw || "isNot" in raw)) {
    negate = "isNot" in raw;
    sub = negate ? raw.isNot : raw.is;
  }
  if (f.fk) {
    if (sub === null) return { [f.fk]: negate ? { $ne: null } : null };
    const ids = await distinctValues(target, "id", sub);
    return { [f.fk]: negate ? { $nin: ids } : { $in: ids } };
  }
  if (sub === null) {
    const ids = await distinctValues(target, f.backFk!, {});
    return { _id: negate ? { $in: ids } : { $nin: ids } };
  }
  const ids = await distinctValues(target, f.backFk!, sub);
  return { _id: negate ? { $nin: ids } : { $in: ids } };
}

// ---------- LECTURA ----------
function buildSort(key: string, orderBy: any): Record<string, 1 | -1> | undefined {
  if (!orderBy) return undefined;
  const list = Array.isArray(orderBy) ? orderBy : [orderBy];
  const sort: Record<string, 1 | -1> = {};
  for (const o of list) {
    for (const [k, v] of Object.entries(o)) {
      const f = META[key].fields[k];
      if (!f || f.kind === "relation") throw new DbError("P2009", `orderBy no soportado: ${META[key].name}.${k}`);
      const dir = typeof v === "string" ? v : (v as any)?.sort;
      sort[dbField(k)] = dir === "desc" ? -1 : 1;
    }
  }
  if (!("_id" in sort)) sort._id = 1;
  return sort;
}

function toModel(key: string, doc: any): any {
  if (!doc) return doc;
  const out: Record<string, any> = {};
  for (const f of Object.values(META[key].fields)) {
    if (f.kind === "relation") continue;
    const v = f.isId ? doc._id : doc[f.name];
    out[f.name] = v === undefined ? (f.isList ? [] : null) : v;
  }
  return out;
}

async function rawFind(key: string, args: any = {}): Promise<any[]> {
  const filter = await compileWhere(key, args.where);
  let cursor = (await col(key)).find(filter);
  const sort = buildSort(key, args.orderBy);
  if (sort) cursor = cursor.sort(sort);
  if (args.skip) cursor = cursor.skip(args.skip);
  if (args.take !== undefined) cursor = cursor.limit(Math.abs(args.take));
  return cursor.toArray();
}

const pick = (a: any) => ({ select: a.select, include: a.include });

async function shape(key: string, docs: any[], args: any = {}): Promise<any[]> {
  const m = META[key];
  const models = docs.map((d) => toModel(key, d));
  const spec: Record<string, any> = args.select ?? args.include ?? {};

  for (const [rel, relArgsRaw] of Object.entries(spec)) {
    if (!relArgsRaw) continue;
    if (rel === "_count") {
      await attachCounts(key, models, relArgsRaw);
      continue;
    }
    const f = m.fields[rel];
    if (!f) throw new DbError("P2009", `Campo desconocido en select/include: ${m.name}.${rel}`);
    if (f.kind !== "relation") continue;
    const relArgs = relArgsRaw === true ? {} : (relArgsRaw as any);
    const target = BY_NAME[f.type];
    if (f.fk) {
      const ids = Array.from(new Set(models.map((x) => x[f.fk!]).filter((v) => v != null)));
      const rawRel = ids.length ? await rawFind(target, { where: { id: { in: ids } } }) : [];
      const shaped = await shape(target, rawRel, pick(relArgs));
      const byId = new Map(rawRel.map((r, i) => [r._id, shaped[i]]));
      for (const x of models) x[rel] = x[f.fk] != null ? byId.get(x[f.fk]) ?? null : null;
    } else {
      const parentIds = models.map((x) => x.id);
      const where = { AND: [{ [f.backFk!]: { in: parentIds } }, relArgs.where ?? {}] };
      const rawRel = parentIds.length ? await rawFind(target, { where, orderBy: relArgs.orderBy }) : [];
      const shaped = await shape(target, rawRel, pick(relArgs));
      const groups = new Map<string, any[]>();
      rawRel.forEach((r, i) => {
        const p = r[f.backFk!];
        if (!groups.has(p)) groups.set(p, []);
        groups.get(p)!.push(shaped[i]);
      });
      for (const x of models) {
        let list = groups.get(x.id) ?? [];
        if (relArgs.skip) list = list.slice(relArgs.skip);
        if (relArgs.take !== undefined) list = list.slice(0, relArgs.take);
        x[rel] = f.isList ? list : list[0] ?? null;
      }
    }
  }

  if (args.select) {
    const keys = Object.keys(spec).filter((k) => spec[k]);
    return models.map((x) => Object.fromEntries(keys.map((k) => [k, x[k]])));
  }
  return models;
}

async function attachCounts(key: string, models: any[], countArgs: any) {
  const m = META[key];
  const sel: Record<string, any> =
    countArgs === true
      ? Object.fromEntries(Object.values(m.fields).filter((f) => f.kind === "relation" && f.isList).map((f) => [f.name, true]))
      : countArgs.select ?? {};
  const ids = models.map((x) => x.id);
  const counts: Record<string, Record<string, number>> = {};
  for (const [rel, v] of Object.entries(sel)) {
    if (!v) continue;
    const f = m.fields[rel];
    const target = BY_NAME[f.type];
    const filter = await compileWhere(target, { AND: [{ [f.backFk!]: { in: ids } }, (v as any)?.where ?? {}] });
    const rows = await (await col(target))
      .aggregate([{ $match: filter }, { $group: { _id: `$${f.backFk}`, n: { $sum: 1 } } }])
      .toArray();
    counts[rel] = Object.fromEntries(rows.map((r) => [r._id, r.n]));
  }
  for (const x of models) {
    x._count = Object.fromEntries(Object.keys(counts).map((rel) => [rel, counts[rel][x.id] ?? 0]));
  }
}

async function findManyImpl(key: string, args: any = {}) {
  return shape(key, await rawFind(key, args), args);
}

async function findFirstImpl(key: string, args: any = {}) {
  const [r] = await findManyImpl(key, { ...args, take: 1 });
  return r ?? null;
}

// ---------- ESCRITURA ----------
type Deferred = (parentId: string) => Promise<void>;

function buildCreateDoc(key: string, data: any): { doc: Record<string, any>; deferred: Deferred[] } {
  const m = META[key];
  const doc: Record<string, any> = {};
  const deferred: Deferred[] = [];
  const now = new Date();
  for (const [k, v] of Object.entries(data ?? {})) {
    if (v === undefined) continue;
    const f = m.fields[k];
    if (!f) throw new DbError("P2009", `Campo desconocido en create: ${m.name}.${k}`);
    if (f.kind === "relation") {
      deferred.push(...relationWrite(f, v, doc));
      continue;
    }
    const val = isPlainObject(v) && f.isList && "set" in v ? (v as any).set : v;
    doc[dbField(k)] = coerce(f, val);
  }
  for (const f of Object.values(m.fields)) {
    if (f.kind === "relation") continue;
    const name = dbField(f.name);
    if (doc[name] !== undefined) continue;
    if (f.updatedAt) doc[name] = now;
    else if (f.default?.kind === "cuid") doc[name] = newId();
    else if (f.default?.kind === "now") doc[name] = now;
    else if (f.default?.kind === "value") doc[name] = f.default.value;
    else if (f.isList) doc[name] = [];
    else if (f.isOptional) doc[name] = null;
  }
  if (doc._id === undefined) doc._id = newId();
  return { doc, deferred };
}

function relationWrite(f: FieldMeta, v: any, doc: Record<string, any>): Deferred[] {
  const target = BY_NAME[f.type];
  const out: Deferred[] = [];
  if (f.fk) {
    if (v.connect) doc[f.fk] = v.connect.id;
    if (v.disconnect) doc[f.fk] = null;
    if (v.create) {
      const created = buildCreateDoc(target, v.create);
      doc[f.fk] = created.doc._id;
      out.push(async () => {
        await insertDoc(target, created.doc);
        for (const d of created.deferred) await d(created.doc._id);
      });
    }
    return out;
  }
  const fk = f.backFk!;
  const asList = (x: any) => (Array.isArray(x) ? x : [x]);
  if (v.deleteMany !== undefined)
    out.push(async (pid) => {
      await deleteManyImpl(target, { where: { AND: [{ [fk]: pid }, v.deleteMany ?? {}] } });
    });
  if (v.create)
    out.push(async (pid) => {
      for (const c of asList(v.create)) await createImpl(target, { data: { ...c, [fk]: pid } });
    });
  if (v.createMany)
    out.push(async (pid) => {
      for (const c of asList(v.createMany.data)) await createImpl(target, { data: { ...c, [fk]: pid } });
    });
  if (v.connect)
    out.push(async (pid) => {
      for (const c of asList(v.connect)) await updateManyImpl(target, { where: c, data: { [fk]: pid } });
    });
  return out;
}

async function insertDoc(key: string, doc: Record<string, any>) {
  const locked = LOCKED_MODELS[key];
  if (locked) await acquireSlotLocks(key, doc._id, locked(doc));
  try {
    await (await col(key)).insertOne(doc);
  } catch (err) {
    if (locked) await releaseSlotLocks(doc._id);
    if (isDup(err)) duplicateError(err, key);
    throw err;
  }
}

async function createImpl(key: string, args: any) {
  const { doc, deferred } = buildCreateDoc(key, args.data);
  await insertDoc(key, doc);
  for (const d of deferred) await d(doc._id);
  if (!deferred.length && !args.select && !args.include) return toModel(key, doc);
  const [r] = await findManyImpl(key, { where: { id: doc._id }, select: args.select, include: args.include });
  return r;
}

function buildUpdate(key: string, data: any) {
  const m = META[key];
  const $set: Record<string, any> = {};
  const $inc: Record<string, number> = {};
  const $mul: Record<string, number> = {};
  const $push: Record<string, any> = {};
  const relational: [FieldMeta, any][] = [];
  for (const [k, v] of Object.entries(data ?? {})) {
    if (v === undefined) continue;
    const f = m.fields[k];
    if (!f) throw new DbError("P2009", `Campo desconocido en update: ${m.name}.${k}`);
    if (f.isId) continue;
    if (f.kind === "relation") {
      if (f.fk && (v as any).connect) $set[f.fk] = (v as any).connect.id;
      else if (f.fk && (v as any).disconnect) $set[f.fk] = null;
      else relational.push([f, v]);
      continue;
    }
    if (isPlainObject(v) && f.type !== "Json") {
      const o = v as any;
      if ("set" in o) $set[k] = coerce(f, o.set);
      if ("increment" in o) $inc[k] = ($inc[k] ?? 0) + o.increment;
      if ("decrement" in o) $inc[k] = ($inc[k] ?? 0) - o.decrement;
      if ("multiply" in o) $mul[k] = o.multiply;
      if ("push" in o) $push[k] = Array.isArray(o.push) ? { $each: o.push } : o.push;
      continue;
    }
    $set[k] = coerce(f, v);
  }
  for (const f of Object.values(m.fields)) if (f.updatedAt && !(f.name in $set)) $set[f.name] = new Date();
  const update: Record<string, any> = {};
  if (Object.keys($set).length) update.$set = $set;
  if (Object.keys($inc).length) update.$inc = $inc;
  if (Object.keys($mul).length) update.$mul = $mul;
  if (Object.keys($push).length) update.$push = $push;
  return { update, set: $set, relational };
}

async function updateDoc(key: string, pre: any, data: any) {
  const { update, set, relational } = buildUpdate(key, data);
  const locked = LOCKED_MODELS[key];
  const next = { ...pre, ...set };
  const lockChanged = !!locked && JSON.stringify(locked(next)) !== JSON.stringify(locked(pre));
  if (lockChanged) await acquireSlotLocks(key, pre._id, locked!(next));
  let after: any;
  try {
    after = Object.keys(update).length
      ? await (await col(key)).findOneAndUpdate({ _id: pre._id }, update, { returnDocument: "after" })
      : pre;
  } catch (err) {
    if (lockChanged) await acquireSlotLocks(key, pre._id, locked!(pre), { releaseOthers: true }).catch(() => {});
    if (isDup(err)) duplicateError(err, key);
    throw err;
  }
  if (lockChanged) await acquireSlotLocks(key, pre._id, locked!(after ?? next), { releaseOthers: true });
  for (const [f, v] of relational) for (const d of relationWrite(f, v, {})) await d(pre._id);
  return after ?? next;
}

async function findUniqueRaw(key: string, where: any) {
  const [doc] = await rawFind(key, { where, take: 1 });
  return doc ?? null;
}

async function updateImpl(key: string, args: any) {
  const pre = await findUniqueRaw(key, args.where);
  if (!pre) throw new DbError("P2025", `No se encontró el registro a actualizar en ${META[key].name}.`);
  const after = await updateDoc(key, pre, args.data);
  const [r] = await shape(key, [after], args);
  return r;
}

async function updateManyImpl(key: string, args: any) {
  const hasRelational = Object.entries(args.data ?? {}).some(([k]) => META[key].fields[k]?.kind === "relation");
  if (LOCKED_MODELS[key] || hasRelational) {
    const docs = await rawFind(key, { where: args.where });
    for (const d of docs) await updateDoc(key, d, args.data);
    return { count: docs.length };
  }
  const { update } = buildUpdate(key, args.data);
  const filter = await compileWhere(key, args.where);
  try {
    const r = await (await col(key)).updateMany(filter, update);
    return { count: r.matchedCount };
  } catch (err) {
    if (isDup(err)) duplicateError(err, key);
    throw err;
  }
}

function whereEqualities(key: string, where: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(where ?? {})) {
    const f = META[key].fields[k];
    if (f && f.kind !== "relation" && !isPlainObject(v)) out[k] = v;
    else if (!f && isPlainObject(v)) Object.assign(out, whereEqualities(key, v));
  }
  return out;
}

async function upsertImpl(key: string, args: any) {
  const pre = await findUniqueRaw(key, args.where);
  const sel = { select: args.select, include: args.include };
  if (pre) return updateImpl(key, { where: { id: pre._id }, data: args.update, ...sel });
  try {
    return await createImpl(key, { data: { ...whereEqualities(key, args.where), ...args.create }, ...sel });
  } catch (err: any) {
    if (err?.code !== "P2002") throw err;
    const again = await findUniqueRaw(key, args.where);
    if (!again) throw err;
    return updateImpl(key, { where: { id: again._id }, data: args.update, ...sel });
  }
}

// Integridad referencial en borrado (Cascade / SetNull / Restrict) según el esquema.
async function onDeleteReferences(key: string, ids: string[]) {
  if (!ids.length) return;
  const name = META[key].name;
  const refs: [string, FieldMeta][] = [];
  for (const [k2, m2] of Object.entries(META))
    for (const f of Object.values(m2.fields)) if (f.kind === "relation" && f.fk && f.type === name) refs.push([k2, f]);
  for (const [k2, f] of refs) {
    if (f.onDelete === "Restrict" || f.onDelete === "NoAction") {
      const n = await (await col(k2)).countDocuments({ [f.fk!]: { $in: ids } });
      if (n > 0) throw new DbError("P2003", `Foreign key constraint failed: ${META[k2].name}.${f.fk}`, { field_name: f.fk });
    }
  }
  for (const [k2, f] of refs) {
    if (f.onDelete === "Cascade") await deleteManyImpl(k2, { where: { [f.fk!]: { in: ids } } });
    else if (f.onDelete === "SetNull") await updateManyImpl(k2, { where: { [f.fk!]: { in: ids } }, data: { [f.fk!]: null } });
  }
}

async function deleteImpl(key: string, args: any) {
  const pre = await findUniqueRaw(key, args.where);
  if (!pre) throw new DbError("P2025", `No se encontró el registro a eliminar en ${META[key].name}.`);
  const [shaped] = await shape(key, [pre], args);
  await onDeleteReferences(key, [pre._id]);
  await (await col(key)).deleteOne({ _id: pre._id });
  if (LOCKED_MODELS[key]) await releaseSlotLocks(pre._id);
  return shaped;
}

async function deleteManyImpl(key: string, args: any = {}) {
  const c = await col(key);
  const filter = await compileWhere(key, args.where);
  const ids = (await c.find(filter, { projection: { _id: 1 } }).toArray()).map((d) => d._id);
  if (!ids.length) return { count: 0 };
  await onDeleteReferences(key, ids);
  const r = await c.deleteMany({ _id: { $in: ids } });
  if (LOCKED_MODELS[key]) for (const id of ids) await releaseSlotLocks(id);
  return { count: r.deletedCount };
}

async function countImpl(key: string, args: any = {}) {
  return (await col(key)).countDocuments(await compileWhere(key, args.where));
}

async function aggregateImpl(key: string, args: any) {
  const filter = await compileWhere(key, args.where);
  const group: Record<string, any> = { _id: null, __count: { $sum: 1 } };
  const ops = ["_min", "_max", "_sum", "_avg"];
  for (const op of ops)
    for (const fld of Object.keys(args[op] ?? {})) group[`${op}__${fld}`] = { [`$${op.slice(1)}`]: `$${dbField(fld)}` };
  const [row] = await (await col(key)).aggregate([{ $match: filter }, { $group: group }]).toArray();
  const out: Record<string, any> = {};
  for (const op of ops)
    if (args[op]) out[op] = Object.fromEntries(Object.keys(args[op]).map((fld) => [fld, row?.[`${op}__${fld}`] ?? null]));
  if (args._count) out._count = { _all: row?.__count ?? 0 };
  return out;
}

async function groupByImpl(key: string, args: any) {
  const filter = await compileWhere(key, args.where);
  const by: string[] = Array.isArray(args.by) ? args.by : [args.by];
  const rows = await (await col(key))
    .aggregate([{ $match: filter }, { $group: { _id: Object.fromEntries(by.map((b) => [b, `$${dbField(b)}`])), n: { $sum: 1 } } }])
    .toArray();
  return rows.map((r) => ({ ...r._id, ...(args._count ? { _count: { _all: r.n } } : {}) }));
}

// ---------- Delegados ----------
function orThrow(key: string) {
  return async (args?: any): Promise<any> => {
    const r = await findFirstImpl(key, args);
    if (!r) throw new DbError("P2025", `No se encontró ${META[key].name}.`);
    return r;
  };
}

function delegate(key: string) {
  return {
    findMany: (args?: any): Promise<any[]> => findManyImpl(key, args),
    findFirst: (args?: any): Promise<any> => findFirstImpl(key, args),
    findUnique: (args: any): Promise<any> => findFirstImpl(key, args),
    findFirstOrThrow: orThrow(key),
    findUniqueOrThrow: orThrow(key),
    create: (args: any): Promise<any> => createImpl(key, args),
    createMany: async (args: any): Promise<{ count: number }> => {
      let count = 0;
      for (const d of Array.isArray(args.data) ? args.data : [args.data]) {
        try {
          await createImpl(key, { data: d });
          count++;
        } catch (err: any) {
          if (!(args.skipDuplicates && err?.code === "P2002")) throw err;
        }
      }
      return { count };
    },
    update: (args: any): Promise<any> => updateImpl(key, args),
    updateMany: (args: any): Promise<{ count: number }> => updateManyImpl(key, args),
    upsert: (args: any): Promise<any> => upsertImpl(key, args),
    delete: (args: any): Promise<any> => deleteImpl(key, args),
    deleteMany: (args?: any): Promise<{ count: number }> => deleteManyImpl(key, args),
    count: (args?: any): Promise<number> => countImpl(key, args),
    aggregate: (args: any): Promise<any> => aggregateImpl(key, args),
    groupBy: (args: any): Promise<any[]> => groupByImpl(key, args),
  };
}

type Delegate = ReturnType<typeof delegate>;

function buildClient() {
  const client = {} as Record<ModelKey, Delegate> & {
    $disconnect: () => Promise<void>;
    $ping: () => Promise<boolean>;
  };
  for (const key of Object.keys(META) as ModelKey[]) (client as any)[key] = delegate(key);
  client.$disconnect = async () => {
    const c = g.__mongo;
    g.__mongo = undefined;
    if (c) await c.client.close();
  };
  client.$ping = async () => {
    await (await getMongoDb()).command({ ping: 1 });
    return true;
  };
  return client;
}

export const prisma = buildClient();
export type Db = typeof prisma;
export type PrismaClient = Db;

/** Ejecuta pasos de escritura de forma SECUENCIAL (sin atomicidad: MongoDB standalone no admite transacciones). */
export function sequentialWrites<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  return fn(prisma);
}

export declare namespace Prisma {
  type InputJsonValue = any;
  type TransactionClient = Db;
}
