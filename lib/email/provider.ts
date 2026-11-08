import { prisma } from "@/lib/db/prisma";
import { escapeHtml } from "@/lib/utils";

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
}): Promise<{
  status: "ACCEPTED" | "SIMULATED_LOCAL" | "FAILED";
  deliveryId: string;
  providerMessageId?: string;
  alreadySent?: boolean;
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

  const apiKey = process.env.EMAIL_PROVIDER_API_KEY?.trim();
  const fromEmail =
    process.env.EMAIL_FROM?.trim() || "ESPACIO Q <no-reply@espacioq.es>";
  const replyTo = process.env.EMAIL_REPLY_TO?.trim() || undefined;

  if (!apiKey) {
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
      },
    });

    return {
      status: "SIMULATED_LOCAL",
      deliveryId: simulated.id,
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": params.dedupKey,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [params.toEmail],
        reply_to: replyTo,
        subject: params.subject,
        html: params.htmlBody,
        text: params.textBody,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMsg =
        typeof data?.message === "string"
          ? data.message
          : `Error HTTP ${response.status} del proveedor de email`;

      const failed = await prisma.emailDelivery.upsert({
        where: { dedupKey: params.dedupKey },
        update: {
          status: "FAILED",
          errorMessage: errorMsg,
        },
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

      return { status: "FAILED", deliveryId: failed.id };
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
    const failed = await prisma.emailDelivery.upsert({
      where: { dedupKey: params.dedupKey },
      update: {
        status: "FAILED",
        errorMessage: err?.message ?? "Error de red con proveedor de correo",
      },
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
        errorMessage: err?.message ?? "Error de red con proveedor de correo",
      },
    });

    return { status: "FAILED", deliveryId: failed.id };
  }
}
