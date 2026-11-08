import React from "react";
import Link from "next/link";
import { AlertTriangle, FileText, Scale, ShieldCheck } from "lucide-react";
import type { LegalDocumentData } from "@/lib/domain/cms-defaults";
import {
  interpolateLegalPlaceholders,
  type LegalPlaceholderContext,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const ALL_LEGAL_DOCS = [
  { href: "/aviso-legal", label: "Aviso Legal" },
  { href: "/terminos-y-condiciones", label: "Términos y Condiciones" },
  { href: "/condiciones-reserva", label: "Condiciones de Reserva" },
  { href: "/privacidad", label: "Política de Privacidad" },
  { href: "/cookies", label: "Política de Cookies" },
];

export function LegalDocumentView({
  doc,
  settings,
  missingLegalFields,
  currentPath,
  version,
}: {
  doc: LegalDocumentData;
  settings: LegalPlaceholderContext | null;
  missingLegalFields: string[];
  currentPath: string;
  version: number;
}) {
  const ctx: LegalPlaceholderContext = settings ?? {};
  const introText = interpolateLegalPlaceholders(doc.intro || "", ctx);

  return (
    <div className="py-14 sm:py-20">
      <div className="container mx-auto max-w-5xl">
        {/* Navegación entre los 5 documentos legales del negocio */}
        <nav
          aria-label="Documentos legales del salón"
          className="no-scrollbar mb-8 flex items-center gap-2 overflow-x-auto whitespace-nowrap border-b border-border pb-4 sm:mb-10 sm:flex-wrap sm:whitespace-normal sm:pb-5"
        >
          {ALL_LEGAL_DOCS.map((item) => {
            const active = item.href === currentPath;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Cabecera del documento legal */}
        <header className="space-y-4 border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="secondary">
              <Scale className="h-3.5 w-3.5" />
              <span>Marco Legal · ESPACIO Q</span>
            </Badge>
            <span className="text-xs text-muted-foreground">
              Última actualización: {doc.lastUpdated || "Octubre 2026"} · Versión{" "}
              {version}.0
            </span>
          </div>

          <h1
            style={{ fontSize: "clamp(2.1rem, 4vw, 3.25rem)" }}
            className="font-serif font-normal leading-tight text-foreground"
          >
            {doc.title}
          </h1>

          {doc.subtitle && (
            <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
              {doc.subtitle}
            </p>
          )}
        </header>

        {/* Aviso honesto si faltan datos fiscales del titular en Configuración */}
        {missingLegalFields.length > 0 && (
          <div
            role="note"
            className="mt-8 flex items-start gap-3 rounded-editorial border border-border bg-card p-5 text-xs leading-relaxed text-muted-foreground shadow-subtle"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div>
              <p className="font-semibold text-foreground">
                Nota de configuración para el titular del salón:
              </p>
              <p className="mt-1">
                Este documento es 100 % editable desde el panel de administración (
                <Link
                  href="/admin/contenido"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Panel → Contenido y Legales
                </Link>
                ). Antes de publicar en producción definitiva, completa los
                siguientes datos identificativos en{" "}
                <Link
                  href="/admin/configuracion"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Configuración del Salón
                </Link>
                : <strong className="text-foreground">{missingLegalFields.join(", ")}</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Índice lateral */}
          <aside className="lg:col-span-4">
            <div className="rounded-editorial border border-border bg-card p-4 shadow-subtle sm:p-5 lg:sticky lg:top-28">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Índice de cláusulas</span>
              </div>
              <ol className="mt-4 space-y-2 text-xs text-muted-foreground">
                {(doc.sections || []).map((sec) => (
                  <li key={sec.id}>
                    <a
                      href={`#${sec.id}`}
                      className="block rounded-md px-2 py-1.5 transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {sec.heading}
                    </a>
                  </li>
                ))}
              </ol>

              <div className="mt-6 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  <span>Documento administrable</span>
                </div>
                <p className="mt-1">
                  El equipo autorizado de ESPACIO Q puede actualizar cláusulas y
                  publicar nuevas revisiones desde el Dashboard sin modificar código.
                </p>
              </div>
            </div>
          </aside>

          {/* Cuerpo de cláusulas */}
          <article className="space-y-8 lg:col-span-8">
            {introText && (
              <div className="rounded-editorial border border-border bg-card/70 p-6 text-base leading-relaxed text-foreground">
                {introText}
              </div>
            )}

            {(doc.sections || []).map((sec) => {
              const bodyText = interpolateLegalPlaceholders(sec.content, ctx);
              return (
                <section
                  key={sec.id}
                  id={sec.id}
                  className="scroll-mt-24 rounded-editorial border border-border bg-card p-5 shadow-subtle sm:scroll-mt-28 sm:p-8"
                >
                  <h2 className="font-serif text-2xl font-medium text-foreground">
                    {sec.heading}
                  </h2>
                  <div className="mt-4 space-y-3 whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {bodyText}
                  </div>
                </section>
              );
            })}
          </article>
        </div>
      </div>
    </div>
  );
}
