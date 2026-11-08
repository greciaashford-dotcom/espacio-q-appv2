"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewsletterActionPanel({
  mode,
  token,
  email,
}: {
  mode: "confirm" | "unsubscribe";
  token?: string;
  email?: string;
}) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState(email || "");

  async function run() {
    setState("busy");
    setMessage(null);
    const body =
      mode === "confirm"
        ? { action: "confirm", token }
        : { action: "unsubscribe", token: token || undefined, email: emailInput || undefined };
    try {
      const res = await fetch("/api/v1/newsletter/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setMessage(data.error || "No se pudo completar la acción.");
        return;
      }
      setState("done");
    } catch {
      setState("error");
      setMessage("Error de conexión.");
    }
  }

  if (state === "done") {
    return (
      <div role="status" className="space-y-3 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
        <h1 className="font-serif text-3xl">
          {mode === "confirm" ? "Suscripción confirmada" : "Baja procesada"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === "confirm"
            ? "Gracias por confirmar. Recibirás nuestras novedades y podrás darte de baja en cualquier momento."
            : "No recibirás más comunicaciones comerciales. Seguirás recibiendo, si procede, los avisos necesarios de tus citas."}
        </p>
        <Button asChild variant="outline"><Link href="/">Volver al inicio</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-3xl">
        {mode === "confirm" ? "Confirma tu suscripción" : "Darse de baja de la newsletter"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {mode === "confirm"
          ? "Pulsa el botón para confirmar que deseas recibir la newsletter de ESPACIO Q."
          : "Pulsa el botón para dejar de recibir comunicaciones comerciales. No necesitas iniciar sesión."}
      </p>
      {mode === "unsubscribe" && !token && (
        <div className="space-y-1.5">
          <Label htmlFor="unsub-email">Correo electrónico</Label>
          <Input id="unsub-email" type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
        </div>
      )}
      {mode === "confirm" && !token ? (
        <p role="alert" className="text-sm text-destructive">Enlace incompleto: falta el token de verificación.</p>
      ) : (
        <Button onClick={run} disabled={state === "busy"} className="w-full">
          {state === "busy" && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "confirm" ? "Confirmar suscripción" : "Confirmar baja"}
        </Button>
      )}
      {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
    </div>
  );
}
