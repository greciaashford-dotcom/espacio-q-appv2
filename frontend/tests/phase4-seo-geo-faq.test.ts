import { describe, expect, it } from "vitest";
import robots, { AI_CRAWLERS, PRIVATE_PATHS } from "@/app/robots";
import sitemap from "@/app/sitemap";
import { GET as llms } from "@/app/llms.txt/route";
import { ensureBaseCmsAndSettings } from "@/lib/domain/cms";
import { getPublishedFaq, fillSalonPlaceholders } from "@/lib/domain/faq";
import { faqGraph, openingHoursSpecification, salonGraph, serviceGraph } from "@/lib/seo/json-ld";
import { isIndexableHost, SITE_URL, withSeo } from "@/lib/seo/site";

describe("Fase 4 · SEO + GEO + FAQ", () => {
  it("dominio canónico y noindex fuera de espacioq.es", () => {
    expect(SITE_URL).toBe("https://espacioq.es");
    expect(isIndexableHost("espacioq.es")).toBe(true);
    expect(isIndexableHost("www.espacioq.es")).toBe(true);
    expect(isIndexableHost("x.preview.emergentagent.com")).toBe(false);
    const m = withSeo({ title: "T", description: "D", alternates: { canonical: "/contacto" } });
    expect(m.title).toEqual({ absolute: "T" });
    expect((m.alternates as any).languages["es-ES"]).toBe("/contacto");
    expect((m.openGraph as any).images[0]).toMatchObject({ width: 1200, height: 630 });
    expect((m.twitter as any).card).toBe("summary_large_image");
  });

  it("robots permite * y todos los rastreadores de IA con los mismos bloqueos", () => {
    const r = robots();
    const rules = r.rules as Array<{ userAgent: string; allow: string; disallow: string[] }>;
    for (const ua of ["*", ...AI_CRAWLERS]) {
      const rule = rules.find((x) => x.userAgent === ua)!;
      expect(rule.allow).toBe("/");
      expect(rule.disallow).toEqual(PRIVATE_PATHS);
    }
    expect(r.sitemap).toBe("https://espacioq.es/sitemap.xml");
  });

  it("JSON-LD del salón con horario agrupado y sin valoraciones", () => {
    const weekly = [
      { dayOfWeek: 2, intervals: [{ start: "10:30", end: "21:00" }] },
      { dayOfWeek: 3, intervals: [{ start: "10:30", end: "21:00" }] },
      { dayOfWeek: 6, intervals: [{ start: "09:00", end: "16:00" }] },
    ];
    expect(openingHoursSpecification(weekly)).toEqual([
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Tuesday", "Wednesday"], opens: "10:30", closes: "21:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday"], opens: "09:00", closes: "16:00" },
    ]);
    const g = salonGraph({ brandName: "ESPACIO Q", city: "Madrid", addressLine: "Calle de Pelayo, 41", postalCode: "28004", latitude: 40.4241269, longitude: -3.6976262, scheduleConfirmed: true, weekly }) as any;
    const json = JSON.stringify(g);
    expect(json).not.toMatch(/aggregateRating|review/i);
    const salon = g["@graph"].find((n: any) => Array.isArray(n["@type"]));
    expect(salon["@type"]).toEqual(["HairSalon", "BeautySalon"]);
    expect(salon.geo).toMatchObject({ latitude: 40.4241269, longitude: -3.6976262 });
    expect(salon.potentialAction.target.urlTemplate).toBe("https://espacioq.es/reservar");
    expect(g["@graph"].map((n: any) => n["@type"])).toEqual(expect.arrayContaining(["WebSite", "Organization"]));
  });

  it("Service + BreadcrumbList y FAQPage", () => {
    const s = serviceGraph({ name: "Corte", slug: "corte", description: "d", categoryName: "Corte", priceType: "FIXED", priceCents: 6400, currency: "EUR" }) as any;
    expect(s["@graph"][0].offers).toMatchObject({ price: "64.00", priceCurrency: "EUR" });
    expect(s["@graph"][1].itemListElement).toHaveLength(3);
    const consult = serviceGraph({ name: "X", slug: "x", description: "d", categoryName: "C", priceType: "CONSULT", priceCents: null, currency: "EUR" }) as any;
    expect(consult["@graph"][0].offers).toBeUndefined();
    const f = faqGraph([{ question: "¿P?", answer: "R" }]) as any;
    expect(f.mainEntity[0]).toMatchObject({ "@type": "Question", name: "¿P?", acceptedAnswer: { text: "R" } });
  });

  it("FAQ sembrada con datos reales y marcadores resueltos", async () => {
    await ensureBaseCmsAndSettings();
    const { items } = await getPublishedFaq();
    expect(items.length).toBeGreaterThanOrEqual(6);
    const all = items.map((i) => i.question + " " + i.answer).join(" ");
    expect(all).toContain("Calle de Pelayo, 41");
    expect(all).toContain("Chueca (L5)");
    expect(all).not.toContain("{{");
    expect(fillSalonPlaceholders("{{cancellationFreeHours}} h · {{phone}}", { phone: "1", cancellationFreeHours: 48 })).toBe("48 h · 1");
  });

  it("sitemap con dominio final, FAQ y servicios; llms.txt con datos en vivo", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain("https://espacioq.es");
    expect(urls).toContain("https://espacioq.es/preguntas-frecuentes");
    expect(urls.some((u) => u.startsWith("https://espacioq.es/servicios/"))).toBe(true);
    const txt = await (await llms()).text();
    for (const part of ["# ESPACIO Q", "Calle de Pelayo", "Chueca", "Horario", "Servicios y precios", "https://espacioq.es/reservar", "https://espacioq.es/preguntas-frecuentes"]) {
      expect(txt).toContain(part);
    }
  });
});
