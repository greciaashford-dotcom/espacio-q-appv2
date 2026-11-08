// Genera lib/db/schema.generated.ts (metadatos + tipos TS) a partir de prisma/schema.prisma (solo como DSL de modelos; sin Prisma).
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const src = fs.readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
const lines = src.split("\n").map((l) => l.replace(/\/\/.*$/, "").trim());

const enums = {};
const models = {};
let cur = null;
for (const line of lines) {
  let m;
  if ((m = line.match(/^enum (\w+) \{/))) { cur = { kind: "enum", name: m[1] }; enums[m[1]] = []; continue; }
  if ((m = line.match(/^model (\w+) \{/))) { cur = { kind: "model", name: m[1] }; models[m[1]] = { fields: {}, uniques: [], indexes: [] }; continue; }
  if (line === "}") { cur = null; continue; }
  if (!cur || !line) continue;
  if (cur.kind === "enum") { enums[cur.name].push(line); continue; }
  const model = models[cur.name];
  if ((m = line.match(/^@@unique\(\[([^\]]+)\]\)/))) { model.uniques.push(m[1].split(",").map((s) => s.trim())); continue; }
  if ((m = line.match(/^@@index\(\[([^\]]+)\]\)/))) { model.indexes.push(m[1].split(",").map((s) => s.trim())); continue; }
  m = line.match(/^(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)$/);
  if (!m) continue;
  const [, name, type, list, opt, attrs] = m;
  const f = { name, type, isList: !!list, isOptional: !!opt };
  if (/@id\b/.test(attrs)) f.isId = true;
  if (/@unique\b/.test(attrs)) { f.isUnique = true; model.uniques.push([name]); }
  if (/@updatedAt\b/.test(attrs)) f.updatedAt = true;
  const d = attrs.match(/@default\((.*?)\)(\s|$)/);
  if (d) {
    const v = d[1];
    if (v === "cuid()") f.default = { kind: "cuid" };
    else if (v === "now()") f.default = { kind: "now" };
    else if (v.startsWith('"')) f.default = { kind: "value", value: JSON.parse(v.replace(/\)$/, "")) };
    else if (v === "true" || v === "false") f.default = { kind: "value", value: v === "true" };
    else if (/^-?[\d.]+$/.test(v)) f.default = { kind: "value", value: Number(v) };
    else f.default = { kind: "value", value: v };
  }
  const r = attrs.match(/@relation\(fields: \[([^\]]+)\], references: \[([^\]]+)\](?:, onDelete: (\w+))?\)/);
  if (r) { f.fk = r[1].trim(); f.ref = r[2].trim(); f.onDelete = r[3] || "Restrict"; }
  model.fields[name] = f;
}

const SCALARS = { String: "string", Int: "number", Float: "number", Boolean: "boolean", DateTime: "Date", Json: "any" };
const lcFirst = (s) => s[0].toLowerCase() + s.slice(1);

// Clasificar campos y resolver relaciones inversas
for (const [mName, model] of Object.entries(models)) {
  for (const f of Object.values(model.fields)) {
    if (SCALARS[f.type]) f.kind = "scalar";
    else if (enums[f.type]) f.kind = "enum";
    else if (models[f.type]) f.kind = "relation";
  }
  for (const f of Object.values(model.fields)) {
    if (f.kind !== "relation" || f.fk) continue;
    const other = models[f.type];
    const back = Object.values(other.fields).find((o) => o.type === mName && o.fk);
    if (!back) throw new Error(`No se encontró relación inversa ${mName}.${f.name}`);
    f.backFk = back.fk;
    f.backRef = back.ref;
  }
}

const meta = {};
for (const [mName, model] of Object.entries(models)) {
  meta[lcFirst(mName)] = { name: mName, collection: lcFirst(mName), fields: model.fields, uniques: model.uniques, indexes: model.indexes };
}

let out = "// AUTO-GENERADO por scripts/gen-db-schema.mjs — no editar a mano.\n/* eslint-disable */\n\n";
for (const [eName, vals] of Object.entries(enums)) {
  out += `export const ${eName} = { ${vals.map((v) => `${v}: "${v}"`).join(", ")} } as const;\n`;
  out += `export type ${eName} = (typeof ${eName})[keyof typeof ${eName}];\n\n`;
}
for (const [mName, model] of Object.entries(models)) {
  out += `export type ${mName} = {\n`;
  for (const f of Object.values(model.fields)) {
    if (f.kind === "relation") continue;
    const t = f.kind === "enum" ? f.type : SCALARS[f.type];
    out += `  ${f.name}: ${t}${f.isList ? "[]" : ""}${f.isOptional ? " | null" : ""};\n`;
  }
  out += "};\n\n";
}
out += `export const MODEL_META = ${JSON.stringify(meta)} as const;\n\n`;
out += `export type ModelKey = ${Object.keys(meta).map((k) => `"${k}"`).join(" | ")};\n`;
fs.writeFileSync(path.join(root, "lib/db/schema.generated.ts"), out);
console.log(`schema.generated.ts: ${Object.keys(models).length} modelos, ${Object.keys(enums).length} enums`);
