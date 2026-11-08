import { prisma } from "@/lib/db/prisma";
import {
  ensureBaseCmsAndSettings,
  getPublishedCmsBlock,
} from "@/lib/domain/cms";
import { parseIntervalsJson } from "@/lib/domain/schedule";
import type {
  HeaderFooterCmsData,
  PublicSalonMeta,
} from "@/components/public/public-shell";
import type { NewsletterConfigData } from "@/components/ui/newsletter-dialog";
import type { CookieBannerContent } from "@/components/public/cookie-consent-manager";

const DAY_NAMES_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0]; // Lunes a Domingo

export async function getPublicShellData() {
  const settings = await ensureBaseCmsAndSettings();

  const [headerFooterBlock, newsletterBlock, cookieBannerBlock, schedules] =
    await Promise.all([
      getPublishedCmsBlock<HeaderFooterCmsData>("header_footer"),
      getPublishedCmsBlock<NewsletterConfigData>("newsletter_config"),
      getPublishedCmsBlock<CookieBannerContent>("cookie_banner"),
      prisma.workingSchedule.findMany({
        where: {
          targetType: "SALON",
          source: settings.activeScheduleSource,
        },
      }),
    ]);

  let effectiveSchedules = schedules;
  if (effectiveSchedules.length === 0) {
    effectiveSchedules = await prisma.workingSchedule.findMany({
      where: {
        targetType: "SALON",
        source: "MANUAL",
      },
    });
  }

  const weeklySummary = ORDERED_DAYS.map((dayIdx) => {
    const row = effectiveSchedules.find((s) => s.dayOfWeek === dayIdx);
    const intervals = row ? parseIntervalsJson(row.intervalsJson) : [];
    const isOpen = Boolean(row?.isOpen && intervals.length > 0);
    return {
      dayName: DAY_NAMES_ES[dayIdx],
      isOpen,
      hoursText: isOpen
        ? intervals.map((i) => `${i.start}–${i.end}`).join(" y ")
        : "Cerrado",
    };
  });

  const salonMeta: PublicSalonMeta = {
    brandName: settings.brandName,
    tagline: settings.tagline,
    city: settings.city,
    addressLine: settings.addressLine,
    postalCode: settings.postalCode,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    contactEmail: settings.contactEmail,
    googleMapsUrl: settings.googleMapsUrl,
    instagramUrl: settings.instagramUrl,
    facebookUrl: settings.facebookUrl,
    tiktokUrl: settings.tiktokUrl,
    scheduleConfirmed: settings.scheduleConfirmed,
    activeScheduleSource: settings.activeScheduleSource,
    hasOptionalCookiesEnabled: Boolean(
      settings.analyticsCookiesEnabled ||
        settings.marketingCookiesEnabled ||
        settings.externalMapEmbedEnabled
    ),
    weeklySummary,
  };

  return {
    settings,
    headerFooter: headerFooterBlock.data,
    newsletterConfig: newsletterBlock.data,
    cookieBanner: cookieBannerBlock.data,
    salonMeta,
  };
}
