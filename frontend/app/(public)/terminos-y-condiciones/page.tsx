import React from "react";
import type { Metadata } from "next";
import { getLegalDocument } from "@/lib/domain/cms";
import { LegalDocumentView } from "@/components/public/legal-document-view";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getLegalDocument("legal_terminos_condiciones");
  return {
    title: doc.seoTitle || "Términos y Condiciones Generales · ESPACIO Q Madrid",
    description:
      doc.seoDescription ||
      "Términos y condiciones generales de prestación de servicios y uso de la web de ESPACIO Q.",
    alternates: { canonical: "/terminos-y-condiciones" },
  };
}

export default async function TerminosYCondicionesPage({
  searchParams,
}: {
  searchParams?: { preview?: string };
}) {
  const isPreview = searchParams?.preview === "1";
  const doc = await getLegalDocument("legal_terminos_condiciones", {
    previewDraft: isPreview,
  });

  return (
    <LegalDocumentView
      doc={doc.data}
      settings={doc.settings}
      missingLegalFields={doc.missingLegalFields}
      currentPath="/terminos-y-condiciones"
      version={doc.version}
    />
  );
}
