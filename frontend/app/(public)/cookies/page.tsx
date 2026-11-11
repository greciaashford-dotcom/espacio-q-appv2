import React from "react";
import type { Metadata } from "next";
import { withSeo } from "@/lib/seo/site";
import { getLegalDocument } from "@/lib/domain/cms";
import { LegalDocumentView } from "@/components/public/legal-document-view";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getLegalDocument("legal_cookies");
  return withSeo({
    title: doc.seoTitle || "Política de Cookies · ESPACIO Q Madrid",
    description:
      doc.seoDescription ||
      "Información sobre el uso de cookies y tecnologías de almacenamiento local en ESPACIO Q.",
    alternates: { canonical: "/cookies" },
  });
}

export default async function CookiesPage({
  searchParams,
}: {
  searchParams?: { preview?: string };
}) {
  const isPreview = searchParams?.preview === "1";
  const doc = await getLegalDocument("legal_cookies", {
    previewDraft: isPreview,
  });

  return (
    <LegalDocumentView
      doc={doc.data}
      settings={doc.settings}
      missingLegalFields={doc.missingLegalFields}
      currentPath="/cookies"
      version={doc.version}
    />
  );
}
