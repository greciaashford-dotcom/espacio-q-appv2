import React from "react";
import type { Metadata } from "next";
import { NewsletterActionPanel } from "@/components/public/newsletter-action-panel";

export const metadata: Metadata = {
  title: "Confirmar suscripción",
  robots: { index: false, follow: false },
};

export default function ConfirmarNewsletterPage({
  searchParams,
}: {
  searchParams?: { token?: string };
}) {
  return (
    <div className="py-20">
      <div className="container mx-auto max-w-md rounded-editorial border border-border bg-card p-8 shadow-subtle">
        <NewsletterActionPanel mode="confirm" token={searchParams?.token} />
      </div>
    </div>
  );
}
