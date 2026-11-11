import { prisma } from "@/lib/db/prisma";
import { getPublishedCmsBlock } from "@/lib/domain/cms";
import { getPublicShellData } from "@/lib/domain/public-context";
import { getPublishedFaq } from "@/lib/domain/faq";
import { formatPrice } from "@/lib/utils";
import { absoluteUrl, SITE_URL } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

/** /llms.txt — resumen en Markdown para buscadores con IA, generado con datos en vivo. */
export async function GET() {
  const [{ salonMeta: m }, contacto, faq, categories] = await Promise.all([
    getPublicShellData(),
    getPublishedCmsBlock<Record<string, any>>("page_contacto"),
    getPublishedFaq(),
    prisma.serviceCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: { services: { where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
    }),
  ]);
  const d = (contacto.data?.directions ?? {}) as Record<string, string>;
  const address = [m.addressLine, m.postalCode && `${m.postalCode} ${m.city}`].filter(Boolean).join(", ") || m.city;
  const lines: string[] = [
    `# ${m.brandName}`,
    "",
    `> ${m.brandName} es una peluquería y salón de belleza en el barrio de Chueca (Justicia), Madrid. ${m.tagline ?? ""}`.trim(),
    "",
    "## Datos del salón",
    `- Dirección: ${address}, España`,
    "- Barrio: Chueca · Justicia (Madrid)",
    ...(m.phone ? [`- Teléfono: ${m.phone}`] : []),
    ...(m.contactEmail ? [`- Email: ${m.contactEmail}`] : []),
    `- Web: ${SITE_URL}`,
    `- Reservar cita online: ${absoluteUrl("/reservar")}`,
    `- Preguntas frecuentes: ${absoluteUrl("/preguntas-frecuentes")}`,
    `- Contacto y mapa: ${absoluteUrl("/contacto")}`,
    ...(m.googleMapsUrl ? [`- Google Maps: ${m.googleMapsUrl}`] : []),
    "",
    "## Cómo llegar",
    ...(d.metro?.trim() ? [`- Metro: ${d.metro.trim()}`] : []),
    ...(d.bus?.trim() ? [`- Autobús: ${d.bus.trim()}`] : []),
    ...(d.parking?.trim() ? [`- Aparcamiento: ${d.parking.trim()}`] : []),
    "",
    "## Horario (Europe/Madrid)",
    ...(m.scheduleConfirmed
      ? m.weeklySummary.map((w) => `- ${w.dayName}: ${w.isOpen ? w.hoursText : "Cerrado"}`)
      : ["- Horario pendiente de confirmación por el salón."]),
    "",
    "## Servicios y precios (IVA incluido)",
  ];
  for (const c of categories as any[]) {
    if (!c.services.length) continue;
    lines.push("", `### ${c.name}`);
    for (const s of c.services) {
      lines.push(
        `- [${s.name}](${absoluteUrl(`/servicios/${s.slug}`)}): ${formatPrice(s.priceType, s.priceCents, s.currency)} · ${s.durationMin} min`
      );
    }
  }
  if (faq.items.length) {
    lines.push("", "## Preguntas frecuentes");
    for (const i of faq.items) lines.push("", `### ${i.question}`, i.answer);
  }
  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}
