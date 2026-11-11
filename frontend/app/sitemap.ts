import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { SITE_URL, absoluteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

const STATIC_ROUTES: Array<{ path: string; priority: number; cmsKeys: string[]; withServices?: boolean }> = [
  { path: "/", priority: 1.0, cmsKeys: ["home_hero", "home_sections"], withServices: true },
  { path: "/servicios", priority: 0.9, cmsKeys: ["page_servicios"], withServices: true },
  { path: "/reservar", priority: 0.9, cmsKeys: ["page_reservar"] },
  { path: "/equipo", priority: 0.8, cmsKeys: ["page_equipo"] },
  { path: "/galeria", priority: 0.8, cmsKeys: ["page_galeria"] },
  { path: "/contacto", priority: 0.8, cmsKeys: ["page_contacto"] },
  { path: "/preguntas-frecuentes", priority: 0.7, cmsKeys: ["page_faq"] },
  { path: "/aviso-legal", priority: 0.3, cmsKeys: ["legal_aviso_legal"] },
  { path: "/terminos-y-condiciones", priority: 0.3, cmsKeys: ["legal_terminos_condiciones"] },
  { path: "/condiciones-reserva", priority: 0.4, cmsKeys: ["legal_condiciones_reserva"] },
  { path: "/privacidad", priority: 0.3, cmsKeys: ["legal_privacidad"] },
  { path: "/cookies", priority: 0.3, cmsKeys: ["legal_cookies"] },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, services] = await Promise.all([
    prisma.pageContent.findMany({ select: { key: true, publishedAt: true, createdAt: true } }),
    prisma.service.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
  ]);
  // lastmod real: última publicación del bloque CMS (o su creación) y, donde aplica, último cambio de servicio
  const publishedAt = new Map(pages.map((p: any) => [p.key, new Date(p.publishedAt ?? p.createdAt)]));
  const latestService = services.reduce<Date | null>(
    (max: Date | null, s: any) => (!max || s.updatedAt > max ? s.updatedAt : max),
    null
  );
  const lastmod = (r: (typeof STATIC_ROUTES)[number]) => {
    const dates = r.cmsKeys.map((k) => publishedAt.get(k)).filter(Boolean) as Date[];
    if (r.withServices && latestService) dates.push(latestService);
    return dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : undefined;
  };

  return [
    ...STATIC_ROUTES.map((r) => ({
      url: r.path === "/" ? SITE_URL : absoluteUrl(r.path),
      lastModified: lastmod(r),
      changeFrequency: "weekly" as const,
      priority: r.priority,
    })),
    ...services.map((s: any) => ({
      url: absoluteUrl(`/servicios/${s.slug}`),
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  ];
}
