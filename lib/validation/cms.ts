import net from "node:net";
import { getAllowedImageDomains, isPrivateOrReservedIp } from "@/lib/security/ssrf";

const MAX_STRING = 20000;
const MAX_JSON_BYTES = 250_000;

export function isSafeHref(value: string): boolean {
  const v = value.trim();
  if (v === "") return true;
  if (v.startsWith("/") && !v.startsWith("//")) return true;
  if (v.startsWith("#")) return true;
  try {
    const u = new URL(v);
    return ["https:", "mailto:", "tel:"].includes(u.protocol);
  } catch {
    return false;
  }
}

export function isSafeImageSrc(value: string): boolean {
  const v = value.trim();
  if (v === "") return true;
  if (v.startsWith("/media/")) return true;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" || u.username || u.password) return false;
    const host = u.hostname.toLowerCase();
    return getAllowedImageDomains().some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

/**
 * Valida enlaces externos HTTPS directos de imagen (cargados por el navegador en FlipGallery,
 * sin proxy SSRF en servidor) o rutas locales de biblioteca (/media/...).
 */
export function isSafeExternalOrLocalImageUrl(value: string): boolean {
  const v = value.trim();
  if (v === "") return true;
  if (v.startsWith("/media/") && !v.startsWith("//")) return true;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" || u.username || u.password) return false;
    if (u.port && u.port !== "443") return false;
    const host = u.hostname.toLowerCase();
    if (
      !host ||
      host === "localhost" ||
      host.endsWith(".local") ||
      host.endsWith(".internal")
    ) {
      return false;
    }
    if (net.isIP(host) !== 0 && isPrivateOrReservedIp(host)) {
      return false;
    }
    if (
      (host.includes("drive.google.com") && u.pathname.includes("/file/")) ||
      (host.includes("dropbox.com") && !u.searchParams.has("raw"))
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida recursivamente un bloque CMS antes de guardarlo: tipos simples, longitudes,
 * enlaces seguros (sin javascript:) e imágenes de biblioteca o enlaces externos HTTPS válidos.
 */
export function validateCmsPayload(data: unknown): string[] {
  const errors: string[] = [];
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return ["El contenido debe ser un objeto estructurado."];
  }
  const size = Buffer.byteLength(JSON.stringify(data), "utf8");
  if (size > MAX_JSON_BYTES) errors.push("El bloque supera el tamaño máximo permitido.");

  const walk = (node: unknown, path: string, key: string) => {
    if (node === null || typeof node === "boolean" || typeof node === "number") return;
    if (typeof node === "string") {
      if (node.length > MAX_STRING) errors.push(`${path}: texto demasiado largo.`);
      if (/href$/i.test(key) && !isSafeHref(node)) {
        errors.push(`${path}: enlace no permitido («${node}»). Usa rutas internas (/...), https:, mailto: o tel:.`);
      }
      if (/^(src|imageUrl)$/i.test(key) && !isSafeImageSrc(node)) {
        errors.push(`${path}: la imagen debe proceder de la biblioteca (/media/...) o de un dominio HTTPS autorizado.`);
      }
      if (/^url$/i.test(key) && !isSafeExternalOrLocalImageUrl(node)) {
        errors.push(`${path}: introduce un enlace externo HTTPS válido (https://...) o una imagen de la biblioteca (/media/...).`);
      }
      return;
    }
    if (Array.isArray(node)) {
      if (node.length > 200) errors.push(`${path}: demasiados elementos.`);
      node.forEach((child, i) => walk(child, `${path}[${i + 1}]`, key));
      return;
    }
    if (typeof node === "object") {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        walk(v, path ? `${path}.${k}` : k, k);
      }
      return;
    }
    errors.push(`${path}: tipo de dato no permitido.`);
  };
  walk(data, "", "");
  return errors;
}
