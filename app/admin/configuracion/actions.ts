"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, canManageSettingsOrUsers } from "@/lib/auth/session";
import { hashPassword } from "@/lib/security/crypto";
import { normalizeEmail } from "@/lib/utils";

const settingsSchema = z.object({
  brandName: z.string().trim().min(2, "El nombre de marca es obligatorio").max(120),
  tagline: z.string().trim().min(2).max(200),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  googleMapsUrl: z.string().trim().url("URL de Google Maps inválida"),
  addressLine: z.string().trim().max(200).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  neighborhood: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(40).optional().or(z.literal("")),
  contactEmail: z.string().trim().email("Email de contacto inválido").optional().or(z.literal("")),
  instagramUrl: z.string().trim().url("URL de Instagram inválida").optional().or(z.literal("")),
  facebookUrl: z.string().trim().url("URL de Facebook inválida").optional().or(z.literal("")),
  tiktokUrl: z.string().trim().url("URL de TikTok inválida").optional().or(z.literal("")),
  legalOwnerName: z.string().trim().max(200).optional().or(z.literal("")),
  legalTaxId: z.string().trim().max(40).optional().or(z.literal("")),
  legalRegistryInfo: z.string().trim().max(300).optional().or(z.literal("")),
  legalRegisteredAddress: z.string().trim().max(250).optional().or(z.literal("")),
  legalDpoEmail: z.string().trim().email("Email RGPD/DPO inválido").optional().or(z.literal("")),
  publicBookingEnabled: z.boolean(),
  bookingApprovalMode: z.enum(["AUTOMATIC", "MANUAL"]),
  slotIntervalMin: z.coerce.number().int().min(5).max(120),
  minAdvanceNoticeMin: z.coerce.number().int().min(0).max(10080),
  maxBookingHorizonDays: z.coerce.number().int().min(1).max(365),
  cancellationFreeHours: z.coerce.number().int().min(0).max(168),
  rescheduleFreeHours: z.coerce.number().int().min(0).max(168),
  contactRetentionDays: z.coerce.number().int().min(30).max(3650),
  exportRetentionHours: z.coerce.number().int().min(1).max(168),
  analyticsCookiesEnabled: z.boolean(),
  marketingCookiesEnabled: z.boolean(),
  externalMapEmbedEnabled: z.boolean(),
});

function toNull(val?: string): string | null {
  const t = val?.trim();
  return t ? t : null;
}

export async function updateSalonSettingsAction(input: z.infer<typeof settingsSchema>) {
  const user = await getCurrentUser();
  if (!user || !canManageSettingsOrUsers(user)) {
    return { ok: false, error: "No tienes permisos para modificar la configuración del salón." };
  }

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de configuración inválidos.",
    };
  }

  const d = parsed.data;
  await prisma.salonSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      brandName: d.brandName,
      tagline: d.tagline,
      city: d.city,
      country: d.country,
      googleMapsUrl: d.googleMapsUrl,
      addressLine: toNull(d.addressLine),
      postalCode: toNull(d.postalCode),
      neighborhood: toNull(d.neighborhood),
      phone: toNull(d.phone),
      whatsapp: toNull(d.whatsapp),
      contactEmail: toNull(d.contactEmail),
      instagramUrl: toNull(d.instagramUrl),
      facebookUrl: toNull(d.facebookUrl),
      tiktokUrl: toNull(d.tiktokUrl),
      legalOwnerName: toNull(d.legalOwnerName),
      legalTaxId: toNull(d.legalTaxId),
      legalRegistryInfo: toNull(d.legalRegistryInfo),
      legalRegisteredAddress: toNull(d.legalRegisteredAddress),
      legalDpoEmail: toNull(d.legalDpoEmail),
      publicBookingEnabled: d.publicBookingEnabled,
      bookingApprovalMode: d.bookingApprovalMode,
      slotIntervalMin: d.slotIntervalMin,
      minAdvanceNoticeMin: d.minAdvanceNoticeMin,
      maxBookingHorizonDays: d.maxBookingHorizonDays,
      cancellationFreeHours: d.cancellationFreeHours,
      rescheduleFreeHours: d.rescheduleFreeHours,
      contactRetentionDays: d.contactRetentionDays,
      exportRetentionHours: d.exportRetentionHours,
      analyticsCookiesEnabled: d.analyticsCookiesEnabled,
      marketingCookiesEnabled: d.marketingCookiesEnabled,
      externalMapEmbedEnabled: d.externalMapEmbedEnabled,
    },
    update: {
      brandName: d.brandName,
      tagline: d.tagline,
      city: d.city,
      country: d.country,
      googleMapsUrl: d.googleMapsUrl,
      addressLine: toNull(d.addressLine),
      postalCode: toNull(d.postalCode),
      neighborhood: toNull(d.neighborhood),
      phone: toNull(d.phone),
      whatsapp: toNull(d.whatsapp),
      contactEmail: toNull(d.contactEmail),
      instagramUrl: toNull(d.instagramUrl),
      facebookUrl: toNull(d.facebookUrl),
      tiktokUrl: toNull(d.tiktokUrl),
      legalOwnerName: toNull(d.legalOwnerName),
      legalTaxId: toNull(d.legalTaxId),
      legalRegistryInfo: toNull(d.legalRegistryInfo),
      legalRegisteredAddress: toNull(d.legalRegisteredAddress),
      legalDpoEmail: toNull(d.legalDpoEmail),
      publicBookingEnabled: d.publicBookingEnabled,
      bookingApprovalMode: d.bookingApprovalMode,
      slotIntervalMin: d.slotIntervalMin,
      minAdvanceNoticeMin: d.minAdvanceNoticeMin,
      maxBookingHorizonDays: d.maxBookingHorizonDays,
      cancellationFreeHours: d.cancellationFreeHours,
      rescheduleFreeHours: d.rescheduleFreeHours,
      contactRetentionDays: d.contactRetentionDays,
      exportRetentionHours: d.exportRetentionHours,
      analyticsCookiesEnabled: d.analyticsCookiesEnabled,
      marketingCookiesEnabled: d.marketingCookiesEnabled,
      externalMapEmbedEnabled: d.externalMapEmbedEnabled,
    },
  });

  await prisma.auditEvent.create({
    data: {
      actorUserId: user.id,
      action: "SALON_SETTINGS_UPDATED",
      entityType: "SalonSettings",
      entityId: "default",
      summary: "Actualización de configuración general, fiscal/legal y políticas operativas.",
    },
  });

  for (const path of [
    "/",
    "/contacto",
    "/reservar",
    "/aviso-legal",
    "/terminos-y-condiciones",
    "/condiciones-reserva",
    "/privacidad",
    "/cookies",
    "/admin",
    "/admin/configuracion",
  ]) {
    revalidatePath(path);
  }

  return { ok: true };
}

const createStaffSchema = z.object({
  name: z.string().trim().min(2, "Nombre obligatorio").max(120),
  email: z.string().trim().email("Correo electrónico inválido"),
  password: z.string().min(10, "La contraseña debe tener al menos 10 caracteres").max(128),
  role: z.enum(["OWNER_ADMIN", "RECEPTION", "PROFESSIONAL"]),
  professionalId: z.string().trim().optional().or(z.literal("")),
  canExportData: z.boolean(),
  canManageMarketing: z.boolean(),
});

export async function createStaffUserAction(input: z.infer<typeof createStaffSchema>) {
  const actor = await getCurrentUser();
  if (!actor || !canManageSettingsOrUsers(actor)) {
    return { ok: false, error: "Solo el perfil Propietaria/o puede gestionar usuarios." };
  }

  const parsed = createStaffSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos de usuario inválidos." };
  }

  const email = normalizeEmail(parsed.data.email);
  if (!email) return { ok: false, error: "Correo inválido." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Ya existe un usuario con ese correo electrónico." };
  }

  const proId = parsed.data.professionalId?.trim() || null;
  if (proId) {
    const linked = await prisma.user.findFirst({ where: { professionalId: proId } });
    if (linked) {
      return { ok: false, error: "Ese perfil profesional ya está vinculado a otro usuario." };
    }
  }

  const created = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: hashPassword(parsed.data.password),
      role: parsed.data.role,
      professionalId: proId,
      canExportData: parsed.data.role === "RECEPTION" ? parsed.data.canExportData : false,
      canManageMarketing: parsed.data.role === "RECEPTION" ? parsed.data.canManageMarketing : false,
      active: true,
    },
  });

  await prisma.auditEvent.create({
    data: {
      actorUserId: actor.id,
      action: "STAFF_USER_CREATED",
      entityType: "User",
      entityId: created.id,
      summary: `Usuario interno creado: ${created.email} (${created.role}).`,
    },
  });

  revalidatePath("/admin/configuracion");
  return { ok: true };
}

const updateStaffSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["OWNER_ADMIN", "RECEPTION", "PROFESSIONAL"]),
  professionalId: z.string().trim().optional().or(z.literal("")),
  active: z.boolean(),
  canExportData: z.boolean(),
  canManageMarketing: z.boolean(),
  newPassword: z.string().optional().or(z.literal("")),
});

export async function updateStaffUserAction(input: z.infer<typeof updateStaffSchema>) {
  const actor = await getCurrentUser();
  if (!actor || !canManageSettingsOrUsers(actor)) {
    return { ok: false, error: "No autorizado." };
  }

  const parsed = updateStaffSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const target = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!target) {
    return { ok: false, error: "Usuario no encontrado." };
  }

  if (parsed.data.newPassword && parsed.data.newPassword.length < 10) {
    return { ok: false, error: "La nueva contraseña debe tener al menos 10 caracteres." };
  }

  // Impedir dejar el sistema sin al menos un OWNER_ADMIN activo
  if (
    target.role === "OWNER_ADMIN" &&
    (!parsed.data.active || parsed.data.role !== "OWNER_ADMIN")
  ) {
    const otherOwners = await prisma.user.count({
      where: {
        id: { not: target.id },
        role: "OWNER_ADMIN",
        active: true,
      },
    });
    if (otherOwners === 0) {
      return {
        ok: false,
        error: "Debe permanecer al menos una cuenta activa con rol Propietaria/o (OWNER_ADMIN).",
      };
    }
  }

  const proId = parsed.data.professionalId?.trim() || null;
  if (proId) {
    const linked = await prisma.user.findFirst({
      where: { professionalId: proId, id: { not: target.id } },
    });
    if (linked) {
      return { ok: false, error: "Ese perfil profesional ya está asignado a otro usuario." };
    }
  }

  await prisma.user.update({
    where: { id: target.id },
    data: {
      role: parsed.data.role,
      professionalId: proId,
      active: parsed.data.active,
      canExportData: parsed.data.role === "RECEPTION" ? parsed.data.canExportData : false,
      canManageMarketing:
        parsed.data.role === "RECEPTION" ? parsed.data.canManageMarketing : false,
      ...(parsed.data.newPassword
        ? { passwordHash: hashPassword(parsed.data.newPassword) }
        : {}),
    },
  });

  if (!parsed.data.active) {
    await prisma.session.deleteMany({ where: { userId: target.id } });
  }

  await prisma.auditEvent.create({
    data: {
      actorUserId: actor.id,
      action: "STAFF_USER_UPDATED",
      entityType: "User",
      entityId: target.id,
      summary: `Actualizado usuario ${target.email} (rol: ${parsed.data.role}, activo: ${parsed.data.active}).`,
    },
  });

  revalidatePath("/admin/configuracion");
  return { ok: true };
}
