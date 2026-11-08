"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  retryFailedJobsAction,
  runWorkerNowAction,
  toggleAutomationRuleAction,
  updateEmailTemplateAction,
} from "@/app/admin/automatizaciones/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type RuleItem = {
  id: string;
  key: string;
  name: string;
  triggerEvent: string;
  offsetMinutes: number;
  active: boolean;
  description: string | null;
};

type TemplateItem = {
  id: string;
  key: string;
  name: string;
  category: string;
  subject: string;
  heading: string;
  bodyTemplate: string;
  footerNote: string | null;
  active: boolean;
};

type JobItem = {
  id: string;
  jobType: string;
  dedupKey: string;
  status: string;
  scheduledAtUtc: string;
  attempts: number;
  lastError: string | null;
};

type DeliveryItem = {
  id: string;
  category: string;
  templateKey: string;
  toEmail: string;
  subject: string;
  status: string;
  providerName: string;
  htmlBody: string;
  textBody: string;
  createdAt: string;
};

export function AutomationsManager({
  rules,
  templates,
  jobCounts,
  recentJobs,
  deliveries,
}: {
  rules: RuleItem[];
  templates: TemplateItem[];
  jobCounts: Record<string, number>;
  recentJobs: JobItem[];
  deliveries: DeliveryItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"outbox" | "queue" | "rules" | "templates">("outbox");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [previewDelivery, setPreviewDelivery] = useState<DeliveryItem | null>(null);
  const [editingTpl, setEditingTpl] = useState<TemplateItem | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <span>
            Pendientes: <strong>{jobCounts.PENDING ?? 0}</strong>
          </span>
          <span>
            En proceso: <strong>{jobCounts.PROCESSING ?? 0}</strong>
          </span>
          <span>
            Completados: <strong>{jobCounts.COMPLETED ?? 0}</strong>
          </span>
          <span>
            Descartados/Cancelados: <strong>{jobCounts.CANCELLED ?? 0}</strong>
          </span>
          <span className={(jobCounts.FAILED ?? 0) > 0 ? "text-destructive" : ""}>
            Fallidos: <strong>{jobCounts.FAILED ?? 0}</strong>
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(jobCounts.FAILED ?? 0) > 0 && (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const res = await retryFailedJobsAction();
                  if (res.ok) {
                    setFeedback({
                      type: "ok",
                      text: `${res.count} trabajo(s) fallidos reencolados.`,
                    });
                    router.refresh();
                  }
                })
              }
            >
              Reintentar fallidos
            </Button>
          )}
          <Button
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const res = await runWorkerNowAction();
                if (res.ok && res.stats) {
                  setFeedback({
                    type: "ok",
                    text: `Worker ejecutado: ${res.stats.completedJobs} completados, ${res.stats.skippedOrCancelledJobs} omitidos por cancelación/cambio, ${res.stats.campaignsProcessed} campañas procesadas.`,
                  });
                  router.refresh();
                }
              })
            }
          >
            Procesar cola pendiente ahora
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {(
          [
            { id: "outbox", label: `Entregas y buzón local (${deliveries.length})` },
            { id: "queue", label: `Cola de trabajos (${recentJobs.length})` },
            { id: "rules", label: `Reglas automáticas (${rules.length})` },
            { id: "templates", label: `Plantillas de correo (${templates.length})` },
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

      {previewDelivery && (
        <Card className="border-primary">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">{previewDelivery.subject}</CardTitle>
              <p className="text-xs text-muted-foreground">
                Para: {previewDelivery.toEmail} · Estado: {previewDelivery.status} ({previewDelivery.providerName})
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setPreviewDelivery(null)}>
              Cerrar vista previa
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <iframe
              title="Vista previa correo HTML"
              sandbox=""
              srcDoc={previewDelivery.htmlBody}
              className="h-96 w-full rounded-lg border border-border bg-white"
            />
            <details className="text-xs">
              <summary className="cursor-pointer font-medium">Ver versión texto plano</summary>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-background p-3">
                {previewDelivery.textBody}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}

      {tab === "outbox" && (
        <Card>
          <CardHeader>
            <CardTitle>Registro de correos y buzón local</CardTitle>
            <p className="text-xs text-muted-foreground">
              Los correos aceptados por Resend figuran como <code>ACCEPTED</code> hasta que un webhook firmado confirma <code>DELIVERED</code> o <code>BOUNCED</code>. Sin API key figuran honestamente como <code>SIMULATED_LOCAL</code>.
            </p>
          </CardHeader>
          <CardContent>
            {deliveries.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aún no se han generado entregas de correo.
              </p>
            ) : (
              <div className="divide-y divide-border text-sm">
                {deliveries.map((d) => (
                  <div key={d.id} className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{d.subject}</span>
                        <Badge
                          variant={
                            d.status === "DELIVERED" || d.status === "ACCEPTED"
                              ? "success"
                              : d.status === "SIMULATED_LOCAL"
                              ? "warning"
                              : d.status === "FAILED" || d.status === "BOUNCED"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {d.status}
                        </Badge>
                        <Badge variant="outline">{d.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Para: {d.toEmail} · {new Date(d.createdAt).toLocaleString("es-ES")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewDelivery(d)}
                    >
                      Inspeccionar HTML
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "queue" && (
        <Card>
          <CardHeader>
            <CardTitle>Cola persistente NotificationJob</CardTitle>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sin trabajos en cola.
              </p>
            ) : (
              <div className="divide-y divide-border text-xs">
                {recentJobs.map((j) => (
                  <div key={j.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-medium">
                        {j.jobType} · <span className="font-mono">{j.dedupKey}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Programado: {new Date(j.scheduledAtUtc).toLocaleString("es-ES")} · Intentos:{" "}
                        {j.attempts} {j.lastError ? `· Nota: ${j.lastError}` : ""}
                      </p>
                    </div>
                    <Badge
                      variant={
                        j.status === "COMPLETED"
                          ? "success"
                          : j.status === "FAILED"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {j.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "rules" && (
        <Card>
          <CardHeader>
            <CardTitle>Reglas de automatización transaccional</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {rules.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Evento: <code>{r.triggerEvent}</code> · Desfase: {r.offsetMinutes} min{" "}
                    {r.description ? `· ${r.description}` : ""}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={r.active}
                    disabled={isPending}
                    onChange={(e) =>
                      startTransition(async () => {
                        await toggleAutomationRuleAction(r.id, e.target.checked);
                        router.refresh();
                      })
                    }
                  />
                  <span>{r.active ? "Activa" : "Pausada"}</span>
                </label>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === "templates" && (
        <div className="space-y-4">
          {editingTpl && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Editar plantilla: {editingTpl.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    startTransition(async () => {
                      const res = await updateEmailTemplateAction({
                        id: editingTpl.id,
                        subject: editingTpl.subject,
                        heading: editingTpl.heading,
                        bodyTemplate: editingTpl.bodyTemplate,
                        footerNote: editingTpl.footerNote ?? "",
                        active: editingTpl.active,
                      });
                      if (res.ok) {
                        setFeedback({ type: "ok", text: "Plantilla actualizada." });
                        setEditingTpl(null);
                        router.refresh();
                      }
                    });
                  }}
                >
                  <div>
                    <Label className="text-xs">Asunto</Label>
                    <Input
                      value={editingTpl.subject}
                      onChange={(e) =>
                        setEditingTpl({ ...editingTpl, subject: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Titular</Label>
                    <Input
                      value={editingTpl.heading}
                      onChange={(e) =>
                        setEditingTpl({ ...editingTpl, heading: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Cuerpo base</Label>
                    <Textarea
                      rows={4}
                      value={editingTpl.bodyTemplate}
                      onChange={(e) =>
                        setEditingTpl({ ...editingTpl, bodyTemplate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setEditingTpl(null)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      Guardar plantilla
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Plantillas registradas</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border text-sm">
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">
                      {tpl.name} <span className="font-mono text-xs text-muted-foreground">({tpl.key})</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Asunto: {tpl.subject}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setEditingTpl(tpl)}>
                    Editar
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
