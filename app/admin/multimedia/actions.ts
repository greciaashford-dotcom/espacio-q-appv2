"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { canManageCatalogOrCms, getCurrentUser } from "@/lib/auth/session";

const updateSchema = z.object({
  id: z.string().min(1),
  internalName: z.string().trim().min(1).max(160),
  altText: z.string().trim().min(1).max(240),
  caption: z.string().trim().max(240).optional().or(z.literal("")),
  category: z.string().trim().min(1).max(40),
  focalPointX: z.coerce.number().min(0).max(100),
  focalPointY: z.coerce.number().min(0).max(100),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  authorCredit: z.string().trim().max(160).optional().or(z.literal("")),
  licenseNote: z.string().trim().max(240).optional().or(z.literal("")),
  isProvisional: z.boolean(),
  publicVisible: z.boolean(),
});

export async function updateMediaAssetAction(input: z.infer<typeof updateSchema>) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "Sin permisos suficientes." };
  }

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos de imagen inválidos." };
  }

  await prisma.mediaAsset.update({
    where: { id: parsed.data.id },
    data: {
      internalName: parsed.data.internalName,
      altText: parsed.data.altText,
      caption: parsed.data.caption || null,
      category: parsed.data.category,
      focalPointX: parsed.data.focalPointX,
      focalPointY: parsed.data.focalPointY,
      sortOrder: parsed.data.sortOrder,
      authorCredit: parsed.data.authorCredit || null,
      licenseNote: parsed.data.licenseNote || null,
      isProvisional: parsed.data.isProvisional,
      publicVisible: parsed.data.publicVisible,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/galeria");
  revalidatePath("/admin/multimedia");
  return { ok: true };
}

export async function deleteMediaAssetAction(id: string) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "Sin permisos suficientes." };
  }

  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    include: {
      usages: true,
      services: { select: { name: true } },
      professionals: { select: { name: true } },
    },
  });

  if (!asset) {
    return { ok: false, error: "Imagen no encontrada." };
  }

  const usedIn: string[] = [
    ...asset.usages.map((u) => u.locationName),
    ...asset.services.map((s) => `Servicio: ${s.name}`),
    ...asset.professionals.map((p) => `Profesional: ${p.name}`),
  ];

  // Verificar si su src aparece en algún bloque CMS publicado/borrador
  const cmsPages = await prisma.pageContent.findMany({
    select: { title: true, publishedData: true, draftData: true },
  });
  for (const page of cmsPages) {
    const raw = JSON.stringify([page.publishedData, page.draftData]);
    if (raw.includes(asset.src)) {
      usedIn.push(`CMS: ${page.title}`);
    }
  }

  if (usedIn.length > 0) {
    const uniqueUses = Array.from(new Set(usedIn));
    return {
      ok: false,
      error: `No se puede eliminar porque está en uso en: ${uniqueUses.join(", ")}. Sustitúyela primero para evitar enlaces rotos.`,
    };
  }

  await prisma.mediaAsset.delete({ where: { id } });
  await prisma.auditEvent.create({
    data: {
      actorUserId: user.id,
      action: "MEDIA_DELETE",
      entityType: "MediaAsset",
      entityId: id,
      summary: `Eliminada imagen: ${asset.internalName}`,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/galeria");
  revalidatePath("/admin/multimedia");
  return { ok: true };
}
