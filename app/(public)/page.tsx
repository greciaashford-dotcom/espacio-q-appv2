import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getHeroContent, getPublishedCmsBlock } from "@/lib/domain/cms";
import { getPublicShellData } from "@/lib/domain/public-context";
import { PerspectiveTunnelHero } from "@/components/ui/perspective-tunnel-hero";
import { FlipGallery } from "@/components/ui/flip-gallery";
import { ExperienceSteps } from "@/components/ui/experience-steps";
import {
  PictureRailGallery,
  type PictureRailItem,
} from "@/components/ui/picture-rail-gallery";
import {
  DEFAULT_SALON_TEAM_MEMBERS,
  TeamShowcase,
  type TeamMember,
} from "@/components/ui/team-showcase";
import { FeaturedServicesMenu } from "@/components/public/featured-services-menu";
import { Button } from "@/components/ui/button";
import { ensureDefaultServicesCatalog } from "@/lib/domain/cms";

export async function generateMetadata(): Promise<Metadata> {
  const heroBlock = await getPublishedCmsBlock("home_hero");
  return {
    title: heroBlock.seoTitle || "ESPACIO Q · Salón de Belleza en Madrid",
    description:
      heroBlock.seoDescription ||
      "Un espacio para cuidar de ti en Madrid. Estilismo, cuidado capilar y rituales de belleza personalizados.",
    alternates: { canonical: "/" },
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { preview?: string };
}) {
  const isPreview = searchParams?.preview === "1";

  let [
    heroContent,
    homeSectionsBlock,
    shellData,
    serviceCategories,
    allServices,
    professionals,
    galleryAssets,
  ] = await Promise.all([
    getHeroContent({ previewDraft: isPreview }),
    getPublishedCmsBlock<Record<string, any>>("home_sections", {
      previewDraft: isPreview,
    }),
    getPublicShellData(),
    prisma.serviceCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.service.findMany({
      where: { active: true, category: { active: true } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { category: true },
    }),
    prisma.professional.findMany({
      where: { active: true, publicVisible: true },
      orderBy: { sortOrder: "asc" },
      take: 6,
      include: { photoAsset: true },
    }),
    prisma.mediaAsset.findMany({
      where: { publicVisible: true },
      orderBy: { sortOrder: "asc" },
      take: 6,
    }),
  ]);

  if (serviceCategories.length === 0) {
    await ensureDefaultServicesCatalog();
    [serviceCategories, allServices] = await Promise.all([
      prisma.serviceCategory.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.service.findMany({
        where: { active: true, category: { active: true } },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { category: true },
      }),
    ]);
  }

  const sections = homeSectionsBlock.data || {};
  const intro = sections.intro || {};
  const featuredCfg = sections.featuredServices || {};
  const experience = sections.experience || {};
  const teamCfg = sections.teamSection || {};
  const galleryCfg = sections.gallerySection || {};
  const reviewsCfg = sections.reviewsSection || {};
  const faqCfg = sections.faqSection || {};
  const locationCfg = sections.locationSection || {};
  const { salonMeta } = shellData;

  return (
    <div>
      {/* 1. Hero 3D Perspective Tunnel */}
      <PerspectiveTunnelHero
        content={heroContent}
        nextSectionId="intro-salon"
      />

      {/* 2. Introducción Editorial Asimétrica con Galería Flip 3D Responsiva */}
      {intro.visible !== false && (
        <section
          id="intro-salon"
          className="scroll-mt-16 border-b border-border py-12 sm:scroll-mt-20 sm:py-20 lg:py-28"
        >
          <div className="container mx-auto grid grid-cols-1 items-center gap-8 sm:gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="space-y-4 sm:space-y-6 lg:col-span-6 lg:pr-4">
              {intro.eyebrow && (
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {intro.eyebrow}
                </p>
              )}
              <h2
                style={{ fontSize: "clamp(1.75rem, 3.6vw, 3.1rem)" }}
                className="font-serif font-normal leading-[1.12] text-foreground"
              >
                {intro.title}
              </h2>
              {intro.lead && (
                <p className="text-base sm:text-lg font-medium leading-relaxed text-foreground/90">
                  {intro.lead}
                </p>
              )}
              {intro.body && (
                <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                  {intro.body}
                </p>
              )}
              {intro.quote && (
                <blockquote className="border-l-2 border-primary pl-4 sm:pl-5 font-serif text-lg sm:text-xl italic text-foreground">
                  «{intro.quote}»
                </blockquote>
              )}
            </div>

            <div className="flex w-full justify-center lg:col-span-6 lg:justify-end">
              <FlipGallery
                images={intro.flipImages}
                autoPlay
                autoPlayIntervalMs={3000}
              />
            </div>
          </div>
        </section>
      )}

      {/* 3. Carta Interactiva de Servicios y Rituales desde Catálogo Real */}
      {featuredCfg.visible !== false && (
        <section className="border-b border-border bg-card/50 py-14 sm:py-24 lg:py-28">
          <div className="container mx-auto space-y-10 sm:space-y-12">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div className="max-w-2xl space-y-3">
                {featuredCfg.eyebrow && (
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {featuredCfg.eyebrow}
                  </p>
                )}
                <h2
                  style={{ fontSize: "clamp(1.75rem, 3.4vw, 2.9rem)" }}
                  className="font-serif font-normal leading-tight text-foreground"
                >
                  {featuredCfg.title}
                </h2>
                {featuredCfg.description && (
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {featuredCfg.description}
                  </p>
                )}
              </div>

              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/servicios">
                  <span>{featuredCfg.ctaLabel || "Leer la carta completa"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {allServices.length > 0 ? (
              <FeaturedServicesMenu
                categories={serviceCategories.map((c) => ({
                  id: c.id,
                  name: c.name,
                  slug: c.slug,
                  description: c.description,
                }))}
                services={allServices.map((s) => ({
                  id: s.id,
                  categoryId: s.categoryId,
                  categoryName: s.category.name,
                  categorySlug: s.category.slug,
                  name: s.name,
                  slug: s.slug,
                  shortDescription: s.shortDescription,
                  durationMin: s.durationMin,
                  priceType: s.priceType,
                  priceCents: s.priceCents,
                  currency: s.currency,
                  featured: s.featured,
                }))}
                ctaLabel={featuredCfg.ctaLabel || "Leer la carta completa"}
              />
            ) : (
              <div className="rounded-editorial border border-border bg-card p-8 text-center shadow-subtle sm:p-12">
                <Sparkles className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="mt-3 font-serif text-2xl text-foreground">
                  Catálogo de servicios en configuración
                </p>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                  {featuredCfg.emptyStateMessage ||
                    "El salón está completando las tarifas y duraciones oficiales de sus tratamientos."}
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button asChild variant="outline">
                    <Link href="/contacto">Consultar con el salón</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. Propuesta de Experiencia del Salón (Pasos de Atención Interactivos y Animados) */}
      {experience.visible !== false && (
        <ExperienceSteps
          eyebrow={experience.eyebrow}
          title={experience.title}
          description={experience.description}
          fallbackImageUrl={experience.imageUrl}
          fallbackImageAlt={experience.imageAlt || "Experiencia en ESPACIO Q"}
          pillars={Array.isArray(experience.pillars) ? experience.pillars : []}
        />
      )}

      {/* 5. Equipo Profesional (Mosaico Interactivo) */}
      {teamCfg.visible !== false && (() => {
        const cmsTeamMembers: TeamMember[] = Array.isArray(teamCfg.showcaseMembers)
          ? teamCfg.showcaseMembers.filter(
              (m: TeamMember) =>
                Boolean(m && m.name && (m.url || m.image || "").trim())
            )
          : [];
        const liveProMembers: TeamMember[] = professionals.map((pro, idx) => ({
          id: pro.id,
          name: pro.name,
          role: pro.roleTitle,
          specialty: pro.bio ?? undefined,
          url:
            pro.photoAsset?.src ||
            DEFAULT_SALON_TEAM_MEMBERS[idx % DEFAULT_SALON_TEAM_MEMBERS.length]
              .url,
          bookingHref: `/reservar?professionalId=${pro.id}`,
        }));
        const showcaseMembers =
          liveProMembers.length > 0
            ? liveProMembers
            : cmsTeamMembers.length > 0
              ? cmsTeamMembers
              : DEFAULT_SALON_TEAM_MEMBERS;

        return (
          <section className="border-b border-border bg-card/40 py-16 sm:py-24 lg:py-28">
            <div className="container mx-auto space-y-10 sm:space-y-14">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div className="max-w-2xl space-y-3">
                  {teamCfg.eyebrow && (
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {teamCfg.eyebrow}
                    </p>
                  )}
                  <h2
                    style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.9rem)" }}
                    className="font-serif font-normal leading-tight text-foreground"
                  >
                    {teamCfg.title}
                  </h2>
                  {teamCfg.description && (
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {teamCfg.description}
                    </p>
                  )}
                </div>

                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/equipo">
                    <span>{teamCfg.ctaLabel || "Conocer al equipo"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <TeamShowcase members={showcaseMembers} />

              {liveProMembers.length === 0 && teamCfg.provisionalNote && (
                <p className="text-center text-xs text-muted-foreground">
                  {teamCfg.provisionalNote}
                </p>
              )}
            </div>
          </section>
        );
      })()}

      {/* 6. Galería Visual Interactiva (Peinados y Cortes) */}
      {galleryCfg.visible !== false && (() => {
        const cmsRailItems: PictureRailItem[] = Array.isArray(galleryCfg.railItems)
          ? galleryCfg.railItems.filter(
              (item: PictureRailItem) =>
                Boolean(item && (item.url || item.image || "").trim())
            )
          : [];
        const fallbackRailItems: PictureRailItem[] = galleryAssets.map(
          (asset, idx) => ({
            id: asset.id,
            title: asset.internalName || asset.altText,
            description: asset.caption || asset.altText,
            categoryTag: "Estilismo",
            url: asset.src,
            frame: idx % 2 === 0 ? "oak" : "white",
            aspect: asset.height > 0 ? asset.width / asset.height : 0.8,
            mat: true,
          })
        );
        const railItems =
          cmsRailItems.length > 0 ? cmsRailItems : fallbackRailItems;
        if (railItems.length === 0) return null;

        return (
          <PictureRailGallery
            items={railItems}
            eyebrow={galleryCfg.eyebrow}
            heading={galleryCfg.title}
            caption={galleryCfg.description}
            autoplay
            interval={3200}
            className="border-b border-border py-12 sm:py-20"
            action={
              <Button asChild variant="outline">
                <Link href="/galeria">
                  <span>{galleryCfg.ctaLabel || "Ver galería completa"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            }
          />
        );
      })()}

      {/* 7. Reseñas Verificadas (Solo si existen y están autorizadas) */}
      {reviewsCfg.visible === true &&
        Array.isArray(reviewsCfg.items) &&
        reviewsCfg.items.length > 0 && (
          <section className="border-b border-border bg-card/50 py-20">
            <div className="container mx-auto space-y-10">
              <div className="max-w-xl space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {reviewsCfg.eyebrow}
                </p>
                <h2 className="font-serif text-3xl text-foreground">
                  {reviewsCfg.title}
                </h2>
                {reviewsCfg.sourceNote && (
                  <p className="text-xs text-muted-foreground">
                    {reviewsCfg.sourceNote}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {reviewsCfg.items.map(
                  (rev: { author: string; text: string; date?: string }, i: number) => (
                    <blockquote
                      key={i}
                      className="rounded-editorial border border-border bg-card p-6 shadow-subtle"
                    >
                      <p className="text-sm italic leading-relaxed text-foreground">
                        «{rev.text}»
                      </p>
                      <footer className="mt-4 text-xs font-medium text-muted-foreground">
                        {rev.author} {rev.date ? `· ${rev.date}` : ""}
                      </footer>
                    </blockquote>
                  )
                )}
              </div>
            </div>
          </section>
        )}

      {/* 8. Preguntas Frecuentes Editables */}
      {faqCfg.visible !== false &&
        Array.isArray(faqCfg.items) &&
        faqCfg.items.length > 0 && (
          <section className="border-b border-border bg-card/40 py-20 sm:py-28">
            <div className="container mx-auto grid grid-cols-1 gap-12 lg:grid-cols-12">
              <div className="space-y-3 lg:col-span-5">
                {faqCfg.eyebrow && (
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {faqCfg.eyebrow}
                  </p>
                )}
                <h2
                  style={{ fontSize: "clamp(1.85rem, 3.2vw, 2.75rem)" }}
                  className="font-serif font-normal leading-tight text-foreground"
                >
                  {faqCfg.title}
                </h2>
                {faqCfg.description && (
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {faqCfg.description}
                  </p>
                )}
              </div>

              <div className="divide-y divide-border rounded-editorial border border-border bg-card lg:col-span-7">
                {faqCfg.items.map(
                  (item: { question: string; answer: string }, idx: number) => (
                    <details key={idx} className="group p-6">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-xl font-medium text-foreground">
                        <span>{item.question}</span>
                        <span className="text-sm text-muted-foreground transition-transform group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {item.answer}
                      </p>
                    </details>
                  )
                )}
              </div>
            </div>
          </section>
        )}

      {/* 9 y 10. Ubicación, Horarios y CTA Final a Reservas */}
      {locationCfg.visible !== false && (
        <section className="py-14 sm:py-24 lg:py-28">
          <div className="container mx-auto grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12">
            <div className="flex flex-col justify-between rounded-editorial border border-border bg-card p-5 shadow-subtle sm:p-8 lg:col-span-7 lg:p-10">
              <div className="space-y-4">
                {locationCfg.eyebrow && (
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {locationCfg.eyebrow}
                  </p>
                )}
                <h2 className="font-serif text-2xl font-normal text-foreground sm:text-4xl">
                  {locationCfg.title}
                </h2>
                {locationCfg.description && (
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {locationCfg.description}
                  </p>
                )}

                <div className="mt-6 grid grid-cols-1 gap-6 pt-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>Ubicación</span>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {salonMeta.addressLine
                        ? `${salonMeta.addressLine}, ${salonMeta.city}`
                        : `${salonMeta.city}, España`}
                    </p>
                    <a
                      href={salonMeta.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground underline underline-offset-4"
                    >
                      <span>
                        {locationCfg.mapLinkLabel ||
                          "Abrir ubicación en Google Maps"}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  </div>

                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>Horario de apertura</span>
                    </h3>
                    {salonMeta.scheduleConfirmed ? (
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {salonMeta.weeklySummary.map((d) => (
                          <li
                            key={d.dayName}
                            className="flex justify-between gap-2"
                          >
                            <span className="font-medium text-foreground">
                              {d.dayName}
                            </span>
                            <span className="text-right">{d.isOpen ? d.hoursText : "Cerrado"}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Horario en proceso de confirmación en el salón.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-editorial border border-border bg-primary p-5 text-primary-foreground shadow-editorial sm:p-8 lg:col-span-5 lg:p-10">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/75">
                  CITA PREVIA ONLINE
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal leading-tight">
                  {locationCfg.bookingCtaTitle ||
                    "¿Lista o listo para tu próxima visita?"}
                </h2>
                <p className="text-sm leading-relaxed text-primary-foreground/85">
                  {locationCfg.bookingCtaDescription ||
                    "Selecciona tu tratamiento, profesional y horario disponible en tiempo real."}
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-card text-foreground hover:bg-accent sm:w-auto"
                >
                  <Link href="/reservar">
                    <Calendar className="h-4 w-4" />
                    <span>{locationCfg.bookingCtaLabel || "Reservar ahora"}</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
                >
                  <Link href="/contacto">Contactar</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
