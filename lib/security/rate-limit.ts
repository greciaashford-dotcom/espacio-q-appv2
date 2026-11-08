import { prisma } from "@/lib/db/prisma";
import { hashToken } from "@/lib/security/crypto";

/**
 * Rate limiting persistente en PostgreSQL. Devuelve true si la petición está permitida.
 */
export async function checkRateLimit(params: {
  scope: string;
  identifier: string;
  limit: number;
  windowSec: number;
}): Promise<boolean> {
  const key = `${params.scope}:${hashToken(params.identifier).slice(0, 32)}`;
  const since = new Date(Date.now() - params.windowSec * 1000);
  const count = await prisma.rateLimitHit.count({
    where: { key, createdAt: { gte: since } },
  });
  if (count >= params.limit) return false;
  await prisma.rateLimitHit.create({ data: { key } });
  return true;
}

export function getClientIdentifier(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  return ip;
}

/**
 * Protección básica CSRF/origen para mutaciones: el Origin (si existe) debe coincidir con el host.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // peticiones same-origin de navegadores antiguos o server-to-server
  try {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
