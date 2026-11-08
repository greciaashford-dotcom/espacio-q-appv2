"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, canManageCatalogOrCms } from "@/lib/auth/session";
import { slugify } from "@/lib/utils";

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Nombre de categoría obligatorio").max(100),
  slug: z.string().trim().max(100).optional(),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(999),
  active: z.boolean(),
});

export async function saveServiceCategoryAction(input: z.infer<typeof categorySchema>) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado para gestionar el catálogo." };
  }

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Categoría inválida." };
  }

  const d = parsed.data;
  const finalSlug = slugify(d.slug || d.name);
  if (!finalSlug) return { ok: false, error: "Slug inválido." };

  const duplicate = await prisma.serviceCategory.findFirst({
    where: { slug: finalSlug, ...(d.id ? { id: { not: d.id } } : {}) },
  });
  if (duplicate) {
    return { ok: false, error: `Ya existe una categoría con el identificador "${finalSlug}".` };
  }

  const saved = d.id
    ? await prisma.serviceCategory.update({
        where: { id: d.id },
        data: {
          name: d.name,
          slug: finalSlug,
          description: d.description?.trim() || null,
          sortOrder: d.sortOrder,
          active: d.active,
        },
      })
    : await prisma.serviceCategory.create({
        data: {
          name: d.name,
          slug: finalSlug,
          description: d.description?.trim() || null,
          sortOrder: d.sortOrder,
          active: d.active,
        },
      });

  await prisma.auditEvent.create({
    data: {
      actorUserId: user.id,
      action: d.id ? "SERVICE_CATEGORY_UPDATED" : "SERVICE_CATEGORY_CREATED",
      entityType: "ServiceCategory",
      entityId: saved.id,
      summary: `Categoría de servicio ${d.id ? "actualizada" : "creada"}: ${saved.name}.`,
    },
  });

  revalidatePath("/");
  revalidatePath("/servicios");
  revalidatePath("/reservar");
  revalidatePath("/admin/servicios");
  return { ok: true };
}

export async function deleteServiceCategoryAction(categoryId: string) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado." };
  }

  const count = await prisma.service.count({ where: { categoryId } });
  if (count > 0) {
    await prisma.serviceCategory.update({
      where: { id: categoryId },
      data: { active: false },
    });
    revalidatePath("/servicios");
    revalidatePath("/admin/servicios");
    return {
      ok: true,
      message: "La categoría tiene servicios asociados; se ha desactivado en lugar de borrarse.",
    };
  }

  await prisma.serviceCategory.delete({ where: { id: categoryId } });
  revalidatePath("/servicios");
  revalidatePath("/admin/servicios");
  return { ok: true };
}

const serviceSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1, "Selecciona una categoría"),
  name: z.string().trim().min(2, "Nombre del servicio obligatorio").max(140),
  slug: z.string().trim().max(140).optional(),
  shortDescription: z.string().trim().min(5, "Resumen breve obligatorio").max(260),
  description: z.string().trim().min(10, "Descripción completa obligatoria").max(4000),
  durationMin: z.coerce.number().int().min(5, "Mínimo 5 minutos").max(600),
  bufferBeforeMin: z.coerce.number().int().min(0).max(120),
  bufferAfterMin: z.coerce.number().int().min(0).max(120),
  priceType: z.enum(["FIXED", "FROM", "CONSULT"]),
  priceEuros: z.string().optional().or(z.literal("")),
  featured: z.boolean(),
  active: z.boolean(),
  imageAssetId: z.string().optional().or(z.literal("")),
  seoTitle: z.string().trim().max(160).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(300).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export async function saveServiceAction(input: z.infer<typeof serviceSchema>) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado." };
  }

  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos de servicio inválidos." };
  }

  const d = parsed.data;
  const finalSlug = slugify(d.slug || d.name);
  if (!finalSlug) return { ok: false, error: "Slug inválido." };

  const dup = await prisma.service.findFirst({
    where: { slug: finalSlug, ...(d.id ? { id: { not: d.id } } : {}) },
  });
  if (dup) {
    return { ok: false, error: `Ya existe un servicio con el slug "${finalSlug}".` };
  }

  let priceCents: number | null = null;
  if (d.priceType !== "CONSULT") {
    const normalizedNum = Number(String(d.priceEuros ?? "").replace(",", "."));
    if (!Number.isFinite(normalizedNum) || normalizedNum < 0) {
      return {
        ok: false,
        error: "Introduce un importe en euros válido (o selecciona «A consultar tras diagnóstico»).",
      };
    }
    priceCents = Math.round(normalizedNum * 100);
  }

  const payload = {
    categoryId: d.categoryId,
    name: d.name,
    slug: finalSlug,
    shortDescription: d.shortDescription,
    description: d.description,
    durationMin: d.durationMin,
    bufferBeforeMin: d.bufferBeforeMin,
    bufferAfterMin: d.bufferAfterMin,
    priceType: d.priceType,
    priceCents,
    currency: "EUR",
    featured: d.featured,
    active: d.active,
    imageAssetId: d.imageAssetId?.trim() || null,
    seoTitle: d.seoTitle?.trim() || null,
    seoDescription: d.seoDescription?.trim() || null,
    sortOrder: d.sortOrder,
  };

  const saved = d.id
    ? await prisma.service.update({ where: { id: d.id }, data: payload })
    : await prisma.service.create({ data: payload });

  await prisma.auditEvent.create({
    data: {
      actorUserId: user.id,
      action: d.id ? "SERVICE_UPDATED" : "SERVICE_CREATED",
      entityType: "Service",
      entityId: saved.id,
      summary: `Servicio ${d.id ? "actualizado" : "creado"}: ${saved.name}.`,
    },
  });

  revalidatePath("/");
  revalidatePath("/servicios");
  revalidatePath(`/servicios/${saved.slug}`);
  revalidatePath("/reservar");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin");
  revalidatePath("/admin/servicios");
  revalidatePath("/admin/equipo");
  return { ok: true };
}

export async function deleteOrDeactivateServiceAction(serviceId: string) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado." };
  }

  const apptCount = await prisma.appointment.count({ where: { serviceId } });
  if (apptCount > 0) {
    await prisma.service.update({
      where: { id: serviceId },
      data: { active: false },
    });
    revalidatePath("/");
    revalidatePath("/servicios");
    revalidatePath("/reservar");
    revalidatePath("/admin/servicios");
    return {
      ok: true,
      deactivatedOnly: true,
      message:
        "El servicio tiene citas históricas o futuras; se ha desactivado para conservar la integridad contable y los snapshots de las citas.",
    };
  }

  await prisma.service.delete({ where: { id: serviceId } });
  revalidatePath("/");
  revalidatePath("/servicios");
  revalidatePath("/reservar");
  revalidatePath("/admin/servicios");
  return { ok: true, deactivatedOnly: false };
}
