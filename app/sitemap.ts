import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: Array<{ path: string; priority: number }> = [
    { path: "", priority: 1.0 },
    { path: "/servicios", priority: 0.9 },
    { path: "/reservar", priority: 0.9 },
    { path: "/equipo", priority: 0.8 },
    { path: "/galeria", priority: 0.8 },
    { path: "/contacto", priority: 0.8 },
    { path: "/aviso-legal", priority: 0.3 },
    { path: "/terminos-y-condiciones", priority: 0.3 },
    { path: "/condiciones-reserva", priority: 0.4 },
    { path: "/privacidad", priority: 0.3 },
    { path: "/cookies", priority: 0.3 },
  ];

  let serviceSlugs: Array<{ slug: string; updatedAt: Date }> = [];
  try {
    serviceSlugs = await prisma.service.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    });
  } catch {
    serviceSlugs = [];
  }

  return [
    ...staticRoutes.map((r) => ({
      url: `${baseUrl}${r.path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: r.priority,
    })),
    ...serviceSlugs.map((s) => ({
      url: `${baseUrl}/servicios/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  ];
}
