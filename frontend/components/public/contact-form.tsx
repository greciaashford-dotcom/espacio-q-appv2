"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function ContactForm({ cms }: { cms: Record<string, any> }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      subject: String(fd.get("subject") || ""),
      message: String(fd.get("message") || ""),
      privacyAccepted: fd.get("privacy") === "on",
      website: String(fd.get("website") || ""),
    };
    if (!payload.privacyAccepted) {
      setState("error");
      setError("Debes aceptar la Política de Privacidad para enviar la consulta.");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setError(data.error || "No se pudo enviar la consulta.");
        return;
      }
      setState("done");
    } catch {
      setState("error");
      setError("Error de conexión. Inténtalo de nuevo.");
    }
  }

  if (state === "done") {
    return (
      <div role="status" className="rounded-editorial border border-border bg-card p-8">
        <CheckCircle2 className="h-6 w-6 text-success" />
        <h2 className="mt-3 font-serif text-2xl">{cms.successTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{cms.successDescription}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-editorial border border-border bg-card p-5 shadow-subtle sm:p-8">
      <div>
        <h2 className="font-serif text-2xl">{cms.formTitle}</h2>
        {cms.formSubtitle && <p className="mt-1 text-sm text-muted-foreground">{cms.formSubtitle}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-name">Nombre *</Label>
          <Input id="c-name" name="name" required autoComplete="name" minLength={2} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-email">Email *</Label>
          <Input id="c-email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-phone">Teléfono (opcional)</Label>
          <Input id="c-phone" name="phone" type="tel" autoComplete="tel" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-subject">Asunto (opcional)</Label>
          <Input id="c-subject" name="subject" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-message">Mensaje *</Label>
        <Textarea id="c-message" name="message" required minLength={10} maxLength={3000} rows={5} />
      </div>
      {/* Honeypot oculto para bots */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="c-website">No rellenar</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex items-start gap-2.5">
        <input id="c-privacy" name="privacy" type="checkbox" className="mt-1 h-4 w-4 shrink-0" />
        <label htmlFor="c-privacy" className="text-xs leading-relaxed text-muted-foreground">
          {cms.privacyConsentLabel}{" "}
          <Link href="/privacidad" className="font-medium text-foreground underline">
            Política de Privacidad
          </Link>
          .
        </label>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={state === "sending"} className="w-full sm:w-auto">
        {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {cms.submitButtonLabel || "Enviar consulta"}
      </Button>
    </form>
  );
}
