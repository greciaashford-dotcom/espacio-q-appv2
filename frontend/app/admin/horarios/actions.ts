"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma, sequentialWrites } from "@/lib/db/prisma";
import { getCurrentUser, canManageCatalogOrCms } from "@/lib/auth/session";
import { detectScheduleConflictsForFutureAppointments } from "@/lib/domain/schedule";
import { syncScheduleWithGoogle } from "@/lib/integrations/google";
import { timeStrToMinutes } from "@/lib/domain/timezone";

const intervalSchema = z
  .object({
    start: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm requerido"),
    end: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm requerido"),
  })
  .refine((v) => timeStrToMinutes(v.start) < timeStrToMinutes(v.end), {
    message: "La hora de inicio debe ser anterior a la hora de cierre.",
  });

const dayScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isOpen: z.boolean(),
  intervals: z.array(intervalSchema),
});

const saveWeeklySchema = z.object({
  targetType: z.enum(["SALON", "PROFESSIONAL"]),
  professionalId: z.string().optional().or(z.literal("")),
  scheduleConfirmed: z.boolean().optional(),
  days: z.array(dayScheduleSchema).length(7),
});

export async function saveWeeklyScheduleAction(input: z.infer<typeof saveWeeklySchema>) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado para gestionar horarios." };
  }

  const parsed = saveWeeklySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Horario inválido." };
  }

  const d = parsed.data;
  const proId = d.targetType === "PROFESSIONAL" ? d.professionalId?.trim() || null : null;
  if (d.targetType === "PROFESSIONAL" && !proId) {
    return { ok: false, error: "Selecciona un profesional para guardar su turno específico." };
  }

  // Comprobar que no haya solapamientos entre tramos del mismo día (ej. horario partido válido 10:00-14:00 y 16:00-20:00)
  for (const day of d.days) {
    const sorted = [...day.intervals].sort(
      (a, b) => timeStrToMinutes(a.start) - timeStrToMinutes(b.start)
    );
    for (let i = 1; i < sorted.length; i++) {
      if (timeStrToMinutes(sorted[i].start) < timeStrToMinutes(sorted[i - 1].end)) {
        return {
          ok: false,
          error: `Hay tramos horarios solapados en el mismo día (${sorted[i - 1].start}-${sorted[i - 1].end} y ${sorted[i].start}-${sorted[i].end}).`,
        };
      }
    }
  }

  // Sin transacciones: se crean primero las filas nuevas y después se borran las antiguas por id,
  // de modo que un fallo intermedio nunca deja el horario vacío.
  await sequentialWrites(async (tx) => {
    if (d.targetType === "SALON") {
      const oldSalon = await tx.workingSchedule.findMany({
        where: { targetType: "SALON", source: "MANUAL" },
        select: { id: true },
      });
      for (const day of d.days) {
        await tx.workingSchedule.create({
          data: {
            targetType: "SALON",
            dayOfWeek: day.dayOfWeek,
            isOpen: day.isOpen && day.intervals.length > 0,
            intervalsJson: day.isOpen ? day.intervals : [],
            source: "MANUAL",
            updatedBy: user.id,
          },
        });
      }
      await tx.workingSchedule.deleteMany({
        where: { id: { in: oldSalon.map((r: any) => r.id) } },
      });
      if (typeof d.scheduleConfirmed === "boolean") {
        await tx.salonSettings.update({
          where: { id: "default" },
          data: {
            scheduleConfirmed: d.scheduleConfirmed,
            lastScheduleVerifiedAt: d.scheduleConfirmed ? new Date() : undefined,
          },
        });
      }
    } else if (proId) {
      const oldPro = await tx.workingSchedule.findMany({
        where: { targetType: "PROFESSIONAL", professionalId: proId },
        select: { id: true },
      });
      for (const day of d.days) {
        await tx.workingSchedule.create({
          data: {
            targetType: "PROFESSIONAL",
            professionalId: proId,
            dayOfWeek: day.dayOfWeek,
            isOpen: day.isOpen && day.intervals.length > 0,
            intervalsJson: day.isOpen ? day.intervals : [],
            source: "MANUAL",
            updatedBy: user.id,
          },
        });
      }
      await tx.workingSchedule.deleteMany({
        where: { id: { in: oldPro.map((r: any) => r.id) } },
      });
    }
  });

  const conflicts = await detectScheduleConflictsForFutureAppointments("MANUAL_SCHEDULE_UPDATE");

  await prisma.auditEvent.create({
    data: {
      actorUserId: user.id,
      action: "WEEKLY_SCHEDULE_UPDATED",
      entityType: "WorkingSchedule",
      entityId: proId ?? "SALON",
      summary: `Horario semanal actualizado (${d.targetType}). Conflictos detectados: ${conflicts.conflictCount}.`,
    },
  });

  revalidatePath("/");
  revalidatePath("/contacto");
  revalidatePath("/reservar");
  revalidatePath("/admin");
  revalidatePath("/admin/horarios");
  revalidatePath("/admin/agenda");

  return {
    ok: true,
    conflictsDetected: conflicts.conflictCount,
  };
}

export async function resetProfessionalScheduleInheritanceAction(professionalId: string) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado." };
  }

  await prisma.workingSchedule.deleteMany({
    where: { targetType: "PROFESSIONAL", professionalId },
  });

  revalidatePath("/reservar");
  revalidatePath("/admin/horarios");
  return { ok: true };
}

const exceptionSchema = z.object({
  targetType: z.enum(["SALON", "PROFESSIONAL"]),
  professionalId: z.string().optional().or(z.literal("")),
  dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha YYYY-MM-DD requerida"),
  isClosed: z.boolean(),
  intervals: z.array(intervalSchema),
  reason: z.string().trim().max(240).optional().or(z.literal("")),
});

export async function createScheduleExceptionAction(input: z.infer<typeof exceptionSchema>) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado." };
  }

  const parsed = exceptionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Excepción inválida." };
  }

  const d = parsed.data;
  const proId = d.targetType === "PROFESSIONAL" ? d.professionalId?.trim() || null : null;
  if (d.targetType === "PROFESSIONAL" && !proId) {
    return { ok: false, error: "Selecciona el profesional afectado por la excepción." };
  }

  if (!d.isClosed && d.intervals.length === 0) {
    return { ok: false, error: "Añade al menos una franja horaria especial o marca el día como cerrado." };
  }

  // Reemplazar excepción manual existente para ese mismo objetivo y fecha
  await prisma.scheduleException.deleteMany({
    where: {
      targetType: d.targetType,
      professionalId: proId,
      dateStr: d.dateStr,
      source: "MANUAL",
    },
  });

  const created = await prisma.scheduleException.create({
    data: {
      targetType: d.targetType,
      professionalId: proId,
      dateStr: d.dateStr,
      isClosed: d.isClosed,
      intervalsJson: d.isClosed ? [] : d.intervals,
      reason: d.reason?.trim() || (d.isClosed ? "Festivo / Cierre puntual" : "Horario especial"),
      source: "MANUAL",
      authorized: true,
      createdBy: user.id,
    },
  });

  const conflicts = await detectScheduleConflictsForFutureAppointments("MANUAL_EXCEPTION");

  await prisma.auditEvent.create({
    data: {
      actorUserId: user.id,
      action: "SCHEDULE_EXCEPTION_CREATED",
      entityType: "ScheduleException",
      entityId: created.id,
      summary: `Excepción horaria ${d.dateStr} (${d.targetType}). Conflictos: ${conflicts.conflictCount}.`,
    },
  });

  revalidatePath("/contacto");
  revalidatePath("/reservar");
  revalidatePath("/admin/horarios");
  revalidatePath("/admin/agenda");

  return { ok: true, conflictsDetected: conflicts.conflictCount };
}

export async function deleteScheduleExceptionAction(exceptionId: string) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado." };
  }

  await prisma.scheduleException.delete({ where: { id: exceptionId } });
  revalidatePath("/contacto");
  revalidatePath("/reservar");
  revalidatePath("/admin/horarios");
  return { ok: true };
}

export async function triggerGoogleScheduleSyncAction() {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado." };
  }

  const res = await syncScheduleWithGoogle({ actorUserId: user.id });
  revalidatePath("/");
  revalidatePath("/contacto");
  revalidatePath("/reservar");
  revalidatePath("/admin");
  revalidatePath("/admin/horarios");
  return res;
}

export async function resolveScheduleConflictAlertAction(alertId: string) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado." };
  }

  await prisma.scheduleConflictAlert.update({
    where: { id: alertId },
    data: {
      resolved: true,
      resolvedBy: user.id,
      resolvedAt: new Date(),
    },
  });

  revalidatePath("/admin/horarios");
  return { ok: true };
}
