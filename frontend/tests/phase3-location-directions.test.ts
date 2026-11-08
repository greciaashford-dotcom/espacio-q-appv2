import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { ensureBaseCmsAndSettings, getPublishedCmsBlock, migrateCmsDefaults } from "@/lib/domain/cms";
import { COOKIES_MAPS_MENTION, DEFAULT_CONTACT_DIRECTIONS } from "@/lib/domain/cms-defaults";
import { buildDirectionsUrl, buildGoogleEmbedUrl, getSalonLocation } from "@/lib/domain/location";

describe("Fase 3 · ubicación, «Cómo llegar» y textos editables", () => {
  afterAll(async () => {
    await migrateCmsDefaults();
  });

  it("coordenadas exactas y URL de direcciones de Google Maps a ESPACIO Q", () => {
    const loc = getSalonLocation({ brandName: "ESPACIO Q", addressLine: "Calle de Pelayo, 41", postalCode: "28004", city: "Madrid" });
    expect(loc.latitude).toBe(40.4241269);
    expect(loc.longitude).toBe(-3.6976262);
    const url = new URL(buildDirectionsUrl(loc));
    expect(url.origin + url.pathname).toBe("https://www.google.com/maps/dir/");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("destination")).toBe("ESPACIO Q, Calle de Pelayo 41, 28004 Madrid");
    expect(buildGoogleEmbedUrl(loc)).toContain("output=embed");
  });

  it("siembra los textos por defecto (Autobús vacío) y no pisa ediciones del salón", async () => {
    await ensureBaseCmsAndSettings();
    const page = await prisma.pageContent.findUnique({ where: { key: "page_contacto" } });
    const original = page!.publishedData as Record<string, any>;
    const originalDraft = page!.draftData as Record<string, any>;
    try {
      // Bloque antiguo sin "directions" -> se añaden los valores sugeridos
      const { directions: _d, ...withoutDirections } = original;
      await prisma.pageContent.update({ where: { key: "page_contacto" }, data: { publishedData: withoutDirections, draftData: withoutDirections } });
      await migrateCmsDefaults();
      const seeded = await getPublishedCmsBlock<Record<string, any>>("page_contacto");
      expect(seeded.data.directions).toEqual(DEFAULT_CONTACT_DIRECTIONS);
      expect(seeded.data.directions.bus).toBe("");

      // Edición del salón -> la siembra es idempotente y no la sobrescribe
      const edited = { ...seeded.data, directions: { ...DEFAULT_CONTACT_DIRECTIONS, metro: "Editado", bus: "Línea 3" } };
      await prisma.pageContent.update({ where: { key: "page_contacto" }, data: { publishedData: edited, draftData: edited } });
      await migrateCmsDefaults();
      const after = await getPublishedCmsBlock<Record<string, any>>("page_contacto");
      expect(after.data.directions.metro).toBe("Editado");
      expect(after.data.directions.bus).toBe("Línea 3");
    } finally {
      await prisma.pageContent.update({ where: { key: "page_contacto" }, data: { publishedData: original, draftData: originalDraft } });
    }
  });

  it("añade la mención de Google Maps solo a la política de cookies por defecto", async () => {
    await ensureBaseCmsAndSettings();
    const page = await prisma.pageContent.findUnique({ where: { key: "legal_cookies" } });
    const original = page!.publishedData as Record<string, any>;
    const originalDraft = page!.draftData as Record<string, any>;
    const withContent = (content: string) => ({
      ...original,
      sections: original.sections.map((s: any) => (s.id === "cookies-utilizadas" ? { ...s, content } : s)),
    });
    const section = (d: any) => d.sections.find((s: any) => s.id === "cookies-utilizadas").content as string;
    try {
      const target = section(original).includes(COOKIES_MAPS_MENTION) ? section(original) : section(original) + COOKIES_MAPS_MENTION;
      const legacy = target.replace(COOKIES_MAPS_MENTION, "");
      await prisma.pageContent.update({ where: { key: "legal_cookies" }, data: { publishedData: withContent(legacy), draftData: withContent(legacy) } });
      await migrateCmsDefaults();
      let rec = await prisma.pageContent.findUnique({ where: { key: "legal_cookies" } });
      expect(section(rec!.publishedData)).toContain("Mapas de terceros (Google Maps)");

      await prisma.pageContent.update({ where: { key: "legal_cookies" }, data: { publishedData: withContent("Texto propio del salón"), draftData: withContent("Texto propio del salón") } });
      await migrateCmsDefaults();
      rec = await prisma.pageContent.findUnique({ where: { key: "legal_cookies" } });
      expect(section(rec!.publishedData)).toBe("Texto propio del salón");
    } finally {
      await prisma.pageContent.update({ where: { key: "legal_cookies" }, data: { publishedData: original, draftData: originalDraft } });
    }
  });
});
