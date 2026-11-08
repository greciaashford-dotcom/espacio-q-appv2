import crypto from "node:crypto";

let counter = crypto.randomInt(0, 1679616);

/** Identificador tipo cuid (25 caracteres, minúsculas, ordenable por tiempo). */
export function newId(): string {
  counter = (counter + 1) % 1679616;
  const time = Date.now().toString(36).padStart(9, "0");
  const count = counter.toString(36).padStart(4, "0");
  const rand = BigInt("0x" + crypto.randomBytes(8).toString("hex")).toString(36).padStart(13, "0").slice(0, 11);
  return `c${time}${count}${rand}`;
}
