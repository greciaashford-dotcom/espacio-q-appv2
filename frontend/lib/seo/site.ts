import type { Metadata } from "next";

/** Dominio canónico público (SEO). APP_URL se mantiene para enlaces de correos. */
export const SITE_URL = (process.env.SITE_URL || "https://espacioq.es").replace(/\/$/, "");
export const SHARE_IMAGE = {
  url: "/og-espacioq.jpg",
  width: 1200,
  height: 630,
  alt: "ESPACIO Q · Peluquería y salón de belleza en Chueca, Madrid",
};
export const SALON_GEO = { region: "ES-MD", placename: "Madrid", lat: 40.4241269, lng: -3.6976262 };

export const absoluteUrl = (path = "/") => `${SITE_URL}${path === "/" ? "" : path}` || SITE_URL;

/** Solo espacioq.es / www.espacioq.es son indexables; preview y dominios de Emergent llevan noindex. */
export function isIndexableHost(host: string | null | undefined) {
  const h = (host || "").split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");
  const canonicalHost = new URL(SITE_URL).hostname;
  return h === canonicalHost || h === `www.${canonicalHost}`;
}

/** Completa la metadata de una página pública: título absoluto, canonical, hreflang, Open Graph y Twitter. */
export function withSeo(meta: Metadata): Metadata {
  const canonical = String(meta.alternates?.canonical ?? "/");
  const title = typeof meta.title === "string" ? meta.title : undefined;
  const description = meta.description ?? undefined;
  return {
    ...meta,
    ...(title ? { title: { absolute: title } } : {}),
    alternates: { ...meta.alternates, canonical, languages: { "es-ES": canonical } },
    openGraph: {
      type: "website",
      locale: "es_ES",
      siteName: "ESPACIO Q",
      url: canonical,
      title,
      description,
      images: [SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [SHARE_IMAGE.url] },
  };
}
