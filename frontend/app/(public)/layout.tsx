import React from "react";
import { getPublicShellData } from "@/lib/domain/public-context";
import { PublicShell } from "@/components/public/public-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { salonGraph } from "@/lib/seo/json-ld";
import { ESPACIO_Q_LOCATION_METADATA } from "@/lib/domain/default-services-catalog";

export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings, headerFooter, newsletterConfig, cookieBanner, salonMeta } =
    await getPublicShellData();

  const jsonLd = salonGraph({
    brandName: settings.brandName,
    tagline: settings.tagline,
    addressLine: settings.addressLine,
    postalCode: settings.postalCode,
    city: settings.city,
    phone: settings.phone,
    contactEmail: settings.contactEmail,
    googleMapsUrl: settings.googleMapsUrl,
    sameAs: [settings.instagramUrl, settings.facebookUrl, settings.tiktokUrl].filter(Boolean) as string[],
    latitude: ESPACIO_Q_LOCATION_METADATA.latitude,
    longitude: ESPACIO_Q_LOCATION_METADATA.longitude,
    scheduleConfirmed: salonMeta.scheduleConfirmed,
    weekly: salonMeta.weeklySummary,
  });

  return (
    <>
      <JsonLd id="jsonld-salon" data={jsonLd} />
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
