import crypto from "node:crypto";

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET debe definirse con al menos 32 caracteres.");
  }
  return secret;
}

/**
 * Token firmado (HMAC) sin PII para enlaces de baja: `<subscriberId>.<firma>`.
 */
export function signUnsubscribeToken(subscriberId: string): string {
  const sig = crypto
    .createHmac("sha256", getAuthSecret())
    .update(`unsub:${subscriberId}`)
    .digest("base64url");
  return `${subscriberId}.${sig}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const id = token.slice(0, idx);
  const expected = signUnsubscribeToken(id);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return id;
}

export function generateOpaqueToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }
  const [, salt, hashHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hashHex, "hex");
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function getEncryptionKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY?.trim();
  // Nunca usamos una clave por defecto incrustada: sin TOKEN_ENCRYPTION_KEY no se cifran secretos.
  if (!raw || !/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY debe definirse como 64 caracteres hexadecimales (32 bytes)."
    );
  }
  return Buffer.from(raw, "hex");
}

export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${authTag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(ciphertext: string): string {
  const parts = ciphertext.split(".");
  if (parts.length !== 3) {
    throw new Error("Formato de secreto cifrado inválido");
  }
  const [ivB64, tagB64, dataB64] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivB64, "base64url");
  const authTag = Buffer.from(tagB64, "base64url");
  const encrypted = Buffer.from(dataB64, "base64url");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
