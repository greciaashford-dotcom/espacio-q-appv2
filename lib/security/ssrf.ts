import dns from "node:dns/promises";
import net from "node:net";

const DEFAULT_ALLOWED_DOMAINS = ["images.unsplash.com", "plus.unsplash.com"];

export function getAllowedImageDomains(): string[] {
  const raw = process.env.ALLOWED_IMAGE_DOMAINS;
  if (!raw) return DEFAULT_ALLOWED_DOMAINS;
  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function isPrivateOrReservedIp(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  // IPv6 checks
  if (net.isIPv6(normalized)) {
    if (
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fe80:") ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("ff")
    ) {
      return true;
    }
    // IPv4-mapped IPv6 ::ffff:x.x.x.x
    if (normalized.startsWith("::ffff:")) {
      const v4Part = normalized.slice(7);
      if (net.isIPv4(v4Part)) {
        return isPrivateOrReservedIp(v4Part);
      }
    }
    return false;
  }

  if (!net.isIPv4(normalized)) {
    return true;
  }

  const parts = normalized.split(".").map((n) => parseInt(n, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }

  const [a, b] = parts;
  // 0.0.0.0/8, 10.0.0.0/8, 127.0.0.0/8
  if (a === 0 || a === 10 || a === 127) return true;
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 169.254.0.0/16 (Link-local & Cloud Metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  // 198.18.0.0/15
  if (a === 198 && (b === 18 || b === 19)) return true;
  // Multicast & Broadcast 224.0.0.0/4+
  if (a >= 224) return true;

  return false;
}

export type ValidatedExternalUrl = {
  ok: true;
  url: string;
  hostname: string;
};

export type InvalidExternalUrl = {
  ok: false;
  error: string;
};

export async function validateExternalImageUrl(
  rawUrl: string,
  options?: { skipDnsLookup?: boolean; customAllowedDomains?: string[] }
): Promise<ValidatedExternalUrl | InvalidExternalUrl> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: "URL con formato inválido." };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, error: "Solo se permiten enlaces seguros con esquema HTTPS." };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: "No se permiten credenciales incrustadas en la URL." };
  }

  if (parsed.port && parsed.port !== "443") {
    return { ok: false, error: "Puerto no permitido. Solo se admite el puerto HTTPS estándar (443)." };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return { ok: false, error: "Host local o interno bloqueado por política anti-SSRF." };
  }

  if (net.isIP(hostname) !== 0) {
    if (isPrivateOrReservedIp(hostname)) {
      return { ok: false, error: "Dirección IP privada, loopback o de metadatos bloqueada." };
    }
    return { ok: false, error: "No se permiten direcciones IP directas; utiliza un dominio HTTPS autorizado." };
  }

  // Detectar enlaces de páginas contenedoras de Google Drive / Dropbox no directos
  if (hostname.includes("drive.google.com") || hostname.includes("dropbox.com")) {
    return {
      ok: false,
      error:
        "Los enlaces compartidos de Google Drive o Dropbox no son recursos de imagen directos. Descarga la imagen y súbela desde tu dispositivo.",
    };
  }

  const allowedDomains = options?.customAllowedDomains ?? getAllowedImageDomains();
  const isDomainAllowed = allowedDomains.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );

  if (!isDomainAllowed) {
    return {
      ok: false,
      error: `El dominio "${hostname}" no está en la lista de dominios autorizados (${allowedDomains.join(", ")}). Sube el archivo directamente desde tu dispositivo o autoriza el dominio.`,
    };
  }

  if (!options?.skipDnsLookup) {
    try {
      const records = await dns.lookup(hostname, { all: true });
      if (!records || records.length === 0) {
        return { ok: false, error: "No se pudo resolver el dominio de la imagen." };
      }
      for (const rec of records) {
        if (isPrivateOrReservedIp(rec.address)) {
          return {
            ok: false,
            error: "El dominio resuelve a una IP privada o reservada (protección anti-SSRF).",
          };
        }
      }
    } catch {
      return { ok: false, error: "Error resolviendo DNS del dominio externo." };
    }
  }

  return {
    ok: true,
    url: parsed.toString(),
    hostname,
  };
}

export function detectImageMimeFromBuffer(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  // WEBP: RIFF....WEBP
  if (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  // AVIF: ....ftypavif
  if (buf.toString("ascii", 4, 12) === "ftypavif") {
    return "image/avif";
  }
  return null;
}
