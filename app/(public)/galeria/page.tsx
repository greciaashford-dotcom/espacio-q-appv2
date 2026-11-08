import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getPublishedCmsBlock } from "@/lib/domain/cms";
import {
  PictureRailGallery,
  type PictureRailItem,
} from "@/components/ui/picture-rail-gallery";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const block = await getPublishedCmsBlock("page_galeria");
  return {
    title: block.seoTitle || "Galería · ESPACIO Q Madrid",
    description: block.seoDescription || undefined,
    alternates: { canonical: "/galeria" },
  };
}

export default async function GaleriaPage({
  searchParams,
}: {
  searchParams?: { preview?: string };
}) {
  const [block, assets] = await Promise.all([
    getPublishedCmsBlock<Record<string, any>>("page_galeria", {
      previewDraft: searchParams?.preview === "1",
    }),
    prisma.mediaAsset.findMany({
      where: { publicVisible: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
  ]);
  const cms = block.data || {};
  const hasProvisional = assets.some((a) => a.isProvisional);
  const railItems: PictureRailItem[] = Array.isArray(cms.railItems)
    ? cms.railItems.filter(
        (item: PictureRailItem) =>
          Boolean(item && (item.url || item.image || "").trim())
      )
    : [];

  return (
    <div className="py-12 sm:py-20">
      <div className="container mx-auto space-y-6 pb-8 sm:pb-12">
        <header className="max-w-3xl space-y-4">
          {cms.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {cms.eyebrow}
            </p>
          )}
          <h1
            style={{ fontSize: "clamp(2.1rem, 4.2vw, 3.5rem)" }}
            className="font-serif font-normal leading-tight text-foreground"
          >
            {cms.title}
          </h1>
          {cms.description && (
            <p className="text-base text-muted-foreground sm:text-lg">
              {cms.description}
            </p>
          )}
        </header>
      </div>

      {railItems.length > 0 && (
        <PictureRailGallery
          items={railItems}
          eyebrow={cms.railEyebrow}
          heading={cms.railTitle}
          caption={cms.railCaption}
          autoplay
          interval={3200}
          className="border-y border-border bg-card/35 py-8 sm:py-14"
          action={
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/reservar">
                <span>Reservar valoración personalizada</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
      )}

      <div className="container mx-auto space-y-8 pt-12 sm:pt-16">
        {hasProvisional && cms.provisionalBannerText && (
          <p className="rounded-editorial border border-border bg-card p-4 text-xs text-muted-foreground">
            {cms.provisionalBannerText}
          </p>
        )}

        {assets.length > 0 && (
          <section aria-label={cms.archiveTitle || "Atmósfera y espacio del salón"} className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-normal text-foreground sm:text-3xl">
                {cms.archiveTitle || "Atmósfera y espacio del salón"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Detalles arquitectónicos, texturas e iluminación natural de ESPACIO Q.
              </p>
            </div>
            <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>li]:mb-5">
              {assets.map((a) => (
                <li key={a.id} className="break-inside-avoid">
                  <figure className="overflow-hidden rounded-editorial border border-border bg-card shadow-subtle">
                    <div
                      className="relative"
                      style={{ aspectRatio: `${a.width} / ${a.height}` }}
                    >
                      <Image
                        src={a.src}
                        alt={a.altText}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                        style={{
                          objectPosition: `${a.focalPointX}% ${a.focalPointY}%`,
                        }}
                      />
                    </div>
                    {(a.caption || a.isProvisional) && (
                      <figcaption className="px-4 py-3 text-xs text-muted-foreground">
                        {a.isProvisional
                          ? "Referencia editorial provisional"
                          : a.caption}
                      </figcaption>
                    )}
                  </figure>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
