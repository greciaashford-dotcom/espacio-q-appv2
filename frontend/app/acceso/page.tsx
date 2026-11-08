import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Acceso al panel",
  robots: { index: false, follow: false },
};

export default async function AccesoPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const user = await getCurrentUser();
  if (user) redirect("/admin");

  const userCount = await prisma.user.count();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm space-y-6 rounded-editorial border border-border bg-card p-8 shadow-editorial">
        <div className="text-center">
          <p className="font-serif text-3xl tracking-[0.14em]">ESPACIO Q</p>
          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
            {userCount === 0
              ? "Configuración inicial de propietaria/o"
              : "Panel de gestión"}
          </p>
        </div>
        <LoginForm
          next={searchParams?.next}
          isFirstRunBootstrap={userCount === 0}
        />
        <p className="text-center text-xs text-muted-foreground">
          Acceso privado del personal autorizado.{" "}
          <Link href="/" className="underline">
            Volver a la web
          </Link>
        </p>
      </div>
    </div>
  );
}
