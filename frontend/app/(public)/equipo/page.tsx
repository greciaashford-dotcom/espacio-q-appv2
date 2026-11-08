import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, UserCheck } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getPublishedCmsBlock } from "@/lib/domain/cms";
import {
  DEFAULT_SALON_TEAM_MEMBERS,
  TeamShowcase,
  type TeamMember,
} from "@/components/ui/team-showcase";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const block = await getPublishedCmsBlock("page_equipo");
  return {
    title: block.seoTitle || "Nuestro Equipo · ESPACIO Q Madrid",
    description: block.seoDescription || undefined,
    alternates: { canonical: "/equipo" },
  };
}

export default async function EquipoPage({
  searchParams,
}: {
  searchParams?: { preview?: string };
}) {
  const [block, pros] = await Promise.all([
    getPublishedCmsBlock<Record<string, any>>("page_equipo", {
      previewDraft: searchParams?.preview === "1",
    }),
    prisma.professional.findMany({
      where: { active: true, publicVisible: true },
      orderBy: { sortOrder: "asc" },
      include: {
        photoAsset: true,
        services: {
          where: { active: true, service: { active: true } },
          include: { service: true },
        },
      },
    }),
  ]);
  const cms = block.data || {};

  const cmsMembers: TeamMember[] = Array.isArray(cms.showcaseMembers)
    ? cms.showcaseMembers.filter(
        (m: TeamMember) =>
          Boolean(m && m.name && (m.url || m.image || "").trim())
      )
    : [];

  const liveMembers: TeamMember[] = pros.map((pro, idx) => ({
    id: pro.id,
    name: pro.name,
    role: pro.roleTitle,
    specialty: pro.bio ?? undefined,
    url:
      pro.photoAsset?.src ||
      DEFAULT_SALON_TEAM_MEMBERS[idx % DEFAULT_SALON_TEAM_MEMBERS.length].url,
    bookingHref: `/reservar?professionalId=${pro.id}`,
  }));

  const showcaseMembers =
    liveMembers.length > 0
      ? liveMembers
      : cmsMembers.length > 0
        ? cmsMembers
        : DEFAULT_SALON_TEAM_MEMBERS;

  return (
    <div className="py-14 sm:py-24">
      <div className="container mx-auto space-y-12 sm:space-y-16">
        <header className="max-w-3xl space-y-4">
          {cms.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {cms.eyebrow}
            </p>
          )}
          <h1
            style={{ fontSize: "clamp(2.2rem, 4.2vw, 3.5rem)" }}
            className="font-serif font-normal leading-tight text-foreground"
          >
            {cms.title}
          </h1>
          {cms.description && (
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {cms.description}
            </p>
          )}
        </header>

        <section
          aria-label="Equipo profesional de ESPACIO Q"
          className="rounded-editorial border border-border bg-card/45 p-5 shadow-subtle sm:p-8 lg:p-10"
        >
          <TeamShowcase members={showcaseMembers} />
          {liveMembers.length === 0 && cms.provisionalNote && (
            <p className="mt-8 border-t border-border/70 pt-4 text-center text-xs text-muted-foreground">
              {cms.provisionalNote}
            </p>
          )}
        </section>

        {pros.length > 0 && (
          <section aria-label="Reserva directa por especialista" className="space-y-6">
            <h2 className="font-serif text-2xl font-normal text-foreground sm:text-3xl">
              Reserva directa por especialista
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pros.map((pro) => (
                <article
                  key={pro.id}
                  className="overflow-hidden rounded-editorial border border-border bg-card shadow-subtle"
                >
                  <div className="relative aspect-[4/5] bg-secondary">
                    {pro.photoAsset ? (
                      <Image
                        src={pro.photoAsset.src}
                        alt={pro.photoAsset.altText || pro.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <UserCheck className="h-10 w-10 text-muted-foreground opacity-40" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-6">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {pro.roleTitle}
                    </p>
                    <h3 className="font-serif text-2xl">{pro.name}</h3>
                    {pro.bio && (
                      <p className="text-sm text-muted-foreground">{pro.bio}</p>
                    )}
                    {pro.specialties.length > 0 && (
                      <ul className="flex flex-wrap gap-1.5">
                        {pro.specialties.map((s: any) => (
                          <li
                            key={s}
                            className="rounded-full border border-border px-2.5 py-0.5 text-xs"
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/reservar?professionalId=${pro.id}`}>
                        Reservar con {pro.name}
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {cms.philosophyTitle && (
          <section className="flex flex-col justify-between gap-6 rounded-editorial border border-border bg-card p-6 shadow-subtle sm:flex-row sm:items-center sm:p-8">
            <div className="max-w-2xl space-y-2">
              <h2 className="font-serif text-2xl text-foreground">
                {cms.philosophyTitle}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {cms.philosophyBody}
              </p>
            </div>
            <Button asChild size="lg" className="w-full shrink-0 sm:w-auto">
              <Link href="/reservar">
                <span>Reservar cita</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
