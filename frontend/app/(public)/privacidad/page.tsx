import React from "react";
import type { Metadata } from "next";
import { withSeo } from "@/lib/seo/site";
import { getLegalDocument } from "@/lib/domain/cms";
import { LegalDocumentView } from "@/components/public/legal-document-view";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getLegalDocument("legal_privacidad");
  return withSeo({
    title: doc.seoTitle || "Política de Privacidad · ESPACIO Q Madrid",
    description:
      doc.seoDescription ||
      "Información sobre protección de datos personales conforme al RGPD y LOPDGDD en ESPACIO Q.",
    alternates: { canonical: "/privacidad" },
  });
}

export default async function PrivacidadPage({
  searchParams,
}: {
  searchParams?: { preview?: string };
}) {
  const isPreview = searchParams?.preview === "1";
  const doc = await getLegalDocument("legal_privacidad", {
    previewDraft: isPreview,
  });

  return (
    <LegalDocumentView
      doc={doc.data}
      settings={doc.settings}
      missingLegalFields={doc.missingLegalFields}
      currentPath="/privacidad"
      version={doc.version}
    />
  );
}
