import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-24 text-center text-foreground">
      <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
        ESPACIO Q · MADRID
      </p>
      <h1 className="mt-4 font-serif text-5xl font-medium sm:text-6xl">
        Página no encontrada
      </h1>
      <p className="mt-4 max-w-md text-sm text-muted-foreground">
        El enlace solicitado no existe o ha cambiado de ubicación. Puedes regresar a la portada o consultar nuestro catálogo.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Volver al inicio
        </Link>
        <Link
          href="/servicios"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-6 text-sm font-medium hover:bg-accent"
        >
          Ver servicios
        </Link>
        <Link
          href="/reservar"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-6 text-sm font-medium hover:bg-accent"
        >
          Reservar cita
        </Link>
      </div>
    </main>
  );
}
