import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned.length > 0 ? cleaned : null;
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatPrice(
  priceType: "FIXED" | "FROM" | "CONSULT" | string,
  priceCents: number | null | undefined,
  currency = "EUR"
): string {
  if (priceType === "CONSULT" || priceCents === null || priceCents === undefined) {
    return "A consultar tras diagnóstico";
  }
  const euros = priceCents / 100;
  const formatted = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(euros);

  if (priceType === "FROM") {
    return `Desde ${formatted}`;
  }
  return formatted;
}

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export type LegalPlaceholderContext = {
  brandName?: string | null;
  legalOwnerName?: string | null;
  legalTaxId?: string | null;
  legalRegistryInfo?: string | null;
  legalRegisteredAddress?: string | null;
  legalDpoEmail?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  cancellationFreeHours?: number | null;
  contactRetentionDays?: number | null;
};

export function interpolateLegalPlaceholders(
  text: string,
  ctx: LegalPlaceholderContext
): string {
  const pendingTag = (label: string) =>
    `[Dato pendiente de configurar en Panel → Configuración: ${label}]`;

  const replacements: Record<string, string> = {
    "{{brandName}}": ctx.brandName?.trim() || "ESPACIO Q",
    "{{legalOwnerName}}":
      ctx.legalOwnerName?.trim() || pendingTag("Titular / Razón Social"),
    "{{legalTaxId}}": ctx.legalTaxId?.trim() || pendingTag("NIF / CIF"),
    "{{legalRegistryInfo}}":
      ctx.legalRegistryInfo?.trim() ||
      "No inscrito / Pendiente de completar datos registrales en Configuración",
    "{{legalRegisteredAddress}}":
      ctx.legalRegisteredAddress?.trim() ||
      pendingTag("Domicilio social en Madrid"),
    "{{legalDpoEmail}}":
      ctx.legalDpoEmail?.trim() ||
      ctx.contactEmail?.trim() ||
      pendingTag("Correo de Privacidad / Contacto"),
    "{{contactEmail}}":
      ctx.contactEmail?.trim() || pendingTag("Correo de contacto del salón"),
    "{{phone}}": ctx.phone?.trim() || pendingTag("Teléfono de contacto"),
    "{{cancellationFreeHours}}": String(ctx.cancellationFreeHours ?? 24),
    "{{contactRetentionDays}}": String(ctx.contactRetentionDays ?? 365),
  };

  let output = text;
  for (const [key, value] of Object.entries(replacements)) {
    output = output.split(key).join(value);
  }
  return output;
}
