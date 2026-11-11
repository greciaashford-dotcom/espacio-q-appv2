"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Loader2, Mail, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type NewsletterConfigData = {
  enabled: boolean;
  openMode: "manual" | "timer" | "scroll";
  delaySeconds: number;
  scrollPercent: number;
  cooldownDays: number;
  imageUrl: string;
  imageAlt: string;
  eyebrow?: string;
  title: string;
  description: string;
  promoText?: string;
  inputPlaceholder: string;
  firstNamePlaceholder?: string;
  consentLabel: string;
  submitLabel: string;
  submittingLabel: string;
  pendingTitle: string;
  pendingDescription: string;
  confirmedTitle: string;
  confirmedDescription: string;
  footerTitle?: string;
  footerDescription?: string;
};

type SubscriptionState =
  | "idle"
  | "submitting"
  | "pending_verification"
  | "confirmed"
  | "error"
  | "rate_limited";

const DISMISS_STORAGE_KEY = "espacioq_newsletter_dismissed_until";

export function NewsletterDialog({
  config,
  open,
  onOpenChange,
  onSubscribe,
}: {
  config: NewsletterConfigData;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onSubscribe?: (payload: {
    email: string;
    firstName?: string;
    consentAccepted: boolean;
  }) => Promise<{ ok: boolean; error?: string; rateLimited?: boolean }>;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [status, setStatus] = useState<SubscriptionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Apertura automática opcional solo si el administrador lo activa en el CMS y respeta el periodo de no repetición
  useEffect(() => {
    if (!config.enabled || config.openMode === "manual") return;
    if (typeof window === "undefined") return;

    try {
      const dismissedUntil = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        return;
      }
    } catch {
      // Ignorar errores de almacenamiento restringido
    }

    if (config.openMode === "timer") {
      const delayMs = Math.max(5, config.delaySeconds || 18) * 1000;
      const timer = window.setTimeout(() => {
        onOpenChange(true);
      }, delayMs);
      return () => window.clearTimeout(timer);
    }

    if (config.openMode === "scroll") {
      const targetRatio = Math.min(90, Math.max(20, config.scrollPercent || 60)) / 100;
      const onScroll = () => {
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight <= 0) return;
        if (window.scrollY / docHeight >= targetRatio) {
          onOpenChange(true);
          window.removeEventListener("scroll", onScroll);
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }
  }, [
    config.enabled,
    config.openMode,
    config.delaySeconds,
    config.scrollPercent,
    onOpenChange,
  ]);

  const recordCooldown = () => {
    try {
      const days = Math.max(1, config.cooldownDays || 14);
      const until = Date.now() + days * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_STORAGE_KEY, String(until));
    } catch {
      // Ignorar si localStorage no está disponible
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      recordCooldown();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setStatus("error");
      setErrorMessage("Por favor, introduce un correo electrónico válido.");
      return;
    }

    if (!consentAccepted) {
      setStatus("error");
      setErrorMessage(
        "Es necesario marcar la casilla de consentimiento explícito para suscribirte."
      );
      return;
    }

    setStatus("submitting");

    try {
      if (onSubscribe) {
        const res = await onSubscribe({
          email: trimmedEmail,
          firstName: firstName.trim() || undefined,
          consentAccepted,
        });
        if (!res.ok) {
          setStatus(res.rateLimited ? "rate_limited" : "error");
          setErrorMessage(
            res.error || "No se pudo procesar tu solicitud. Inténtalo de nuevo."
          );
          return;
        }
        recordCooldown();
        setStatus("pending_verification");
        return;
      }

      const response = await fetch("/api/v1/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          firstName: firstName.trim() || undefined,
          consentAccepted,
          source: "newsletter_dialog",
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.status === 429) {
        setStatus("rate_limited");
        setErrorMessage(
          data.error ||
            "Has realizado demasiadas solicitudes seguidas. Espera unos minutos antes de volver a intentarlo."
        );
        return;
      }

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(
          data.error || "No se pudo completar la suscripción en este momento."
        );
        return;
      }

      recordCooldown();
      setStatus("pending_verification");
    } catch {
      setStatus("error");
      setErrorMessage(
        "Error de conexión al enviar tu solicitud. Puedes volver a intentarlo."
      );
    }
  };

  if (!config.enabled) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-testid="newsletter-dialog" className="overflow-y-auto p-0 sm:max-w-[460px] lg:max-w-[420px]">
        {config.imageUrl && (
          <div className="relative h-36 max-h-[28svh] w-full bg-secondary sm:h-52 sm:max-h-none lg:h-32">
            <Image
              src={config.imageUrl}
              alt={config.imageAlt || "Newsletter ESPACIO Q"}
              fill
              sizes="(max-width: 640px) 100vw, 460px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-popover/80 via-transparent to-transparent" />
          </div>
        )}

        <div className="p-4 pt-4 sm:p-6 sm:pt-5 lg:px-5 lg:pb-5 lg:pt-4">
          <DialogHeader>
            {config.eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {config.eyebrow}
              </p>
            )}
            <DialogTitle className="mt-1 text-2xl sm:text-[26px] lg:text-[22px]">
              {status === "pending_verification"
                ? config.pendingTitle
                : status === "confirmed"
                  ? config.confirmedTitle
                  : config.title}
            </DialogTitle>
            <DialogDescription className="mt-2">
              {status === "pending_verification"
                ? config.pendingDescription
                : status === "confirmed"
                  ? config.confirmedDescription
                  : config.description}
            </DialogDescription>
          </DialogHeader>

          {config.promoText &&
            config.promoText.trim().length > 0 &&
            status !== "pending_verification" && (
              <div className="mt-4 rounded-lg border border-border bg-accent px-3.5 py-2.5 text-xs font-medium text-accent-foreground">
                {config.promoText}
              </div>
            )}

          {status === "pending_verification" || status === "confirmed" ? (
            <div
              role="status"
              aria-live="polite"
              className="mt-6 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <div className="text-sm text-foreground">
                  <p className="font-medium">
                    Solicitud registrada para{" "}
                    <span className="underline">{email}</span>
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Para cumplir con la normativa de protección de datos, solo
                    activaremos el envío comercial cuando pulses el enlace de
                    confirmación enviado a tu correo.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full"
                onClick={() => handleOpenChange(false)}
              >
                Entendido, cerrar ventana
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4 lg:mt-3.5 lg:space-y-3" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="newsletter-modal-email">
                  Correo electrónico <span aria-hidden="true">*</span>
                </Label>
                <Input
                  id="newsletter-modal-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={config.inputPlaceholder || "tu@email.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "submitting"}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newsletter-modal-name">
                  Nombre <span className="text-xs text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="newsletter-modal-name"
                  type="text"
                  autoComplete="given-name"
                  placeholder={
                    config.firstNamePlaceholder || "Tu nombre (opcional)"
                  }
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={status === "submitting"}
                />
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id="newsletter-modal-consent"
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  disabled={status === "submitting"}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-ring"
                />
                <Label
                  htmlFor="newsletter-modal-consent"
                  className="text-xs font-normal leading-relaxed text-muted-foreground"
                >
                  {config.consentLabel}{" "}
                  <Link
                    href="/privacidad"
                    className="font-medium text-foreground underline underline-offset-2"
                    onClick={() => handleOpenChange(false)}
                  >
                    Ver Política de Privacidad
                  </Link>
                  .
                </Label>
              </div>

              {(status === "error" || status === "rate_limited") &&
                errorMessage && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

              <Button
                type="submit"
                className="w-full"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {config.submittingLabel || "Procesando..."}
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    {config.submitLabel || "Suscribirme"}
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Variante integrada para pie de página o sección final de Home, conectada al mismo endpoint double opt-in.
 */
export function NewsletterInlineForm({
  config,
}: {
  config: NewsletterConfigData;
}) {
  const [email, setEmail] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [status, setStatus] = useState<SubscriptionState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (!config.enabled) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setStatus("error");
      setMessage("Introduce un correo electrónico válido.");
      return;
    }

    if (!consentAccepted) {
      setStatus("error");
      setMessage(
        "Debes marcar la casilla de consentimiento explícito antes de suscribirte."
      );
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/v1/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          consentAccepted,
          source: "footer_form",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(res.status === 429 ? "rate_limited" : "error");
        setMessage(data.error || "No se pudo procesar tu solicitud.");
        return;
      }
      setStatus("pending_verification");
      setMessage(
        data.message ||
          "Revisa tu correo para confirmar tu suscripción (double opt-in)."
      );
      setEmail("");
      setConsentAccepted(false);
    } catch {
      setStatus("error");
      setMessage("Error de conexión. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="rounded-editorial border border-border bg-card p-6 shadow-subtle">
      <h3 className="font-serif text-xl font-medium text-foreground">
        {config.footerTitle || "Únete a nuestra carta editorial"}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {config.footerDescription || config.description}
      </p>

      {status === "pending_verification" ? (
        <div
          role="status"
          className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-accent p-3.5 text-xs text-foreground"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <span>{message}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <label htmlFor="footer-newsletter-email" className="sr-only">
              Correo electrónico para newsletter
            </label>
            <Input
              id="footer-newsletter-email"
              type="email"
              required
              placeholder={config.inputPlaceholder || "tu@email.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "submitting"}
              className="flex-1"
            />
            <Button type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                config.submitLabel || "Suscribirme"
              )}
            </Button>
          </div>

          <div className="flex items-start gap-2">
            <input
              id="footer-newsletter-consent"
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              disabled={status === "submitting"}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-ring"
            />
            <label
              htmlFor="footer-newsletter-consent"
              className="text-xs leading-relaxed text-muted-foreground"
            >
              {config.consentLabel}{" "}
              <Link
                href="/privacidad"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Política de Privacidad
              </Link>
              .
            </label>
          </div>

          {(status === "error" || status === "rate_limited") && message && (
            <p role="alert" className="text-xs text-destructive">
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
