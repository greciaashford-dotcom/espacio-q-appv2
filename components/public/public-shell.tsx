"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Clock,
  Cookie,
  ExternalLink,
  Lock,
  Mail,
  MapPin,
  Menu,
  Phone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NewsletterDialog,
  NewsletterInlineForm,
  type NewsletterConfigData,
} from "@/components/ui/newsletter-dialog";
import {
  CookieConsentManager,
  type CookieBannerContent,
} from "@/components/public/cookie-consent-manager";
import { PromoCouponPopup } from "@/components/public/promo-coupon-popup";
import { cn } from "@/lib/utils";

export type HeaderFooterCmsData = {
  brandName: string;
  brandSubtitle?: string;
  ctaLabel: string;
  ctaHref: string;
  newsletterTriggerLabel?: string;
  navItems: Array<{ label: string; href: string; visible: boolean }>;
  footerTagline: string;
  footerCopyright: string;
  legalLinks: Array<{ label: string; href: string; visible: boolean }>;
};

export type PublicSalonMeta = {
  brandName: string;
  tagline: string;
  city: string;
  addressLine: string | null;
  postalCode: string | null;
  phone: string | null;
  whatsapp: string | null;
  contactEmail: string | null;
  googleMapsUrl: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  scheduleConfirmed: boolean;
  activeScheduleSource: string;
  hasOptionalCookiesEnabled: boolean;
  weeklySummary: Array<{
    dayName: string;
    isOpen: boolean;
    hoursText: string;
  }>;
};

export function PublicShell({
  children,
  headerFooter,
  newsletterConfig,
  cookieBanner,
  salonMeta,
}: {
  children: React.ReactNode;
  headerFooter: HeaderFooterCmsData;
  newsletterConfig: NewsletterConfigData;
  cookieBanner: CookieBannerContent;
  salonMeta: PublicSalonMeta;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [cookieDialogOpen, setCookieDialogOpen] = useState(false);

  const visibleNavItems = (headerFooter.navItems || []).filter(
    (item) => item.visible
  );
  const visibleLegalLinks = (headerFooter.legalLinks || []).filter(
    (item) => item.visible
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      {/* Enlace accesible para saltar directamente al contenido */}
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-editorial"
      >
        Saltar al contenido principal
      </a>

      {/* Cabecera Sticky */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between gap-3 sm:h-20 sm:gap-4">
          <Link
            href="/"
            className="group flex min-w-0 flex-col rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="truncate font-serif text-xl font-medium tracking-[0.12em] text-foreground sm:text-2xl sm:tracking-[0.14em]">
              {headerFooter.brandName || salonMeta.brandName || "ESPACIO Q"}
            </span>
            <span className="truncate text-[9px] font-medium uppercase tracking-[0.24em] text-muted-foreground sm:text-[10px] sm:tracking-[0.28em]">
              {headerFooter.brandSubtitle || salonMeta.city || "MADRID"}
            </span>
          </Link>

          {/* Navegación Escritorio (lg+) */}
          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-6 lg:flex xl:gap-7"
          >
            {visibleNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative py-1 text-sm font-medium transition-colors hover:text-foreground",
                    isActive
                      ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Acciones Escritorio (lg+) */}
          <div className="hidden items-center gap-3 lg:flex">
            {newsletterConfig.enabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setNewsletterOpen(true)}
              >
                <Mail className="h-4 w-4" />
                <span>{headerFooter.newsletterTriggerLabel || "Newsletter"}</span>
              </Button>
            )}
            <Button asChild size="default">
              <Link href={headerFooter.ctaHref || "/reservar"}>
                <Calendar className="h-4 w-4" />
                <span>{headerFooter.ctaLabel || "Reservar cita"}</span>
              </Link>
            </Button>
          </div>

          {/* Botones Móvil y Tablet (< lg) */}
          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            <Button asChild size="sm" className="px-3 sm:px-3.5">
              <Link href={headerFooter.ctaHref || "/reservar"}>Reservar</Link>
            </Button>
            <button
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-foreground"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Drawer Navegación Móvil y Tablet */}
        {mobileMenuOpen && (
          <div
            id="mobile-nav-drawer"
            className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-border bg-card px-4 py-5 shadow-editorial sm:max-h-[calc(100dvh-5rem)] sm:px-6 sm:py-6 lg:hidden"
          >
            <nav
              aria-label="Navegación móvil"
              className="flex flex-col space-y-2"
            >
              {visibleNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "rounded-lg px-3.5 py-3 text-base font-medium transition-colors",
                      isActive
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-5 flex flex-col gap-2.5 border-t border-border pt-5">
              {newsletterConfig.enabled && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setNewsletterOpen(true);
                  }}
                >
                  <Mail className="h-4 w-4" />
                  <span>Suscribirme a la Newsletter</span>
                </Button>
              )}
              <Button asChild className="w-full">
                <Link
                  href={headerFooter.ctaHref || "/reservar"}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Calendar className="h-4 w-4" />
                  <span>{headerFooter.ctaLabel || "Reservar cita"}</span>
                </Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Contenido Principal */}
      <main id="contenido-principal" className="flex-1">
        {children}
      </main>

      {/* Pie de Página */}
      <footer className="border-t border-border bg-card/70 pt-12 pb-[max(3rem,calc(1.5rem+env(safe-area-inset-bottom)))] sm:pt-16">
        <div className="container mx-auto space-y-10 sm:space-y-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* Columna 1: Identidad y Contacto Confirmado */}
            <div className="space-y-4 lg:col-span-4">
              <div>
                <p className="font-serif text-2xl font-medium tracking-[0.14em] text-foreground">
                  {headerFooter.brandName || salonMeta.brandName}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {headerFooter.footerTagline}
                </p>
              </div>

              <div className="space-y-2 pt-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                  <div>
                    <p className="text-foreground">
                      {salonMeta.addressLine
                        ? `${salonMeta.addressLine}${
                            salonMeta.postalCode
                              ? `, ${salonMeta.postalCode}`
                              : ""
                          } · ${salonMeta.city}`
                        : `${salonMeta.city}, España`}
                    </p>
                    <a
                      href={salonMeta.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-foreground underline underline-offset-2"
                    >
                      <span>Ver ubicación en Google Maps</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {salonMeta.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 shrink-0 text-foreground" />
                    <a
                      href={`tel:${salonMeta.phone.replace(/\s+/g, "")}`}
                      className="hover:text-foreground underline-offset-2 hover:underline"
                    >
                      {salonMeta.phone}
                    </a>
                  </div>
                )}

                {salonMeta.contactEmail && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 shrink-0 text-foreground" />
                    <a
                      href={`mailto:${salonMeta.contactEmail}`}
                      className="break-all hover:text-foreground underline-offset-2 hover:underline sm:break-normal"
                    >
                      {salonMeta.contactEmail}
                    </a>
                  </div>
                )}
              </div>

              {/* Redes sociales solo si están configuradas y son válidas */}
              {(salonMeta.instagramUrl ||
                salonMeta.facebookUrl ||
                salonMeta.tiktokUrl ||
                salonMeta.whatsapp) && (
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-medium">
                  {salonMeta.instagramUrl && (
                    <a
                      href={salonMeta.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-foreground hover:bg-accent"
                    >
                      Instagram
                    </a>
                  )}
                  {salonMeta.facebookUrl && (
                    <a
                      href={salonMeta.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-foreground hover:bg-accent"
                    >
                      Facebook
                    </a>
                  )}
                  {salonMeta.tiktokUrl && (
                    <a
                      href={salonMeta.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-foreground hover:bg-accent"
                    >
                      TikTok
                    </a>
                  )}
                  {salonMeta.whatsapp && (
                    <a
                      href={`https://wa.me/${salonMeta.whatsapp.replace(/[^\d]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-foreground hover:bg-accent"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Columna 2: Navegación y Horario */}
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:col-span-4">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                  Explorar
                </h2>
                <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                  <li>
                    <Link href="/" className="hover:text-foreground">
                      Inicio
                    </Link>
                  </li>
                  {visibleNavItems.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="hover:text-foreground">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="/reservar"
                      className="font-medium text-foreground hover:underline"
                    >
                      Reservar cita
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-foreground" />
                  <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                    Horario en Madrid
                  </h2>
                </div>
                {salonMeta.scheduleConfirmed ? (
                  <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                    {salonMeta.weeklySummary.map((row) => (
                      <li
                        key={row.dayName}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="font-medium text-foreground">
                          {row.dayName}
                        </span>
                        <span>{row.isOpen ? row.hoursText : "Cerrado"}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                    Horario oficial en actualización. Consulta nuestra ficha en
                    Google Maps o escríbenos desde Contacto.
                  </p>
                )}
              </div>
            </div>

            {/* Columna 3: Newsletter Integrada */}
            <div className="lg:col-span-4">
              <NewsletterInlineForm config={newsletterConfig} />
            </div>
          </div>

          {/* Barra inferior con Páginas Legales Editables, Configuración de Cookies y Acceso al Panel */}
          <div className="flex flex-col gap-4 border-t border-border pt-8 text-xs text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
            <p>
              © {new Date().getFullYear()} {headerFooter.footerCopyright}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {visibleLegalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-foreground underline-offset-4 hover:underline"
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => setCookieDialogOpen(true)}
                className="inline-flex items-center gap-1 text-left hover:text-foreground underline-offset-4 hover:underline"
              >
                <Cookie className="h-3.5 w-3.5" />
                <span>Preferencias de Cookies</span>
              </button>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-muted-foreground/80 hover:text-foreground"
              >
                <Lock className="h-3 w-3" />
                <span>Panel</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal único de Newsletter */}
      <NewsletterDialog
        config={newsletterConfig}
        open={newsletterOpen}
        onOpenChange={setNewsletterOpen}
      />

      {/* Invitación emergente Black Friday (4s tras entrar en la página) */}
      <PromoCouponPopup />

      {/* Gestor de Cookies */}
      <CookieConsentManager
        content={cookieBanner}
        hasOptionalCookiesEnabled={salonMeta.hasOptionalCookiesEnabled}
        externalOpen={cookieDialogOpen}
        onExternalOpenChange={setCookieDialogOpen}
      />
    </div>
  );
}
