import { prisma } from "@/lib/db/prisma";
import {
  getDayOfWeekMadrid,
  madridLocalToUtc,
  timeStrToMinutes,
} from "@/lib/domain/timezone";
import type { PrismaClient, Prisma } from "@/lib/db/prisma";

export type TimeIntervalStr = {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
};

export type UtcInterval = {
  startUtc: Date;
  endUtc: Date;
  startTimeStr: string;
  endTimeStr: string;
};

type DbClient = PrismaClient | Prisma.TransactionClient;

export function parseIntervalsJson(raw: unknown): TimeIntervalStr[] {
  if (!Array.isArray(raw)) return [];
  const valid: TimeIntervalStr[] = [];
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      typeof (item as any).start === "string" &&
      typeof (item as any).end === "string" &&
      /^\d{2}:\d{2}$/.test((item as any).start) &&
      /^\d{2}:\d{2}$/.test((item as any).end)
    ) {
      const s = timeStrToMinutes((item as any).start);
      const e = timeStrToMinutes((item as any).end);
      if (s < e) {
        valid.push({ start: (item as any).start, end: (item as any).end });
      }
    }
  }
  return valid;
}

/**
 * Interseca los intervalos de turno del profesional con el horario efectivo del salón.
 * Un turno de profesional solo puede restringir el horario del salón, nunca ampliarlo.
 */
export function intersectTimeIntervals(
  salonIntervals: TimeIntervalStr[],
  proIntervals: TimeIntervalStr[]
): TimeIntervalStr[] {
  const result: TimeIntervalStr[] = [];
  for (const s of salonIntervals) {
    const sStart = timeStrToMinutes(s.start);
    const sEnd = timeStrToMinutes(s.end);
    for (const p of proIntervals) {
      const pStart = timeStrToMinutes(p.start);
      const pEnd = timeStrToMinutes(p.end);
      const overlapStart = Math.max(sStart, pStart);
      const overlapEnd = Math.min(sEnd, pEnd);
      if (overlapStart < overlapEnd) {
        const hh1 = String(Math.floor(overlapStart / 60)).padStart(2, "0");
        const mm1 = String(overlapStart % 60).padStart(2, "0");
        const hh2 = String(Math.floor(overlapEnd / 60)).padStart(2, "0");
        const mm2 = String(overlapEnd % 60).padStart(2, "0");
        result.push({ start: `${hh1}:${mm1}`, end: `${hh2}:${mm2}` });
      }
    }
  }
  return result;
}

/**
 * Obtiene el horario efectivo del salón para una fecha (YYYY-MM-DD) siguiendo la política de precedencia:
 * 1. Excepción local autorizada (MANUAL) para esa fecha
 * 2. Excepción de Google aplicable para esa fecha
 * 3. Horario regular de la fuente activa del salón
 */
export async function getEffectiveSalonIntervals(
  dateStr: string,
  db: DbClient = prisma
): Promise<{
  isOpen: boolean;
  intervals: TimeIntervalStr[];
  source: string;
  reason?: string;
}> {
  const settings = await db.salonSettings.findUnique({ where: { id: "default" } });
  if (!settings || !settings.scheduleConfirmed) {
    return {
      isOpen: false,
      intervals: [],
      source: "UNCONFIRMED",
      reason: "Horario del salón pendiente de confirmación.",
    };
  }

  // 1. Buscar excepciones del salón para esta fecha
  const exceptions = await db.scheduleException.findMany({
    where: {
      targetType: "SALON",
      dateStr,
      authorized: true,
    },
  });

  // Precedencia: excepción MANUAL primero, luego GOOGLE_BUSINESS / GOOGLE_PLACES
  const manualEx = exceptions.find((e) => e.source === "MANUAL");
  const googleEx = exceptions.find((e) => e.source !== "MANUAL");
  const chosenEx = manualEx ?? googleEx;

  if (chosenEx) {
    if (chosenEx.isClosed) {
      return {
        isOpen: false,
        intervals: [],
        source: chosenEx.source,
        reason: chosenEx.reason ?? "Cierre o festivo programado",
      };
    }
    const intervals = parseIntervalsJson(chosenEx.intervalsJson);
    return {
      isOpen: intervals.length > 0,
      intervals,
      source: chosenEx.source,
      reason: chosenEx.reason ?? undefined,
    };
  }

  // 2. Horario semanal regular de la fuente activa (o MANUAL si no hay registros de la fuente externa)
  const dayOfWeek = getDayOfWeekMadrid(dateStr);
  const regularSchedules = await db.workingSchedule.findMany({
    where: {
      targetType: "SALON",
      dayOfWeek,
    },
  });

  const preferred =
    regularSchedules.find((s) => s.source === settings.activeScheduleSource) ??
    regularSchedules.find((s) => s.source === "MANUAL");

  if (!preferred || !preferred.isOpen) {
    return {
      isOpen: false,
      intervals: [],
      source: preferred?.source ?? settings.activeScheduleSource,
    };
  }

  const intervals = parseIntervalsJson(preferred.intervalsJson);
  return {
    isOpen: intervals.length > 0,
    intervals,
    source: preferred.source,
  };
}

/**
 * Obtiene el horario efectivo de un profesional para una fecha (YYYY-MM-DD),
 * restringido siempre por el horario efectivo del salón.
 */
export async function getEffectiveProfessionalIntervals(
  professionalId: string,
  dateStr: string,
  db: DbClient = prisma
): Promise<{
  isAvailable: boolean;
  intervals: TimeIntervalStr[];
  utcIntervals: UtcInterval[];
}> {
  const salonSchedule = await getEffectiveSalonIntervals(dateStr, db);
  if (!salonSchedule.isOpen || salonSchedule.intervals.length === 0) {
    return { isAvailable: false, intervals: [], utcIntervals: [] };
  }

  // Comprobar excepción/ausencia del profesional para esa fecha
  const proException = await db.scheduleException.findFirst({
    where: {
      targetType: "PROFESSIONAL",
      professionalId,
      dateStr,
      authorized: true,
    },
  });

  let proRawIntervals: TimeIntervalStr[] = [];
  if (proException) {
    if (proException.isClosed) {
      return { isAvailable: false, intervals: [], utcIntervals: [] };
    }
    proRawIntervals = parseIntervalsJson(proException.intervalsJson);
  } else {
    const dayOfWeek = getDayOfWeekMadrid(dateStr);
    const proWeekly = await db.workingSchedule.findFirst({
      where: {
        targetType: "PROFESSIONAL",
        professionalId,
        dayOfWeek,
      },
    });

    if (proWeekly) {
      if (!proWeekly.isOpen) {
        return { isAvailable: false, intervals: [], utcIntervals: [] };
      }
      proRawIntervals = parseIntervalsJson(proWeekly.intervalsJson);
    } else {
      // Si el profesional no tiene un turno restrictivo específico para ese día, hereda el del salón
      proRawIntervals = salonSchedule.intervals;
    }
  }

  const effectiveIntervals = intersectTimeIntervals(
    salonSchedule.intervals,
    proRawIntervals
  );

  const utcIntervals: UtcInterval[] = [];
  for (const interval of effectiveIntervals) {
    const startConv = madridLocalToUtc(dateStr, interval.start);
    const endConv = madridLocalToUtc(dateStr, interval.end);
    if (startConv.ok && endConv.ok && startConv.utcDate < endConv.utcDate) {
      utcIntervals.push({
        startUtc: startConv.utcDate,
        endUtc: endConv.utcDate,
        startTimeStr: interval.start,
        endTimeStr: interval.end,
      });
    }
  }

  return {
    isAvailable: utcIntervals.length > 0,
    intervals: effectiveIntervals,
    utcIntervals,
  };
}

/**
 * Detecta citas existentes (CONFIRMED o PENDING_APPROVAL) que queden fuera del nuevo horario efectivo
 * tras una sincronización externa o cambio de horario, creando alertas en ScheduleConflictAlert
 * sin cancelar ni mover citas automáticamente.
 */
export async function detectScheduleConflictsForFutureAppointments(
  sourceLabel: string,
  db: DbClient = prisma
): Promise<{ conflictCount: number; appointmentIds: string[] }> {
  const now = new Date();
  const futureAppointments = await db.appointment.findMany({
    where: {
      startAtUtc: { gte: now },
      status: { in: ["CONFIRMED", "PENDING_APPROVAL"] },
    },
  });

  const conflictedIds: string[] = [];

  for (const appt of futureAppointments) {
    const proSched = await getEffectiveProfessionalIntervals(
      appt.professionalId,
      appt.dateStrMadrid,
      db
    );

    const fitsInAnyInterval = proSched.utcIntervals.some(
      (range) =>
        appt.blockStartAtUtc >= range.startUtc &&
        appt.blockEndAtUtc <= range.endUtc
    );

    if (!fitsInAnyInterval) {
      conflictedIds.push(appt.id);
      const existingAlert = await db.scheduleConflictAlert.findFirst({
        where: {
          appointmentId: appt.id,
          resolved: false,
        },
      });
      if (!existingAlert) {
        await db.scheduleConflictAlert.create({
          data: {
            appointmentId: appt.id,
            source: sourceLabel,
            reason: `La cita ${appt.referenceCode} (${appt.dateStrMadrid} ${appt.startTimeMadrid}-${appt.endTimeMadrid}) queda fuera del nuevo horario efectivo.`,
          },
        });
      }
    }
  }

  return {
    conflictCount: conflictedIds.length,
    appointmentIds: conflictedIds,
  };
}
