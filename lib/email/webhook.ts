import crypto from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { normalizeEmail } from "@/lib/utils";

const MAX_TOLERANCE_SEC = 300; // 5 minutos contra replay attacks

export function signWebhookPayload(
  rawBody: string,
  timestampSec: number,
  secret: string
): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestampSec}.${rawBody}`)
    .digest("hex");
}

export async function processSignedEmailWebhook(params: {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  nowMs?: number;
}): Promise<
  | { ok: true; idempotentReplay: boolean; eventType: string }
  | { ok: false; status: 400 | 401 | 503; error: string }
> {
  const secret = process.env.EMAIL_WEBHOOK_SECRET?.trim();
  if (!secret || secret.length < 16) {
    return {
      ok: false,
      status: 503,
      error: "EMAIL_WEBHOOK_SECRET no está configurado en el servidor.",
    };
  }

  if (!params.signatureHeader || !params.timestampHeader) {
    return {
      ok: false,
      status: 401,
      error: "Cabeceras de firma o timestamp ausentes.",
    };
  }

  const tsSec = Number(params.timestampHeader);
  const nowSec = Math.floor((params.nowMs ?? Date.now()) / 1000);
  if (!Number.isFinite(tsSec) || Math.abs(nowSec - tsSec) > MAX_TOLERANCE_SEC) {
    return {
      ok: false,
      status: 401,
      error: "Timestamp de webhook inválido o fuera de ventana permitida.",
    };
  }

  const cleanSig = params.signatureHeader.replace(/^sha256=/i, "").trim();
  const expectedSig = signWebhookPayload(params.rawBody, tsSec, secret);

  const a = Buffer.from(cleanSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return {
      ok: false,
      status: 401,
      error: "Firma criptográfica del webhook inválida.",
    };
  }

  let payload: any;
  try {
    payload = JSON.parse(params.rawBody);
  } catch {
    return { ok: false, status: 400, error: "JSON de webhook malformado." };
  }

  const eventType = String(payload?.type || "");
  const data = payload?.data ?? {};
  const providerMessageId =
    typeof data.email_id === "string"
      ? data.email_id
      : typeof data.providerMessageId === "string"
      ? data.providerMessageId
      : null;
  const dedupKey = typeof data.dedupKey === "string" ? data.dedupKey : null;
  const rawRecipient = Array.isArray(data.to)
    ? data.to[0]
    : typeof data.to === "string"
    ? data.to
    : null;

  const delivery = providerMessageId
    ? await prisma.emailDelivery.findUnique({ where: { providerMessageId } })
    : dedupKey
    ? await prisma.emailDelivery.findUnique({ where: { dedupKey } })
    : null;

  const emailNormalized = normalizeEmail(rawRecipient || delivery?.toEmail);
  const now = new Date();

  if (eventType === "email.delivered") {
    if (!delivery) {
      return { ok: true, idempotentReplay: false, eventType };
    }
    if (delivery.status === "DELIVERED") {
      return { ok: true, idempotentReplay: true, eventType };
    }

    await prisma.$transaction(async (tx) => {
      await tx.emailDelivery.update({
        where: { id: delivery.id },
        data: { status: "DELIVERED", deliveredAt: now },
      });

      if (delivery.campaignId) {
        await tx.campaign.update({
          where: { id: delivery.campaignId },
          data: { deliveredCount: { increment: 1 } },
        });
        if (emailNormalized) {
          await tx.campaignRecipient.updateMany({
            where: {
              campaignId: delivery.campaignId,
              emailNormalized,
            },
            data: { status: "DELIVERED", deliveredAt: now },
          });
        }
      }
    });

    return { ok: true, idempotentReplay: false, eventType };
  }

  if (eventType === "email.bounced" || eventType === "email.complained") {
    const targetStatus = eventType === "email.bounced" ? "BOUNCED" : "COMPLAINED";
    const suppressionReason =
      eventType === "email.bounced" ? "HARD_BOUNCE" : "COMPLAINT";

    if (delivery && delivery.status === targetStatus) {
      return { ok: true, idempotentReplay: true, eventType };
    }

    await prisma.$transaction(async (tx) => {
      if (delivery) {
        await tx.emailDelivery.update({
          where: { id: delivery.id },
          data: {
            status: targetStatus,
            bouncedAt: now,
          },
        });

        if (delivery.campaignId) {
          await tx.campaign.update({
            where: { id: delivery.campaignId },
            data:
              targetStatus === "BOUNCED"
                ? { bouncedCount: { increment: 1 } }
                : { complainedCount: { increment: 1 } },
          });
          if (emailNormalized) {
            await tx.campaignRecipient.updateMany({
              where: {
                campaignId: delivery.campaignId,
                emailNormalized,
              },
              data: { status: "BOUNCED" },
            });
          }
        }
      }

      if (emailNormalized) {
        await tx.suppression.upsert({
          where: { emailNormalized },
          update: { reason: suppressionReason },
          create: {
            emailNormalized,
            reason: suppressionReason,
            sourceEventId: providerMessageId ?? delivery?.id ?? null,
          },
        });

        await tx.subscriber.updateMany({
          where: { emailNormalized },
          data: {
            status: targetStatus === "BOUNCED" ? "BOUNCED" : "SUPPRESSED",
            unsubscribedAt: now,
          },
        });

        await tx.client.updateMany({
          where: { emailNormalized },
          data: { marketingConsent: false },
        });
      }
    });

    return { ok: true, idempotentReplay: false, eventType };
  }

  return { ok: true, idempotentReplay: false, eventType };
}
