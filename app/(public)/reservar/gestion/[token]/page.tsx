import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { hashToken } from "@/lib/security/crypto";
import { utcToMadridParts } from "@/lib/domain/timezone";
import { BookingManageClient } from "@/components/booking/booking-manage-client";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Gestión de cita",
  robots: { index: false, follow: false, nocache: true },
};

export default async function GestionCitaPage({
  params,
}: {
  params: { token: string };
}) {
  const rawToken = decodeURIComponent(params.token || "");
  const tokenHash = rawToken.length >= 16 ? hashToken(rawToken) : "";

  const [appt, settings] = await Promise.all([
    tokenHash
      ? prisma.appointment.findUnique({
          where: { manageTokenHash: tokenHash },
          include: { professional: true },
        })
      : Promise.resolve(null),
    prisma.salonSettings.findUnique({ where: { id: "default" } }),
  ]);

  if (
    !appt ||
    appt.manageTokenRevoked ||
    appt.manageTokenExpiresAt < new Date()
  ) {
    return (
      <div className="py-20">
        <div className="container mx-auto max-w-lg rounded-editorial border border-border bg-card p-8 text-center shadow-subtle space-y-4">
          <h1 className="font-serif text-3xl">Enlace no disponible</h1>
          <p className="text-sm text-muted-foreground">
            Este enlace de gestión no es válido o ha caducado. Si necesitas
            ayuda con tu reserva, contacta directamente con el salón.
          </p>
          <Button asChild variant="outline">
            <Link href="/contacto">Ir a Contacto</Link>
          </Button>
        </div>
      </div>
    );
  }

  const now = new Date();
  const todayStr = utcToMadridParts(now).dateStr;
  const maxDateStr = utcToMadridParts(
    new Date(
      now.getTime() + (settings?.maxBookingHorizonDays ?? 60) * 24 * 3600 * 1000
    )
  ).dateStr;

  // Sin PII sensible innecesaria en la respuesta
  return (
    <div className="py-16 sm:py-24">
      <div className="container mx-auto max-w-2xl">
        <BookingManageClient
          token={rawToken}
          appointment={{
            id: appt.id,
            referenceCode: appt.referenceCode,
            status: appt.status,
            attendanceConfirmed: Boolean(appt.attendanceConfirmedAt),
            serviceId: appt.serviceId,
            serviceName: appt.serviceNameSnapshot,
            durationMin: appt.durationMinSnapshot,
            priceType: appt.priceTypeSnapshot,
            priceCents: appt.priceCentsSnapshot,
            currency: appt.currencySnapshot,
            professionalId: appt.professionalId,
            professionalName: appt.professional.name,
            dateStrMadrid: appt.dateStrMadrid,
            startTimeMadrid: appt.startTimeMadrid,
            endTimeMadrid: appt.endTimeMadrid,
          }}
          todayStr={todayStr}
          maxDateStr={maxDateStr}
          cancellationFreeHours={settings?.cancellationFreeHours ?? 24}
        />
      </div>
    </div>
  );
}
