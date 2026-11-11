"use server";

import { revalidatePath } from "next/cache";
import { appUrl as getAppUrl } from "@/lib/app-url";
import { z } from "zod";
import { prisma, sequentialWrites } from "@/lib/db/prisma";
import { getCurrentUser, canManageCampaigns } from "@/lib/auth/session";
import { dispatchEmailWithAudit, renderZenLinenEmailLayout } from "@/lib/email/provider";
import { processDueJobsAndCampaigns } from "@/lib/jobs/worker";
import { normalizeEmail } from "@/lib/utils";

const campaignSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Nombre interno obligatorio").max(140),
  subject: z.string().trim().min(3, "Asunto obligatorio").max(160),
  preheader: z.string().trim().max(180).optional().or(z.literal("")),
  heading: z.string().trim().min(3, "Titular editorial obligatorio").max(180),
  bodyText: z.string().trim().min(10, "Cuerpo del mensaje obligatorio").max(8000),
  ctaLabel: z.string().trim().max(80).optional().or(z.literal("")),
  ctaUrl: z.string().trim().url("URL del botón inválida").optional().or(z.literal("")),
  tagsText: z.string().trim().max(300).optional().or(z.literal("")),
});

async function findEligibleActiveSubscribers(tags: string[]) {
  const suppressed = await prisma.suppression.findMany({
    select: { emailNormalized: true },
  });
  const suppressedSet = new Set(suppressed.map((s) => s.emailNormalized));

  const activeSubs = await prisma.subscriber.findMany({
    where: {
      status: "ACTIVE",
      confirmedAt: { not: null },
      ...(tags.length > 0 ? { tags: { hasSome: tags } } : {}),
    },
    select: {
      id: true,
      emailNormalized: true,
    },
  });

  return activeSubs.filter((s) => !suppressedSet.has(s.emailNormalized));
}

export async function saveCampaignDraftAction(input: z.infer<typeof campaignSchema>) {
  const user = await getCurrentUser();
  if (!user || !canManageCampaigns(user)) {
    return { ok: false, error: "No autorizado para gestionar campañas de marketing." };
  }

  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Campaña inválida." };
  }

  const d = parsed.data;
  const tags = d.tagsText
    ? d.tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const eligible = await findEligibleActiveSubscribers(tags);

  const payload = {
    name: d.name,
    subject: d.subject,
    preheader: d.preheader?.trim() || null,
    heading: d.heading,
    bodyText: d.bodyText,
    ctaLabel: d.ctaLabel?.trim() || null,
    ctaUrl: d.ctaUrl?.trim() || null,
    segmentFilterJson: { tags, onlyConfirmed: true },
    totalRecipients: eligible.length,
    createdBy: user.id,
  };

  const saved = d.id
    ? await prisma.campaign.update({
        where: { id: d.id },
        data: payload,
      })
    : await prisma.campaign.create({
        data: {
          ...payload,
          status: "DRAFT",
        },
      });

  await prisma.auditEvent.create({
    data: {
      actorUserId: user.id,
      action: d.id ? "CAMPAIGN_UPDATED" : "CAMPAIGN_CREATED",
      entityType: "Campaign",
      entityId: saved.id,
      summary: `Borrador de campaña "${saved.name}" guardado (${eligible.length} destinatarios elegibles).`,
    },
  });

  revalidatePath("/admin/marketing");
  return { ok: true, campaignId: saved.id, eligibleCount: eligible.length };
}

export async function sendTestCampaignEmailAction(params: {
  campaignId: string;
  testEmail: string;
}) {
  const user = await getCurrentUser();
  if (!user || !canManageCampaigns(user)) {
    return { ok: false, error: "No autorizado." };
  }

  const toEmail = normalizeEmail(params.testEmail);
  if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    return { ok: false, error: "Introduce un correo de prueba válido." };
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.campaignId },
  });
  if (!campaign) return { ok: false, error: "Campaña no encontrada." };

  const appUrl = getAppUrl();
  const rendered = renderZenLinenEmailLayout({
    heading: campaign.heading,
    preheader: campaign.preheader ?? campaign.subject,
    paragraphs: campaign.bodyText
      .split(/\n+/)
      .map((p: any) => p.trim())
      .filter(Boolean),
    cta:
      campaign.ctaLabel && campaign.ctaUrl
        ? { label: campaign.ctaLabel, url: campaign.ctaUrl }
        : undefined,
    unsubscribeUrl: `${appUrl}/newsletter/baja?token=ejemplo-vista-previa`,
  });

  const dispatchRes = await dispatchEmailWithAudit({
    dedupKey: `campaign-test:${campaign.id}:${Date.now()}`,
    category: "MARKETING",
    templateKey: `CAMPAIGN_TEST_${campaign.id}`,
    toEmail,
    subject: `[PRUEBA] ${campaign.subject}`,
    htmlBody: rendered.html,
    textBody: rendered.text,
    campaignId: campaign.id,
  });

  revalidatePath("/admin/automatizaciones");
  return {
    ok: true,
    deliveryStatus: dispatchRes.status,
  };
}

export async function launchCampaignAction(params: {
  campaignId: string;
  scheduledAtIso?: string;
}) {
  const user = await getCurrentUser();
  if (!user || !canManageCampaigns(user)) {
    return { ok: false, error: "No autorizado." };
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.campaignId },
  });
  if (!campaign) return { ok: false, error: "Campaña no encontrada." };
  if (campaign.status !== "DRAFT" && campaign.status !== "READY") {
    return { ok: false, error: "Solo se pueden programar campañas en estado borrador." };
  }

  const filter = (campaign.segmentFilterJson ?? {}) as { tags?: string[] };
  const tags = Array.isArray(filter.tags) ? filter.tags : [];
  const eligible = await findEligibleActiveSubscribers(tags);

  if (eligible.length === 0) {
    return {
      ok: false,
      error:
        "No hay suscriptores activos con double opt-in confirmado y no suprimidos para este segmento.",
    };
  }

  const now = new Date();
  const scheduledAt = params.scheduledAtIso ? new Date(params.scheduledAtIso) : now;
  const validSchedule = Number.isNaN(scheduledAt.getTime()) ? now : scheduledAt;

  await sequentialWrites(async (tx) => {
    await tx.campaignRecipient.deleteMany({ where: { campaignId: campaign.id } });
    await tx.campaignRecipient.createMany({
      data: eligible.map((sub) => ({
        campaignId: campaign.id,
        subscriberId: sub.id,
        emailNormalized: sub.emailNormalized,
        status: "PENDING",
      })),
    });

    await tx.campaign.update({
      where: { id: campaign.id },
      data: {
        status: "SCHEDULED",
        scheduledAtUtc: validSchedule,
        totalRecipients: eligible.length,
      },
    });

    await tx.auditEvent.create({
      data: {
        actorUserId: user.id,
        action: "CAMPAIGN_SCHEDULED",
        entityType: "Campaign",
        entityId: campaign.id,
        summary: `Campaña "${campaign.name}" lanzada/programada para ${eligible.length} destinatarios confirmados.`,
      },
    });
  });

  if (validSchedule <= now) {
    await processDueJobsAndCampaigns({ nowUtc: new Date() });
  }

  revalidatePath("/admin/marketing");
  revalidatePath("/admin/automatizaciones");
  return { ok: true, recipientsQueued: eligible.length };
}

export async function addManualSuppressionAction(emailInput: string) {
  const user = await getCurrentUser();
  if (!user || !canManageCampaigns(user)) {
    return { ok: false, error: "No autorizado." };
  }

  const emailNormalized = normalizeEmail(emailInput);
  if (!emailNormalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalized)) {
    return { ok: false, error: "Correo electrónico inválido." };
  }

  await sequentialWrites(async (tx) => {
    await tx.suppression.upsert({
      where: { emailNormalized },
      update: { reason: "MANUAL_SUPPRESSION" },
      create: {
        emailNormalized,
        reason: "MANUAL_SUPPRESSION",
      },
    });

    await tx.subscriber.updateMany({
      where: { emailNormalized },
      data: { status: "SUPPRESSED", unsubscribedAt: new Date() },
    });

    await tx.client.updateMany({
      where: { emailNormalized },
      data: { marketingConsent: false },
    });
  });

  revalidatePath("/admin/marketing");
  return { ok: true };
}
