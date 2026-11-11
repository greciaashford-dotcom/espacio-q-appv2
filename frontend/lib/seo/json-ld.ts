import { SITE_URL, SHARE_IMAGE, absoluteUrl } from "@/lib/seo/site";

type Json = Record<string, unknown>;
const DAY_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const SALON_ID = `${SITE_URL}/#salon`;
export const ORG_ID = `${SITE_URL}/#organization`;

export type SalonFacts = {
  brandName: string;
  tagline?: string | null;
  addressLine?: string | null;
  postalCode?: string | null;
  city: string;
  phone?: string | null;
  contactEmail?: string | null;
  googleMapsUrl?: string | null;
  sameAs?: string[];
  latitude: number;
  longitude: number;
  scheduleConfirmed: boolean;
  weekly: Array<{ dayOfWeek: number; intervals: Array<{ start: string; end: string }> }>;
};

/** Agrupa días con el mismo horario en OpeningHoursSpecification. */
export function openingHoursSpecification(weekly: SalonFacts["weekly"]) {
  const groups = new Map<string, string[]>();
  for (const d of weekly) {
    for (const i of d.intervals) {
      const k = `${i.start}-${i.end}`;
      groups.set(k, [...(groups.get(k) ?? []), DAY_EN[d.dayOfWeek]]);
    }
  }
  return Array.from(groups.entries()).map(([k, days]) => {
    const [opens, closes] = k.split("-");
    return { "@type": "OpeningHoursSpecification", dayOfWeek: days, opens, closes };
  });
}

export function salonGraph(f: SalonFacts): Json {
  const logo = { "@type": "ImageObject", url: absoluteUrl("/icon-512.png"), width: 512, height: 512 };
  const salon: Json = {
    "@type": ["HairSalon", "BeautySalon"],
    "@id": SALON_ID,
    name: f.brandName,
    description: `Peluquería y salón de belleza en Chueca, Madrid. ${f.tagline ?? ""}`.trim(),
    url: SITE_URL,
    image: absoluteUrl(SHARE_IMAGE.url),
    logo,
    priceRange: "€€",
    currenciesAccepted: "EUR",
    address: {
      "@type": "PostalAddress",
      ...(f.addressLine ? { streetAddress: f.addressLine } : {}),
      ...(f.postalCode ? { postalCode: f.postalCode } : {}),
      addressLocality: f.city,
      addressRegion: "Comunidad de Madrid",
      addressCountry: "ES",
    },
    geo: { "@type": "GeoCoordinates", latitude: f.latitude, longitude: f.longitude },
    ...(f.googleMapsUrl ? { hasMap: f.googleMapsUrl } : {}),
    ...(f.phone ? { telephone: f.phone } : {}),
    ...(f.contactEmail ? { email: f.contactEmail } : {}),
    areaServed: [
      { "@type": "Place", name: "Chueca, Madrid" },
      { "@type": "Place", name: "Justicia, Madrid" },
      { "@type": "City", name: "Madrid" },
    ],
    ...(f.scheduleConfirmed ? { openingHoursSpecification: openingHoursSpecification(f.weekly) } : {}),
    potentialAction: {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/reservar"),
        inLanguage: "es-ES",
        actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"],
      },
      result: { "@type": "Reservation", name: "Cita en ESPACIO Q" },
    },
    parentOrganization: { "@id": ORG_ID },
    ...(f.sameAs?.length ? { sameAs: f.sameAs } : {}),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: f.brandName,
        inLanguage: "es-ES",
        publisher: { "@id": ORG_ID },
      },
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: f.brandName,
        url: SITE_URL,
        logo,
        ...(f.sameAs?.length ? { sameAs: f.sameAs } : {}),
      },
      salon,
    ],
  };
}

export function serviceGraph(s: {
  name: string;
  slug: string;
  description: string;
  categoryName: string;
  priceType: string;
  priceCents: number | null;
  currency: string;
}): Json {
  const url = absoluteUrl(`/servicios/${s.slug}`);
  const price = s.priceCents != null ? (s.priceCents / 100).toFixed(2) : null;
  const offers =
    s.priceType === "FIXED" && price
      ? { "@type": "Offer", price, priceCurrency: s.currency, url, availability: "https://schema.org/InStock" }
      : s.priceType === "FROM" && price
        ? {
            "@type": "Offer",
            url,
            priceCurrency: s.currency,
            priceSpecification: { "@type": "PriceSpecification", minPrice: price, priceCurrency: s.currency },
          }
        : null;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: s.name,
        description: s.description,
        serviceType: s.categoryName,
        url,
        provider: { "@id": SALON_ID },
        areaServed: { "@type": "City", name: "Madrid" },
        ...(offers ? { offers } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Servicios", item: absoluteUrl("/servicios") },
          { "@type": "ListItem", position: 3, name: s.name, item: url },
        ],
      },
    ],
  };
}

export function faqGraph(items: Array<{ question: string; answer: string }>): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}
