import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import {
  normalizeEquipoPageData,
  normalizeGaleriaPageData,
  normalizeHomeSectionsData,
} from "@/lib/domain/cms";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { CmsEditor } from "@/components/admin/cms-editor";

export const metadata = { title: "Editar contenido" };

export default async function EditContentPage({ params }: { params: { key: string } }) {
  const page = await prisma.pageContent.findUnique({
    where: { key: params.key },
    include: { revisions: { orderBy: { version: "desc" }, take: 30 } },
  });
  if (!page) notFound();

  const [assets, settings] = await Promise.all([
    prisma.mediaAsset.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
    prisma.salonSettings.findUnique({ where: { id: "default" } }),
  ]);

  const placeholders =
    page.category === "LEGAL"
      ? [
          { token: "{{brandName}}", description: "Marca", value: settings?.brandName ?? null },
          { token: "{{legalOwnerName}}", description: "Titular / razón social", value: settings?.legalOwnerName ?? null },
          { token: "{{legalTaxId}}", description: "NIF / CIF", value: settings?.legalTaxId ?? null },
          { token: "{{legalRegisteredAddress}}", description: "Domicilio", value: settings?.legalRegisteredAddress ?? null },
          { token: "{{legalRegistryInfo}}", description: "Datos registrales", value: settings?.legalRegistryInfo ?? null },
          { token: "{{legalDpoEmail}}", description: "Email de privacidad", value: settings?.legalDpoEmail ?? null },
          { token: "{{contactEmail}}", description: "Email de contacto", value: settings?.contactEmail ?? null },
          { token: "{{phone}}", description: "Teléfono", value: settings?.phone ?? null },
          { token: "{{cancellationFreeHours}}", description: "Horas de cancelación gratuita", value: String(settings?.cancellationFreeHours ?? 24) },
          { token: "{{contactRetentionDays}}", description: "Días de conservación de consultas", value: String(settings?.contactRetentionDays ?? 365) },
        ]
      : undefined;

  const previewPath = page.slug || "/";

  return (
    <div>
      <AdminPageHeader
        title={page.title}
        description={
          page.category === "LEGAL"
            ? "Borrador legal editable. Revísalo con tu asesoría antes de publicarlo como definitivo; los datos fiscales se toman de Configuración."
            : "Edita los textos, enlaces e imágenes de este bloque. Los cambios no se ven en la web hasta publicarlos."
        }
        breadcrumbs={[
          { label: "Panel", href: "/admin" },
          { label: "Contenido", href: "/admin/contenido" },
          { label: page.title },
        ]}
        actions={
          <Link href={previewPath} target="_blank" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-accent">
            <ExternalLink className="h-3.5 w-3.5" /> Ver versión publicada
          </Link>
        }
      />
      <CmsEditor
        blockKey={page.key}
        title={page.title}
        category={page.category}
        previewPath={previewPath}
        initialDraft={
          page.key === "home_sections"
            ? normalizeHomeSectionsData(page.draftData)
            : page.key === "page_galeria"
              ? normalizeGaleriaPageData(page.draftData)
              : page.key === "page_equipo"
                ? normalizeEquipoPageData(page.draftData)
                : page.draftData
        }
        seoTitle={page.seoTitle}
        seoDescription={page.seoDescription}
        hasUnpublished={page.hasUnpublished}
        version={page.version}
        revisions={page.revisions.map((r) => ({
          id: r.id,
          version: r.version,
          changeNote: r.changeNote,
          createdBy: r.createdBy,
          createdAt: r.createdAt.toISOString(),
        }))}
        assets={assets.map((a) => ({
          id: a.id,
          src: a.src,
          altText: a.altText,
          internalName: a.internalName,
          category: a.category,
          focalPointX: a.focalPointX,
          focalPointY: a.focalPointY,
          isProvisional: a.isProvisional,
        }))}
        placeholders={placeholders}
      />
    </div>
  );
}
