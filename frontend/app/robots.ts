import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

export const PRIVATE_PATHS = ["/admin", "/admin/", "/acceso", "/api/", "/reservar/gestion/", "/newsletter/"];
export const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      // Buscadores con IA (GEO): permitidos explícitamente en las páginas públicas
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: PRIVATE_PATHS })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
