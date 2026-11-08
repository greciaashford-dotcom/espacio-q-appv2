import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, canManageCatalogOrCms } from "@/lib/auth/session";
import { getEffectiveProfessionalIntervals } from "@/lib/domain/schedule";
import { timeStrToMinutes, utcToMadridParts } from "@/lib/domain/timezone";
import { formatPrice } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { ContactInbox } from "@/components/admin/contact-inbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Informes" };

function buildDateWindow(daysBack: number): string[] {
  const todayStr = utcToMadridParts(new Date()).dateStr;
  const [y, m, d] = todayStr.split("-").map((n) => parseInt(n, 10));
  const base = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const result: string[] = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const dt = new Date(base.getTime() - i * 24 * 3600 * 1000);
    result.push(dt.toISOString().slice(0, 10));
  }
  return result;
}

export default async function AdminInformesPage({
  searchParams,
}: {
  searchParams?: { range?: string };
}) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return (
      <div>
        <AdminPageHeader
          title="Informes y actividad"
          description="Acceso restringido a Dirección y Recepción."
        />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No tienes permisos para acceder a los informes globales del salón.
          </CardContent>
        </Card>
      </div>
    );
  }

  const days = searchParams?.range === "7" ? 7 : searchParams?.range === "90" ? 90 : 30;
  const windowDates = buildDateWindow(days);
  const startDateStr = windowDates[0];
  const endDateStr = windowDates[windowDates.length - 1];

  const [appointments, activePros, contactMessages, auditEvents] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        dateStrMadrid: { gte: startDateStr, lte: endDateStr },
      },
      include: { professional: { select: { name: true } } },
    }),
    prisma.professional.findMany({
      where: { active: true },
      select: { id: true, name: true },
    }),
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    user.role === "OWNER_ADMIN"
      ? prisma.auditEvent.findMany({
          orderBy: { createdAt: "desc" },
          include: { actorUser: { select: { name: true, email: true } } },
          take: 40,
        })
      : Promise.resolve([]),
  ]);

  // Desglose por estado
  const countsByStatus: Record<string, number> = {
    CONFIRMED: 0,
    PENDING_APPROVAL: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    NO_SHOW: 0,
  };

  let bookedMinutes = 0;
  let estimatedCompletedCents = 0;
  let completedConsultCount = 0;
  const byService = new Map<string, number>();
  const byPro = new Map<string, number>();

  for (const a of appointments) {
    countsByStatus[a.status] = (countsByStatus[a.status] ?? 0) + 1;

    if (a.status === "CONFIRMED" || a.status === "COMPLETED") {
      bookedMinutes +=
        a.bufferBeforeSnapshot + a.durationMinSnapshot + a.bufferAfterSnapshot;
      byService.set(a.serviceNameSnapshot, (byService.get(a.serviceNameSnapshot) ?? 0) + 1);
      byPro.set(a.professional.name, (byPro.get(a.professional.name) ?? 0) + 1);
    }

    if (a.status === "COMPLETED") {
      if (a.priceCentsSnapshot !== null && a.priceTypeSnapshot !== "CONSULT") {
        estimatedCompletedCents += a.priceCentsSnapshot;
      } else {
        completedConsultCount++;
      }
    }
  }

  // Calcular minutos disponibles reales del equipo activo en el rango seleccionado
  let availableScheduleMinutes = 0;
  if (activePros.length > 0) {
    for (const dStr of windowDates) {
      for (const pro of activePros) {
        const eff = await getEffectiveProfessionalIntervals(pro.id, dStr);
        for (const intv of eff.intervals) {
          availableScheduleMinutes +=
            timeStrToMinutes(intv.end) - timeStrToMinutes(intv.start);
        }
      }
    }
  }

  const occupationPct =
    availableScheduleMinutes > 0
      ? Math.min(100, Math.round((bookedMinutes / availableScheduleMinutes) * 1000) / 10)
      : 0;

  const totalAppts = appointments.length;
  const cancelOrNoShowRate =
    totalAppts > 0
      ? Math.round(
          (((countsByStatus.CANCELLED ?? 0) + (countsByStatus.NO_SHOW ?? 0)) /
            totalAppts) *
            1000
        ) / 10
      : 0;

  const topServices = Array.from(byService.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const topPros = Array.from(byPro.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Informes, consultas y auditoría"
        description={`Métricas operativas reales calculadas desde base de datos (${startDateStr} a ${endDateStr}).`}
        actions={
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs">
            {[
              { r: "7", label: "7 días" },
              { r: "30", label: "30 días" },
              { r: "90", label: "90 días" },
            ].map((opt) => (
              <Link
                key={opt.r}
                href={`/admin/informes?range=${opt.r}`}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  String(days) === opt.r
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Citas en periodo ({days}d)
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{totalAppts}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {countsByStatus.COMPLETED} completadas · {countsByStatus.CONFIRMED} confirmadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Ocupación horaria real
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{occupationPct}%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {bookedMinutes} min ocupados / {availableScheduleMinutes} min disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Cancelaciones y No-show
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{cancelOrNoShowRate}%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {countsByStatus.CANCELLED} canceladas · {countsByStatus.NO_SHOW} ausencias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Importe estimado servicios completados
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {formatPrice("FIXED", estimatedCompletedCents, "EUR")}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Estimación según tarifa de citas completadas (no representa cobros de caja ni TPV).
              {completedConsultCount > 0
                ? ` + ${completedConsultCount} servicio(s) «a consultar».`
                : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Servicios más solicitados</CardTitle>
          </CardHeader>
          <CardContent>
            {topServices.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Sin citas confirmadas o completadas en este rango.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {topServices.map(([name, count]) => (
                  <li key={name} className="flex items-center justify-between py-2.5">
                    <span>{name}</span>
                    <span className="font-semibold tabular-nums">{count} cita(s)</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad por profesional</CardTitle>
          </CardHeader>
          <CardContent>
            {topPros.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Sin actividad registrada en este rango.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {topPros.map(([name, count]) => (
                  <li key={name} className="flex items-center justify-between py-2.5">
                    <span>{name}</span>
                    <span className="font-semibold tabular-nums">{count} cita(s)</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bandeja de consultas recibidas (/contacto)</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactInbox
            messages={contactMessages.map((m) => ({
              id: m.id,
              name: m.name,
              email: m.email,
              phone: m.phone,
              subject: m.subject,
              message: m.message,
              status: m.status,
              createdAt: m.createdAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>

      {user.role === "OWNER_ADMIN" && (
        <Card>
          <CardHeader>
            <CardTitle>Registro de auditoría de cambios críticos (AuditEvent)</CardTitle>
          </CardHeader>
          <CardContent>
            {auditEvents.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Sin eventos de auditoría registrados.</p>
            ) : (
              <div className="divide-y divide-border text-xs">
                {auditEvents.map((ev) => (
                  <div key={ev.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div>
                      <span className="font-mono font-semibold">{ev.action}</span> ·{" "}
                      <span>{ev.summary}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {ev.actorUser?.email ?? "Sistema"} ·{" "}
                      {ev.createdAt.toLocaleString("es-ES")}
                    </span>
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
