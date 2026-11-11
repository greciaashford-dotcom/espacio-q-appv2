import { prisma, sequentialWrites } from "@/lib/db/prisma";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import {
  detectScheduleConflictsForFutureAppointments,
  type TimeIntervalStr,
} from "@/lib/domain/schedule";

const GOOGLE_DAY_TO_INDEX: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export function getGoogleIntegrationConfigStatus() {
  const hasBusinessOAuth = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
  const hasPlacesApi = Boolean(
    process.env.GOOGLE_PLACES_API_KEY?.trim() &&
      process.env.GOOGLE_PLACE_ID?.trim()
  );

  return {
    hasBusinessOAuth,
    hasPlacesApi,
    businessLocationId: process.env.GOOGLE_BUSINESS_LOCATION_ID?.trim() || null,
    placeId: process.env.GOOGLE_PLACE_ID?.trim() || null,
    redirectUri: googleRedirectUri(),
  };
}

/** Redirect URI de OAuth: GOOGLE_REDIRECT_URI o APP_URL del entorno (sin valores por defecto locales). */
function googleRedirectUri(): string {
  const explicit = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  const appUrl = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (!appUrl) throw new Error("APP_URL o GOOGLE_REDIRECT_URI son obligatorias para Google OAuth.");
  return `${appUrl}/api/integrations/google/callback`;
}

export function buildGoogleBusinessOAuthUrl(stateToken: string): string | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) return null;

  const redirectUri = googleRedirectUri();

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set(
    "scope",
    "https://www.googleapis.com/auth/business.manage"
  );
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", stateToken);

  return url.toString();
}

function formatGoogleTimeObj(t?: { hours?: number; minutes?: number }): string {
  const hh = String(t?.hours ?? 0).padStart(2, "0");
  const mm = String(t?.minutes ?? 0).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Sincroniza el horario desde Google Business Profile API si hay conexión OAuth activa,
 * o consulta Google Places API si está configurada como fuente verificada.
 */
export async function syncScheduleWithGoogle(params?: {
  actorUserId?: string;
}): Promise<{
  ok: boolean;
  provider: string;
  message: string;
  conflictsDetected?: number;
}> {
  const config = getGoogleIntegrationConfigStatus();
  const connection = await prisma.integrationConnection.findUnique({
    where: { provider: "GOOGLE_BUSINESS" },
  });

  // 1. Intentar Google Business Profile API si hay conexión con token y locationId
  if (
    config.hasBusinessOAuth &&
    connection &&
    connection.status === "CONNECTED" &&
    connection.encryptedAccessToken &&
    (connection.externalLocationId || config.businessLocationId)
  ) {
    try {
      const accessToken = decryptSecret(connection.encryptedAccessToken);
      const locationName =
        connection.externalLocationId || config.businessLocationId!;

      const apiUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?readMask=title,regularHours,specialHours,openInfo`;
      const res = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        await prisma.integrationConnection.update({
          where: { provider: "GOOGLE_BUSINESS" },
          data: {
            lastSyncAt: new Date(),
            lastSyncStatus: "ERROR",
            lastError: `HTTP ${res.status}: ${errText.slice(0, 200)}`,
          },
        });
        await prisma.syncEvent.create({
          data: {
            provider: "GOOGLE_BUSINESS",
            status: "ERROR",
            summary: `Fallo al consultar Google Business Profile API (HTTP ${res.status}).`,
          },
        });
        return {
          ok: false,
          provider: "GOOGLE_BUSINESS",
          message: `Error al consultar Google Business Profile API (HTTP ${res.status}). Se mantiene el último horario válido.`,
        };
      }

      const locationData = await res.json();
      const title = String(locationData.title || "");
      if (!title.toLowerCase().includes("espacio q")) {
        throw new Error(
          `La ubicación devuelta ("${title}") no coincide con ESPACIO Q.`
        );
      }

      // Normalizar regularHours.periods
      const byDay = new Map<number, TimeIntervalStr[]>();
      for (let d = 0; d <= 6; d++) byDay.set(d, []);

      const periods = locationData.regularHours?.periods ?? [];
      for (const period of periods) {
        const openDay = GOOGLE_DAY_TO_INDEX[period.openDay];
        const closeDay = GOOGLE_DAY_TO_INDEX[period.closeDay];
        if (openDay === undefined) continue;
        const start = formatGoogleTimeObj(period.openTime);
        const end =
          closeDay !== undefined && closeDay !== openDay
            ? "23:59"
            : formatGoogleTimeObj(period.closeTime);
        byDay.get(openDay)?.push({ start, end });
      }

      await sequentialWrites(async (tx) => {
        const oldRows = await tx.workingSchedule.findMany({
          where: { targetType: "SALON", source: "GOOGLE_BUSINESS" },
          select: { id: true },
        });

        for (let d = 0; d <= 6; d++) {
          const intervals = byDay.get(d) ?? [];
          await tx.workingSchedule.create({
            data: {
              targetType: "SALON",
              dayOfWeek: d,
              isOpen: intervals.length > 0,
              intervalsJson: intervals,
              source: "GOOGLE_BUSINESS",
              updatedBy: "GOOGLE_BUSINESS_SYNC",
            },
          });
        }

        await tx.workingSchedule.deleteMany({
          where: { id: { in: oldRows.map((r: any) => r.id) } },
        });

        // Normalizar specialHours
        const specialPeriods =
          locationData.specialHours?.specialHourPeriods ?? [];
        await tx.scheduleException.deleteMany({
          where: { targetType: "SALON", source: "GOOGLE_BUSINESS" },
        });

        for (const sp of specialPeriods) {
          if (!sp.startDate?.year || !sp.startDate?.month || !sp.startDate?.day)
            continue;
          const dateStr = `${sp.startDate.year}-${String(
            sp.startDate.month
          ).padStart(2, "0")}-${String(sp.startDate.day).padStart(2, "0")}`;
          const isClosed = Boolean(sp.closed);
          const intervals = isClosed
            ? []
            : [
                {
                  start: formatGoogleTimeObj(sp.openTime),
                  end: formatGoogleTimeObj(sp.closeTime),
                },
              ];

          await tx.scheduleException.create({
            data: {
              targetType: "SALON",
              dateStr,
              isClosed,
              intervalsJson: intervals,
              reason: "Horario especial Google Business Profile",
              source: "GOOGLE_BUSINESS",
              authorized: true,
            },
          });
        }

        await tx.salonSettings.update({
          where: { id: "default" },
          data: {
            activeScheduleSource: "GOOGLE_BUSINESS",
            scheduleConfirmed: true,
            lastScheduleVerifiedAt: new Date(),
          },
        });
      });

      const conflicts = await detectScheduleConflictsForFutureAppointments(
        "GOOGLE_BUSINESS"
      );

      await prisma.integrationConnection.update({
        where: { provider: "GOOGLE_BUSINESS" },
        data: {
          externalLocationTitle: title,
          lastSyncAt: new Date(),
          lastSyncStatus:
            conflicts.conflictCount > 0 ? "CONFLICT_DETECTED" : "SUCCESS",
          lastError: null,
        },
      });

      await prisma.syncEvent.create({
        data: {
          provider: "GOOGLE_BUSINESS",
          status:
            conflicts.conflictCount > 0 ? "CONFLICT_DETECTED" : "SUCCESS",
          summary: `Horario sincronizado con Google Business Profile (${title}). Conflictos detectados: ${conflicts.conflictCount}.`,
          detailsJson: conflicts,
        },
      });

      return {
        ok: true,
        provider: "GOOGLE_BUSINESS",
        message: `Sincronización completada con Google Business Profile (${title}).`,
        conflictsDetected: conflicts.conflictCount,
      };
    } catch (err: any) {
      await prisma.syncEvent.create({
        data: {
          provider: "GOOGLE_BUSINESS",
          status: "ERROR",
          summary: err?.message ?? "Error en sincronización Google Business.",
        },
      });
      return {
        ok: false,
        provider: "GOOGLE_BUSINESS",
        message:
          err?.message ??
          "Error al sincronizar con Google Business Profile API.",
      };
    }
  }

  // 2. Alternativa: Google Places API (New) si están configuradas GOOGLE_PLACES_API_KEY y GOOGLE_PLACE_ID
  if (config.hasPlacesApi && config.placeId) {
    try {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY!.trim();
      const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(
        config.placeId
      )}`;
      const res = await fetch(url, {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "id,displayName,formattedAddress,regularOpeningHours,currentOpeningHours",
        },
      });

      if (!res.ok) {
        return {
          ok: false,
          provider: "GOOGLE_PLACES",
          message: `Places API devolvió HTTP ${res.status}. Revisa GOOGLE_PLACES_API_KEY y GOOGLE_PLACE_ID.`,
        };
      }

      const placeData = await res.json();
      const displayName = String(placeData.displayName?.text || "");
      if (!displayName.toLowerCase().includes("espacio q")) {
        return {
          ok: false,
          provider: "GOOGLE_PLACES",
          message: `El Place ID configurado corresponde a "${displayName}" y no a ESPACIO Q.`,
        };
      }

      await prisma.integrationConnection.upsert({
        where: { provider: "GOOGLE_PLACES" },
        update: {
          status: "CONNECTED",
          externalLocationId: config.placeId,
          externalLocationTitle: displayName,
          lastSyncAt: new Date(),
          lastSyncStatus: "SUCCESS",
          lastError: null,
          // No persistimos la respuesta bruta completa de Places para cumplir políticas de Google Maps Platform
          configJson: {
            weekdayDescriptions:
              placeData.regularOpeningHours?.weekdayDescriptions ?? [],
            fetchedAt: new Date().toISOString(),
          },
        },
        create: {
          provider: "GOOGLE_PLACES",
          status: "CONNECTED",
          externalLocationId: config.placeId,
          externalLocationTitle: displayName,
          lastSyncAt: new Date(),
          lastSyncStatus: "SUCCESS",
          configJson: {
            weekdayDescriptions:
              placeData.regularOpeningHours?.weekdayDescriptions ?? [],
            fetchedAt: new Date().toISOString(),
          },
        },
      });

      return {
        ok: true,
        provider: "GOOGLE_PLACES",
        message: `Ficha verificada mediante Google Places API (${displayName}). Revisa y confirma las franjas operativas en el panel.`,
        conflictsDetected: 0,
      };
    } catch (err: any) {
      return {
        ok: false,
        provider: "GOOGLE_PLACES",
        message: err?.message ?? "Error consultando Google Places API.",
      };
    }
  }

  return {
    ok: false,
    provider: "MANUAL",
    message:
      "Credenciales de Google Business Profile API o Google Places API pendientes de configurar en variables de entorno. El salón opera de forma segura con el Horario Manual configurado en el panel.",
  };
}

export async function saveGoogleOAuthTokens(params: {
  accessToken: string;
  refreshToken?: string;
  expiresInSec?: number;
  accountLabel?: string;
  locationId?: string;
}) {
  const encryptedAccessToken = encryptSecret(params.accessToken);
  const encryptedRefreshToken = params.refreshToken
    ? encryptSecret(params.refreshToken)
    : undefined;
  const tokenExpiresAt = params.expiresInSec
    ? new Date(Date.now() + params.expiresInSec * 1000)
    : null;

  await prisma.integrationConnection.upsert({
    where: { provider: "GOOGLE_BUSINESS" },
    update: {
      status: "CONNECTED",
      encryptedAccessToken,
      ...(encryptedRefreshToken ? { encryptedRefreshToken } : {}),
      tokenExpiresAt,
      accountLabel: params.accountLabel ?? undefined,
      externalLocationId: params.locationId ?? undefined,
      lastError: null,
    },
    create: {
      provider: "GOOGLE_BUSINESS",
      status: "CONNECTED",
      encryptedAccessToken,
      encryptedRefreshToken: encryptedRefreshToken ?? null,
      tokenExpiresAt,
      accountLabel: params.accountLabel ?? null,
      externalLocationId: params.locationId ?? null,
    },
  });
}
