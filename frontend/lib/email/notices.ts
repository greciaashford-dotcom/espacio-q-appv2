import { prisma } from "@/lib/db/prisma";
import { dispatchEmailWithAudit, renderZenLinenEmailLayout } from "@/lib/email/provider";
import { formatPrice } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  PENDING_APPROVAL: "Pendiente de aprobación",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No presentada",
};

const appUrl = () => (process.env.APP_URL || "").replace(/\/$/, "");

/** Dirección de avisos internos: "Email de avisos del salón" o, si está vacía, el correo de contacto del salón. */
export async function getSalonNoticeEmail(): Promise<string | null> {
  const s = await prisma.salonSettings.findUnique({
    where: { id: "default" },
    select: { noticeEmail: true, contactEmail: true },
  });
  return s?.noticeEmail?.trim() || s?.contactEmail?.trim() || null;
}

async function template(key: string) {
  return prisma.emailTemplate.findUnique({ where: { key } });
}

/** Bienvenida a cliente nuevo (sin contenido promocional: se envía sin consentimiento comercial). */
export async function renderClientWelcome(appt: any) {
  const tpl = await template("CLIENT_WELCOME");
  const firstName = String(appt.customerName || "").trim().split(/\s+/)[0] || "";
  const fill = (s: string) => s.replace(/\{\{\s*nombre\s*\}\}/gi, firstName);
  const subject = fill(tpl?.active !== false && tpl?.subject ? tpl.subject : "Te damos la bienvenida a ESPACIO Q");
  const heading = fill(tpl?.heading || "Te damos la bienvenida a ESPACIO Q");
  const body = fill(
    tpl?.bodyTemplate ||
      "Gracias por reservar tu primera cita con nosotras. Te esperamos en el salón para dedicarte el tiempo que necesitas."
  );
  const rendered = renderZenLinenEmailLayout({
    heading,
    preheader: tpl?.preheader || subject,
    paragraphs: [`Hola ${firstName},`, ...body.split(/\n+/).map((p) => p.trim()).filter(Boolean)],
    cta: { label: tpl?.ctaLabel || "Visitar ESPACIO Q", url: `${appUrl()}/` },
    footerNote: tpl?.footerNote || undefined,
  });
  return { subject, ...rendered };
}

/** Aviso interno al salón por cada nueva reserva. */
export function renderSalonBookingNotice(appt: any) {
  const subject = `Nueva reserva ${appt.referenceCode} · ${appt.dateStrMadrid} ${appt.startTimeMadrid}`;
  const rendered = renderZenLinenEmailLayout({
    heading: "Nueva reserva recibida",
    preheader: subject,
    paragraphs: ["Se ha registrado una nueva cita en ESPACIO Q:"],
    detailsBox: [
      { label: "Referencia", value: appt.referenceCode },
      { label: "Servicio", value: appt.serviceNameSnapshot },
      { label: "Profesional", value: appt.professional?.name ?? "—" },
      { label: "Fecha (Madrid)", value: appt.dateStrMadrid },
      { label: "Hora (Madrid)", value: `${appt.startTimeMadrid} – ${appt.endTimeMadrid}` },
      { label: "Estado", value: STATUS_LABEL[appt.status] ?? appt.status },
      { label: "Precio", value: formatPrice(appt.priceTypeSnapshot, appt.priceCentsSnapshot, appt.currencySnapshot) },
      { label: "Cliente", value: appt.customerName },
      { label: "Email", value: appt.customerEmail || "—" },
      { label: "Teléfono", value: appt.customerPhone || "—" },
    ],
    cta: { label: "Abrir agenda", url: `${appUrl()}/admin/agenda?date=${appt.dateStrMadrid}` },
    footerNote: "Aviso interno automático de ESPACIO Q.",
  });
  return { subject, ...rendered };
}

/** Aviso interno inmediato por cada mensaje de contacto (Reply-To = remitente). */
export async function sendSalonContactNotice(msg: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
}) {
  const to = await getSalonNoticeEmail();
  if (!to) return { skipped: true as const };
  const subject = `Nuevo mensaje de contacto · ${msg.name}`;
  const rendered = renderZenLinenEmailLayout({
    heading: "Nuevo mensaje desde la web",
    preheader: subject,
    paragraphs: ["Has recibido un mensaje a través del formulario de contacto. Puedes responder directamente a este correo.", ...msg.message.split(/\n+/)],
    detailsBox: [
      { label: "Nombre", value: msg.name },
      { label: "Email", value: msg.email },
      { label: "Teléfono", value: msg.phone || "—" },
      { label: "Asunto", value: msg.subject || "—" },
    ],
    footerNote: "Aviso interno automático de ESPACIO Q.",
  });
  return dispatchEmailWithAudit({
    dedupKey: `salon-notice-contact:${msg.id}`,
    category: "TRANSACTIONAL",
    templateKey: "SALON_NOTICE_CONTACT",
    toEmail: to,
    subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    retryViaQueue: true,
    replyTo: msg.email,
  });
}
