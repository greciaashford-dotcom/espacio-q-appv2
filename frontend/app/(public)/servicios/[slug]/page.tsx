/* eslint-disable @next/next/no-img-element */
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { withSeo } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/json-ld";
import { serviceGraph } from "@/lib/seo/json-ld";
import { ArrowLeft, Calendar, Check, Clock, UserCheck } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import {
  CHAPTER_META_BY_SLUG,
  SERVICE_META_BY_SLUG,
} from "@/lib/domain/default-services-catalog";

async function getService(slug: string) {
  return prisma.service.findFirst({
    where: { slug, active: true },
    include: {
      category: true,
      imageAsset: true,
      professionals: {
        where: { active: true, professional: { active: true, publicVisible: true } },
        include: { professional: true },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const svc = await getService(params.slug);
  if (!svc) return { title: "Servicio no disponible" };
  return withSeo({
    title: svc.seoTitle || `${svc.name} · ESPACIO Q Madrid`,
    description: svc.seoDescription || svc.shortDescription,
    alternates: { canonical: `/servicios/${svc.slug}` },
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const svc = await getService(params.slug);
  if (!svc) notFound();

  const meta = SERVICE_META_BY_SLUG[svc.slug];
  const chapterMeta = CHAPTER_META_BY_SLUG[svc.category.slug];

  const faqs = Array.isArray(svc.faqJson)
    ? (svc.faqJson as Array<{ question?: string; answer?: string }>).filter(
        (f) => f?.question && f?.answer
      )
    : [];

  return (
    <div className="py-14 sm:py-20">
      <JsonLd
        id="jsonld-service"
        data={serviceGraph({
          name: svc.name,
          slug: svc.slug,
          description: svc.shortDescription || svc.description,
          categoryName: svc.category.name,
          priceType: svc.priceType,
          priceCents: svc.priceCents,
          currency: svc.currency,
        })}
      />
      <div className="container mx-auto max-w-5xl space-y-10">
        <nav aria-label="Ruta de navegación" className="text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/servicios" className="inline-flex items-center gap-1 hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Servicios
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">{svc.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2">
              {chapterMeta?.roman && (
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {chapterMeta.roman} ·
                </span>
              )}
              <Badge variant="secondary">{svc.category.name}</Badge>
            </div>
            <h1
              style={{ fontSize: "clamp(2.1rem, 4vw, 3.25rem)" }}
              className="font-serif font-normal leading-tight"
            >
              {svc.name}
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {svc.shortDescription}
            </p>
            <div className="whitespace-pre-line text-base leading-relaxed text-foreground/90">
              {svc.description}
            </div>

            {meta && (
              <div className="grid grid-cols-1 gap-5 rounded-editorial border border-border bg-card p-6 shadow-subtle sm:grid-cols-2">
                <div className="space-y-2.5">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Qué incluye tu momento
                  </h2>
                  <ul className="space-y-2 text-sm text-foreground/90">
                    {meta.ritualIncludes.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2.5 border-t border-border/70 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Pensado especialmente para
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {meta.idealFor}
                  </p>
                </div>
              </div>
            )}
          </div>

          <aside className="lg:col-span-5">
            <div className="sticky top-28 space-y-5 rounded-editorial border border-border bg-card p-6 shadow-subtle">
              {svc.imageAsset ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
                  <Image
                    src={svc.imageAsset.src}
                    alt={svc.imageAsset.altText}
                    fill
                    sizes="(max-width: 1024px) 100vw, 400px"
                    className="object-cover"
                  />
                </div>
              ) : chapterMeta?.coverUrl ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
                  <img
                    src={chapterMeta.coverUrl}
                    alt={svc.category.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" /> Duración estimada
                </span>
                <span className="font-medium">{svc.durationMin} min</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Precio</span>
                <span className="font-serif text-xl font-medium">
                  {formatPrice(svc.priceType, svc.priceCents, svc.currency)}
                </span>
              </div>
              {svc.priceType !== "FIXED" && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Importe orientativo: el presupuesto final se confirma en el salón tras el
                  diagnóstico y antes de comenzar.
                </p>
              )}
              <Button asChild className="w-full" size="lg">
                <Link href={`/reservar?serviceId=${svc.id}`}>
                  <Calendar className="h-4 w-4" /> Reservar este servicio
                </Link>
              </Button>
            </div>
          </aside>
        </div>

        {svc.professionals.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-serif text-2xl">Profesionales que realizan este servicio</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {svc.professionals.map((ps: any) => (
                <div
                  key={ps.id}
                  className="flex flex-col items-start justify-between gap-3 rounded-editorial border border-border bg-card p-4 min-[400px]:flex-row min-[400px]:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <UserCheck className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{ps.professional.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{ps.professional.roleTitle}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full shrink-0 min-[400px]:w-auto">
                    <Link href={`/reservar?serviceId=${svc.id}&professionalId=${ps.professionalId}`}>
                      Reservar
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {faqs.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-serif text-2xl">Preguntas frecuentes</h2>
            <div className="divide-y divide-border rounded-editorial border border-border bg-card">
              {faqs.map((f, i) => (
                <details key={i} className="group p-5">
                  <summary className="cursor-pointer list-none font-medium">{f.question}</summary>
                  <p className="mt-2 text-sm text-muted-foreground">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
