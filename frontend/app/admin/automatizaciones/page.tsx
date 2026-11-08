import React from "react";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, canManageCatalogOrCms } from "@/lib/auth/session";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { AutomationsManager } from "@/components/admin/automations-manager";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Automatizaciones" };

export default async function AdminAutomatizacionesPage() {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return (
      <div>
        <AdminPageHeader
          title="Automatizaciones y Entregas"
          description="Acceso restringido a Dirección y Recepción."
        />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No tienes permisos para acceder a la cola de notificaciones.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [rules, templates, groupedJobs, recentJobs, deliveries] = await Promise.all([
    prisma.automationRule.findMany({ orderBy: { key: "asc" } }),
    prisma.emailTemplate.findMany({ orderBy: { key: "asc" } }),
    prisma.notificationJob.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.notificationJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.emailDelivery.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const jobCounts: Record<string, number> = {};
  for (const g of groupedJobs) {
    jobCounts[g.status] = g._count._all;
  }

  return (
    <div>
      <AdminPageHeader
        title="Automatizaciones, cola y buzón de correos"
        description="Reglas de confirmación/recordatorio, worker transaccional y registro auditable de correos enviados o guardados en buzón local."
      />
      <AutomationsManager
        rules={rules}
        templates={templates}
        jobCounts={jobCounts}
        recentJobs={recentJobs.map((j) => ({
          id: j.id,
          jobType: j.jobType,
          dedupKey: j.dedupKey,
          status: j.status,
          scheduledAtUtc: j.scheduledAtUtc.toISOString(),
          attempts: j.attempts,
          lastError: j.lastError,
        }))}
        deliveries={deliveries.map((d) => ({
          id: d.id,
          category: d.category,
          templateKey: d.templateKey,
          toEmail: d.toEmail,
          subject: d.subject,
          status: d.status,
          providerName: d.providerName,
          htmlBody: d.htmlBody,
          textBody: d.textBody,
          providerMessageId: d.providerMessageId ?? null,
          errorMessage: d.errorMessage ?? null,
          createdAt: d.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
