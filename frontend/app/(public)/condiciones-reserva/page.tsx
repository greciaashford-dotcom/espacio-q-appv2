import React from "react";
import type { Metadata } from "next";
import { withSeo } from "@/lib/seo/site";
import { getLegalDocument } from "@/lib/domain/cms";
import { LegalDocumentView } from "@/components/public/legal-document-view";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getLegalDocument("legal_condiciones_reserva");
  return withSeo({
    title: doc.seoTitle || "Condiciones de Reserva y Cancelación · ESPACIO Q Madrid",
    description:
      doc.seoDescription ||
      "Política de reservas online, modificaciones, cancelaciones y puntualidad de ESPACIO Q.",
    alternates: { canonical: "/condiciones-reserva" },
  });
}

export default async function CondicionesReservaPage({
  searchParams,
}: {
  searchParams?: { preview?: string };
}) {
  const isPreview = searchParams?.preview === "1";
  const doc = await getLegalDocument("legal_condiciones_reserva", {
    previewDraft: isPreview,
  });

  return (
    <LegalDocumentView
      doc={doc.data}
      settings={doc.settings}
      missingLegalFields={doc.missingLegalFields}
      currentPath="/condiciones-reserva"
      version={doc.version}
    />
  );
}
