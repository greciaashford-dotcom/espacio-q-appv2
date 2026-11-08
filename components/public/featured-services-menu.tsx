/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";
import {
  CHAPTER_META_BY_SLUG,
  SERVICE_META_BY_SLUG,
} from "@/lib/domain/default-services-catalog";

export interface HomeMenuCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface HomeMenuService {
  id: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  name: string;
  slug: string;
  shortDescription: string;
  durationMin: number;
  priceType: string;
  priceCents: number | null;
  currency: string;
  featured: boolean;
}

export function FeaturedServicesMenu({
  categories,
  services,
  ctaLabel = "Leer la carta completa",
}: {
  categories: HomeMenuCategory[];
  services: HomeMenuService[];
  ctaLabel?: string;
}) {
  const [activeTab, setActiveTab] = useState<string>("featured");
  const [expandedId, setExpandedId] = useState<string | null>(
    services.find((s) => s.featured)?.id ?? services[0]?.id ?? null
  );

  const visibleServices = useMemo(() => {
    if (activeTab === "featured") {
      const feat = services.filter((s) => s.featured);
      return (feat.length > 0 ? feat : services).slice(0, 6);
    }
    return services.filter((s) => s.categoryId === activeTab);
  }, [activeTab, services]);

  const activeVisual = useMemo(() => {
    if (activeTab === "featured") {
      return {
        roman: "Selección de la Casa",
        title: "Los 6 capítulos esenciales de ESPACIO Q",
        tagline:
          "Un recorrido pensado desde la escucha tranquila hasta el último detalle en casa.",
        coverUrl:
          "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80",
      };
    }
    const cat = categories.find((c) => c.id === activeTab);
    const meta = cat ? CHAPTER_META_BY_SLUG[cat.slug] : undefined;
    return {
      roman: meta?.roman ?? "Capítulo",
      title: cat?.name ?? "Carta ESPACIO Q",
      tagline:
        meta?.tagline ??
        cat?.description ??
        "Tiempos reales y fórmulas respetuosas adaptadas a ti.",
      coverUrl:
        meta?.coverUrl ??
        "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=80",
    };
  }, [activeTab, categories]);

  if (services.length === 0) return null;

  return (
    <div data-slot="featured-services-menu" className="space-y-8">
      {/* Pestañas interactivas de capítulos */}
      <div
        role="tablist"
        aria-label="Capítulos de la carta de servicios"
        className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "featured"}
          onClick={() => {
            setActiveTab("featured");
            const first = services.find((s) => s.featured) ?? services[0];
            if (first) setExpandedId(first.id);
          }}
          className={cn(
            "relative inline-flex min-h-[42px] shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
            activeTab === "featured"
              ? "border-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          )}
        >
          {activeTab === "featured" && (
            <motion.span
              layoutId="home-services-chapter-tab"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="absolute inset-0 rounded-full bg-primary"
              aria-hidden="true"
            />
          )}
          <Sparkles className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
          <span className="relative z-10">Imprescindibles</span>
        </button>

        {categories.map((cat, idx) => {
          const isSelected = activeTab === cat.id;
          const roman = CHAPTER_META_BY_SLUG[cat.slug]?.roman?.replace(
            "Capítulo ",
            ""
          ) ?? String(idx + 1);
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                setActiveTab(cat.id);
                const firstInCat = services.find((s) => s.categoryId === cat.id);
                if (firstInCat) setExpandedId(firstInCat.id);
              }}
              className={cn(
                "relative inline-flex min-h-[42px] shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "border-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {isSelected && (
                <motion.span
                  layoutId="home-services-chapter-tab"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10">
                {roman} · {cat.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Escenario editorial dividido: Portada sensorial + Carta interactiva */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Tarjeta visual del capítulo activo */}
        <div className="lg:col-span-4">
          <div className="flex h-full flex-col justify-between overflow-hidden rounded-editorial border border-border bg-card shadow-subtle">
            <div>
              <div className="relative aspect-[16/10] overflow-hidden bg-secondary lg:aspect-[4/4]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeVisual.coverUrl}
                    src={activeVisual.coverUrl}
                    alt={activeVisual.title}
                    initial={{ opacity: 0.2, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0.2 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="h-full w-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="rounded-full border border-white/30 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] backdrop-blur-sm">
                    {activeVisual.roman}
                  </span>
                </div>
              </div>

              <div className="space-y-2 p-5 sm:p-6">
                <h3 className="font-serif text-2xl font-normal leading-snug text-foreground">
                  {activeVisual.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {activeVisual.tagline}
                </p>
              </div>
            </div>

            <div className="border-t border-border bg-background/50 p-4 sm:p-5 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  <strong className="font-medium text-foreground">
                    {services.length} rituales
                  </strong>{" "}
                  en {categories.length} capítulos
                </div>
                <Link
                  href="/servicios"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground underline-offset-4 hover:underline"
                >
                  <span>{ctaLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Líneas interactivas de la carta */}
        <div className="flex flex-col justify-between gap-4 lg:col-span-8">
          <div className="divide-y divide-border overflow-hidden rounded-editorial border border-border bg-card shadow-subtle">
            <AnimatePresence mode="popLayout" initial={false}>
              {visibleServices.map((svc) => {
                const isOpen = expandedId === svc.id;
                const meta = SERVICE_META_BY_SLUG[svc.slug];

                return (
                  <motion.div
                    key={svc.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                    className={cn(
                      "transition-colors",
                      isOpen ? "bg-accent/40" : "hover:bg-accent/25"
                    )}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={isOpen}
                      onClick={() =>
                        setExpandedId((prev) => (prev === svc.id ? null : svc.id))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setExpandedId((prev) =>
                            prev === svc.id ? null : svc.id
                          );
                        }
                      }}
                      className="flex cursor-pointer flex-col justify-between gap-3 p-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-row sm:items-center sm:p-6"
                    >
                      <div className="max-w-xl space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium uppercase tracking-wider">
                            {svc.categoryName}
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {svc.durationMin} min
                          </span>
                        </div>
                        <h3 className="font-serif text-xl font-medium text-foreground sm:text-2xl">
                          {svc.name}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {svc.shortDescription}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-1 sm:justify-end sm:pt-0">
                        <span className="font-serif text-lg font-medium text-foreground sm:whitespace-nowrap sm:text-xl">
                          {formatPrice(
                            svc.priceType,
                            svc.priceCents,
                            svc.currency
                          )}
                        </span>
                        <span
                          aria-hidden="true"
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground"
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform duration-300",
                              isOpen && "rotate-180"
                            )}
                          />
                        </span>
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.24, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-3 border-t border-border/70 bg-background/60 px-4 py-4 sm:px-6">
                            {meta && (
                              <ul className="grid grid-cols-1 gap-1.5 text-xs text-muted-foreground sm:grid-cols-3">
                                {meta.ritualIncludes.map((inc) => (
                                  <li
                                    key={inc}
                                    className="flex items-start gap-1.5"
                                  >
                                    <Check
                                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                                      aria-hidden="true"
                                    />
                                    <span>{inc}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <Link
                                href={`/servicios/${svc.slug}`}
                                className="text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
                              >
                                Leer ritual completo
                              </Link>
                              <Button asChild size="sm">
                                <Link href={`/reservar?serviceId=${svc.id}`}>
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>Reservar</span>
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Tarjeta magnética de paso a la carta completa */}
          <div className="flex flex-col items-start justify-between gap-4 rounded-editorial border border-border bg-card p-5 shadow-subtle sm:flex-row sm:items-center sm:px-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="font-serif text-lg font-medium text-foreground">
                  Diseña tu propia visita combinando rituales
                </p>
                <p className="text-xs text-muted-foreground">
                  En nuestra carta completa puedes calcular tiempos totales, filtrar según tu cabello o piel y recorrer los {categories.length} capítulos.
                </p>
              </div>
            </div>

            <Button asChild className="w-full shrink-0 sm:w-auto">
              <Link href="/servicios">
                <span>Abrir carta completa</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
