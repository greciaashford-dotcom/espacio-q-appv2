import React from "react";
import { prisma } from "@/lib/db/prisma";
import { ensureBaseCmsAndSettings } from "@/lib/domain/cms";
import { getCurrentUser, canManageCatalogOrCms } from "@/lib/auth/session";
import { parseIntervalsJson } from "@/lib/domain/schedule";
import { getGoogleIntegrationConfigStatus } from "@/lib/integrations/google";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { SchedulesManager } from "@/components/admin/schedules-manager";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Horarios" };

function build7Days(rows: Array<{ dayOfWeek: number; isOpen: boolean; intervalsJson: unknown }>) {
  return [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const found = rows.find((r) => r.dayOfWeek === d);
    return {
      dayOfWeek: d,
      isOpen: found ? found.isOpen : false,
      intervals: found ? parseIntervalsJson(found.intervalsJson) : [],
    };
  });
}

export default async function AdminHorariosPage() {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return (
      <div>
        <AdminPageHeader title="Horarios" description="Acceso restringido a Dirección y Recepción." />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No tienes permisos para modificar los horarios del salón.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [
    settings,
    allSchedules,
    professionals,
    exceptions,
    conflicts,
    googleConn,
    syncEvents,
  ] = await Promise.all([
    ensureBaseCmsAndSettings(),
    prisma.workingSchedule.findMany({ orderBy: { dayOfWeek: "asc" } }),
    prisma.professional.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.scheduleException.findMany({
      orderBy: { dateStr: "asc" },
      include: { professional: { select: { name: true } } },
      take: 60,
    }),
    prisma.scheduleConflictAlert.findMany({
      where: { resolved: false },
      orderBy: { createdAt: "desc" },
      include: { appointment: true },
    }),
    prisma.integrationConnection.findUnique({ where: { provider: "GOOGLE_BUSINESS" } }),
    prisma.syncEvent.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const salonManualRows = allSchedules.filter(
    (s) => s.targetType === "SALON" && s.source === "MANUAL"
  );
  const salonDays = build7Days(salonManualRows);

  const proSchedulesByProId: Record<string, { hasCustom: boolean; days: ReturnType<typeof build7Days> }> = {};
  for (const pro of professionals) {
    const proRows = allSchedules.filter(
      (s) => s.targetType === "PROFESSIONAL" && s.professionalId === pro.id
    );
    proSchedulesByProId[pro.id] = {
      hasCustom: proRows.length > 0,
      days: proRows.length > 0 ? build7Days(proRows) : salonDays,
    };
  }

  const googleCfg = getGoogleIntegrationConfigStatus();

  return (
    <div>
      <AdminPageHeader
        title="Horarios, turnos y sincronización"
        description="Gestiona el horario regular en Europe/Madrid, turnos partidos por profesional, festivos y sincronización con Google."
      />
      <SchedulesManager
        salonDays={salonDays}
        proSchedulesByProId={proSchedulesByProId}
        professionals={professionals}
        scheduleConfirmed={settings.scheduleConfirmed}
        activeScheduleSource={settings.activeScheduleSource}
        exceptions={exceptions.map((ex) => ({
          id: ex.id,
          targetType: ex.targetType,
          professionalName: ex.professional?.name ?? null,
          dateStr: ex.dateStr,
          isClosed: ex.isClosed,
          intervals: parseIntervalsJson(ex.intervalsJson),
          reason: ex.reason,
          source: ex.source,
        }))}
        conflicts={conflicts.map((c) => ({
          id: c.id,
          referenceCode: c.appointment.referenceCode,
          customerName: c.appointment.customerName,
          dateStrMadrid: c.appointment.dateStrMadrid,
          startTimeMadrid: c.appointment.startTimeMadrid,
          reason: c.reason,
          source: c.source,
        }))}
        googleStatus={{
          hasBusinessOAuth: googleCfg.hasBusinessOAuth,
          hasPlacesApi: googleCfg.hasPlacesApi,
          connectionStatus: googleConn?.status ?? "PENDING_CREDENTIALS",
          externalLocationTitle: googleConn?.externalLocationTitle ?? null,
          lastSyncAt: googleConn?.lastSyncAt ? googleConn.lastSyncAt.toISOString() : null,
          isOwnerAdmin: user.role === "OWNER_ADMIN",
        }}
        syncEvents={syncEvents.map((ev) => ({
          id: ev.id,
          provider: ev.provider,
          status: ev.status,
          summary: ev.summary,
          createdAt: ev.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
