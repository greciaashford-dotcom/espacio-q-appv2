import React from "react";
import { prisma } from "@/lib/db/prisma";
import { getAllowedImageDomains } from "@/lib/security/ssrf";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { MediaManager } from "@/components/admin/media-manager";

export const metadata = { title: "Biblioteca multimedia" };

export default async function MultimediaPage() {
  const [assets, cmsPages] = await Promise.all([
    prisma.mediaAsset.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      include: {
        usages: true,
        services: { select: { name: true } },
        professionals: { select: { name: true } },
      },
    }),
    prisma.pageContent.findMany({
      select: { title: true, publishedData: true },
    }),
  ]);

  const items = assets.map((a) => {
    const usageLabels: string[] = [
      ...a.usages.map((u) => u.locationName),
      ...a.services.map((s) => `Servicio: ${s.name}`),
      ...a.professionals.map((p) => `Equipo: ${p.name}`),
    ];
    for (const p of cmsPages) {
      if (JSON.stringify(p.publishedData).includes(a.src)) {
        usageLabels.push(p.title);
      }
    }
    return {
      id: a.id,
      internalName: a.internalName,
      src: a.src,
      sourceType: a.sourceType,
      altText: a.altText,
      caption: a.caption,
      category: a.category,
      focalPointX: a.focalPointX,
      focalPointY: a.focalPointY,
      sortOrder: a.sortOrder,
      authorCredit: a.authorCredit,
      licenseNote: a.licenseNote,
      isProvisional: a.isProvisional,
      publicVisible: a.publicVisible,
      usageLabels: Array.from(new Set(usageLabels)),
    };
  });

  return (
    <div>
      <AdminPageHeader
        title="Biblioteca multimedia"
        description="Gestiona las fotografías del hero 3D, newsletter, servicios, equipo y galería. Detecta dónde se usa cada imagen antes de borrarla."
        breadcrumbs={[
          { label: "Panel", href: "/admin" },
          { label: "Multimedia" },
        ]}
      />
      <MediaManager
        assets={items}
        allowedDomains={getAllowedImageDomains()}
      />
    </div>
  );
}
