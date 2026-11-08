"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  HeartHandshake,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type ExperiencePillarItem = {
  title: string;
  description: string;
  badge?: string;
  url?: string;
};

export const DEFAULT_EXPERIENCE_STEP_DURATION_MS = 4500;

export const DEFAULT_EXPERIENCE_STEP_BADGES = [
  "Escucha y valoración",
  "Tiempo dedicado",
  "Cuidado continuo",
];

export const DEFAULT_EXPERIENCE_STEP_URLS = [
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=1000&q=80",
];

const STEP_ICONS = [Sparkles, Clock, HeartHandshake, CheckCircle2];

export interface ExperienceStepsProps {
  eyebrow?: string;
  title: string;
  description?: string;
  fallbackImageUrl?: string;
  fallbackImageAlt?: string;
  pillars?: ExperiencePillarItem[];
  autoPlay?: boolean;
  stepDurationMs?: number;
  bookingHref?: string;
  bookingLabel?: string;
}

export function ExperienceSteps({
  eyebrow,
  title,
  description,
  fallbackImageUrl,
  fallbackImageAlt = "Experiencia de atención en ESPACIO Q",
  pillars = [],
  autoPlay = true,
  stepDurationMs = DEFAULT_EXPERIENCE_STEP_DURATION_MS,
  bookingHref = "/reservar",
  bookingLabel = "Reservar cita personalizada",
}: ExperienceStepsProps) {
  const uid = useId().replace(/:/g, "");
  const prefersReducedMotion = useReducedMotion();

  const normalizedSteps = useMemo(() => {
    const valid = (pillars ?? []).filter(
      (item) =>
        item &&
        typeof item.title === "string" &&
        item.title.trim().length > 0
    );

    return valid.map((step, idx) => {
      const resolvedUrl =
        (typeof step.url === "string" && step.url.trim()) ||
        (idx === 0 && fallbackImageUrl?.trim()) ||
        DEFAULT_EXPERIENCE_STEP_URLS[idx % DEFAULT_EXPERIENCE_STEP_URLS.length] ||
        fallbackImageUrl ||
        "";

      const resolvedBadge =
        typeof step.badge === "string"
          ? step.badge.trim()
          : DEFAULT_EXPERIENCE_STEP_BADGES[idx] || `Paso 0${idx + 1}`;

      return {
        title: step.title,
        description: step.description || "",
        badge: resolvedBadge,
        url: resolvedUrl,
      };
    });
  }, [pillars, fallbackImageUrl]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [cycleNonce, setCycleNonce] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const safeIndex =
    normalizedSteps.length > 0 && activeIndex < normalizedSteps.length
      ? activeIndex
      : 0;

  useEffect(() => {
    if (safeIndex !== activeIndex) {
      setActiveIndex(safeIndex);
    }
  }, [safeIndex, activeIndex]);

  // Precargar fotografías de cada paso para transiciones instantáneas sin parpadeos
  useEffect(() => {
    if (typeof window === "undefined") return;
    for (const step of normalizedSteps) {
      if (step.url) {
        const img = new window.Image();
        img.src = step.url;
      }
    }
  }, [normalizedSteps]);

  // Pausar cuando la pestaña está en segundo plano
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibility = () => {
      setIsTabVisible(document.visibilityState === "visible");
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const canAutoAdvance =
    autoPlay &&
    !prefersReducedMotion &&
    !userPaused &&
    !isTouching &&
    isTabVisible &&
    normalizedSteps.length > 1 &&
    stepDurationMs > 0;

  const selectStep = useCallback(
    (nextIndex: number) => {
      if (normalizedSteps.length === 0) return;
      const wrapped =
        ((nextIndex % normalizedSteps.length) + normalizedSteps.length) %
        normalizedSteps.length;
      setActiveIndex(wrapped);
      setCycleNonce((n) => n + 1);
    },
    [normalizedSteps.length]
  );

  // Avance automático sincronizado con la barra de progreso animada
  useEffect(() => {
    if (!canAutoAdvance) return;
    const timer = window.setTimeout(() => {
      selectStep(safeIndex + 1);
    }, stepDurationMs);
    return () => window.clearTimeout(timer);
  }, [canAutoAdvance, safeIndex, stepDurationMs, cycleNonce, selectStep]);

  const handleStepKeyDown = (
    e: React.KeyboardEvent<HTMLElement>,
    idx: number
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectStep(idx);
      return;
    }
    if (normalizedSteps.length <= 1) return;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      selectStep(idx + 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      selectStep(idx - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      selectStep(0);
    } else if (e.key === "End") {
      e.preventDefault();
      selectStep(normalizedSteps.length - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    if (!t) return;
    setIsTouching(true);
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsTouching(false);
    if (!touchStartRef.current) return;
    const endTouch = e.changedTouches[0];
    const endX = endTouch?.clientX ?? touchStartRef.current.x;
    const endY = endTouch?.clientY ?? touchStartRef.current.y;
    const deltaX = endX - touchStartRef.current.x;
    const deltaY = endY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.abs(deltaX) > 36 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      selectStep(deltaX < 0 ? safeIndex + 1 : safeIndex - 1);
    }
  };

  const handleTouchCancel = () => {
    setIsTouching(false);
    touchStartRef.current = null;
  };

  const currentStep = normalizedSteps[safeIndex] ?? null;
  const activeImageUrl = currentStep?.url || fallbackImageUrl || "";
  const totalStepsFormatted = String(normalizedSteps.length).padStart(2, "0");
  const currentStepFormatted = String(safeIndex + 1).padStart(2, "0");

  return (
    <section
      id="experiencia-salon"
      aria-label={title || "Pasos de atención en ESPACIO Q"}
      className="border-b border-border py-14 sm:py-24 lg:py-28"
    >
      <div className="container mx-auto grid grid-cols-1 items-start gap-8 sm:gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
        {/* Columna Visual Dinámica: Escenario interactivo sincronizado con cada paso */}
        <div className="order-2 mx-auto w-full max-w-lg lg:order-1 lg:col-span-5 lg:max-w-none">
          {activeImageUrl && (
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
              className="touch-pan-y rounded-editorial border border-border bg-card p-2.5 shadow-editorial sm:p-3.5"
            >
              <div className="relative aspect-[5/4] w-full overflow-hidden rounded-lg bg-secondary sm:aspect-[4/3] lg:aspect-[4/5]">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={`${safeIndex}-${activeImageUrl}`}
                    initial={
                      prefersReducedMotion
                        ? { opacity: 1 }
                        : { opacity: 0, scale: 1.05 }
                    }
                    animate={{ opacity: 1, scale: 1 }}
                    exit={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.98 }
                    }
                    transition={{
                      duration: prefersReducedMotion ? 0.05 : 0.65,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="absolute inset-0 h-full w-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeImageUrl}
                      alt={
                        currentStep
                          ? `${currentStep.title} — ${fallbackImageAlt}`
                          : fallbackImageAlt
                      }
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/65 via-foreground/10 to-transparent"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Insignia flotante superior del paso activo */}
                {normalizedSteps.length > 0 && (
                  <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between gap-2 sm:left-4 sm:right-4 sm:top-4">
                    <div className="inline-flex max-w-[80%] items-center gap-2 rounded-full border border-border/80 bg-card/92 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground shadow-subtle backdrop-blur-md">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse" />
                      <span className="truncate">
                        Paso {currentStepFormatted}
                        {currentStep?.badge ? ` · ${currentStep.badge}` : ""}
                      </span>
                    </div>

                    {normalizedSteps.length > 1 && !prefersReducedMotion && (
                      <button
                        type="button"
                        onClick={() => setUserPaused((p) => !p)}
                        aria-label={
                          userPaused
                            ? "Reanudar recorrido automático de pasos"
                            : "Pausar recorrido automático de pasos"
                        }
                        title={userPaused ? "Reanudar recorrido" : "Pausar recorrido"}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/80 bg-card/92 text-foreground shadow-subtle backdrop-blur-md transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {userPaused ? (
                          <Play className="h-3.5 w-3.5 translate-x-[0.5px]" />
                        ) : (
                          <Pause className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Tarjeta flotante inferior con barras de progreso segmentadas y controles */}
                {currentStep && (
                  <div className="absolute bottom-3 left-3 right-3 z-10 rounded-xl border border-border/85 bg-card/94 p-3.5 shadow-editorial backdrop-blur-md sm:bottom-4 sm:left-4 sm:right-4 sm:p-4">
                    {normalizedSteps.length > 1 && (
                      <div
                        className="mb-2.5 flex items-center gap-1.5"
                        role="group"
                        aria-label="Progreso de pasos de atención"
                      >
                        {normalizedSteps.map((st, idx) => {
                          const isCurrent = idx === safeIndex;
                          const isPast = idx < safeIndex;
                          return (
                            <button
                              key={`seg-${st.title}-${idx}`}
                              type="button"
                              onClick={() => selectStep(idx)}
                              aria-label={`Ver paso ${idx + 1}: ${st.title}`}
                              className="group relative h-5 flex-1 py-2 focus-visible:outline-none"
                            >
                              <span className="relative block h-1 w-full overflow-hidden rounded-full bg-secondary">
                                {isPast && (
                                  <span className="absolute inset-0 bg-primary/70" />
                                )}
                                {isCurrent && (
                                  <motion.span
                                    key={`bar-${safeIndex}-${cycleNonce}-${canAutoAdvance}`}
                                    initial={{
                                      scaleX: canAutoAdvance ? 0 : 1,
                                    }}
                                    animate={{ scaleX: 1 }}
                                    transition={{
                                      duration: canAutoAdvance
                                        ? stepDurationMs / 1000
                                        : 0.2,
                                      ease: "linear",
                                    }}
                                    style={{ transformOrigin: "left center" }}
                                    className="absolute inset-0 bg-primary"
                                  />
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          {currentStepFormatted} / {totalStepsFormatted} · Atención en salón
                        </p>
                        <p className="mt-0.5 truncate font-serif text-lg font-medium text-foreground sm:text-xl">
                          {currentStep.title}
                        </p>
                      </div>

                      {normalizedSteps.length > 1 && (
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => selectStep(safeIndex - 1)}
                            aria-label="Paso de atención anterior"
                            title="Paso anterior"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/85 text-foreground transition hover:bg-accent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => selectStep(safeIndex + 1)}
                            aria-label="Siguiente paso de atención"
                            title="Siguiente paso"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-primary text-primary-foreground transition hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Columna Editorial e Interactiva de Pasos de Atención */}
        <div className="order-1 space-y-6 sm:space-y-8 lg:order-2 lg:col-span-7 lg:pl-6">
          <div className="space-y-3">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <h2
              style={{ fontSize: "clamp(1.75rem, 3.4vw, 2.9rem)" }}
              className="font-serif font-normal leading-tight text-foreground"
            >
              {title}
            </h2>
            {description && (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {description}
              </p>
            )}
          </div>

          {normalizedSteps.length > 0 && (
            <div className="space-y-4">
              {/* Selector táctil rápido en móvil */}
              {normalizedSteps.length > 1 && (
                <div
                  className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 sm:hidden"
                  role="group"
                  aria-label="Selector rápido de pasos"
                >
                  {normalizedSteps.map((step, idx) => {
                    const isActive = idx === safeIndex;
                    return (
                      <button
                        key={`pill-${step.title}-${idx}`}
                        type="button"
                        onClick={() => selectStep(idx)}
                        className={`min-h-[40px] shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                          isActive
                            ? "border-primary bg-primary text-primary-foreground shadow-subtle"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        0{idx + 1} · {step.title}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Línea de tiempo interactiva con tarjetas modernas animadas */}
              <div
                role="group"
                aria-label="Pasos del ritual de atención"
                className="relative space-y-3 sm:space-y-3.5"
              >
                {/* Riel vertical sutil en pantallas sm+ */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-7 left-[27px] top-7 hidden w-px bg-border sm:block"
                />

                {normalizedSteps.map((step, idx) => {
                  const isActive = idx === safeIndex;
                  const StepIcon = STEP_ICONS[idx % STEP_ICONS.length];
                  const stepNum = String(idx + 1).padStart(2, "0");

                  return (
                    <motion.div
                      key={`${step.title}-${idx}`}
                      layout
                      transition={{
                        layout: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
                      }}
                      className="relative"
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        id={`${uid}-step-card-${idx}`}
                        aria-current={isActive ? "step" : undefined}
                        onClick={() => selectStep(idx)}
                        onKeyDown={(e) => handleStepKeyDown(e, idx)}
                        className={`group relative flex w-full cursor-pointer items-start gap-3.5 overflow-hidden rounded-editorial border p-4 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-4 sm:p-5 ${
                          isActive
                            ? "border-primary/50 bg-card shadow-editorial"
                            : "border-border bg-card/55 hover:border-primary/30 hover:bg-card/85"
                        }`}
                      >
                        {/* Indicador lateral animado con layoutId compartido */}
                        {isActive && (
                          <motion.span
                            layoutId={`${uid}-active-step-indicator`}
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 32,
                            }}
                            aria-hidden="true"
                            className="absolute bottom-0 left-0 top-0 w-1 bg-primary"
                          />
                        )}

                        {/* Medallón numérico e icono animado */}
                        <div
                          className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                            isActive
                              ? "scale-105 border-primary bg-primary text-primary-foreground shadow-subtle"
                              : "border-border bg-background text-muted-foreground group-hover:border-primary/40 group-hover:text-foreground"
                          }`}
                        >
                          <StepIcon className="h-4 w-4" />
                          <span
                            className={`absolute -bottom-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border px-1 font-sans text-[10px] font-semibold leading-none ${
                              isActive
                                ? "border-border bg-card text-foreground"
                                : "border-border bg-secondary text-muted-foreground"
                            }`}
                          >
                            {stepNum}
                          </span>
                        </div>

                        {/* Contenido editorial del paso */}
                        <div
                          id={`${uid}-step-panel-${idx}`}
                          className="min-w-0 flex-1 space-y-1.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-serif text-sm font-medium text-muted-foreground">
                                Paso {stepNum}
                              </span>
                              {step.badge && (
                                <span
                                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                                    isActive
                                      ? "border-border bg-accent text-accent-foreground"
                                      : "border-border/70 bg-background/70 text-muted-foreground"
                                  }`}
                                >
                                  {step.badge}
                                </span>
                              )}
                            </div>

                            <span
                              aria-hidden="true"
                              className={`inline-flex items-center gap-1 text-[11px] font-medium transition-all duration-300 ${
                                isActive
                                  ? "translate-x-0 text-foreground"
                                  : "-translate-x-1 text-muted-foreground opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                              }`}
                            >
                              <span>{isActive ? "Activo" : "Explorar"}</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                          </div>

                          <h3
                            className={`font-serif text-xl font-medium leading-snug transition-colors sm:text-2xl ${
                              isActive
                                ? "text-foreground"
                                : "text-foreground/85 group-hover:text-foreground"
                            }`}
                          >
                            {step.title}
                          </h3>

                          <p
                            className={`text-xs leading-relaxed transition-colors duration-300 sm:text-sm ${
                              isActive
                                ? "text-foreground/85"
                                : "line-clamp-2 text-muted-foreground sm:line-clamp-none"
                            }`}
                          >
                            {step.description}
                          </p>

                          {/* Barra de tiempo viva dentro de la tarjeta activa */}
                          {isActive && normalizedSteps.length > 1 && (
                            <div className="pt-2">
                              <div className="h-[2px] w-full overflow-hidden rounded-full bg-secondary">
                                <motion.div
                                  key={`card-progress-${safeIndex}-${cycleNonce}-${canAutoAdvance}`}
                                  initial={{
                                    scaleX: canAutoAdvance ? 0 : 1,
                                  }}
                                  animate={{ scaleX: 1 }}
                                  transition={{
                                    duration: canAutoAdvance
                                      ? stepDurationMs / 1000
                                      : 0.2,
                                    ease: "linear",
                                  }}
                                  style={{ transformOrigin: "left center" }}
                                  className="h-full w-full bg-primary"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pie de acción contextual de la sección */}
              <div className="flex flex-col items-stretch justify-between gap-3 pt-2 sm:flex-row sm:items-center">
                <p className="text-xs text-muted-foreground">
                  Selecciona cada paso para explorar cómo preparamos tu visita en ESPACIO Q.
                </p>
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                  <Link href={bookingHref}>
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{bookingLabel}</span>
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ExperienceSteps;
