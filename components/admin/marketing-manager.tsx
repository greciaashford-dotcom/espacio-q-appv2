"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addManualSuppressionAction,
  launchCampaignAction,
  saveCampaignDraftAction,
  sendTestCampaignEmailAction,
} from "@/app/admin/marketing/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type CampaignItem = {
  id: string;
  name: string;
  subject: string;
  preheader: string | null;
  heading: string;
  bodyText: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  tags: string[];
  status: string;
  totalRecipients: number;
  acceptedCount: number;
  deliveredCount: number;
  bouncedCount: number;
  complainedCount: number;
  createdAt: string;
};

type SubscriberItem = {
  id: string;
  email: string;
  firstName: string | null;
  status: string;
  confirmedAt: string | null;
  source: string;
};

type SuppressionItem = {
  id: string;
  emailNormalized: string;
  reason: string;
  createdAt: string;
};

export function MarketingManager({
  stats,
  emailProviderReady,
  campaigns,
  subscribers,
  suppressions,
  defaultTestEmail,
}: {
  stats: {
    activeCount: number;
    pendingCount: number;
    unsubscribedCount: number;
    suppressionCount: number;
  };
  emailProviderReady: boolean;
  campaigns: CampaignItem[];
  subscribers: SubscriberItem[];
  suppressions: SuppressionItem[];
  defaultTestEmail: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"campaigns" | "subscribers" | "suppressions">("campaigns");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [testEmail, setTestEmail] = useState(defaultTestEmail);
  const [suppressEmail, setSuppressEmail] = useState("");

  const emptyForm = {
    id: "",
    name: "",
    subject: "",
    preheader: "",
    heading: "",
    bodyText: "",
    ctaLabel: "Reservar en ESPACIO Q",
    ctaUrl: "",
    tagsText: "",
  };
  const [form, setForm] = useState(emptyForm);

  function editCampaign(c: CampaignItem) {
    setForm({
      id: c.id,
      name: c.name,
      subject: c.subject,
      preheader: c.preheader ?? "",
      heading: c.heading,
      bodyText: c.bodyText,
      ctaLabel: c.ctaLabel ?? "",
      ctaUrl: c.ctaUrl ?? "",
      tagsText: c.tags.join(", "),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSaveCampaign(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await saveCampaignDraftAction({
        ...form,
        id: form.id || undefined,
      });
      if (res.ok) {
        setFeedback({
          type: "ok",
          text: `Campaña guardada en borrador (${res.eligibleCount} suscriptor(es) activo(s) elegible(s)).`,
        });
        setForm(emptyForm);
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error ?? "No se pudo guardar la campaña." });
      }
    });
  }

  return (
    <div className="space-y-6">
      {!emailProviderReady && (
        <div className="rounded-xl border border-warning bg-warning/10 p-4 text-sm">
          <strong>Modo buzón local (SIMULATED_LOCAL):</strong> <code>EMAIL_PROVIDER_API_KEY</code> no está definida todavía. Los envíos de prueba y campañas se renderizan con plantilla editorial real y se guardan en el buzón local de{" "}
          <strong>Automatizaciones → Entregas</strong> para inspección sin enviar correos externos.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Suscriptores activos</p>
            <p className="mt-1 text-2xl font-semibold">{stats.activeCount}</p>
            <p className="text-xs text-muted-foreground">Double opt-in verificado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Pendientes confirmar</p>
            <p className="mt-1 text-2xl font-semibold">{stats.pendingCount}</p>
            <p className="text-xs text-muted-foreground">No reciben campañas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Bajas voluntarias</p>
            <p className="mt-1 text-2xl font-semibold">{stats.unsubscribedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Lista de supresión</p>
            <p className="mt-1 text-2xl font-semibold">{stats.suppressionCount}</p>
            <p className="text-xs text-muted-foreground">Bajas, rebotes y quejas</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {(
          [
            { id: "campaigns", label: `Campañas (${campaigns.length})` },
            { id: "subscribers", label: `Suscriptores (${subscribers.length})` },
            { id: "suppressions", label: `Supresión (${suppressions.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium ${
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === "ok"
              ? "border-success/40 bg-success/10 text-foreground"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {tab === "campaigns" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{form.id ? "Editar borrador de campaña" : "Nueva campaña editorial"}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Incluye automáticamente cabecera Zen Linen y enlace firmado de baja en un clic sin exponer datos personales en la URL.
                </p>
              </div>
              {form.id && (
                <Button size="sm" variant="outline" onClick={() => setForm(emptyForm)}>
                  Cancelar edición
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCampaign} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Nombre interno de campaña</Label>
                    <Input
                      placeholder="Ej. Novedades Otoño Madrid"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Filtro por etiquetas (opcional, vacío = todos los confirmados)</Label>
                    <Input
                      placeholder="color, tratamientos"
                      value={form.tagsText}
                      onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Asunto del correo</Label>
                    <Input
                      placeholder="Cuidado estacional para tu cabello · ESPACIO Q"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Preheader (texto vista previa bandeja)</Label>
                    <Input
                      value={form.preheader}
                      onChange={(e) => setForm({ ...form, preheader: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Titular principal dentro del correo</Label>
                  <Input
                    value={form.heading}
                    onChange={(e) => setForm({ ...form, heading: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Cuerpo editorial (separa párrafos con salto de línea)</Label>
                  <Textarea
                    rows={5}
                    value={form.bodyText}
                    onChange={(e) => setForm({ ...form, bodyText: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Texto del botón CTA (opcional)</Label>
                    <Input
                      value={form.ctaLabel}
                      onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">URL del botón CTA (opcional)</Label>
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={form.ctaUrl}
                      onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isPending}>
                    {form.id ? "Actualizar borrador" : "Guardar borrador de campaña"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <CardTitle>Historial de campañas</CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Email para pruebas:</Label>
                <Input
                  type="email"
                  className="h-8 w-56 text-xs"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No se ha creado ninguna campaña todavía.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {campaigns.map((c) => (
                    <div key={c.id} className="flex flex-col justify-between gap-3 py-4 lg:flex-row lg:items-center">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{c.name}</span>
                          <Badge variant={c.status === "COMPLETED" ? "success" : "outline"}>
                            {c.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Asunto: {c.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          Elegibles: {c.totalRecipients} · Aceptados por proveedor/buzón:{" "}
                          {c.acceptedCount} · Entregados (webhook): {c.deliveredCount} · Rebotes:{" "}
                          {c.bouncedCount} · Quejas: {c.complainedCount}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {c.status === "DRAFT" && (
                          <Button size="sm" variant="outline" onClick={() => editCampaign(c)}>
                            Editar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() =>
                            startTransition(async () => {
                              const res = await sendTestCampaignEmailAction({
                                campaignId: c.id,
                                testEmail,
                              });
                              if (res.ok) {
                                setFeedback({
                                  type: "ok",
                                  text: `Prueba despachada a ${testEmail} (estado: ${res.deliveryStatus}).`,
                                });
                              } else {
                                setFeedback({
                                  type: "err",
                                  text: res.error ?? "Error enviando prueba.",
                                });
                              }
                            })
                          }
                        >
                          Enviar prueba
                        </Button>
                        {c.status === "DRAFT" && (
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() =>
                              startTransition(async () => {
                                const res = await launchCampaignAction({ campaignId: c.id });
                                if (res.ok) {
                                  setFeedback({
                                    type: "ok",
                                    text: `Campaña lanzada para ${res.recipientsQueued} suscriptor(es) confirmado(s).`,
                                  });
                                  router.refresh();
                                } else {
                                  setFeedback({
                                    type: "err",
                                    text: res.error ?? "No se pudo lanzar.",
                                  });
                                }
                              })
                            }
                          >
                            Enviar ahora
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "subscribers" && (
        <Card>
          <CardHeader>
            <CardTitle>Suscriptores del newsletter</CardTitle>
          </CardHeader>
          <CardContent>
            {subscribers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aún no hay suscriptores registrados desde la web pública.
              </p>
            ) : (
              <div className="divide-y divide-border text-sm">
                {subscribers.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-medium">
                        {s.email} {s.firstName ? `(${s.firstName})` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Origen: {s.source} ·{" "}
                        {s.confirmedAt
                          ? `Confirmado: ${new Date(s.confirmedAt).toLocaleString("es-ES")}`
                          : "Pendiente de confirmar enlace por email"}
                      </p>
                    </div>
                    <Badge variant={s.status === "ACTIVE" ? "success" : "secondary"}>
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "suppressions" && (
        <Card>
          <CardHeader>
            <CardTitle>Lista global de supresión (bajas, rebotes duros y quejas)</CardTitle>
            <p className="text-xs text-muted-foreground">
              El worker revalida esta tabla en tiempo real justo antes de cada envío individual; ninguna dirección incluida aquí recibirá comunicaciones comerciales.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  const res = await addManualSuppressionAction(suppressEmail);
                  if (res.ok) {
                    setSuppressEmail("");
                    setFeedback({ type: "ok", text: "Correo añadido a lista de supresión." });
                    router.refresh();
                  } else {
                    setFeedback({ type: "err", text: res.error ?? "Correo inválido." });
                  }
                });
              }}
            >
              <Input
                type="email"
                placeholder="Suprimir email manualmente..."
                value={suppressEmail}
                onChange={(e) => setSuppressEmail(e.target.value)}
                required
              />
              <Button type="submit" variant="outline" disabled={isPending}>
                Añadir a supresión
              </Button>
            </form>

            {suppressions.length === 0 ? (
              <p className="py-4 text-xs text-muted-foreground">Lista de supresión vacía.</p>
            ) : (
              <div className="divide-y divide-border text-xs">
                {suppressions.map((sup) => (
                  <div key={sup.id} className="flex items-center justify-between py-2.5">
                    <span className="font-mono">{sup.emailNormalized}</span>
                    <Badge variant="outline">{sup.reason}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
