import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { withSeo } from "@/lib/seo/site";
import { BookOpen, Clock, Sparkles } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import {
  ensureDefaultServicesCatalog,
  getPublishedCmsBlock,
} from "@/lib/domain/cms";
import { ServicesCatalogClient } from "@/components/public/services-catalog-client";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const block = await getPublishedCmsBlock("page_servicios");
  return withSeo({
    title: block.seoTitle || "Carta de Servicios y Rituales · ESPACIO Q Madrid",
    description:
      block.seoDescription ||
      "Recorre los 6 capítulos de la carta de servicios, tiempos reales y rituales de belleza consciente en ESPACIO Q Madrid.",
    alternates: { canonical: "/servicios" },
  });
}

export default async function ServiciosPage({
  searchParams,
}: {
  searchParams?: { preview?: string };
}) {
  const isPreview = searchParams?.preview === "1";

  let [pageBlock, categories, services] = await Promise.all([
    getPublishedCmsBlock<Record<string, any>>("page_servicios", {
      previewDraft: isPreview,
    }),
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

  if (categories.length === 0) {
    await ensureDefaultServicesCatalog();
    [categories, services] = await Promise.all([
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

  const cms = pageBlock.data || {};

  return (
    <div className="py-12 sm:py-20 lg:py-24">
      <div className="container mx-auto space-y-10 sm:space-y-12">
        <header className="max-w-3xl space-y-4">
          {cms.eyebrow !== "" && (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {cms.eyebrow || "CARTA EDITORIAL · ESPACIO Q"}
            </p>
          )}
          <h1
            style={{ fontSize: "clamp(2.2rem, 4.4vw, 3.6rem)" }}
            className="font-serif font-normal leading-[1.1] text-foreground"
          >
            {cms.title || "Carta de servicios y rituales de cuidado"}
          </h1>
          {cms.description && (
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {cms.description}
            </p>
          )}

          {services.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 font-medium text-foreground shadow-subtle">
                <BookOpen className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>
                  {categories.length} capítulos · {services.length} rituales
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3.5 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>Diagnóstico personalizado incluido</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3.5 py-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>Combina servicios y calcula tu tiempo</span>
              </span>
            </div>
          )}
        </header>

        <ServicesCatalogClient
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
          }))}
          services={services.map((s) => ({
            id: s.id,
            categoryId: s.categoryId,
            categoryName: s.category.name,
            categorySlug: s.category.slug,
            name: s.name,
            slug: s.slug,
            shortDescription: s.shortDescription,
            description: s.description,
            durationMin: s.durationMin,
            priceType: s.priceType,
            priceCents: s.priceCents,
            currency: s.currency,
            featured: s.featured,
          }))}
          pageCms={cms}
        />

        {cms.pricingNotice && (
          <div className="rounded-editorial border border-border bg-card/70 p-5 text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Nota sobre tarifas:</strong>{" "}
            {cms.pricingNotice}
          </div>
        )}

        <div className="flex flex-col items-start justify-between gap-5 rounded-editorial border border-border bg-card p-5 shadow-subtle sm:flex-row sm:items-center sm:p-8">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="font-serif text-2xl font-medium text-foreground">
              {cms.bottomCtaTitle || "¿Dudas sobre qué servicio elegir?"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {cms.bottomCtaDescription ||
                "Escríbenos desde la página de contacto y te orientaremos antes de reservar."}
            </p>
          </div>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={cms.bottomCtaHref || "/contacto"}>
              {cms.bottomCtaLabel || "Contactar con el salón"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
