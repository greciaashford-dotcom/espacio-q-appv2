/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import {
  CHAPTER_META_BY_SLUG,
  RITUAL_NEED_OPTIONS,
  SERVICE_META_BY_SLUG,
  type RitualNeedKey,
} from "@/lib/domain/default-services-catalog";

export type PublicCategoryItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type PublicServiceItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  categorySlug?: string;
  name: string;
  slug: string;
  shortDescription: string;
  description?: string;
  durationMin: number;
  priceType: string;
  priceCents: number | null;
  currency: string;
  featured: boolean;
};

const ROMAN_FALLBACK = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

function formatDurationHuman(totalMin: number): string {
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

export function ServicesCatalogClient({
  categories,
  services,
  pageCms,
}: {
  categories: PublicCategoryItem[];
  services: PublicServiceItem[];
  pageCms: Record<string, any>;
}) {
  const [selectedNeed, setSelectedNeed] = useState<RitualNeedKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChapterId, setActiveChapterId] = useState<string>(
    categories[0]?.id ?? ""
  );
  const [seenChapters, setSeenChapters] = useState<Set<string>>(() =>
    categories[0]?.id ? new Set([categories[0].id]) : new Set()
  );
  const [expandedServiceIds, setExpandedServiceIds] = useState<Set<string>>(
    () => new Set(services.filter((s) => s.featured).slice(0, 1).map((s) => s.id))
  );
  const [ritualIds, setRitualIds] = useState<string[]>([]);
  const [trayExpanded, setTrayExpanded] = useState(false);

  const chapterRefs = useRef<Record<string, HTMLElement | null>>({});

  // Filtrado por necesidad guiada y búsqueda
  const filteredByCategory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return categories
      .map((cat, idx) => {
        const chapterMeta = CHAPTER_META_BY_SLUG[cat.slug];
        const catServices = services.filter((svc) => {
          if (svc.categoryId !== cat.id) return false;

          if (selectedNeed !== "all") {
            const meta = SERVICE_META_BY_SLUG[svc.slug];
            const matchesMeta = meta?.needs.includes(selectedNeed);
            const fallbackMatch =
              (selectedNeed === "renovar-forma" &&
                /corte|flequillo|estilo|rizo/i.test(
                  `${svc.name} ${cat.name}`
                )) ||
              (selectedNeed === "luz-y-color" &&
                /color|luz|balayage|babylights|brillo|gloss|mechas/i.test(
                  `${svc.name} ${cat.name}`
                )) ||
              (selectedNeed === "calma-y-salud" &&
                /spa|hidrat|reconstruc|ritual|masaje|alisado/i.test(
                  `${svc.name} ${cat.name}`
                )) ||
              (selectedNeed === "evento-especial" &&
                /brushing|ondas|recogido|novia|invitada|express/i.test(
                  `${svc.name} ${cat.name}`
                )) ||
              (selectedNeed === "mirada-y-manos" &&
                /ceja|pestañ|facial|kobido|manicura|pedicura|manos/i.test(
                  `${svc.name} ${cat.name}`
                ));

            if (!matchesMeta && !fallbackMatch) return false;
          }

          if (q) {
            const meta = SERVICE_META_BY_SLUG[svc.slug];
            const haystack = [
              svc.name,
              svc.shortDescription,
              svc.description ?? "",
              cat.name,
              meta?.idealFor ?? "",
              ...(meta?.ritualIncludes ?? []),
            ]
              .join(" ")
              .toLowerCase();
            if (!haystack.includes(q)) return false;
          }

          return true;
        });

        return {
          category: cat,
          roman:
            chapterMeta?.roman ??
            `Capítulo ${ROMAN_FALLBACK[idx] ?? String(idx + 1)}`,
          tagline:
            chapterMeta?.tagline ??
            "Atención personalizada y tiempos reales dedicados a ti",
          coverUrl:
            chapterMeta?.coverUrl ??
            "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80",
          services: catServices,
        };
      })
      .filter((group) => group.services.length > 0);
  }, [categories, services, selectedNeed, searchQuery]);

  const totalMatchingServices = useMemo(
    () => filteredByCategory.reduce((acc, g) => acc + g.services.length, 0),
    [filteredByCategory]
  );

  // Seguimiento de lectura por capítulos mediante IntersectionObserver
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const elements = filteredByCategory
      .map((g) => chapterRefs.current[g.category.id])
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          const id = visible[0].target.getAttribute("data-chapter-id");
          if (id) {
            setActiveChapterId(id);
            setSeenChapters((prev) => {
              if (prev.has(id)) return prev;
              const next = new Set(prev);
              next.add(id);
              return next;
            });
          }
        }
      },
      {
        rootMargin: "-18% 0px -52% 0px",
        threshold: [0.1, 0.35, 0.6],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filteredByCategory]);

  const toggleExpandService = (id: string) => {
    setExpandedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleRitualItem = (id: string) => {
    setRitualIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const scrollToChapter = (catId: string) => {
    setActiveChapterId(catId);
    setSeenChapters((prev) => new Set(prev).add(catId));
    const el = chapterRefs.current[catId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const selectedServices = useMemo(
    () =>
      ritualIds
        .map((id) => services.find((s) => s.id === id))
        .filter((s): s is PublicServiceItem => Boolean(s)),
    [ritualIds, services]
  );

  const ritualSummary = useMemo(() => {
    const totalMin = selectedServices.reduce((acc, s) => acc + s.durationMin, 0);
    const hasConsultation = selectedServices.some(
      (s) =>
        s.priceType === "CONSULT" ||
        s.priceType === "CONSULTATION" ||
        s.priceCents === null
    );
    const hasFrom = selectedServices.some((s) => s.priceType === "FROM");
    const sumCents = selectedServices.reduce(
      (acc, s) => acc + (s.priceCents ?? 0),
      0
    );

    let priceLabel = "";
    if (hasConsultation && sumCents === 0) {
      priceLabel = "Diagnóstico en salón";
    } else if (hasConsultation) {
      priceLabel = `Desde ${formatPrice("FIXED", sumCents, "EUR")} + valoración`;
    } else if (hasFrom) {
      priceLabel = formatPrice("FROM", sumCents, "EUR");
    } else {
      priceLabel = formatPrice("FIXED", sumCents, "EUR");
    }

    return { totalMin, priceLabel };
  }, [selectedServices]);

  if (services.length === 0) {
    return (
      <div className="rounded-editorial border border-border bg-card p-10 text-center shadow-subtle sm:p-14">
        <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
        <h2 className="mt-4 font-serif text-3xl text-foreground">
          {pageCms.emptyCatalogTitle || "Carta de servicios en preparación"}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {pageCms.emptyCatalogDescription ||
            "Estamos actualizando los tratamientos, tiempos y tarifas oficiales del salón."}
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/contacto">Consultar con el salón</Link>
          </Button>
        </div>
      </div>
    );
  }

  const totalChaptersCount = categories.length || 1;
  const exploredCount = Math.min(totalChaptersCount, Math.max(1, seenChapters.size));
  const progressPct = Math.round((exploredCount / totalChaptersCount) * 100);

  return (
    <div
      data-slot="interactive-services-carta"
      className={cn("space-y-10", selectedServices.length > 0 && "pb-28")}
    >
      {/* 1. Brújula interactiva de necesidades + Buscador instantáneo */}
      <section
        aria-label="Asesor interactivo de la carta"
        className="rounded-editorial border border-border bg-card p-5 shadow-subtle sm:p-7"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-border/80 pb-5 lg:flex-row lg:items-end">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Explora a tu ritmo · {services.length} rituales en {categories.length} capítulos</span>
            </p>
            <h2 className="font-serif text-2xl font-normal text-foreground sm:text-3xl">
              ¿Qué necesita hoy tu cabello o tu piel?
            </h2>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="service-search-input" className="sr-only">
              Buscar servicio o tratamiento
            </label>
            <Input
              id="service-search-input"
              type="search"
              placeholder={
                pageCms.searchPlaceholder ||
                "Buscar corte, balayage, head spa, kobido..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Selector táctil animado por objetivo */}
        <div
          role="tablist"
          aria-label="Filtrar carta por objetivo de cuidado"
          className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {RITUAL_NEED_OPTIONS.map((opt) => {
            const isSelected = selectedNeed === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedNeed(opt.key)}
                className={cn(
                  "relative flex min-h-[60px] flex-col items-start justify-center rounded-xl border px-4 py-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "border-primary text-foreground"
                    : "border-border/80 bg-background/60 text-muted-foreground hover:border-border hover:bg-background hover:text-foreground"
                )}
              >
                {isSelected && (
                  <motion.span
                    layoutId="active-ritual-need"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-accent/85"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10 flex w-full items-center justify-between gap-2 text-sm font-semibold text-foreground">
                  <span>{opt.label}</span>
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                  )}
                </span>
                <span className="relative z-10 mt-0.5 text-xs leading-snug text-muted-foreground">
                  {opt.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Índice adhesivo de capítulos + Barra de progreso de lectura */}
      {filteredByCategory.length > 0 && (
        <nav
          aria-label="Capítulos de la carta de servicios"
          className="sticky top-16 z-30 -mx-4 border-y border-border bg-background/92 px-4 py-3 backdrop-blur-md sm:top-20 sm:mx-0 sm:rounded-editorial sm:border sm:bg-card/92 sm:px-5 sm:shadow-subtle"
        >
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <span>Índice de la carta</span>
                {(selectedNeed !== "all" || searchQuery.trim() !== "") && (
                  <span className="text-muted-foreground">
                    · {totalMatchingServices} rituales
                  </span>
                )}
              </span>

              <span className="text-[11px] text-muted-foreground">
                {exploredCount === totalChaptersCount
                  ? "Carta completa recorrida ✓"
                  : `${exploredCount} de ${totalChaptersCount} capítulos explorados`}
              </span>
            </div>

            {/* Barra de progreso de lectura */}
            <div
              aria-hidden="true"
              className="h-1 w-full overflow-hidden rounded-full bg-secondary"
            >
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>

            {/* Pestañas horizontales de capítulos */}
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pt-0.5">
              {filteredByCategory.map((group, idx) => {
                const isCurrent = activeChapterId === group.category.id;
                const romanShort = ROMAN_FALLBACK[idx] ?? String(idx + 1);
                return (
                  <button
                    key={group.category.id}
                    type="button"
                    onClick={() => scrollToChapter(group.category.id)}
                    className={cn(
                      "relative min-h-[38px] shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isCurrent
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {isCurrent && (
                      <motion.span
                        layoutId="active-chapter-pill"
                        transition={{ type: "spring", stiffness: 400, damping: 34 }}
                        className="absolute inset-0 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative z-10">
                      {romanShort} · {group.category.name} ({group.services.length})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* 3. Capítulos editoriales y tarjetas interactivas desplegables */}
      {filteredByCategory.length === 0 ? (
        <div className="rounded-editorial border border-border bg-card p-10 text-center shadow-subtle">
          <p className="font-serif text-2xl text-foreground">
            No hemos encontrado rituales con ese criterio
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Prueba otra palabra clave o vuelve a desplegar los 6 capítulos completos.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-5"
            onClick={() => {
              setSelectedNeed("all");
              setSearchQuery("");
            }}
          >
            Ver la carta completa
          </Button>
        </div>
      ) : (
        <div className="space-y-14 sm:space-y-20">
          {filteredByCategory.map((group, groupIdx) => {
            const durations = group.services.map((s) => s.durationMin);
            const minDur = Math.min(...durations);
            const maxDur = Math.max(...durations);

            return (
              <section
                key={group.category.id}
                id={`capitulo-${group.category.slug}`}
                data-chapter-id={group.category.id}
                ref={(el) => {
                  chapterRefs.current[group.category.id] = el;
                }}
                className="scroll-mt-44 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10"
              >
                {/* Portada sensorial del capítulo */}
                <aside className="lg:col-span-4">
                  <div className="overflow-hidden rounded-editorial border border-border bg-card shadow-subtle lg:sticky lg:top-44">
                    <div className="relative aspect-[16/9] overflow-hidden bg-secondary lg:aspect-[4/3]">
                      <img
                        src={group.coverUrl}
                        alt={group.category.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                      <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-white">
                        <span className="rounded-full border border-white/30 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] backdrop-blur-sm">
                          {group.roman}
                        </span>
                        <span className="text-xs font-medium text-white/90">
                          {minDur === maxDur
                            ? `${minDur} min`
                            : `${minDur}–${maxDur} min`}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5 p-5 sm:p-6">
                      <p className="font-serif text-sm italic text-muted-foreground">
                        «{group.tagline}»
                      </p>
                      <h2 className="font-serif text-2xl font-normal leading-snug text-foreground sm:text-3xl">
                        {group.category.name}
                      </h2>
                      {group.category.description && (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {group.category.description}
                        </p>
                      )}
                    </div>
                  </div>
                </aside>

                {/* Lista interactiva de servicios del capítulo */}
                <div className="space-y-3.5 lg:col-span-8">
                  {group.services.map((svc, svcIdx) => {
                    const isExpanded = expandedServiceIds.has(svc.id);
                    const inRitual = ritualIds.includes(svc.id);
                    const meta = SERVICE_META_BY_SLUG[svc.slug];
                    const itemNumber = `${groupIdx + 1}.${svcIdx + 1}`;

                    return (
                      <motion.article
                        key={svc.id}
                        layout="position"
                        className={cn(
                          "overflow-hidden rounded-editorial border bg-card transition-colors duration-200",
                          inRitual
                            ? "border-primary/70 shadow-editorial"
                            : isExpanded
                              ? "border-foreground/30 shadow-subtle"
                              : "border-border hover:border-foreground/25 shadow-subtle"
                        )}
                      >
                        {/* Cabecera clicable del ritual */}
                        <div
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          onClick={() => toggleExpandService(svc.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleExpandService(svc.id);
                            }
                          }}
                          className="cursor-pointer p-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-6"
                        >
                          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                            <div className="max-w-xl space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[11px] tracking-widest text-muted-foreground">
                                  {itemNumber}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/75 px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                                  <Clock className="h-3 w-3" aria-hidden="true" />
                                  {svc.durationMin} min
                                </span>
                                {svc.featured && (
                                  <Badge variant="outline" className="border-primary/35 text-[11px]">
                                    Esencial ESPACIO Q
                                  </Badge>
                                )}
                                {selectedNeed !== "all" && (
                                  <Badge variant="secondary" className="text-[11px]">
                                    Recomendado para ti
                                  </Badge>
                                )}
                              </div>

                              <h3 className="font-serif text-xl font-medium leading-snug text-foreground sm:text-2xl">
                                {svc.name}
                              </h3>

                              <p className="text-sm leading-relaxed text-muted-foreground">
                                {svc.shortDescription}
                              </p>
                            </div>

                            {/* Tarifa y controles rápidos */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-border/60 pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                              <p className="font-serif text-lg font-medium text-foreground sm:whitespace-nowrap sm:text-2xl">
                                {formatPrice(
                                  svc.priceType,
                                  svc.priceCents,
                                  svc.currency
                                )}
                              </p>

                              <div
                                className="flex shrink-0 items-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleRitualItem(svc.id)}
                                  aria-pressed={inRitual}
                                  className={cn(
                                    "inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    inRitual
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border bg-background text-foreground hover:bg-accent"
                                  )}
                                >
                                  {inRitual ? (
                                    <>
                                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                      <span>En mi visita</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                                      <span>Mi ritual</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleExpandService(svc.id)}
                                  aria-label={
                                    isExpanded
                                      ? `Ocultar detalles de ${svc.name}`
                                      : `Leer ritual completo de ${svc.name}`
                                  }
                                  className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                >
                                  <ChevronDown
                                    className={cn(
                                      "h-4 w-4 transition-transform duration-300",
                                      isExpanded && "rotate-180"
                                    )}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Ficha desplegable animada con experiencia completa */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-4 border-t border-border/80 bg-background/55 px-4 py-5 sm:px-6">
                                {svc.description && (
                                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                                    {svc.description}
                                  </p>
                                )}

                                {meta && (
                                  <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/80 bg-card p-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                        Qué incluye tu momento
                                      </p>
                                      <ul className="space-y-1.5 text-xs text-foreground/90">
                                        {meta.ritualIncludes.map((inc) => (
                                          <li
                                            key={inc}
                                            className="flex items-start gap-2"
                                          >
                                            <Check
                                              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                                              aria-hidden="true"
                                            />
                                            <span>{inc}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    <div className="flex flex-col justify-between gap-3 border-t border-border/60 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                                      <div className="space-y-1">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                          Pensado especialmente para
                                        </p>
                                        <p className="text-xs leading-relaxed text-muted-foreground">
                                          {meta.idealFor}
                                        </p>
                                      </div>

                                      {svc.priceType !== "FIXED" && (
                                        <p className="text-[11px] leading-snug text-muted-foreground">
                                          Presupuesto confirmado tras diagnóstico personalizado antes de empezar.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                  <Link
                                    href={`/servicios/${svc.slug}`}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                                  >
                                    <span>Ver ficha individual</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                  </Link>

                                  <div className="flex w-full flex-col gap-2 min-[420px]:w-auto min-[420px]:flex-row min-[420px]:items-center">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="w-full min-[420px]:w-auto"
                                      onClick={() => toggleRitualItem(svc.id)}
                                    >
                                      {inRitual
                                        ? "Quitar de mi visita"
                                        : "Añadir a mi visita"}
                                    </Button>
                                    <Button asChild size="sm" className="w-full min-[420px]:w-auto">
                                      <Link href={`/reservar?serviceId=${svc.id}`}>
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>Reservar este servicio</span>
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.article>
                    );
                  })}

                  {/* Invitación al siguiente capítulo para mantener el flujo de lectura */}
                  {groupIdx < filteredByCategory.length - 1 && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          scrollToChapter(
                            filteredByCategory[groupIdx + 1].category.id
                          )
                        }
                        className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <span>
                          Continuar con{" "}
                          <strong className="font-serif text-sm font-normal text-foreground">
                            {filteredByCategory[groupIdx + 1].roman} ·{" "}
                            {filteredByCategory[groupIdx + 1].category.name}
                          </strong>
                        </span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* 4. Bandeja flotante "Diseña tu Visita" (calculador en tiempo real) */}
      <AnimatePresence>
        {selectedServices.length > 0 && (
          <motion.aside
            aria-label="Resumen de tu ritual personalizado"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-4xl rounded-editorial border border-primary/25 bg-card/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-editorial backdrop-blur-xl sm:inset-x-6 sm:bottom-5 sm:p-5"
          >
            <AnimatePresence initial={false}>
              {trayExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 overflow-hidden border-b border-border pb-4"
                >
                  <div className="flex items-center justify-between pb-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Tu ritual a medida en ESPACIO Q
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setRitualIds([]);
                        setTrayExpanded(false);
                      }}
                      className="text-xs text-muted-foreground underline hover:text-foreground"
                    >
                      Vaciar selección
                    </button>
                  </div>
                  <ul className="max-h-40 space-y-2 overflow-y-auto pr-1">
                    {selectedServices.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-background/80 px-3 py-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {s.name}
                          </p>
                          <p className="text-muted-foreground">
                            {s.durationMin} min ·{" "}
                            {formatPrice(s.priceType, s.priceCents, s.currency)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleRitualItem(s.id)}
                          aria-label={`Quitar ${s.name}`}
                          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center justify-between gap-4 sm:justify-start">
                <div>
                  <button
                    type="button"
                    onClick={() => setTrayExpanded((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
                  >
                    <span>
                      {selectedServices.length}{" "}
                      {selectedServices.length === 1
                        ? "servicio elegido"
                        : "servicios elegidos"}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        trayExpanded && "rotate-180"
                      )}
                    />
                  </button>
                  <p className="mt-0.5 font-serif text-lg font-medium text-foreground sm:text-xl">
                    {formatDurationHuman(ritualSummary.totalMin)} de cuidado ·{" "}
                    <span>{ritualSummary.priceLabel}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRitualIds([]);
                    setTrayExpanded(false);
                  }}
                >
                  Limpiar
                </Button>
                <Button asChild size="default" className="flex-1 sm:flex-initial">
                  <Link
                    href={
                      selectedServices.length > 1
                        ? `/reservar?serviceId=${encodeURIComponent(selectedServices[0].id)}&extraServices=${encodeURIComponent(
                            selectedServices
                              .slice(1)
                              .map((s) => s.name)
                              .join(", ")
                          )}`
                        : `/reservar?serviceId=${encodeURIComponent(selectedServices[0].id)}`
                    }
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Reservar mi momento</span>
                  </Link>
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
