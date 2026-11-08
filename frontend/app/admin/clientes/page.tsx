import React from "react";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, canManageCatalogOrCms, canExportCrm } from "@/lib/auth/session";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { ClientsManager } from "@/components/admin/clients-manager";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Clientes" };

const PAGE_SIZE = 25;

export default async function AdminClientesPage({
  searchParams,
}: {
  searchParams?: { q?: string; tag?: string; status?: string; page?: string };
}) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return (
      <div>
        <AdminPageHeader
          title="Clientes (CRM)"
          description="Acceso restringido a Dirección y Recepción."
        />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Por privacidad RGPD, las cuentas con perfil Profesional solo acceden a sus propias citas del día y no al listado global de clientes ni exportaciones.
          </CardContent>
        </Card>
      </div>
    );
  }

  const searchQuery = searchParams?.q?.trim() || "";
  const tagFilter = searchParams?.tag?.trim() || "";
  const statusFilter = searchParams?.status?.trim() || "";
  const page = Math.max(1, parseInt(searchParams?.page || "1", 10) || 1);

  const where: any = {
    status: statusFilter === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
  };

  if (searchQuery) {
    where.OR = [
      { firstName: { contains: searchQuery, mode: "insensitive" } },
      { lastName: { contains: searchQuery, mode: "insensitive" } },
      { emailNormalized: { contains: searchQuery.toLowerCase() } },
      { phone: { contains: searchQuery } },
    ];
  }

  if (tagFilter) {
    where.tags = { has: tagFilter };
  }

  const [totalCount, clients] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { appointments: true } },
        appointments: {
          orderBy: { startAtUtc: "desc" },
          take: 3,
          select: {
            id: true,
            referenceCode: true,
            dateStrMadrid: true,
            serviceNameSnapshot: true,
            status: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div>
      <AdminPageHeader
        title="Clientes y CRM"
        description="Fichas de cliente, historial de servicios, trazabilidad de consentimientos, anonimización RGPD e importación/exportación Excel (.xlsx)."
      />
      <ClientsManager
        clients={clients.map((c) => ({
          id: c.id,
          externalId: c.externalId,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          tags: c.tags,
          internalNotes: c.internalNotes,
          marketingConsent: c.marketingConsent,
          status: c.status,
          appointmentsCount: c._count.appointments,
          recentAppointments: c.appointments.map((a: any) => ({
            id: a.id,
            referenceCode: a.referenceCode,
            dateStrMadrid: a.dateStrMadrid,
            serviceName: a.serviceNameSnapshot,
            status: a.status,
          })),
        }))}
        totalCount={totalCount}
        page={page}
        totalPages={totalPages}
        searchQuery={searchQuery}
        tagFilter={tagFilter}
        statusFilter={statusFilter}
        canExport={canExportCrm(user)}
        isOwnerAdmin={user.role === "OWNER_ADMIN"}
      />
    </div>
  );
}
