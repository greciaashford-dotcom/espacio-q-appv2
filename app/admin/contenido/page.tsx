import React from "react";
import Link from "next/link";
import { FileText, Globe, LayoutTemplate, Scale } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { ensureBaseCmsAndSettings } from "@/lib/domain/cms";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Contenido y legales" };

const GROUPS = [
  { key: "GLOBAL", title: "Elementos globales", description: "Cabecera, navegación, pie, newsletter y banner de cookies.", icon: Globe },
  { key: "SECTION", title: "Hero de inicio", description: "Túnel 3D: textos, CTA, fotografías, orden, encuadre y animación.", icon: LayoutTemplate },
  { key: "PAGE", title: "Páginas y secciones", description: "Inicio, Servicios, Equipo, Galería, Contacto y Reservar.", icon: FileText },
  { key: "LEGAL", title: "Páginas legales", description: "Aviso legal, términos, condiciones de reserva, privacidad y cookies. Borradores a revisar con asesoría.", icon: Scale },
];

export default async function ContenidoPage() {
  await ensureBaseCmsAndSettings();
  const pages = await prisma.pageContent.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
    select: { key: true, title: true, category: true, slug: true, hasUnpublished: true, version: true, updatedAt: true, updatedBy: true },
  });

  return (
    <div>
      <AdminPageHeader
        title="Contenido y legales"
        description="Edita cada parte de la web mediante formularios. Guarda borradores, previsualiza de forma privada y publica cuando esté listo."
        breadcrumbs={[{ label: "Panel", href: "/admin" }, { label: "Contenido" }]}
      />
      <div className="space-y-10">
        {GROUPS.map((g) => {
          const items = pages.filter((p) => p.category === g.key);
          if (items.length === 0) return null;
          const Icon = g.icon;
          return (
            <section key={g.key} aria-labelledby={`grp-${g.key}`}>
              <div className="mb-3 flex items-start gap-2.5">
                <Icon className="mt-1 h-4 w-4 text-muted-foreground" />
                <div>
                  <h2 id={`grp-${g.key}`} className="text-base font-semibold">{g.title}</h2>
                  <p className="text-xs text-muted-foreground">{g.description}</p>
                </div>
              </div>
              <ul className="divide-y divide-border overflow-hidden rounded-editorial border border-border bg-card">
                {items.map((p) => (
                  <li key={p.key}>
                    <Link
                      href={`/admin/contenido/${p.key}`}
                      className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-accent/60 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.slug ? `Ruta ${p.slug} · ` : ""}v{p.version} · actualizado{" "}
                          {p.updatedAt.toLocaleString("es-ES", { timeZone: "Europe/Madrid", dateStyle: "short", timeStyle: "short" })}
                          {p.updatedBy ? ` por ${p.updatedBy}` : ""}
                        </p>
                      </div>
                      {p.hasUnpublished ? (
                        <Badge variant="warning">Cambios sin publicar</Badge>
                      ) : (
                        <Badge variant="success">Publicado</Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
