import React from "react";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, canManageCatalogOrCms } from "@/lib/auth/session";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { TeamManager } from "@/components/admin/team-manager";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Equipo" };

export default async function AdminEquipoPage() {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return (
      <div>
        <AdminPageHeader title="Equipo" description="Acceso restringido a Dirección y Recepción." />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No tienes permisos para editar miembros del equipo.
          </CardContent>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const [professionals, services, mediaAssets] = await Promise.all([
    prisma.professional.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        services: { where: { active: true }, select: { serviceId: true } },
        _count: {
          select: {
            appointments: {
              where: {
                startAtUtc: { gte: now },
                status: { in: ["CONFIRMED", "PENDING_APPROVAL"] },
              },
            },
          },
        },
      },
    }),
    prisma.service.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { category: { select: { name: true } } },
    }),
    prisma.mediaAsset.findMany({
      where: { publicVisible: true },
      orderBy: { internalName: "asc" },
      select: { id: true, internalName: true },
    }),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Equipo profesional"
        description="Perfiles del salón, visibilidad pública, matriz de servicios y protección de citas futuras ante bajas."
      />
      <TeamManager
        professionals={professionals.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          roleTitle: p.roleTitle,
          bio: p.bio,
          specialties: p.specialties,
          photoAssetId: p.photoAssetId,
          active: p.active,
          publicVisible: p.publicVisible,
          sortOrder: p.sortOrder,
          serviceIds: p.services.map((s) => s.serviceId),
          futureAppointmentsCount: p._count.appointments,
        }))}
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          categoryName: s.category.name,
        }))}
        mediaAssets={mediaAssets}
      />
    </div>
  );
}
