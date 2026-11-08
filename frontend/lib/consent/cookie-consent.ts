export const COOKIE_CONSENT_KEY = "espacioq_cookie_consent";
export const CONSENT_EVENT = "espacioq:consent-changed";

export type StoredCookieConsent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  maps: boolean;
  /** true si solo se ha aceptado Google Maps desde el mapa: el banner sigue pidiendo una elección completa */
  partial?: boolean;
  updatedAt: string;
};

export function readConsent(): StoredCookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return {
      necessary: true,
      analytics: Boolean(p.analytics),
      marketing: Boolean(p.marketing),
      maps: Boolean(p.maps),
      partial: Boolean(p.partial),
      updatedAt: String(p.updatedAt ?? ""),
    };
  } catch {
    return null;
  }
}

export function writeConsent(next: { analytics: boolean; marketing: boolean; maps: boolean; partial?: boolean }) {
  const payload: StoredCookieConsent = {
    necessary: true,
    analytics: next.analytics,
    marketing: next.marketing,
    maps: next.maps,
    ...(next.partial ? { partial: true } : {}),
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(payload));
    document.cookie = `${COOKIE_CONSENT_KEY}=${encodeURIComponent(
      JSON.stringify({ n: 1, a: next.analytics ? 1 : 0, m: next.marketing ? 1 : 0, g: next.maps ? 1 : 0 })
    )}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax`;
  } catch {
    // Ignorar si el navegador bloquea escritura local
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: payload }));
  return payload;
}

/** Acepta solo «Mapas de terceros (Google Maps)» conservando el resto de elecciones. */
export function grantMapsConsent() {
  const current = readConsent();
  return writeConsent({
    analytics: current?.analytics ?? false,
    marketing: current?.marketing ?? false,
    maps: true,
    partial: current ? current.partial : true,
  });
}
