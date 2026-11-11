import React from "react";
import type { Metadata } from "next";
import { withSeo } from "@/lib/seo/site";
import { Clock, MapPin } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import {
  ensureBaseCmsAndSettings,
  getPublishedCmsBlock,
} from "@/lib/domain/cms";
import { getEffectiveSalonIntervals } from "@/lib/domain/schedule";
import { madridLocalToUtc, utcToMadridParts } from "@/lib/domain/timezone";
import {
  BookingWizard,
  type BookingOpenDayOption,
  type BookingWizardService,
} from "@/components/booking/booking-wizard";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const block = await getPublishedCmsBlock("page_reservar");
  return withSeo({
    title: block.seoTitle || "Reservar Cita Online · ESPACIO Q Madrid",
    description:
      block.seoDescription ||
      "Reserva tu cita online en ESPACIO Q Madrid (Calle de Pelayo, 41) por servicio, especialista y horario real.",
    alternates: { canonical: "/reservar" },
  });
}

function addCalendarDaysIso(baseDateStr: string, offsetDays: number): string {
  const [y, m, d] = baseDateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + offsetDays, 12, 0, 0));
  return dt.toISOString().slice(0, 10);
}

function formatShortDayEs(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const raw = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(dt);
  return raw.replace(/\./g, "").replace(/^\w/, (c) => c.toUpperCase());
}

export default async function ReservarPage({
  searchParams,
}: {
  searchParams?: {
    serviceId?: string;
    professionalId?: string;
    extraServices?: string;
    coupon?: string;
    preview?: string;
  };
}) {
  const isPreview = searchParams?.preview === "1";

  const settings = await ensureBaseCmsAndSettings();

  const [block, services] = await Promise.all([
    getPublishedCmsBlock<Record<string, any>>("page_reservar", {
      previewDraft: isPreview,
    }),
    prisma.service.findMany({
      where: { active: true, category: { active: true } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        category: true,
        professionals: {
          where: { active: true, professional: { active: true } },
          include: { professional: true },
        },
      },
    }),
  ]);

  const cms = block.data || {};
  const bookableServices: BookingWizardService[] = services
    .filter((s) => s.professionals.length > 0)
    .map((s) => ({
      id: s.id,
      categoryName: s.category.name,
      name: s.name,
      shortDescription: s.shortDescription,
      durationMin: s.durationMin,
      priceType: s.priceType,
      priceCents: s.priceCents,
      currency: s.currency,
      professionals: s.professionals.map((ps: any) => ({
        id: ps.professionalId,
        name: ps.professional.name,
        roleTitle: ps.professional.roleTitle,
        customDurationMin: ps.customDurationMin,
        customPriceCents: ps.customPriceCents,
      })),
    }));

  const now = new Date();
  const todayStr = utcToMadridParts(now).dateStr;
  const horizonDays = settings?.maxBookingHorizonDays ?? 60;
  const maxDateStr = addCalendarDaysIso(todayStr, horizonDays);

  // Calcular los próximos 8 días hábiles abiertos para evitar caer por defecto en domingo/lunes cerrado
  const upcomingOpenDays: BookingOpenDayOption[] = [];
  if (settings?.scheduleConfirmed) {
    const minNoticeMs = (settings.minAdvanceNoticeMin + 30) * 60 * 1000;
    for (
      let offset = 0;
      offset <= Math.min(horizonDays, 28) && upcomingOpenDays.length < 8;
      offset++
    ) {
      const candidate = addCalendarDaysIso(todayStr, offset);
      const eff = await getEffectiveSalonIntervals(candidate);
      if (!eff.isOpen || eff.intervals.length === 0) continue;

      if (candidate === todayStr) {
        const lastEnd = eff.intervals[eff.intervals.length - 1].end;
        const endConv = madridLocalToUtc(candidate, lastEnd);
        if (
          !endConv.ok ||
          endConv.utcDate.getTime() <= now.getTime() + minNoticeMs
        ) {
          continue;
        }
      }

      upcomingOpenDays.push({
        dateStr: candidate,
        shortLabel:
          candidate === todayStr ? `Hoy · ${formatShortDayEs(candidate)}` : formatShortDayEs(candidate),
        hoursLabel: eff.intervals.map((i) => `${i.start}–${i.end}`).join(" y "),
      });
    }
  }

  const defaultDateStr = upcomingOpenDays[0]?.dateStr ?? todayStr;

  const bookingEnabled = Boolean(
    settings?.publicBookingEnabled &&
      settings?.scheduleConfirmed &&
      bookableServices.length > 0
  );

  return (
    <div className="py-12 sm:py-20 lg:py-24">
      <div className="container mx-auto max-w-4xl space-y-8 sm:space-y-10">
        <header className="space-y-4">
          {cms.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {cms.eyebrow}
            </p>
          )}
          <h1
            style={{ fontSize: "clamp(2.1rem, 4vw, 3.25rem)" }}
            className="font-serif font-normal leading-tight text-foreground"
          >
            {cms.title || "Reserva tu momento en ESPACIO Q"}
          </h1>
          {cms.description && (
            <p className="text-base leading-relaxed text-muted-foreground">
              {cms.description}
            </p>
          )}

          {settings?.scheduleConfirmed && (
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 font-medium text-foreground shadow-subtle">
                <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>Mar–Vie 10:30–21:00 · Sáb 09:00–16:00</span>
              </span>
              {settings.addressLine && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/75 px-3.5 py-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <span>
                    {settings.addressLine}
                    {settings.postalCode ? `, ${settings.postalCode}` : ""}{" "}
                    {settings.city}
                  </span>
                </span>
              )}
            </div>
          )}
        </header>

        <BookingWizard
          services={bookableServices}
          initialServiceId={searchParams?.serviceId}
          initialProfessionalId={searchParams?.professionalId}
          initialExtraServices={searchParams?.extraServices}
          initialCoupon={searchParams?.coupon}
          minDateStr={todayStr}
          defaultDateStr={defaultDateStr}
          maxDateStr={maxDateStr}
          upcomingOpenDays={upcomingOpenDays}
          bookingEnabled={bookingEnabled}
          cancellationFreeHours={settings?.cancellationFreeHours ?? 24}
          cms={cms}
        />
      </div>
    </div>
  );
}
