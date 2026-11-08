import React from "react";
import type { Metadata } from "next";
import { Bus, Clock, ExternalLink, Mail, MapPin, Navigation, Phone, SquareParking, TrainFront } from "lucide-react";
import { getPublishedCmsBlock } from "@/lib/domain/cms";
import { getPublicShellData } from "@/lib/domain/public-context";
import { ContactForm } from "@/components/public/contact-form";
import { ContactMap } from "@/components/public/contact-map";
import { Button } from "@/components/ui/button";
import { buildDirectionsUrl, buildGoogleEmbedUrl, getSalonLocation, type SalonLocation } from "@/lib/domain/location";

export async function generateMetadata(): Promise<Metadata> {
  const block = await getPublishedCmsBlock("page_contacto");
  return {
    title: block.seoTitle || "Contacto · ESPACIO Q Madrid",
    description: block.seoDescription || undefined,
    alternates: { canonical: "/contacto" },
  };
}

export default async function ContactoPage({
  searchParams,
}: {
  searchParams?: { preview?: string };
}) {
  const [block, shell] = await Promise.all([
    getPublishedCmsBlock<Record<string, any>>("page_contacto", {
      previewDraft: searchParams?.preview === "1",
    }),
    getPublicShellData(),
  ]);
  const cms = block.data || {};
  const meta = shell.salonMeta;
  const location = getSalonLocation(meta);
  const directions: Directions = cms.directions && typeof cms.directions === "object" ? cms.directions : {};
  const addressText = meta.addressLine
    ? `${meta.addressLine}${meta.postalCode ? `, ${meta.postalCode}` : ""}, ${meta.city}`
    : `${meta.city}, España`;

  return (
    <div className="py-16 sm:py-24">
      <div className="container mx-auto space-y-12">
        <header className="max-w-3xl space-y-4">
          {cms.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {cms.eyebrow}
            </p>
          )}
          <h1 style={{ fontSize: "clamp(2.2rem, 4.2vw, 3.5rem)" }} className="font-serif font-normal leading-tight">
            {cms.title}
          </h1>
          {cms.description && <p className="text-base text-muted-foreground sm:text-lg">{cms.description}</p>}
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ContactForm cms={cms} />
          </div>
          <aside className="space-y-6 rounded-editorial border border-border bg-card p-5 sm:p-6 lg:col-span-5">
            <div className="space-y-2 text-sm">
              <h2 className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 shrink-0" /> Ubicación</h2>
              <p className="text-muted-foreground">
                {meta.addressLine ? `${meta.addressLine}${meta.postalCode ? `, ${meta.postalCode}` : ""}, ${meta.city}` : `${meta.city}, España`}
              </p>
              <a href={meta.googleMapsUrl} target="_blank" rel="noopener noreferrer" data-testid="contact-map-open-google-link" className="inline-flex items-center gap-1 text-xs font-medium underline">
                Abrir en Google Maps <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
            {meta.phone && (
              <p className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 shrink-0" /><a href={`tel:${meta.phone.replace(/\s+/g, "")}`}>{meta.phone}</a></p>
            )}
            {meta.contactEmail && (
              <p className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 shrink-0" /><a href={`mailto:${meta.contactEmail}`} className="break-all sm:break-normal">{meta.contactEmail}</a></p>
            )}
            <div className="space-y-2 text-sm">
              <h2 className="flex items-center gap-2 font-semibold"><Clock className="h-4 w-4" /> Horario</h2>
              {meta.scheduleConfirmed ? (
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {meta.weeklySummary.map((d) => (
                    <li key={d.dayName} className="flex justify-between gap-3">
                      <span className="font-medium text-foreground">{d.dayName}</span>
                      <span>{d.isOpen ? d.hoursText : "Cerrado"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Horario oficial pendiente de confirmación por el salón.</p>
              )}
            </div>
          </aside>
        </div>

        <ContactLocationSection
          location={location}
          directions={directions}
          addressText={addressText}
        />
      </div>
    </div>
  );
}

type Directions = { title?: string; metro?: string; bus?: string; parking?: string };

function ContactLocationSection({
  location,
  directions,
  addressText,
}: {
  location: SalonLocation;
  directions: Directions;
  addressText: string;
}) {
  const items = [
    { key: "metro", label: "Metro", icon: TrainFront, text: directions.metro },
    { key: "bus", label: "Autobús", icon: Bus, text: directions.bus },
    { key: "parking", label: "Aparcamiento", icon: SquareParking, text: directions.parking },
  ].filter((i) => i.text && i.text.trim());

  return (
    <section aria-label="Ubicación y cómo llegar" className="space-y-6" data-testid="contact-location-section">
      <ContactMap
        lat={location.latitude}
        lng={location.longitude}
        name={location.name}
        address={addressText}
        googleEmbedUrl={buildGoogleEmbedUrl(location)}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="contact-map-address">
            <MapPin className="h-4 w-4 shrink-0 text-foreground" aria-hidden="true" /> {addressText}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="sm" data-testid="contact-directions-btn">
              <a href={buildDirectionsUrl(location)} target="_blank" rel="noopener noreferrer">
                <Navigation className="h-4 w-4" aria-hidden="true" /> Cómo llegar
              </a>
            </Button>
          </div>
        </div>
      </ContactMap>

      {items.length > 0 && (
        <div className="space-y-4" data-testid="contact-directions-block">
          <h2 className="font-serif text-2xl font-normal">
            {directions.title || "Cómo llegar"}
          </h2>
          <dl className={`grid grid-cols-1 gap-4 ${items.length === 3 ? "md:grid-cols-3" : items.length === 2 ? "md:grid-cols-2" : ""}`}>
            {items.map(({ key, label, icon: Icon, text }) => (
              <div key={key} className="space-y-1.5 rounded-editorial border border-border bg-card p-5" data-testid={`contact-directions-${key}`}>
                <dt className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> {label}
                </dt>
                <dd className="whitespace-pre-line text-sm text-muted-foreground">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
