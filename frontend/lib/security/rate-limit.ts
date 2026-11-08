import { prisma } from "@/lib/db/prisma";
import { hashToken } from "@/lib/security/crypto";

/**
 * Rate limiting persistente en MongoDB. Devuelve true si la petición está permitida.
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

export async function clearRateLimit(params: { scope: string; identifier: string }): Promise<void> {
  const key = `${params.scope}:${hashToken(params.identifier).slice(0, 32)}`;
  await prisma.rateLimitHit.deleteMany({ where: { key } });
}

/**
 * IP del cliente a partir de X-Forwarded-For sin confiar en entradas controlables por el cliente:
 * se descartan las TRUSTED_PROXY_HOPS entradas finales añadidas por la infraestructura (CDN/ingress)
 * y se toma la inmediatamente anterior (la que añadió el primer proxy de confianza).
 */
export function clientIpFromForwarded(fwd: string | null | undefined, realIp?: string | null): string {
  const hops = Math.max(0, Number.parseInt(process.env.TRUSTED_PROXY_HOPS || "0", 10) || 0);
  const parts = (fwd || "").split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return realIp?.trim() || "local";
  return parts[Math.max(0, parts.length - 1 - hops)];
}

export function getClientIdentifier(req: Request): string {
  return clientIpFromForwarded(req.headers.get("x-forwarded-for"), req.headers.get("x-real-ip"));
}

/**
 * Protección básica CSRF/origen para mutaciones: el Origin (si existe) debe coincidir con el host.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // peticiones same-origin de navegadores antiguos o server-to-server
  try {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const originHost = new URL(origin).host;
    if (originHost === host) return true;
    // Proxy/CDN de la plataforma (ALLOWED_FORWARDED_ORIGINS, mismos patrones que Server Actions)
    return (process.env.ALLOWED_FORWARDED_ORIGINS || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .some((pattern) =>
        pattern.startsWith("*") ? originHost.endsWith(pattern.replace(/^\*+/, "")) : originHost === pattern
      );
  } catch {
    return false;
  }
}
