import React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { ensureBaseCmsAndSettings } from "@/lib/domain/cms";
import { utcToMadridParts } from "@/lib/domain/timezone";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Resumen" };

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default async function AdminHome() {
  const settings = await ensureBaseCmsAndSettings();
  const today = utcToMadridParts(new Date()).dateStr;
  const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [
    todayAppts,
    pendingAppts,
    newClients,
    activeSubs,
    unpublished,
    services,
    pros,
    failedJobs,
    newMessages,
    simulatedEmails,
    integrations,
    provisionalMedia,
  ] = await Promise.all([
    prisma.appointment.count({ where: { dateStrMadrid: today, status: { in: ["CONFIRMED", "PENDING_APPROVAL"] } } }),
    prisma.appointment.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.client.count({ where: { createdAt: { gte: since30 } } }),
    prisma.subscriber.count({ where: { status: "ACTIVE" } }),
    prisma.pageContent.findMany({ where: { hasUnpublished: true }, select: { key: true, title: true } }),
    prisma.service.count({ where: { active: true } }),
    prisma.professional.count({ where: { active: true } }),
    prisma.notificationJob.count({ where: { status: "FAILED" } }),
    prisma.contactMessage.count({ where: { status: "NEW" } }),
    prisma.emailDelivery.count({ where: { status: "SIMULATED_LOCAL" } }),
    prisma.integrationConnection.findMany({ orderBy: { provider: "asc" } }),
    prisma.mediaAsset.count({ where: { isProvisional: true, publicVisible: true } }),
  ]);

  const checklist = [
    { label: "Titular, NIF y domicilio para las páginas legales", done: Boolean(settings.legalOwnerName && settings.legalTaxId && settings.legalRegisteredAddress), href: "/admin/configuracion" },
    { label: "Email y teléfono de contacto del salón", done: Boolean(settings.contactEmail && settings.phone), href: "/admin/configuracion" },
    { label: "Dirección postal confirmada", done: Boolean(settings.addressLine), href: "/admin/configuracion" },
    { label: "Horario del salón confirmado", done: settings.scheduleConfirmed, href: "/admin/horarios" },
    { label: "Catálogo de servicios con precios y duraciones reales", done: services > 0, href: "/admin/servicios" },
    { label: "Profesionales activos con servicios habilitados", done: pros > 0, href: "/admin/equipo" },
    { label: "Sustituir fotografías provisionales por imágenes propias", done: provisionalMedia === 0, href: "/admin/multimedia" },
    { label: "Proveedor de email configurado (EMAIL_PROVIDER_API_KEY)", done: Boolean(process.env.EMAIL_PROVIDER_API_KEY), href: "/admin/configuracion" },
  ];

  const statusLabel: Record<string, { text: string; variant: "success" | "warning" | "secondary" | "destructive" }> = {
    CONNECTED: { text: "Conectado", variant: "success" },
    DISCONNECTED: { text: "Desconectado", variant: "secondary" },
    PENDING_CREDENTIALS: { text: "Pendiente de configurar", variant: "warning" },
    ERROR: { text: "Error", variant: "destructive" },
  };

  return (
    <div>
      <AdminPageHeader
        title="Resumen"
        description="Datos reales del sistema. Sin datos, las cifras se muestran a cero."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Citas hoy" value={todayAppts} hint={today} />
        <Stat label="Pendientes de aprobar" value={pendingAppts} />
        <Stat label="Clientes nuevos (30 días)" value={newClients} />
        <Stat label="Suscripciones activas" value={activeSubs} hint="Double opt-in confirmado" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Puesta en marcha</CardTitle>
            <p className="text-sm text-muted-foreground">
              Datos de negocio pendientes. No se inventan: complétalos para habilitar reservas y publicar textos legales definitivos.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-start justify-between gap-3 text-sm">
                  <span className="flex items-start gap-2">
                    {c.done ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-label="Completado" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-label="Pendiente" />
                    )}
                    <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.label}</span>
                  </span>
                  {!c.done && c.href && (
                    <Link href={c.href} className="shrink-0 text-xs font-medium underline">
                      Completar
                    </Link>
                  )}
                  {!c.done && !c.href && <span className="shrink-0 text-xs text-muted-foreground">Próxima fase</span>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integraciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {integrations.map((i) => {
                const s = statusLabel[i.status] ?? { text: i.status, variant: "secondary" as const };
                return (
                  <div key={i.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>{i.provider.replace("_", " ")}</span>
                    <Badge variant={s.variant}>{s.text}</Badge>
                  </div>
                );
              })}
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>Horario</span>
                <Badge variant={settings.scheduleConfirmed ? "success" : "warning"}>
                  {settings.activeScheduleSource === "MANUAL" ? "Manual" : "Google"} · {settings.scheduleConfirmed ? "confirmado" : "sin confirmar"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avisos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {unpublished.length > 0 && (
                <p className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <span>
                    {unpublished.length} bloque(s) con cambios sin publicar.{" "}
                    <Link href="/admin/contenido" className="underline">Revisar</Link>
                  </span>
                </p>
              )}
              {failedJobs > 0 && (
                <p className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <span>{failedJobs} trabajo(s) de envío fallidos.</span>
                </p>
              )}
              {simulatedEmails > 0 && (
                <p className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <span>{simulatedEmails} correo(s) guardados en buzón local (no enviados: falta proveedor de email).</span>
                </p>
              )}
              <p className="text-muted-foreground">{newMessages} consulta(s) de contacto nuevas.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
