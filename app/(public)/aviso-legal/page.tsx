import React from "react";
import type { Metadata } from "next";
import { getLegalDocument } from "@/lib/domain/cms";
import { LegalDocumentView } from "@/components/public/legal-document-view";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getLegalDocument("legal_aviso_legal");
  return {
    title: doc.seoTitle || "Aviso Legal · ESPACIO Q Madrid",
    description:
      doc.seoDescription ||
      "Aviso Legal e información general de ESPACIO Q en cumplimiento de la LSSI-CE.",
    alternates: { canonical: "/aviso-legal" },
  };
}

export default async function AvisoLegalPage({
  searchParams,
}: {
  searchParams?: { preview?: string };
}) {
  const isPreview = searchParams?.preview === "1";
  const doc = await getLegalDocument("legal_aviso_legal", {
    previewDraft: isPreview,
  });

  return (
    <LegalDocumentView
      doc={doc.data}
      settings={doc.settings}
      missingLegalFields={doc.missingLegalFields}
      currentPath="/aviso-legal"
      version={doc.version}
    />
  );
}
