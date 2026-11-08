import React from "react";
import { isEmailProviderConfigured } from "@/lib/email/provider";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, canManageCampaigns } from "@/lib/auth/session";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { MarketingManager } from "@/components/admin/marketing-manager";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Marketing" };

export default async function AdminMarketingPage() {
  const user = await getCurrentUser();
  if (!user || !canManageCampaigns(user)) {
    return (
      <div>
        <AdminPageHeader
          title="Marketing y Newsletter"
          description="Acceso restringido a usuarios con permiso explícito de comunicaciones comerciales."
        />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Tu cuenta no tiene habilitado el módulo de campañas de marketing.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [
    activeCount,
    pendingCount,
    unsubscribedCount,
    suppressionCount,
    campaigns,
    subscribers,
    suppressions,
  ] = await Promise.all([
    prisma.subscriber.count({ where: { status: "ACTIVE" } }),
    prisma.subscriber.count({ where: { status: "PENDING" } }),
    prisma.subscriber.count({ where: { status: "UNSUBSCRIBED" } }),
    prisma.suppression.count(),
    prisma.campaign.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.subscriber.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.suppression.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Marketing y Newsletter"
        description="Gestión de suscriptores double opt-in, lista de supresión LSSI/RGPD y envío de campañas editoriales."
      />
      <MarketingManager
        stats={{
          activeCount,
          pendingCount,
          unsubscribedCount,
          suppressionCount,
        }}
        emailProviderReady={isEmailProviderConfigured()}
        campaigns={campaigns.map((c) => {
          const filter = (c.segmentFilterJson ?? {}) as { tags?: string[] };
          return {
            id: c.id,
            name: c.name,
            subject: c.subject,
            preheader: c.preheader,
            heading: c.heading,
            bodyText: c.bodyText,
            ctaLabel: c.ctaLabel,
            ctaUrl: c.ctaUrl,
            tags: Array.isArray(filter.tags) ? filter.tags : [],
            status: c.status,
            totalRecipients: c.totalRecipients,
            acceptedCount: c.acceptedCount,
            deliveredCount: c.deliveredCount,
            bouncedCount: c.bouncedCount,
            complainedCount: c.complainedCount,
            createdAt: c.createdAt.toISOString(),
          };
        })}
        subscribers={subscribers.map((s) => ({
          id: s.id,
          email: s.email,
          firstName: s.firstName,
          status: s.status,
          confirmedAt: s.confirmedAt ? s.confirmedAt.toISOString() : null,
          source: s.source,
        }))}
        suppressions={suppressions.map((sup) => ({
          id: sup.id,
          emailNormalized: sup.emailNormalized,
          reason: sup.reason,
          createdAt: sup.createdAt.toISOString(),
        }))}
        defaultTestEmail={user.email}
      />
    </div>
  );
}
