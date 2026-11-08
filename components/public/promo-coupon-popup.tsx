"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Copy,
  Sparkles,
  TicketPercent,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BLACK_FRIDAY_PROMO } from "@/lib/domain/promo-coupon";

export function PromoCouponPopup({
  forceOpenForTest = false,
}: {
  forceOpenForTest?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState<boolean>(forceOpenForTest);
  const [copied, setCopied] = useState<boolean>(false);

  const dismissPopup = useCallback(() => {
    setOpen(false);
    try {
      window.sessionStorage.setItem(BLACK_FRIDAY_PROMO.storageDismissKey, "1");
    } catch {
      // Ignorar modo privado sin acceso a sessionStorage
    }
  }, []);

  useEffect(() => {
    if (!BLACK_FRIDAY_PROMO.enabled || forceOpenForTest) return;

    let alreadyDismissed = false;
    try {
      alreadyDismissed =
        window.sessionStorage.getItem(BLACK_FRIDAY_PROMO.storageDismissKey) ===
        "1";
      const params = new URLSearchParams(window.location.search);
      if (
        params.get("coupon")?.trim().toUpperCase() === BLACK_FRIDAY_PROMO.code
      ) {
        window.localStorage.setItem(
          BLACK_FRIDAY_PROMO.storageSavedCodeKey,
          BLACK_FRIDAY_PROMO.code
        );
        window.sessionStorage.setItem(
          BLACK_FRIDAY_PROMO.storageDismissKey,
          "1"
        );
        return;
      }
    } catch {
      // Continuar con temporizador estándar
    }

    if (alreadyDismissed) return;

    const timerId = window.setTimeout(() => {
      setOpen(true);
    }, BLACK_FRIDAY_PROMO.delayMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [forceOpenForTest]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismissPopup();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, dismissPopup]);

  const handleCopyCoupon = async () => {
    try {
      window.localStorage.setItem(
        BLACK_FRIDAY_PROMO.storageSavedCodeKey,
        BLACK_FRIDAY_PROMO.code
      );
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(BLACK_FRIDAY_PROMO.code);
      }
    } catch {
      // Fallback silencioso si el navegador restringe portapapeles
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2600);
  };

  const handleApplyAndBook = () => {
    try {
      window.localStorage.setItem(
        BLACK_FRIDAY_PROMO.storageSavedCodeKey,
        BLACK_FRIDAY_PROMO.code
      );
      window.sessionStorage.setItem(BLACK_FRIDAY_PROMO.storageDismissKey, "1");
    } catch {
      // Ignorar almacenamiento restringido
    }
    setOpen(false);
    const targetUrl = `/reservar?coupon=${encodeURIComponent(
      BLACK_FRIDAY_PROMO.code
    )}`;
    if (pathname === "/reservar") {
      window.dispatchEvent(
        new CustomEvent("espacioq:apply-coupon", {
          detail: { code: BLACK_FRIDAY_PROMO.code },
        })
      );
      router.replace(targetUrl);
    } else {
      router.push(targetUrl);
    }
  };

  if (!BLACK_FRIDAY_PROMO.enabled) return null;

  return (
    <AnimatePresence>
      {open && (
        <div
          data-slot="black-friday-promo-popup"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
        >
          {/* Velo de fondo con desenfoque editorial */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={dismissPopup}
            aria-hidden="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-[4px]"
          />

          {/* Tarjeta / Invitación Editorial Black Friday */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bf-promo-title"
            aria-describedby="bf-promo-desc"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{
              type: "spring",
              stiffness: 310,
              damping: 28,
              mass: 0.9,
            }}
            className="relative z-10 w-full max-w-[500px] max-h-[92dvh] overflow-y-auto overscroll-contain rounded-[24px] border border-border bg-card text-foreground shadow-editorial"
          >
            {/* Cabecera Noir Black Friday con brillo sutil */}
            <div className="relative overflow-hidden bg-primary px-5 pb-6 pt-6 text-primary-foreground sm:px-7 sm:pb-7 sm:pt-7">
              {/* Destello ambiental cálido Zen Linen */}
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0.25, scale: 0.9 }}
                animate={{ opacity: [0.22, 0.38, 0.22], scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-white/15 blur-2xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-5 bottom-0 h-px bg-white/15"
              />

              {/* Botón cerrar táctil (>= 44x44px en móvil) */}
              <button
                type="button"
                onClick={dismissPopup}
                aria-label="Cerrar invitación de descuento Black Friday"
                className="absolute right-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-primary-foreground transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background sm:right-4 sm:top-4 sm:h-10 sm:w-10"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative z-10 pr-10">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-foreground">
                  <Sparkles className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span>{BLACK_FRIDAY_PROMO.campaignBadge}</span>
                </span>

                <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12, duration: 0.4 }}
                    className="font-serif text-5xl font-normal leading-none tracking-tight text-primary-foreground sm:text-6xl"
                  >
                    −{BLACK_FRIDAY_PROMO.discountPercent}%
                  </motion.span>
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground opacity-85 sm:text-sm">
                    En todos los servicios
                  </span>
                </div>

                <h2
                  id="bf-promo-title"
                  className="mt-2.5 font-serif text-xl font-normal leading-snug text-primary-foreground sm:text-2xl"
                >
                  {BLACK_FRIDAY_PROMO.title}
                </h2>
              </div>
            </div>

            {/* Cuerpo Zen Linen con cupón troquelado */}
            <div className="space-y-4 p-4 sm:space-y-5 sm:p-7">
              <p
                id="bf-promo-desc"
                className="text-xs leading-relaxed text-muted-foreground sm:text-sm"
              >
                {BLACK_FRIDAY_PROMO.subtitle}
              </p>

              {/* Boleto / Cupón interactivo */}
              <div className="relative rounded-2xl border border-dashed border-border bg-background px-3.5 py-3 sm:px-5 sm:py-4">
                {/* Muescas laterales estilo invitación editorial */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-r border-border bg-card"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-l border-border bg-card"
                />

                <div className="flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      <TicketPercent className="h-3.5 w-3.5 shrink-0 text-foreground" aria-hidden="true" />
                      <span className="truncate">Cupón para tu reserva</span>
                    </p>
                    <p
                      data-slot="promo-coupon-code"
                      className="mt-1 font-serif text-xl font-semibold tracking-[0.14em] text-foreground min-[360px]:text-2xl sm:text-[1.7rem] sm:tracking-[0.18em]"
                    >
                      {BLACK_FRIDAY_PROMO.code}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant={copied ? "default" : "outline"}
                    size="sm"
                    onClick={handleCopyCoupon}
                    className="min-h-[42px] shrink-0 gap-1.5 px-3.5"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar cupón</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {BLACK_FRIDAY_PROMO.conditionsText}
              </p>

              {/* Botones de acción */}
              <div className="flex flex-col gap-2.5 pt-1">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleApplyAndBook}
                  className="w-full justify-center gap-2"
                >
                  <span>Aplicar 25 % y reservar cita</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <button
                  type="button"
                  onClick={dismissPopup}
                  className="min-h-[40px] w-full rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  Seguir viendo la web y aplicar el código al reservar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
