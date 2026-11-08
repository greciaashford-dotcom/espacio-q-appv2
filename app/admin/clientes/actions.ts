"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, canManageCatalogOrCms } from "@/lib/auth/session";
import { normalizeEmail, normalizePhone } from "@/lib/utils";

const clientSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().trim().min(2, "Nombre obligatorio").max(120),
  lastName: z.string().trim().max(140).optional().or(z.literal("")),
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  tagsText: z.string().trim().max(300).optional().or(z.literal("")),
  internalNotes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function saveClientAction(input: z.infer<typeof clientSchema>) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado para gestionar el CRM." };
  }

  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos de cliente inválidos." };
  }

  const d = parsed.data;
  const emailNormalized = normalizeEmail(d.email);
  const phoneNormalized = normalizePhone(d.phone);
  const tags = d.tagsText
    ? d.tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  if (emailNormalized) {
    const dup = await prisma.client.findFirst({
      where: {
        emailNormalized,
        ...(d.id ? { id: { not: d.id } } : {}),
      },
    });
    if (dup) {
      return { ok: false, error: `Ya existe una ficha con el correo ${emailNormalized}.` };
    }
  }

  const saved = d.id
    ? await prisma.client.update({
        where: { id: d.id },
        data: {
          firstName: d.firstName,
          lastName: d.lastName?.trim() || null,
          email: emailNormalized,
          emailNormalized,
          phone: d.phone?.trim() || null,
          phoneNormalized,
          tags,
          internalNotes: d.internalNotes?.trim() || null,
        },
      })
    : await prisma.client.create({
        data: {
          firstName: d.firstName,
          lastName: d.lastName?.trim() || null,
          email: emailNormalized,
          emailNormalized,
          phone: d.phone?.trim() || null,
          phoneNormalized,
          tags,
          internalNotes: d.internalNotes?.trim() || null,
          marketingConsent: false,
          status: "ACTIVE",
        },
      });

  await prisma.auditEvent.create({
    data: {
      actorUserId: user.id,
      action: d.id ? "CLIENT_UPDATED" : "CLIENT_CREATED",
      entityType: "Client",
      entityId: saved.id,
      summary: `Ficha de cliente ${d.id ? "actualizada" : "creada"}: ${saved.firstName}.`,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/clientes");
  return { ok: true };
}

export async function revokeClientMarketingConsentAction(clientId: string) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado." };
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return { ok: false, error: "Cliente no encontrado." };

  await prisma.$transaction(async (tx) => {
    await tx.client.update({
      where: { id: client.id },
      data: { marketingConsent: false },
    });

    if (client.emailNormalized) {
      await tx.suppression.upsert({
        where: { emailNormalized: client.emailNormalized },
        update: { reason: "MANUAL_SUPPRESSION" },
        create: {
          emailNormalized: client.emailNormalized,
          reason: "MANUAL_SUPPRESSION",
        },
      });

      await tx.subscriber.updateMany({
        where: { emailNormalized: client.emailNormalized },
        data: {
          status: "UNSUBSCRIBED",
          unsubscribedAt: new Date(),
        },
      });

      await tx.consentEvent.create({
        data: {
          clientId: client.id,
          email: client.emailNormalized,
          action: "ADMIN_REVOKED",
          channel: "admin",
          policyVersion: "v1.0",
          consentText: "Consentimiento comercial revocado desde ficha CRM a petición del cliente.",
        },
      });
    }
  });

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/marketing");
  return { ok: true };
}

export async function archiveOrRestoreClientAction(clientId: string, archive: boolean) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado." };
  }

  await prisma.client.update({
    where: { id: clientId },
    data: { status: archive ? "ARCHIVED" : "ACTIVE" },
  });

  revalidatePath("/admin/clientes");
  return { ok: true };
}

export async function anonymizeClientRgpdAction(clientId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER_ADMIN") {
    return {
      ok: false,
      error: "La anonimización irreversible RGPD requiere rol Propietaria/o (OWNER_ADMIN).",
    };
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return { ok: false, error: "Cliente no encontrado." };

  await prisma.$transaction(async (tx) => {
    if (client.emailNormalized) {
      await tx.subscriber.deleteMany({
        where: { emailNormalized: client.emailNormalized },
      });
    }

    await tx.client.update({
      where: { id: client.id },
      data: {
        externalId: null,
        firstName: "Cliente",
        lastName: "Anonimizado (RGPD)",
        email: null,
        emailNormalized: null,
        phone: null,
        phoneNormalized: null,
        tags: [],
        internalNotes: null,
        marketingConsent: false,
        marketingConsentAt: null,
        status: "ANONYMIZED",
        anonymizedAt: new Date(),
      },
    });

    // Limpiar PII de snapshots de contacto en citas pasadas manteniendo la integridad de citas
    await tx.appointment.updateMany({
      where: { clientId: client.id },
      data: {
        customerName: "Cliente Anonimizado",
        customerEmail: null,
        customerPhone: null,
        customerNotes: null,
      },
    });

    await tx.auditEvent.create({
      data: {
        actorUserId: user.id,
        action: "CLIENT_ANONYMIZED_RGPD",
        entityType: "Client",
        entityId: client.id,
        summary: `Ficha de cliente ${client.id} anonimizada conforme a RGPD.`,
      },
    });
  });

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/agenda");
  return { ok: true };
}
