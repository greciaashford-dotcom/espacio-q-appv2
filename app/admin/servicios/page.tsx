import React from "react";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, canManageCatalogOrCms } from "@/lib/auth/session";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { ServicesManager } from "@/components/admin/services-manager";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Servicios" };

export default async function AdminServiciosPage() {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return (
      <div>
        <AdminPageHeader title="Servicios" description="Acceso restringido a Dirección y Recepción." />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No tienes permisos para editar el catálogo de servicios.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [categories, services, mediaAssets] = await Promise.all([
    prisma.serviceCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { services: true } } },
    }),
    prisma.service.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        category: { select: { name: true } },
        _count: { select: { professionals: { where: { active: true } } } },
      },
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
        title="Servicios y tarifas"
        description="Gestiona categorías, duraciones, buffers entre citas y precios reales en euros."
      />
      <ServicesManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          sortOrder: c.sortOrder,
          active: c.active,
          servicesCount: c._count.services,
        }))}
        services={services.map((s) => ({
          id: s.id,
          categoryId: s.categoryId,
          categoryName: s.category.name,
          name: s.name,
          slug: s.slug,
          shortDescription: s.shortDescription,
          description: s.description,
          durationMin: s.durationMin,
          bufferBeforeMin: s.bufferBeforeMin,
          bufferAfterMin: s.bufferAfterMin,
          priceType: s.priceType,
          priceCents: s.priceCents,
          featured: s.featured,
          active: s.active,
          imageAssetId: s.imageAssetId,
          seoTitle: s.seoTitle,
          seoDescription: s.seoDescription,
          sortOrder: s.sortOrder,
          professionalsCount: s._count.professionals,
        }))}
        mediaAssets={mediaAssets}
      />
    </div>
  );
}
