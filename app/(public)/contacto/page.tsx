import React from "react";
import type { Metadata } from "next";
import { Clock, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { getPublishedCmsBlock } from "@/lib/domain/cms";
import { getPublicShellData } from "@/lib/domain/public-context";
import { ContactForm } from "@/components/public/contact-form";

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
              <a href={meta.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium underline">
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
      </div>
    </div>
  );
}
