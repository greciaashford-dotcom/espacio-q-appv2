"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma, sequentialWrites } from "@/lib/db/prisma";
import { getCurrentUser, canManageCatalogOrCms } from "@/lib/auth/session";
import { slugify } from "@/lib/utils";

const proSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Nombre obligatorio").max(120),
  slug: z.string().trim().max(120).optional(),
  roleTitle: z.string().trim().min(2, "Especialidad o puesto obligatorio").max(120),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  specialtiesText: z.string().trim().max(500).optional().or(z.literal("")),
  photoAssetId: z.string().optional().or(z.literal("")),
  active: z.boolean(),
  publicVisible: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  serviceIds: z.array(z.string()),
  reassignToProfessionalId: z.string().optional().or(z.literal("")),
  forceDeactivateWithAlerts: z.boolean().optional(),
});

export async function saveProfessionalAction(input: z.infer<typeof proSchema>) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado para gestionar el equipo." };
  }

  const parsed = proSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos de profesional inválidos." };
  }

  const d = parsed.data;
  const finalSlug = slugify(d.slug || d.name);
  if (!finalSlug) return { ok: false, error: "Slug inválido." };

  const dup = await prisma.professional.findFirst({
    where: { slug: finalSlug, ...(d.id ? { id: { not: d.id } } : {}) },
  });
  if (dup) {
    return { ok: false, error: `Ya existe un miembro del equipo con el identificador "${finalSlug}".` };
  }

  const specialties = d.specialtiesText
    ? d.specialtiesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // Regla Sección 10: si se desactiva un profesional con citas futuras activas, exigir reasignación o confirmación explícita con alertas
  let reassignedCount = 0;
  let alertedCount = 0;

  if (d.id && !d.active) {
    const futureAppts = await prisma.appointment.findMany({
      where: {
        professionalId: d.id,
        startAtUtc: { gte: new Date() },
        status: { in: ["CONFIRMED", "PENDING_APPROVAL"] },
      },
      orderBy: { startAtUtc: "asc" },
    });

    if (futureAppts.length > 0) {
      const targetProId = d.reassignToProfessionalId?.trim() || "";
      if (!targetProId && !d.forceDeactivateWithAlerts) {
        return {
          ok: false,
          requiresReassignment: true,
          futureAppointmentsCount: futureAppts.length,
          error: `Este profesional tiene ${futureAppts.length} cita(s) futura(s) activa(s). Selecciona a quién reasignarlas o confirma su revisión manual en alertas.`,
        };
      }

      if (targetProId && targetProId !== d.id) {
        for (const appt of futureAppts) {
          try {
            await sequentialWrites(async (tx) => {
              await tx.appointment.update({
                where: { id: appt.id },
                data: { professionalId: targetProId },
              });
              await tx.occupancy.updateMany({
                where: { appointmentId: appt.id },
                data: { professionalId: targetProId },
              });
              await tx.appointmentEvent.create({
                data: {
                  appointmentId: appt.id,
                  eventType: "PROFESSIONAL_REASSIGNED",
                  actorType: "ADMIN",
                  actorId: user.id,
                  detailsJson: {
                    previousProfessionalId: d.id,
                    newProfessionalId: targetProId,
                  },
                },
              });
            });
            reassignedCount++;
          } catch {
            // Si la franja del profesional destino choca con sus bloqueos de minutos (slotLocks), creamos alerta de conflicto para gestión humana
            alertedCount++;
            await prisma.scheduleConflictAlert.create({
              data: {
                appointmentId: appt.id,
                source: "PROFESSIONAL_DEACTIVATION",
                reason: `No se pudo reasignar automáticamente la cita ${appt.referenceCode} por solapamiento horario en el profesional destino.`,
              },
            });
          }
        }
      } else {
        for (const appt of futureAppts) {
          alertedCount++;
          await prisma.scheduleConflictAlert.create({
            data: {
              appointmentId: appt.id,
              source: "PROFESSIONAL_DEACTIVATION",
              reason: `El profesional asignado a la cita ${appt.referenceCode} fue desactivado; requiere reasignación manual.`,
            },
          });
        }
      }
    }
  }

  const saved = await sequentialWrites(async (tx) => {
    const pro = d.id
      ? await tx.professional.update({
          where: { id: d.id },
          data: {
            name: d.name,
            slug: finalSlug,
            roleTitle: d.roleTitle,
            bio: d.bio?.trim() || null,
            specialties,
            photoAssetId: d.photoAssetId?.trim() || null,
            active: d.active,
            publicVisible: d.publicVisible,
            sortOrder: d.sortOrder,
          },
        })
      : await tx.professional.create({
          data: {
            name: d.name,
            slug: finalSlug,
            roleTitle: d.roleTitle,
            bio: d.bio?.trim() || null,
            specialties,
            photoAssetId: d.photoAssetId?.trim() || null,
            active: d.active,
            publicVisible: d.publicVisible,
            sortOrder: d.sortOrder,
          },
        });

    // Sincronizar matriz de servicios habilitados
    await tx.professionalService.deleteMany({
      where: {
        professionalId: pro.id,
        ...(d.serviceIds.length > 0 ? { serviceId: { notIn: d.serviceIds } } : {}),
      },
    });

    for (const serviceId of d.serviceIds) {
      await tx.professionalService.upsert({
        where: {
          professionalId_serviceId: {
            professionalId: pro.id,
            serviceId,
          },
        },
        update: { active: true },
        create: {
          professionalId: pro.id,
          serviceId,
          active: true,
        },
      });
    }

    return pro;
  });

  await prisma.auditEvent.create({
    data: {
      actorUserId: user.id,
      action: d.id ? "PROFESSIONAL_UPDATED" : "PROFESSIONAL_CREATED",
      entityType: "Professional",
      entityId: saved.id,
      summary: `Profesional ${d.id ? "actualizado" : "creado"}: ${saved.name} (${d.serviceIds.length} servicios habilitados).`,
    },
  });

  revalidatePath("/");
  revalidatePath("/equipo");
  revalidatePath("/servicios");
  revalidatePath("/reservar");
  revalidatePath("/admin");
  revalidatePath("/admin/equipo");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/horarios");

  return {
    ok: true,
    reassignedCount,
    alertedCount,
  };
}
