import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

export const SALON_TIMEZONE = "Europe/Madrid";

/**
 * Convierte una fecha "YYYY-MM-DD" y hora "HH:mm" en Europe/Madrid a instante UTC.
 * Verifica que la hora local exista realmente en Europe/Madrid (protege frente al salto de hora de verano en marzo, p. ej. 02:15 -> 03:15).
 */
export function madridLocalToUtc(
  dateStr: string,
  timeStr: string
): { ok: true; utcDate: Date } | { ok: false; reason: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !/^\d{2}:\d{2}$/.test(timeStr)) {
    return { ok: false, reason: "Formato de fecha u hora inválido." };
  }

  const localIso = `${dateStr}T${timeStr}:00`;
  const utcDate = fromZonedTime(localIso, SALON_TIMEZONE);
  if (Number.isNaN(utcDate.getTime())) {
    return { ok: false, reason: "Fecha u hora no válida." };
  }

  // Verificar que al formatear de vuelta en Europe/Madrid coincidan fecha y hora (evita horas inexistentes en cambio DST de primavera)
  const roundTripDate = formatInTimeZone(utcDate, SALON_TIMEZONE, "yyyy-MM-dd");
  const roundTripTime = formatInTimeZone(utcDate, SALON_TIMEZONE, "HH:mm");

  if (roundTripDate !== dateStr || roundTripTime !== timeStr) {
    return {
      ok: false,
      reason: `La hora ${timeStr} del ${dateStr} no existe en el huso horario Europe/Madrid por cambio oficial de hora.`,
    };
  }

  return { ok: true, utcDate };
}

export function utcToMadridParts(utcDate: Date): {
  dateStr: string;
  timeStr: string;
  isoOffset: string;
} {
  return {
    dateStr: formatInTimeZone(utcDate, SALON_TIMEZONE, "yyyy-MM-dd"),
    timeStr: formatInTimeZone(utcDate, SALON_TIMEZONE, "HH:mm"),
    isoOffset: formatInTimeZone(
      utcDate,
      SALON_TIMEZONE,
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    ),
  };
}

/**
 * Devuelve el día de la semana (0 = Domingo, 1 = Lunes ... 6 = Sábado) para una fecha YYYY-MM-DD en Europe/Madrid.
 */
export function getDayOfWeekMadrid(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  const utcNoon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const isoDay = parseInt(
    formatInTimeZone(utcNoon, SALON_TIMEZONE, "i"), // 1 (Mon) .. 7 (Sun)
    10
  );
  return isoDay === 7 ? 0 : isoDay;
}

export function timeStrToMinutes(timeStr: string): number {
  const [hh, mm] = timeStr.split(":").map((n) => parseInt(n, 10));
  return hh * 60 + mm;
}

export function minutesToTimeStr(totalMinutes: number): string {
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
