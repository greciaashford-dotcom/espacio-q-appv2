"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, canManageCatalogOrCms } from "@/lib/auth/session";
import { processDueJobsAndCampaigns } from "@/lib/jobs/worker";

export async function runWorkerNowAction() {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado." };
  }

  const stats = await processDueJobsAndCampaigns({ nowUtc: new Date(), batchSize: 50 });

  revalidatePath("/admin");
  revalidatePath("/admin/automatizaciones");
  revalidatePath("/admin/marketing");
  return { ok: true, stats };
}

export async function retryFailedJobsAction() {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado." };
  }

  const now = new Date();
  const updated = await prisma.notificationJob.updateMany({
    where: { status: "FAILED" },
    data: {
      status: "PENDING",
      attempts: 0,
      nextAttemptUtc: now,
      lockedUntilUtc: null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/automatizaciones");
  return { ok: true, count: updated.count };
}

export async function toggleAutomationRuleAction(ruleId: string, active: boolean) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado." };
  }

  await prisma.automationRule.update({
    where: { id: ruleId },
    data: { active },
  });

  revalidatePath("/admin/automatizaciones");
  return { ok: true };
}

const templateSchema = z.object({
  id: z.string().min(1),
  subject: z.string().trim().min(3).max(160),
  heading: z.string().trim().min(3).max(160),
  bodyTemplate: z.string().trim().min(5).max(4000),
  footerNote: z.string().trim().max(300).optional().or(z.literal("")),
  active: z.boolean(),
});

export async function updateEmailTemplateAction(input: z.infer<typeof templateSchema>) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado." };
  }

  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Plantilla inválida." };
  }

  const d = parsed.data;
  await prisma.emailTemplate.update({
    where: { id: d.id },
    data: {
      subject: d.subject,
      heading: d.heading,
      bodyTemplate: d.bodyTemplate,
      footerNote: d.footerNote?.trim() || null,
      active: d.active,
    },
  });

  revalidatePath("/admin/automatizaciones");
  return { ok: true };
}
