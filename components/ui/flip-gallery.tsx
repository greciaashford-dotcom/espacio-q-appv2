"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type FlipGalleryImage = {
  title: string;
  url: string;
  alt?: string;
};

export const DEFAULT_SALON_FLIP_IMAGES: FlipGalleryImage[] = [
  {
    title: "Interior sereno en tonos lino y piedra clara",
    url: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Ambiente luminoso del salón con luz natural",
    url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Estilismo y cuidado capilar personalizado",
    url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Herramientas de oficio y cosmética consciente",
    url: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Movimiento natural y acabado luminoso",
    url: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Detalles de calma y bienestar en ESPACIO Q",
    url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80",
  },
];

const FLIP_SPEED = 750;
export const DEFAULT_FLIP_AUTOPLAY_MS = 3000;
const flipTiming: KeyframeAnimationOptions = {
  duration: FLIP_SPEED,
  iterations: 1,
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
};

// Flip hacia abajo (siguiente)
const flipAnimationTop: Keyframe[] = [
  { transform: "rotateX(0deg)" },
  { transform: "rotateX(-90deg)" },
  { transform: "rotateX(-90deg)" },
];
const flipAnimationBottom: Keyframe[] = [
  { transform: "rotateX(90deg)" },
  { transform: "rotateX(90deg)" },
  { transform: "rotateX(0deg)" },
];

// Flip hacia arriba (anterior)
const flipAnimationTopReverse: Keyframe[] = [
  { transform: "rotateX(-90deg)" },
  { transform: "rotateX(-90deg)" },
  { transform: "rotateX(0deg)" },
];
const flipAnimationBottomReverse: Keyframe[] = [
  { transform: "rotateX(0deg)" },
  { transform: "rotateX(90deg)" },
  { transform: "rotateX(90deg)" },
];

function toSafeCssUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "none";
  const escaped = trimmed
    .replace(/\\/g, "%5C")
    .replace(/'/g, "%27")
    .replace(/\)/g, "%29")
    .replace(/[\r\n]/g, "");
  return `url('${escaped}')`;
}

export interface FlipGalleryProps {
  images?: FlipGalleryImage[];
  className?: string;
  autoPlay?: boolean;
  autoPlayIntervalMs?: number;
}

export function FlipGallery({
  images,
  className = "",
  autoPlay = true,
  autoPlayIntervalMs = DEFAULT_FLIP_AUTOPLAY_MS,
}: FlipGalleryProps) {
  const instanceId = useId().replace(/:/g, "");
  const stageSelectorId = `flip-gallery-${instanceId}`;
  const cardSelectorId = `flip-card-${instanceId}`;

  const activeImages = useMemo<FlipGalleryImage[]>(() => {
    const valid = (images ?? []).filter(
      (item) => item && typeof item.url === "string" && item.url.trim().length > 0
    );
    return valid.length > 0 ? valid : DEFAULT_SALON_FLIP_IMAGES;
  }, [images]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const uniteLayersRef = useRef<HTMLDivElement[]>([]);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const isAnimatingRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedTitle, setDisplayedTitle] = useState(
    activeImages[0]?.title ?? ""
  );
  const [titleVisible, setTitleVisible] = useState(true);
  const [isTouching, setIsTouching] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }, []);

  const applyLayerImage = useCallback(
    (el: HTMLDivElement | null | undefined, index: number) => {
      if (!el) return;
      const target = activeImages[index] ?? activeImages[0];
      if (!target) return;
      el.style.backgroundImage = toSafeCssUrl(target.url);
    },
    [activeImages]
  );

  // Sincronizar capas cuando cambia la lista de imágenes desde el CMS / dashboard
  useEffect(() => {
    clearTimers();
    isAnimatingRef.current = false;
    const safeIdx = currentIndex < activeImages.length ? currentIndex : 0;
    if (safeIdx !== currentIndex) {
      setCurrentIndex(safeIdx);
    }
    if (containerRef.current) {
      uniteLayersRef.current = Array.from(
        containerRef.current.querySelectorAll<HTMLDivElement>(".unite-layer")
      );
      uniteLayersRef.current.forEach((el) => applyLayerImage(el, safeIdx));
    }
    setDisplayedTitle(activeImages[safeIdx]?.title ?? "");
    setTitleVisible(true);

    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeImages]);

  // Precargar imágenes del carrusel para transiciones automáticas sin parpadeo
  useEffect(() => {
    if (typeof window === "undefined") return;
    for (const item of activeImages) {
      if (item?.url) {
        const preloader = new window.Image();
        preloader.src = item.url;
      }
    }
  }, [activeImages]);

  // Pausar temporizador cuando la pestaña está oculta y reanudar al volver
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === "visible");
    };
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const updateGallery = useCallback(
    (nextIndex: number, isReverse = false) => {
      const gallery = containerRef.current;
      if (!gallery) return;

      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      const overlayTop = gallery.querySelector<HTMLElement>(".overlay-top");
      const overlayBottom =
        gallery.querySelector<HTMLElement>(".overlay-bottom");

      if (prefersReduced || !overlayTop?.animate || !overlayBottom?.animate) {
        uniteLayersRef.current.forEach((el) => applyLayerImage(el, nextIndex));
        setDisplayedTitle(activeImages[nextIndex]?.title ?? "");
        setTitleVisible(true);
        return;
      }

      clearTimers();
      isAnimatingRef.current = true;

      const topAnim = isReverse ? flipAnimationTopReverse : flipAnimationTop;
      const bottomAnim = isReverse
        ? flipAnimationBottomReverse
        : flipAnimationBottom;

      overlayTop.animate(topAnim, flipTiming);
      overlayBottom.animate(bottomAnim, flipTiming);

      setTitleVisible(false);

      uniteLayersRef.current.forEach((el, idx) => {
        const delay =
          (isReverse && idx !== 1 && idx !== 2) ||
          (!isReverse && (idx === 1 || idx === 2))
            ? FLIP_SPEED - 200
            : 0;

        if (delay === 0) {
          applyLayerImage(el, nextIndex);
        } else {
          const timer = setTimeout(() => applyLayerImage(el, nextIndex), delay);
          timersRef.current.push(timer);
        }
      });

      const titleTimer = setTimeout(() => {
        setDisplayedTitle(activeImages[nextIndex]?.title ?? "");
        setTitleVisible(true);
      }, FLIP_SPEED * 0.5);

      const unlockTimer = setTimeout(() => {
        isAnimatingRef.current = false;
      }, FLIP_SPEED);

      timersRef.current.push(titleTimer, unlockTimer);
    },
    [activeImages, applyLayerImage, clearTimers]
  );

  const updateIndex = useCallback(
    (increment: number) => {
      if (activeImages.length <= 1 || isAnimatingRef.current) return;
      const inc = Number(increment);
      const newIndex =
        (currentIndex + inc + activeImages.length) % activeImages.length;
      const isReverse = inc < 0;
      setCurrentIndex(newIndex);
      updateGallery(newIndex, isReverse);
    },
    [activeImages.length, currentIndex, updateGallery]
  );

  const goToIndex = useCallback(
    (targetIndex: number) => {
      if (
        activeImages.length <= 1 ||
        isAnimatingRef.current ||
        targetIndex === currentIndex ||
        targetIndex < 0 ||
        targetIndex >= activeImages.length
      ) {
        return;
      }
      const isReverse = targetIndex < currentIndex;
      setCurrentIndex(targetIndex);
      updateGallery(targetIndex, isReverse);
    },
    [activeImages.length, currentIndex, updateGallery]
  );

  // Cambio automático cada 3 segundos (3000 ms por defecto), reiniciándose tras interacción manual
  useEffect(() => {
    if (
      !autoPlay ||
      activeImages.length <= 1 ||
      autoPlayIntervalMs <= 0 ||
      isTouching ||
      !isTabVisible
    ) {
      return;
    }

    const autoTimer = window.setTimeout(() => {
      updateIndex(1);
    }, autoPlayIntervalMs);

    return () => window.clearTimeout(autoTimer);
  }, [
    autoPlay,
    autoPlayIntervalMs,
    activeImages.length,
    currentIndex,
    isTouching,
    isTabVisible,
    updateIndex,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      updateIndex(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      updateIndex(1);
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
      updateIndex(deltaX < 0 ? 1 : -1);
    }
  };

  const handleTouchCancel = () => {
    setIsTouching(false);
    touchStartRef.current = null;
  };

  const initialBg = toSafeCssUrl(activeImages[0]?.url ?? "");
  const currentItem = activeImages[currentIndex] ?? activeImages[0];

  return (
    <div
      className={`w-full flex flex-col items-center justify-center font-sans ${className}`}
    >
      <div
        id={cardSelectorId}
        tabIndex={0}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Galería interactiva del salón ESPACIO Q"
        data-autoplay={autoPlay ? "true" : "false"}
        data-autoplay-interval={String(autoPlayIntervalMs)}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        className="w-full max-w-[280px] min-[360px]:max-w-[330px] sm:max-w-[390px] md:max-w-[430px] lg:max-w-[460px] xl:max-w-[500px] touch-pan-y rounded-editorial border border-border bg-card p-2.5 min-[360px]:p-3 sm:p-4 shadow-editorial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Escenario 3D Flip Gallery responsivo en todo tamaño y orientación */}
        <div
          id={stageSelectorId}
          ref={containerRef}
          data-title={currentItem?.title ?? ""}
          className="flip-stage relative w-full aspect-[4/5] overflow-hidden rounded-lg bg-secondary text-center select-none"
          style={{ perspective: "clamp(680px, 85vw, 1100px)" }}
        >
          <span className="sr-only">
            {currentItem?.alt || currentItem?.title || "Imagen del salón ESPACIO Q"}
          </span>

          <div className="top unite">
            <div
              className="unite-layer unite-layer-top"
              style={{ backgroundImage: initialBg }}
            />
          </div>
          <div className="bottom unite">
            <div
              className="unite-layer unite-layer-bottom"
              style={{ backgroundImage: initialBg }}
            />
          </div>
          <div className="overlay-top unite">
            <div
              className="unite-layer unite-layer-top"
              style={{ backgroundImage: initialBg }}
            />
          </div>
          <div className="overlay-bottom unite">
            <div
              className="unite-layer unite-layer-bottom"
              style={{ backgroundImage: initialBg }}
            />
          </div>
        </div>

        {/* Barra inferior responsiva: título animado, contador, indicadores táctiles y navegación >= 44px */}
        <div className="mt-3 flex items-center justify-between gap-2.5 px-0.5 sm:mt-3.5 sm:gap-3 sm:px-1">
          <div className="min-w-0 flex-1">
            <p
              aria-live={autoPlay ? "off" : "polite"}
              className="line-clamp-2 text-xs font-medium leading-snug text-foreground transition-all duration-500 ease-in-out sm:truncate sm:text-sm"
              style={{
                opacity: titleVisible ? 1 : 0,
                transform: titleVisible ? "translateY(0)" : "translateY(-0.4rem)",
              }}
            >
              {displayedTitle}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {String(currentIndex + 1).padStart(2, "0")} /{" "}
                {String(activeImages.length).padStart(2, "0")}
              </p>
              {activeImages.length > 1 && activeImages.length <= 10 && (
                <div
                  className="flex items-center gap-1"
                  role="group"
                  aria-label="Indicadores de imagen"
                >
                  {activeImages.map((img, idx) => {
                    const active = idx === currentIndex;
                    return (
                      <button
                        key={`${img.url}-${idx}`}
                        type="button"
                        onClick={() => goToIndex(idx)}
                        aria-label={`Ir a imagen ${idx + 1}`}
                        aria-current={active ? "true" : undefined}
                        className="group inline-flex h-6 items-center justify-center px-0.5 focus-visible:outline-none"
                      >
                        <span
                          className={`block h-1.5 rounded-full transition-all ${
                            active
                              ? "w-4 bg-primary"
                              : "w-1.5 bg-border group-hover:bg-muted-foreground"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {activeImages.length > 1 && (
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => updateIndex(-1)}
                title="Imagen anterior"
                aria-label="Imagen anterior"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition hover:bg-accent hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10 sm:w-10"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => updateIndex(1)}
                title="Siguiente imagen"
                aria-label="Siguiente imagen"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-primary text-primary-foreground transition hover:opacity-90 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10 sm:w-10"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Estilos encapsulados por instancia para las mitades 3D sin distorsión en cualquier pantalla u orientación */}
      <style>{`
        @media (max-height: 540px) and (orientation: landscape) {
          #${cardSelectorId} {
            max-width: min(340px, 56svh);
          }
        }

        #${stageSelectorId}::after {
          content: '';
          position: absolute;
          background-color: rgba(30, 30, 30, 0.28);
          width: 100%;
          height: 2px;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          z-index: 10;
          pointer-events: none;
        }

        #${stageSelectorId} > .unite {
          position: absolute;
          left: 0;
          width: 100%;
          height: 50%;
          overflow: hidden;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        #${stageSelectorId} > .top,
        #${stageSelectorId} > .overlay-top {
          top: 0;
          transform-origin: bottom center;
        }

        #${stageSelectorId} > .bottom,
        #${stageSelectorId} > .overlay-bottom {
          bottom: 0;
          transform-origin: top center;
        }

        #${stageSelectorId} .unite-layer {
          position: absolute;
          left: 0;
          width: 100%;
          height: 200%;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        #${stageSelectorId} .unite-layer-top {
          top: 0;
        }

        #${stageSelectorId} .unite-layer-bottom {
          bottom: 0;
        }
      `}</style>
    </div>
  );
}

export default FlipGallery;
