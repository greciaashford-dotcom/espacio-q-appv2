import React from "react";
import { getPublicShellData } from "@/lib/domain/public-context";
import { PublicShell } from "@/components/public/public-shell";

export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings, headerFooter, newsletterConfig, cookieBanner, salonMeta } =
    await getPublicShellData();

  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: settings.brandName,
    description: settings.tagline,
    url: process.env.APP_URL || "http://localhost:3000",
    priceRange: "€€",
    address: {
      "@type": "PostalAddress",
      addressLocality: settings.city,
      addressCountry: "ES",
      ...(settings.addressLine ? { streetAddress: settings.addressLine } : {}),
      ...(settings.postalCode ? { postalCode: settings.postalCode } : {}),
    },
    hasMap: settings.googleMapsUrl,
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicShell
        headerFooter={headerFooter}
        newsletterConfig={newsletterConfig}
        cookieBanner={cookieBanner}
        salonMeta={salonMeta}
      >
        {children}
      </PublicShell>
    </>
  );
}
