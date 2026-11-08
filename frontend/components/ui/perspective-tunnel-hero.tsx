"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowDown, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  SalonHeroContent,
  SalonHeroPhoto,
} from "@/lib/domain/cms-defaults";

type ComputedTunnelCard = {
  photo: SalonHeroPhoto;
  index: number;
  xOffset: number;
  yOffset: number;
  baseZ: number;
  travelZ: number;
  rotationDeg: number;
  initialOpacity: number;
};

function TunnelPhotoCard({
  card,
  scrollYProgress,
  isPriority,
  isShortLandscape,
}: {
  card: ComputedTunnelCard;
  scrollYProgress: MotionValue<number>;
  isPriority: boolean;
  isShortLandscape: boolean;
}) {
  const z = useTransform(
    scrollYProgress,
    [0, 1],
    [card.baseZ, card.baseZ + card.travelZ]
  );

  // Escalado de opacidad: visible desde el primer render (0) y se atenúa suavemente al acercarse al plano de cámara
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.78, 0.96, 1],
    [card.initialOpacity, 0.96, 0.92, 0.35, 0.08]
  );

  const rotateZ = useTransform(
    scrollYProgress,
    [0, 1],
    [card.rotationDeg, card.rotationDeg * 0.45]
  );

  return (
    <motion.div
      aria-hidden="true"
      style={{
        x: card.xOffset,
        y: card.yOffset,
        z,
        opacity,
        rotateZ,
        transformStyle: "preserve-3d",
      }}
      className={
        isShortLandscape
          ? "pointer-events-none absolute left-1/2 top-1/2 -ml-[64px] -mt-[80px] h-[160px] w-[128px] select-none overflow-hidden rounded-editorial border border-border/80 bg-card shadow-editorial"
          : "pointer-events-none absolute left-1/2 top-1/2 -ml-[76px] -mt-[95px] h-[190px] w-[152px] min-[390px]:-ml-[88px] min-[390px]:-mt-[110px] min-[390px]:h-[220px] min-[390px]:w-[176px] select-none overflow-hidden rounded-editorial border border-border/80 bg-card shadow-editorial sm:-ml-[108px] sm:-mt-[135px] sm:h-[270px] sm:w-[216px] lg:-ml-[124px] lg:-mt-[155px] lg:h-[310px] lg:w-[248px]"
      }
    >
      <div className="relative h-full w-full overflow-hidden bg-secondary">
        <Image
          src={card.photo.src}
          alt=""
          fill
          priority={isPriority}
          sizes="(max-width: 640px) 176px, (max-width: 1024px) 216px, 248px"
          style={{
            objectFit: "cover",
            objectPosition: `${card.photo.focalPoint?.x ?? 50}% ${
              card.photo.focalPoint?.y ?? 50
            }%`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent" />
      </div>
    </motion.div>
  );
}

export function PerspectiveTunnelHero({
  content,
  nextSectionId = "intro-salon",
}: {
  content: SalonHeroContent;
  nextSectionId?: string;
}) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 1280,
    height: 800,
  });
  const [isVisibleInViewport, setIsVisibleInViewport] = useState(true);
  const [hasFinePointer, setHasFinePointer] = useState(false);

  // Medir el contenedor con ResizeObserver sin depender únicamente de window.innerWidth
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Detectar puntero preciso y visibilidad para suspender animaciones fuera de vista
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: fine)");
    setHasFinePointer(mq.matches);
    const onMqChange = (e: MediaQueryListEvent) => setHasFinePointer(e.matches);
    mq.addEventListener?.("change", onMqChange);

    const onVisibility = () => {
      setIsVisibleInViewport(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", onVisibility);

    let io: IntersectionObserver | null = null;
    if (scrollContainerRef.current && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        ([entry]) => {
          setIsVisibleInViewport(entry.isIntersecting);
        },
        { threshold: 0.01 }
      );
      io.observe(scrollContainerRef.current);
    }

    return () => {
      mq.removeEventListener?.("change", onMqChange);
      document.removeEventListener("visibilitychange", onVisibility);
      io?.disconnect();
    };
  }, []);

  const isMobile = containerSize.width < 768;
  const isShortLandscape =
    containerSize.height < 540 && containerSize.width > containerSize.height;
  const shouldUseStaticFallback =
    Boolean(prefersReducedMotion) ||
    !content.animationEnabled ||
    !content.photos ||
    content.photos.length === 0;

  // En móvil o pantallas horizontales bajas simplificamos a un máximo de 4 tarjetas; en escritorio hasta 9 configurables
  const activePhotos = useMemo(() => {
    const sorted = [...(content.photos || [])].sort(
      (a, b) => a.order - b.order
    );
    return isMobile || isShortLandscape ? sorted.slice(0, 4) : sorted.slice(0, 9);
  }, [content.photos, isMobile, isShortLandscape]);

  // Distribución radial áurea (~137.5°) con zona de exclusión central para no tapar nunca el H1 ni el CTA
  const computedCards = useMemo<ComputedTunnelCard[]>(() => {
    const count = activePhotos.length;
    if (count === 0) return [];

    const goldenAngleRad = (137.5 * Math.PI) / 180;
    const minRadiusX = isMobile
      ? Math.max(95, containerSize.width * 0.28)
      : Math.max(220, Math.min(410, containerSize.width * 0.27));
    const maxRadiusX = isMobile
      ? Math.max(125, containerSize.width * 0.36)
      : Math.max(290, Math.min(540, containerSize.width * 0.38));

    const minRadiusY = isShortLandscape
      ? Math.max(85, containerSize.height * 0.22)
      : isMobile
        ? Math.max(135, containerSize.height * 0.23)
        : Math.max(165, Math.min(275, containerSize.height * 0.27));
    const maxRadiusY = isShortLandscape
      ? Math.max(115, containerSize.height * 0.3)
      : isMobile
        ? Math.max(175, containerSize.height * 0.3)
        : Math.max(220, Math.min(340, containerSize.height * 0.35));

    const minZ = isMobile ? -950 : -1680;
    const maxZ = isMobile ? -120 : -160;
    const travelZ = isMobile ? 980 : 1850;
    const rotations = [-9, 6, -5, 8, -7, 4, -10, 7, -4];

    return activePhotos.map((photo, idx) => {
      const angle = idx * goldenAngleRad + 0.35;
      const radiusFactor = idx % 2 === 0 ? 0.84 : 1;
      const rx =
        minRadiusX + (maxRadiusX - minRadiusX) * radiusFactor;
      const ry =
        minRadiusY + (maxRadiusY - minRadiusY) * radiusFactor;

      const xOffset = Math.round(Math.cos(angle) * rx);
      const yOffset = Math.round(Math.sin(angle) * ry);

      const depthStep = count > 1 ? idx / (count - 1) : 0;
      const baseZ = Math.round(maxZ - depthStep * Math.abs(minZ - maxZ));
      const initialOpacity = Number((0.92 - depthStep * 0.34).toFixed(2));

      return {
        photo,
        index: idx,
        xOffset,
        yOffset,
        baseZ,
        travelZ,
        rotationDeg: rotations[idx % rotations.length],
        initialOpacity,
      };
    });
  }, [activePhotos, containerSize.height, containerSize.width, isMobile, isShortLandscape]);

  const { scrollYProgress } = useScroll({
    target: scrollContainerRef,
    offset: ["start start", "end end"],
  });

  // Parallax suave de puntero sin provocar re-render de React
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothRotateY = useSpring(pointerX, { stiffness: 90, damping: 24 });
  const smoothRotateX = useSpring(pointerY, { stiffness: 90, damping: 24 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      shouldUseStaticFallback ||
      !hasFinePointer ||
      isMobile ||
      !isVisibleInViewport
    ) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;
    pointerX.set(normX * 5.5);
    pointerY.set(-normY * 4.5);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  // Modo accesible / estático (prefers-reduced-motion o animación desactivada en CMS)
  if (shouldUseStaticFallback) {
    return (
      <section
        aria-label="Presentación principal de ESPACIO Q"
        className="relative overflow-hidden border-b border-border bg-background py-16 sm:py-24"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            {content.eyebrow && (
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {content.eyebrow}
              </p>
            )}
            <h1
              style={{ fontSize: "clamp(2.35rem, 5vw, 4.25rem)" }}
              className="font-serif font-normal leading-[1.08] tracking-tight text-foreground"
            >
              {content.title}
            </h1>
            {content.description && (
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {content.description}
              </p>
            )}
            <div className="mt-7 flex w-full flex-col items-stretch justify-center gap-3 min-[420px]:w-auto min-[420px]:flex-row min-[420px]:items-center sm:mt-8 sm:gap-3.5">
              <Button asChild size="lg" className="w-full min-[420px]:w-auto">
                <Link href={content.primaryCta.href}>
                  <Calendar className="h-4 w-4" />
                  {content.primaryCta.label}
                </Link>
              </Button>
              {content.secondaryCta && (
                <Button asChild variant="outline" size="lg" className="w-full min-[420px]:w-auto">
                  <Link href={content.secondaryCta.href}>
                    {content.secondaryCta.label}
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {activePhotos.length > 0 && (
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {activePhotos.slice(0, 4).map((photo, idx) => (
                <div
                  key={photo.id}
                  className="relative aspect-[4/5] overflow-hidden rounded-editorial border border-border bg-card shadow-subtle"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    priority={idx === 0}
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 260px"
                    style={{
                      objectFit: "cover",
                      objectPosition: `${photo.focalPoint?.x ?? 50}% ${
                        photo.focalPoint?.y ?? 50
                      }%`,
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <a
              href={`#${nextSectionId}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>{content.discoverLabel || "Descubrir el salón"}</span>
              <ArrowDown className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>
    );
  }

  const perspectivePx = isMobile ? 900 : 1200;

  return (
    <section
      ref={scrollContainerRef}
      aria-label="Presentación principal de ESPACIO Q"
      className="relative h-[155svh] sm:h-[180svh] border-b border-border bg-background"
    >
      <div
        ref={stageRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="sticky top-0 flex h-[100svh] min-h-[460px] w-full flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-6 sm:pb-12"
        style={{
          perspective: `${perspectivePx}px`,
        }}
      >
        {/* Textura editorial sutil Zen Linen */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,239,228,0.85)_0%,rgba(233,228,216,0.96)_62%,rgba(216,210,196,0.45)_100%)]"
        />

        {/* Escena 3D de tarjetas en eje Z */}
        <motion.div
          aria-hidden="true"
          style={{
            rotateX: smoothRotateX,
            rotateY: smoothRotateY,
            transformStyle: "preserve-3d",
          }}
          className="pointer-events-none absolute inset-0 z-10"
        >
          {computedCards.map((card, idx) => (
            <TunnelPhotoCard
              key={card.photo.id}
              card={card}
              scrollYProgress={scrollYProgress}
              isPriority={idx === 0}
              isShortLandscape={isShortLandscape}
            />
          ))}
        </motion.div>

        {/* Halo suave de protección de legibilidad central */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-20 h-[300px] w-[94%] max-w-[660px] rounded-full bg-background/85 blur-2xl sm:h-[420px]"
        />

        {/* Contenido semántico central siempre legible, visible y clicable desde el primer render */}
        <div className="relative z-30 mx-auto flex w-full max-w-2xl flex-col items-center px-2 text-center sm:px-5">
          {content.eyebrow && (
            <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground shadow-subtle sm:mb-4 sm:px-3.5 sm:text-[11px] sm:tracking-[0.22em]">
              <Sparkles className="h-3 w-3 shrink-0 text-foreground/70" />
              <span className="truncate">{content.eyebrow}</span>
            </div>
          )}

          <h1
            style={{
              fontSize: isShortLandscape
                ? "clamp(1.75rem, 4.2vw, 2.5rem)"
                : "clamp(2.05rem, 5.2vw, 4.5rem)",
            }}
            className="font-serif font-normal leading-[1.08] tracking-tight text-foreground"
          >
            {content.title}
          </h1>

          {content.description && (
            <p
              className={`mt-3 max-w-xl leading-relaxed text-muted-foreground sm:mt-5 ${
                isShortLandscape
                  ? "line-clamp-2 text-xs sm:text-sm"
                  : "text-sm sm:text-lg"
              }`}
            >
              {content.description}
            </p>
          )}

          <div className="mt-5 flex w-full flex-col items-stretch justify-center gap-2.5 min-[420px]:w-auto min-[420px]:flex-row min-[420px]:items-center sm:mt-8 sm:gap-3.5">
            <Button asChild size="lg" className="w-full min-[420px]:w-auto">
              <Link href={content.primaryCta.href}>
                <Calendar className="h-4 w-4" />
                {content.primaryCta.label}
              </Link>
            </Button>
            {content.secondaryCta && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full min-[420px]:w-auto"
              >
                <Link href={content.secondaryCta.href}>
                  {content.secondaryCta.label}
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Salida accesible por teclado y clic hacia la siguiente sección */}
        <div className="absolute bottom-[max(0.85rem,env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-1/2 sm:bottom-6">
          <a
            href={`#${nextSectionId}`}
            className="inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-full border border-border bg-card/95 px-4 py-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground shadow-subtle transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:text-xs"
          >
            <span>{content.discoverLabel || "Descubrir el salón"}</span>
            <ArrowDown className="h-3.5 w-3.5 shrink-0" />
          </a>
        </div>
      </div>
    </section>
  );
}
