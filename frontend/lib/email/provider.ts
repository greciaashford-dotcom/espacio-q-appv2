import { prisma } from "@/lib/db/prisma";
import { escapeHtml } from "@/lib/utils";
import { assertSafeEmail } from "@/lib/email/guardrails";

// Integración Resend gestionada por Emergent: la URL del proxy es constante (no configurable) y la
// dirección From la fija la plataforma; la app solo define el nombre visible (EMAIL_FROM_NAME).
const EMERGENT_EMAIL_BASE_URL = "https://integrations.emergentagent.com";

export const MANAGED_MARKETING_BLOCKED_MESSAGE =
  "No enviado: el remitente gestionado de Emergent solo admite correo transaccional; las campañas de marketing requieren un remitente propio del salón.";

export function getEmailProviderConfig():
  | { configured: true; provider: "EMERGENT_RESEND"; emailKey: string; fromName: string; replyTo?: string }
  | { configured: false; provider: "LOCAL_OUTBOX" } {
  const emailKey = process.env.EMERGENT_EMAIL_KEY?.trim();
  const fromName = process.env.EMAIL_FROM_NAME?.trim();
  if (!emailKey || !fromName) {
    if (emailKey && !fromName) console.error("[email] EMAIL_FROM_NAME es obligatorio para enviar con Resend gestionado.");
    return { configured: false, provider: "LOCAL_OUTBOX" };
  }
  return { configured: true, provider: "EMERGENT_RESEND", emailKey, fromName, replyTo: process.env.EMAIL_REPLY_TO?.trim() || undefined };
}

export const isEmailProviderConfigured = () => getEmailProviderConfig().configured;

// Límite de envío del proveedor (429 rate_limited): pausa global breve para no agotar reintentos en ráfaga.
export const RATE_LIMIT_COOLDOWN_MS = 11 * 60 * 1000;
let providerCooldownUntil = 0;
export const isProviderCoolingDown = () => Date.now() < providerCooldownUntil;

function isBulkMarketing(p: { category: string; templateKey: string; campaignId?: string }) {
  return p.category === "MARKETING" && (Boolean(p.campaignId) || p.templateKey.startsWith("CAMPAIGN_"));
}

// Dominios reservados para pruebas (RFC 2606/6761) y de la suite de tests: nunca se envían de verdad
// (evita rebotes que dañarían la reputación del dominio emisor compartido); quedan en el buzón local.
const RESERVED_TEST_DOMAINS = ["example.com", "example.org", "example.net", "espacioq-test.es"];
const RESERVED_TEST_TLDS = [".test", ".example", ".invalid", ".localhost"];

export function isReservedTestRecipient(email: string): boolean {
  const domain = email.split("@")[1]?.trim().toLowerCase() ?? "";
  return (
    RESERVED_TEST_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`)) ||
    RESERVED_TEST_TLDS.some((t) => domain.endsWith(t))
  );
}

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
  category: "TRANSACTIONAL" | "MARKETING";
};

export function renderZenLinenEmailLayout(params: {
  brandName?: string;
  heading: string;
  preheader?: string;
  paragraphs: string[];
  detailsBox?: Array<{ label: string; value: string }>;
  cta?: { label: string; url: string };
  footerNote?: string;
  unsubscribeUrl?: string;
}): { html: string; text: string } {
  const brand = escapeHtml(params.brandName || "ESPACIO Q");
  const heading = escapeHtml(params.heading);
  const preheader = params.preheader ? escapeHtml(params.preheader) : heading;

  const paragraphsHtml = params.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#1E1E1E;">${escapeHtml(
          p
        )}</p>`
    )
    .join("");

  const detailsHtml =
    params.detailsBox && params.detailsBox.length > 0
      ? `<div style="background:#E9E4D8;border:1px solid #D2CBBB;border-radius:8px;padding:16px 20px;margin:20px 0;">
          ${params.detailsBox
            .map(
              (item) =>
                `<div style="margin:6px 0;font-size:14px;color:#1E1E1E;"><strong style="color:#5E5A52;">${escapeHtml(
                  item.label
                )}:</strong> ${escapeHtml(item.value)}</div>`
            )
            .join("")}
        </div>`
      : "";

  const ctaHtml = params.cta
    ? `<div style="margin:26px 0;">
        <a href="${escapeHtml(
          params.cta.url
        )}" style="display:inline-block;background:#2E2E2E;color:#E6E4D7;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">${escapeHtml(
        params.cta.label
      )}</a>
      </div>`
    : "";

  const unsubscribeHtml = params.unsubscribeUrl
    ? `<p style="margin:12px 0 0 0;font-size:12px;color:#5E5A52;">Puedes darte de baja de nuestras comunicaciones comerciales en cualquier momento <a href="${escapeHtml(
        params.unsubscribeUrl
      )}" style="color:#1E1E1E;text-decoration:underline;">pulsando aquí</a>.</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#E9E4D8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1E1E1E;">
  <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;margin:0 auto;background:#F4EFE4;border:1px solid #D2CBBB;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="padding:28px 32px 16px 32px;border-bottom:1px solid #D2CBBB;">
        <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#5E5A52;">${brand} · MADRID</div>
        <h1 style="margin:10px 0 0 0;font-family:Georgia,serif;font-size:26px;font-weight:500;color:#1E1E1E;">${heading}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px;">
        ${paragraphsHtml}
        ${detailsHtml}
        ${ctaHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:18px 32px 24px 32px;border-top:1px solid #D2CBBB;background:#E6E4D7;">
        <p style="margin:0;font-size:12px;color:#5E5A52;">${escapeHtml(
          params.footerNote || "ESPACIO Q · Salón de belleza en Madrid."
        )}</p>
        ${unsubscribeHtml}
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textParts = [
    `${params.brandName || "ESPACIO Q"} · MADRID`,
    params.heading,
    "",
    ...params.paragraphs,
  ];
  if (params.detailsBox && params.detailsBox.length > 0) {
    textParts.push("");
    for (const d of params.detailsBox) {
      textParts.push(`- ${d.label}: ${d.value}`);
    }
  }
  if (params.cta) {
    textParts.push("", `${params.cta.label}: ${params.cta.url}`);
  }
  if (params.unsubscribeUrl) {
    textParts.push("", `Baja de comunicaciones comerciales: ${params.unsubscribeUrl}`);
  }

  return {
    html,
    text: textParts.join("\n"),
  };
}

export async function dispatchEmailWithAudit(params: {
  dedupKey: string;
  category: "TRANSACTIONAL" | "MARKETING";
  templateKey: string;
  toEmail: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  appointmentId?: string;
  campaignId?: string;
  replyTo?: string;
  /** Envíos directos (fuera de la cola): si fallan por causa transitoria se encola un reintento. */
  retryViaQueue?: boolean;
}): Promise<{
  status: "ACCEPTED" | "SIMULATED_LOCAL" | "FAILED";
  deliveryId: string;
  providerMessageId?: string;
  alreadySent?: boolean;
  errorMessage?: string;
  rateLimited?: boolean;
}> {
  const existing = await prisma.emailDelivery.findUnique({
    where: { dedupKey: params.dedupKey },
  });

  if (
    existing &&
    (existing.status === "ACCEPTED" ||
      existing.status === "DELIVERED" ||
      existing.status === "SIMULATED_LOCAL")
  ) {
    return {
      status:
        existing.status === "SIMULATED_LOCAL" ? "SIMULATED_LOCAL" : "ACCEPTED",
      deliveryId: existing.id,
      providerMessageId: existing.providerMessageId ?? undefined,
      alreadySent: true,
    };
  }

  const provider = getEmailProviderConfig();
  const reservedTestRecipient = isReservedTestRecipient(params.toEmail);

  if (!provider.configured || reservedTestRecipient) {
    const simulated = await prisma.emailDelivery.upsert({
      where: { dedupKey: params.dedupKey },
      update: {
        status: "SIMULATED_LOCAL",
        subject: params.subject,
        htmlBody: params.htmlBody,
        textBody: params.textBody,
      },
      create: {
        dedupKey: params.dedupKey,
        category: params.category,
        templateKey: params.templateKey,
        toEmail: params.toEmail,
        subject: params.subject,
        htmlBody: params.htmlBody,
        textBody: params.textBody,
        status: "SIMULATED_LOCAL",
        providerName: "LOCAL_OUTBOX",
        appointmentId: params.appointmentId ?? null,
        campaignId: params.campaignId ?? null,
        errorMessage: reservedTestRecipient ? "No enviado: dominio reservado para pruebas." : null,
      },
    });

    return {
      status: "SIMULATED_LOCAL",
      deliveryId: simulated.id,
    };
  }

  const recordFailure = async (errorMsg: string, opts: { rateLimited?: boolean; retryable?: boolean } = {}) => {
    const failed = await prisma.emailDelivery.upsert({
      where: { dedupKey: params.dedupKey },
      update: { status: "FAILED", errorMessage: errorMsg },
      create: {
        dedupKey: params.dedupKey,
        category: params.category,
        templateKey: params.templateKey,
        toEmail: params.toEmail,
        subject: params.subject,
        htmlBody: params.htmlBody,
        textBody: params.textBody,
        status: "FAILED",
        providerName: "RESEND",
        appointmentId: params.appointmentId ?? null,
        campaignId: params.campaignId ?? null,
        errorMessage: errorMsg,
      },
    });
    // Envíos directos (fuera de la cola): un fallo reintentable se encola para reintento automático
    if (opts.retryable && params.retryViaQueue) {
      await prisma.notificationJob
        .create({
          data: {
            jobType: "RETRY_EMAIL_DELIVERY",
            dedupKey: `retry:${params.dedupKey}`,
            appointmentId: params.appointmentId ?? null,
            scheduledAtUtc: new Date(),
            nextAttemptUtc: new Date(Date.now() + (opts.rateLimited ? RATE_LIMIT_COOLDOWN_MS : 60_000)),
            maxAttempts: 8,
            payloadJson: { deliveryDedupKey: params.dedupKey, replyTo: params.replyTo ?? null },
          },
        })
        .catch((e: any) => {
          if (e?.code !== "P2002") console.error("[email] no se pudo encolar el reintento", e);
        });
    }
    return { status: "FAILED" as const, deliveryId: failed.id, errorMessage: errorMsg, rateLimited: Boolean(opts.rateLimited) };
  };

  // Política del remitente gestionado de Emergent: solo correo transaccional (sin envíos masivos de marketing).
  if (isBulkMarketing(params)) {
    return recordFailure(MANAGED_MARKETING_BLOCKED_MESSAGE);
  }

  try {
    assertSafeEmail(params.subject, params.htmlBody);
  } catch (err: any) {
    return recordFailure(`Bloqueado por control de seguridad del correo: ${err?.message ?? "contenido no permitido"}`);
  }

  if (Date.now() < providerCooldownUntil) {
    return recordFailure("Pendiente de reintento: límite de envíos del proveedor alcanzado temporalmente.", { rateLimited: true, retryable: true });
  }

  try {
    const response = await fetch(`${EMERGENT_EMAIL_BASE_URL}/api/v1/email/send`, {
      method: "POST",
      headers: {
        "X-Email-Key": provider.emailKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: [params.toEmail],
        subject: params.subject,
        html: params.htmlBody,
        from_name: provider.fromName,
        ...(params.replyTo || provider.replyTo ? { contact_email: params.replyTo || provider.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(30_000),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code = typeof data?.code === "string" ? data.code : "";
      const errorMsg =
        typeof data?.message === "string"
          ? `${code ? `[${code}] ` : ""}${data.message}`
          : `Error HTTP ${response.status} del proveedor de email`;
      if (code) console.warn(`[email] Envío pausado/rechazado (${response.status} ${code}): ${errorMsg}`);
      const rateLimited = response.status === 429 || code === "rate_limited";
      if (rateLimited) providerCooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
      const billing = ["insufficient_credits", "integration_disabled", "daily_limit_reached"].includes(code);
      return recordFailure(errorMsg, { rateLimited, retryable: rateLimited || billing || response.status >= 500 });
    }

    const providerId = typeof data?.id === "string" ? data.id : undefined;
    // Regla Sección 13: un email aceptado por API se marca como ACCEPTED, no como DELIVERED hasta evidencia por webhook
    const accepted = await prisma.emailDelivery.upsert({
      where: { dedupKey: params.dedupKey },
      update: {
        status: "ACCEPTED",
        providerMessageId: providerId,
        acceptedAt: new Date(),
        errorMessage: null,
      },
      create: {
        dedupKey: params.dedupKey,
        category: params.category,
        templateKey: params.templateKey,
        toEmail: params.toEmail,
        subject: params.subject,
        htmlBody: params.htmlBody,
        textBody: params.textBody,
        status: "ACCEPTED",
        providerName: "RESEND",
        providerMessageId: providerId,
        appointmentId: params.appointmentId ?? null,
        campaignId: params.campaignId ?? null,
        acceptedAt: new Date(),
      },
    });

    return {
      status: "ACCEPTED",
      deliveryId: accepted.id,
      providerMessageId: providerId,
    };
  } catch (err: any) {
    return recordFailure(err?.message ?? "Error de red con proveedor de correo", { retryable: true });
  }
}
