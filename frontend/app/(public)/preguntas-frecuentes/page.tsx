import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { HelpCircle } from "lucide-react";
import { getPublishedFaq } from "@/lib/domain/faq";
import { JsonLd } from "@/components/seo/json-ld";
import { faqGraph } from "@/lib/seo/json-ld";
import { withSeo } from "@/lib/seo/site";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const { block } = await getPublishedFaq();
  return withSeo({
    title: block.seoTitle || "Preguntas frecuentes · ESPACIO Q Madrid",
    description:
      block.seoDescription ||
      "Dudas habituales sobre ESPACIO Q en Chueca, Madrid: ubicación, horario, reservas, cancelaciones, aparcamiento y precios.",
    alternates: { canonical: "/preguntas-frecuentes" },
  });
}

export default async function FaqPage({ searchParams }: { searchParams?: { preview?: string } }) {
  const { data, items } = await getPublishedFaq({ previewDraft: searchParams?.preview === "1" });

  return (
    <div className="py-16 sm:py-24">
      {items.length > 0 && <JsonLd id="jsonld-faq" data={faqGraph(items)} />}
      <div className="container mx-auto grid grid-cols-1 gap-12 lg:grid-cols-12">
        <header className="space-y-4 lg:col-span-4">
          {data.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{data.eyebrow}</p>
          )}
          <h1 style={{ fontSize: "clamp(2.2rem, 4.2vw, 3.5rem)" }} className="font-serif font-normal leading-tight">
            {data.title || "Preguntas frecuentes"}
          </h1>
          {data.description && <p className="text-base text-muted-foreground sm:text-lg">{data.description}</p>}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="sm" data-testid="faq-book-btn">
              <Link href="/reservar">Reservar cita</Link>
            </Button>
            <Button asChild size="sm" variant="outline" data-testid="faq-contact-btn">
              <Link href="/contacto">Contactar</Link>
            </Button>
          </div>
        </header>

        <div className="lg:col-span-8">
          {items.length === 0 ? (
            <div data-testid="faq-empty-state" className="rounded-editorial border border-border bg-card p-8 text-center sm:p-12">
              <HelpCircle className="mx-auto h-7 w-7 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm text-muted-foreground">
                {data.emptyStateMessage ||
                  "Estamos preparando las respuestas a las preguntas más habituales. Mientras tanto, escríbenos desde Contacto."}
              </p>
            </div>
          ) : (
            <div data-testid="faq-list" className="divide-y divide-border rounded-editorial border border-border bg-card">
              {items.map((item, idx) => (
                <details key={idx} className="group p-5 sm:p-6" data-testid={`faq-item-${idx}`} open={idx === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm font-serif text-lg font-medium text-foreground sm:text-xl [&::-webkit-details-marker]:hidden">
                    <h2 className="text-left text-[inherit] font-[inherit]">{item.question}</h2>
                    <span aria-hidden="true" className="text-sm text-muted-foreground transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">{item.answer}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
