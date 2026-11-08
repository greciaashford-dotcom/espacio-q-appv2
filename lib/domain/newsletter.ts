import { prisma } from "@/lib/db/prisma";
import {
  generateOpaqueToken,
  hashToken,
  signUnsubscribeToken,
  verifyUnsubscribeToken,
} from "@/lib/security/crypto";
import { normalizeEmail } from "@/lib/utils";
import {
  dispatchEmailWithAudit,
  renderZenLinenEmailLayout,
} from "@/lib/email/provider";

export async function requestNewsletterSubscription(params: {
  email: string;
  firstName?: string | null;
  consentAccepted: boolean;
  source?: string;
  policyVersion?: string;
}): Promise<
  | {
      ok: true;
      state: "PENDING_VERIFICATION";
      message: string;
      verifyTokenForTest?: string;
    }
  | {
      ok: false;
      status: 400 | 422;
      error: string;
    }
> {
  if (!params.consentAccepted) {
    return {
      ok: false,
      status: 400,
      error:
        "Debes aceptar expresamente el consentimiento para recibir la newsletter y leer la Política de Privacidad.",
    };
  }

  const emailNormalized = normalizeEmail(params.email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailNormalized || !emailRegex.test(emailNormalized)) {
    return {
      ok: false,
      status: 400,
      error: "Introduce una dirección de correo electrónico válida.",
    };
  }

  const existing = await prisma.subscriber.findUnique({
    where: { emailNormalized },
  });

  // Regla Sección 8: manejo de duplicados sin revelar innecesariamente si una dirección ya está registrada
  if (existing && existing.status === "ACTIVE") {
    return {
      ok: true,
      state: "PENDING_VERIFICATION",
      message:
        "Si la dirección es válida, recibirás un correo de verificación para confirmar tu suscripción.",
    };
  }

  // Si está en Suppression por rebote duro o queja previa, respondemos de forma neutra sin enviar spam
  const suppressed = await prisma.suppression.findUnique({
    where: { emailNormalized },
  });
  if (
    suppressed &&
    (suppressed.reason === "HARD_BOUNCE" || suppressed.reason === "COMPLAINT")
  ) {
    return {
      ok: true,
      state: "PENDING_VERIFICATION",
      message:
        "Si la dirección es válida, recibirás un correo de verificación para confirmar tu suscripción.",
    };
  }

  const rawVerifyToken = generateOpaqueToken(32);
  const verifyTokenHash = hashToken(rawVerifyToken);
  const verifyTokenExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const rawUnsubToken = generateOpaqueToken(32);
  const unsubscribeTokenHash = existing?.unsubscribeTokenHash ?? hashToken(rawUnsubToken);

  const policyVersion = params.policyVersion || "v1.0";
  const channel = params.source || "newsletter_dialog";

  const subscriber = await prisma.subscriber.upsert({
    where: { emailNormalized },
    update: {
      firstName: params.firstName?.trim() || existing?.firstName || null,
      status: "PENDING",
      verifyTokenHash,
      verifyTokenExpiresAt,
      policyVersion,
      source: channel,
    },
    create: {
      email: emailNormalized,
      emailNormalized,
      firstName: params.firstName?.trim() || null,
      status: "PENDING",
      verifyTokenHash,
      verifyTokenExpiresAt,
      unsubscribeTokenHash,
      policyVersion,
      source: channel,
    },
  });

  await prisma.consentEvent.create({
    data: {
      subscriberId: subscriber.id,
      email: emailNormalized,
      action: "OPT_IN_REQUESTED",
      channel,
      policyVersion,
      consentText:
        "Solicitud de alta en newsletter con consentimiento expreso (pendiente de verificación double opt-in).",
    },
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/newsletter/confirmar?token=${encodeURIComponent(
    rawVerifyToken
  )}`;

  const rendered = renderZenLinenEmailLayout({
    heading: "Confirma tu suscripción a ESPACIO Q",
    preheader: "Un paso más para confirmar tu suscripción en ESPACIO Q Madrid.",
    paragraphs: [
      `Hola${subscriber.firstName ? ` ${subscriber.firstName}` : ""},`,
      "Hemos recibido una solicitud para suscribir esta dirección de correo electrónico a la newsletter de ESPACIO Q en Madrid.",
      "Para proteger tu privacidad y confirmar que realmente deseas recibir nuestras novedades (sistema double opt-in), pulsa en el siguiente botón:",
    ],
    cta: {
      label: "Confirmar mi suscripción",
      url: verifyUrl,
    },
    footerNote:
      "Si no has solicitado esta suscripción, puedes ignorar este mensaje con total tranquilidad; no recibirás ningún correo adicional.",
  });

  await dispatchEmailWithAudit({
    dedupKey: `newsletter-verify:${subscriber.id}:${verifyTokenHash.slice(0, 12)}`,
    category: "TRANSACTIONAL",
    templateKey: "NEWSLETTER_VERIFY",
    toEmail: emailNormalized,
    subject: "Confirma tu suscripción · ESPACIO Q Madrid",
    htmlBody: rendered.html,
    textBody: rendered.text,
  });

  return {
    ok: true,
    state: "PENDING_VERIFICATION",
    message:
      "Si la dirección es válida, recibirás un correo de verificación para confirmar tu suscripción.",
    verifyTokenForTest:
      process.env.NODE_ENV !== "production" ? rawVerifyToken : undefined,
  };
}

export async function confirmNewsletterSubscription(rawToken: string): Promise<
  | { ok: true; email: string; alreadyConfirmed: boolean }
  | { ok: false; error: string }
> {
  if (!rawToken || rawToken.length < 16) {
    return { ok: false, error: "Token de verificación inválido." };
  }

  const tokenHash = hashToken(rawToken);
  const subscriber = await prisma.subscriber.findFirst({
    where: { verifyTokenHash: tokenHash },
  });

  if (!subscriber) {
    return {
      ok: false,
      error: "El enlace de verificación no es válido o ya ha sido utilizado.",
    };
  }

  if (
    subscriber.verifyTokenExpiresAt &&
    subscriber.verifyTokenExpiresAt < new Date()
  ) {
    return {
      ok: false,
      error:
        "El enlace de verificación ha caducado. Puedes volver a solicitar la suscripción desde la web.",
    };
  }

  if (subscriber.status === "ACTIVE" && subscriber.confirmedAt) {
    return {
      ok: true,
      email: subscriber.email,
      alreadyConfirmed: true,
    };
  }

  const now = new Date();
  const rawUnsubToken = generateOpaqueToken(32);
  const unsubHash = hashToken(rawUnsubToken);

  const shouldSendWelcome = !subscriber.welcomeSentAt;

  await prisma.$transaction(async (tx) => {
    await tx.subscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "ACTIVE",
        confirmedAt: now,
        unsubscribedAt: null,
        verifyTokenHash: null,
        verifyTokenExpiresAt: null,
        unsubscribeTokenHash: unsubHash,
        welcomeSentAt: shouldSendWelcome ? now : subscriber.welcomeSentAt,
      },
    });

    // Eliminar de supresión por baja anterior si la persona misma reconfirma mediante double opt-in
    await tx.suppression.deleteMany({
      where: {
        emailNormalized: subscriber.emailNormalized,
        reason: "UNSUBSCRIBED",
      },
    });

    await tx.consentEvent.create({
      data: {
        subscriberId: subscriber.id,
        email: subscriber.emailNormalized,
        action: "DOUBLE_OPT_IN_CONFIRMED",
        channel: "email_verification",
        policyVersion: subscriber.policyVersion,
        consentText: "Suscripción confirmada mediante enlace double opt-in.",
      },
    });

    // Sincronizar con ficha CRM si existe
    await tx.client.updateMany({
      where: { emailNormalized: subscriber.emailNormalized },
      data: {
        marketingConsent: true,
        marketingConsentAt: now,
        marketingConsentSource: "double_opt_in",
        marketingPolicyVersion: subscriber.policyVersion,
      },
    });
  });

  if (shouldSendWelcome) {
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const unsubUrl = `${appUrl}/newsletter/baja?token=${encodeURIComponent(
      signUnsubscribeToken(subscriber.id)
    )}`;

    const rendered = renderZenLinenEmailLayout({
      heading: "Te damos la bienvenida a ESPACIO Q",
      preheader: "Tu suscripción a la newsletter de ESPACIO Q Madrid está confirmada.",
      paragraphs: [
        `Hola${subscriber.firstName ? ` ${subscriber.firstName}` : ""},`,
        "Gracias por confirmar tu suscripción. A partir de ahora recibirás nuestras notas editoriales, novedades del salón y apertura de agenda en fechas especiales en Madrid.",
        "Cuando desees reservar tu próximo momento de cuidado, nuestra agenda online está disponible para ti.",
      ],
      cta: {
        label: "Explorar servicios de ESPACIO Q",
        url: `${appUrl}/servicios`,
      },
      unsubscribeUrl: unsubUrl,
    });

    await dispatchEmailWithAudit({
      dedupKey: `newsletter-welcome:${subscriber.id}`,
      category: "MARKETING",
      templateKey: "NEWSLETTER_WELCOME",
      toEmail: subscriber.emailNormalized,
      subject: "Bienvenida a la carta editorial de ESPACIO Q",
      htmlBody: rendered.html,
      textBody: rendered.text,
    });
  }

  return {
    ok: true,
    email: subscriber.email,
    alreadyConfirmed: false,
  };
}

export async function unsubscribeMarketing(params: {
  email?: string;
  token?: string;
  reason?: string;
}): Promise<{ ok: boolean; emailNormalized?: string }> {
  let emailNormalized = normalizeEmail(params.email);

  if (!emailNormalized && params.token) {
    const signedId = verifyUnsubscribeToken(params.token);
    const subByToken = signedId
      ? await prisma.subscriber.findUnique({ where: { id: signedId } })
      : await prisma.subscriber.findFirst({
          where: { unsubscribeTokenHash: hashToken(params.token) },
        });
    if (subByToken) {
      emailNormalized = subByToken.emailNormalized;
    }
  }

  if (!emailNormalized) {
    return { ok: false };
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const sub = await tx.subscriber.findUnique({
      where: { emailNormalized },
    });

    if (sub) {
      await tx.subscriber.update({
        where: { id: sub.id },
        data: {
          status: "UNSUBSCRIBED",
          unsubscribedAt: now,
        },
      });
    }

    await tx.suppression.upsert({
      where: { emailNormalized },
      update: { reason: params.reason || "UNSUBSCRIBED" },
      create: {
        emailNormalized,
        reason: params.reason || "UNSUBSCRIBED",
      },
    });

    await tx.client.updateMany({
      where: { emailNormalized },
      data: {
        marketingConsent: false,
      },
    });

    await tx.consentEvent.create({
      data: {
        subscriberId: sub?.id ?? null,
        email: emailNormalized,
        action: "UNSUBSCRIBED",
        channel: "unsubscribe_link",
        policyVersion: sub?.policyVersion ?? "v1.0",
        consentText: "Baja voluntaria de comunicaciones comerciales y alta en lista de supresión.",
      },
    });
  });

  return { ok: true, emailNormalized };
}
