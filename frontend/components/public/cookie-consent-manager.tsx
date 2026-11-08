"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONSENT_EVENT, readConsent, writeConsent } from "@/lib/consent/cookie-consent";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type CookieBannerContent = {
  title: string;
  shortDescription?: string;
  description: string;
  acceptAllLabel: string;
  rejectAllLabel: string;
  configureLabel: string;
  savePreferencesLabel: string;
  necessaryTitle: string;
  necessaryDescription: string;
  analyticsTitle: string;
  analyticsDescription: string;
  marketingTitle: string;
  marketingDescription: string;
  mapsTitle?: string;
  mapsDescription?: string;
};

export { COOKIE_CONSENT_KEY } from "@/lib/consent/cookie-consent";
export type { StoredCookieConsent } from "@/lib/consent/cookie-consent";

export function CookieConsentManager({
  content,
  externalOpen,
  onExternalOpenChange,
  forceBannerForTest = false,
}: {
  content: CookieBannerContent;
  hasOptionalCookiesEnabled?: boolean;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  forceBannerForTest?: boolean;
}) {
  const [showFirstLayerBanner, setShowFirstLayerBanner] =
    useState<boolean>(forceBannerForTest);
  const [modalOpen, setModalOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [maps, setMaps] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || forceBannerForTest) return;
    const sync = () => {
      const parsed = readConsent();
      setAnalytics(Boolean(parsed?.analytics));
      setMarketing(Boolean(parsed?.marketing));
      setMaps(Boolean(parsed?.maps));
      // Mostrar siempre al entrar en la web cuando el visitante aún no ha elegido sus preferencias (RGPD / LSSI-CE / Guía AEPD)
      setShowFirstLayerBanner(!parsed || Boolean(parsed.partial));
    };
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, [forceBannerForTest]);

  useEffect(() => {
    if (externalOpen !== undefined) {
      setModalOpen(externalOpen);
    }
  }, [externalOpen]);

  const handleModalChange = (next: boolean) => {
    setModalOpen(next);
    onExternalOpenChange?.(next);
  };

  const persistConsent = (nextAnalytics: boolean, nextMarketing: boolean, nextMaps: boolean) => {
    writeConsent({ analytics: nextAnalytics, marketing: nextMarketing, maps: nextMaps });
    setAnalytics(nextAnalytics);
    setMarketing(nextMarketing);
    setMaps(nextMaps);
    setShowFirstLayerBanner(false);
    handleModalChange(false);
  };

  const firstLayerText =
    content.shortDescription?.trim() ||
    "Usamos cookies técnicas necesarias y, solo con tu permiso expreso, analíticas y de terceros para mejorar tu experiencia.";

  return (
    <>
      <AnimatePresence>
        {showFirstLayerBanner && !modalOpen && (
          <motion.aside
            data-slot="compact-eu-cookie-banner"
            role="region"
            aria-label="Aviso de privacidad y cookies (Normativa Europea RGPD)"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="fixed bottom-[max(0.65rem,env(safe-area-inset-bottom))] left-2.5 right-2.5 z-[45] mx-auto max-w-[360px] rounded-2xl border border-border bg-card p-3.5 shadow-editorial sm:bottom-4 sm:left-4 sm:right-auto sm:mx-0 sm:w-[360px]"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Cookie
                    className="h-3.5 w-3.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>{content.title || "Privacidad y cookies"}</span>
                </div>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-secondary-foreground">
                  RGPD UE
                </span>
              </div>

              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {firstLayerText}{" "}
                <Link
                  href="/cookies"
                  className="font-medium text-foreground underline underline-offset-2 hover:opacity-80"
                >
                  Política de Cookies
                </Link>
                .
              </p>

              {/* Primera capa conforme a Guía AEPD / Comité Europeo: Rechazar y Aceptar al mismo nivel e idéntica prominencia visual */}
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleModalChange(true)}
                  className="h-8 gap-1 px-2 text-[11px] font-medium"
                >
                  <SlidersHorizontal
                    className="h-3 w-3 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate">Configurar</span>
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  data-testid="cookie-banner-reject" onClick={() => persistConsent(false, false, false)}
                  className="h-8 px-2 text-[11px] font-semibold"
                >
                  <span className="truncate">Rechazar</span>
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  data-testid="cookie-banner-accept" onClick={() => persistConsent(true, true, true)}
                  className="h-8 px-2 text-[11px] font-semibold"
                >
                  <span className="truncate">Aceptar</span>
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <Dialog open={modalOpen} onOpenChange={handleModalChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              <span>{content.title || "Preferencias de cookies"}</span>
            </DialogTitle>
            <DialogDescription>
              {content.description}{" "}
              <Link
                href="/cookies"
                onClick={() => handleModalChange(false)}
                className="font-medium text-foreground underline underline-offset-2"
              >
                Ver Política de Cookies completa
              </Link>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="rounded-lg border border-border bg-card p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {content.necessaryTitle}
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                  Siempre activas
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {content.necessaryDescription}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-3.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="cookie-opt-analytics"
                  className="cursor-pointer text-sm font-semibold text-foreground"
                >
                  {content.analyticsTitle}
                </label>
                <input
                  id="cookie-opt-analytics"
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-ring"
                />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {content.analyticsDescription}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-3.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="cookie-opt-marketing"
                  className="cursor-pointer text-sm font-semibold text-foreground"
                >
                  {content.marketingTitle}
                </label>
                <input
                  id="cookie-opt-marketing"
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-ring"
                />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {content.marketingDescription}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-3.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="cookie-opt-maps"
                  className="cursor-pointer text-sm font-semibold text-foreground"
                >
                  {content.mapsTitle || "Mapas de terceros (Google Maps)"}
                </label>
                <input
                  id="cookie-opt-maps"
                  type="checkbox"
                  data-testid="cookie-opt-maps"
                  checked={maps}
                  onChange={(e) => setMaps(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-ring"
                />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {content.mapsDescription ||
                  "Permiten mostrar el mapa interactivo de Google Maps en la página de Contacto. Sin esta opción verás un mapa de OpenStreetMap sin cookies."}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                data-testid="cookie-modal-reject-all" onClick={() => persistConsent(false, false, false)}
              >
                {content.rejectAllLabel || "Rechazar opcionales"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                data-testid="cookie-modal-accept-all" onClick={() => persistConsent(true, true, true)}
              >
                {content.acceptAllLabel || "Aceptar todas"}
              </Button>
            </div>
            <Button
              type="button"
              size="sm"
              className="w-full sm:w-auto"
              data-testid="cookie-modal-save" onClick={() => persistConsent(analytics, marketing, maps)}
            >
              {content.savePreferencesLabel || "Guardar preferencias"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
