import { prisma } from "@/lib/db/prisma";
import { getPublishedCmsBlock } from "@/lib/domain/cms";

export type FaqItem = { question: string; answer: string };

/** Sustituye {{phone}} y {{cancellationFreeHours}} con los datos reales del salón. */
export function fillSalonPlaceholders(text: string, s: { phone?: string | null; cancellationFreeHours?: number | null }) {
  return text
    .replace(/\{\{phone\}\}/g, s.phone || "el teléfono del salón")
    .replace(/\{\{cancellationFreeHours\}\}/g, String(s.cancellationFreeHours ?? 24));
}

export async function getPublishedFaq(options?: { previewDraft?: boolean }) {
  const [block, settings] = await Promise.all([
    getPublishedCmsBlock<Record<string, any>>("page_faq", options),
    prisma.salonSettings.findUnique({ where: { id: "default" } }),
  ]);
  const data = block.data || {};
  const items: FaqItem[] = (Array.isArray(data.items) ? data.items : [])
    .filter((i: any) => i && String(i.question || "").trim() && String(i.answer || "").trim())
    .map((i: any) => ({
      question: fillSalonPlaceholders(String(i.question).trim(), settings ?? {}),
      answer: fillSalonPlaceholders(String(i.answer).trim(), settings ?? {}),
    }));
  return { block, data, items };
}
