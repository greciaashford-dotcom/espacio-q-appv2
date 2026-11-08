/**
 * Configuración y validación centralizada del cupón promocional de Black Friday
 * aplicable en reservas online de ESPACIO Q Madrid.
 */

export const BLACK_FRIDAY_PROMO = {
  enabled: true,
  code: "BLACKQ25",
  discountPercent: 25,
  delayMs: 4000, // 4 segundos tras entrar en la página
  campaignBadge: "BLACK FRIDAY · EDICIÓN LIMITADA",
  title: "25 % de descuento en todos nuestros servicios",
  subtitle:
    "Celebra Black Friday en ESPACIO Q Madrid con un privilegio exclusivo de bienestar. Aplica tu invitación al reservar cualquier ritual de nuestra carta.",
  conditionsText:
    "Válido en todos los servicios de corte, coloración de autor, head spa japonés, estilismo, rostro y manos · Descuento aplicado directamente en tu reserva online.",
  storageDismissKey: "espacioq_bf25_popup_dismissed_v1",
  storageSavedCodeKey: "espacioq_bf25_saved_coupon_v1",
} as const;

export type ValidatedPromoCoupon = {
  valid: true;
  code: string;
  discountPercent: number;
  label: string;
};

export type PromoCouponValidationResult =
  | ValidatedPromoCoupon
  | {
      valid: false;
      error: string;
    };

export function normalizeCouponCode(raw?: string | null): string {
  return (raw ?? "").trim().toUpperCase();
}

export function validatePromoCoupon(
  raw?: string | null
): PromoCouponValidationResult {
  const normalized = normalizeCouponCode(raw);
  if (!normalized) {
    return {
      valid: false,
      error: "Introduce un código promocional para aplicarlo.",
    };
  }

  if (
    BLACK_FRIDAY_PROMO.enabled &&
    (normalized === BLACK_FRIDAY_PROMO.code || normalized === "BLACKFRIDAY25")
  ) {
    return {
      valid: true,
      code: BLACK_FRIDAY_PROMO.code,
      discountPercent: BLACK_FRIDAY_PROMO.discountPercent,
      label: `Black Friday −${BLACK_FRIDAY_PROMO.discountPercent} %`,
    };
  }

  return {
    valid: false,
    error:
      "El código introducido no es válido o ha expirado. Prueba con BLACKQ25.",
  };
}

export function calculateDiscountedCents(
  priceCents: number | null | undefined,
  discountPercent: number
): number | null {
  if (priceCents === null || priceCents === undefined) {
    return null;
  }
  const clampedPercent = Math.min(100, Math.max(0, discountPercent));
  return Math.max(0, Math.round((priceCents * (100 - clampedPercent)) / 100));
}
