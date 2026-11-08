import { prisma } from "@/lib/db/prisma";
import { isEmailProviderConfigured } from "@/lib/email/provider";
import {
  ensureBaseCmsAndSettings,
  ensureDefaultProfessionalsCatalog,
  ensureDefaultServicesCatalog,
  ensureDefaultWorkingSchedule,
} from "@/lib/domain/cms";
import { ESPACIO_Q_LOCATION_METADATA } from "@/lib/domain/default-services-catalog";

const DEFAULT_EMAIL_TEMPLATES = [
  {
    key: "NEWSLETTER_VERIFY",
    name: "Verificación de Newsletter (Double Opt-In)",
    category: "TRANSACTIONAL",
    subject: "Confirma tu suscripción · ESPACIO Q Madrid",
    preheader: "Un paso más para activar tu suscripción en ESPACIO Q.",
    heading: "Confirma tu suscripción a ESPACIO Q",
    bodyTemplate:
      "Hemos recibido tu solicitud para suscribirte a la newsletter de ESPACIO Q. Pulsa en el botón inferior para verificar tu correo electrónico.",
    ctaLabel: "Confirmar mi suscripción",
  },
  {
    key: "NEWSLETTER_WELCOME",
    name: "Bienvenida a la Newsletter",
    category: "MARKETING",
    subject: "Bienvenida a la carta editorial de ESPACIO Q",
    preheader: "Tu suscripción en ESPACIO Q Madrid ha quedado confirmada.",
    heading: "Te damos la bienvenida a ESPACIO Q",
    bodyTemplate:
      "Gracias por confirmar tu suscripción. Recibirás puntualmente nuestras notas de cuidado y novedades del salón en Madrid.",
    ctaLabel: "Explorar servicios",
  },
  {
    key: "APPOINTMENT_REQUEST_PENDING",
    name: "Solicitud de Cita (Pendiente de Aprobación)",
    category: "TRANSACTIONAL",
    subject: "Solicitud de cita recibida · ESPACIO Q Madrid",
    preheader: "Hemos recibido tu solicitud de cita y la estamos revisando.",
    heading: "Solicitud de cita pendiente de confirmación",
    bodyTemplate:
      "Hemos registrado tu solicitud de cita. Ten en cuenta que todavía no está confirmada hasta que el equipo valide la disponibilidad.",
    ctaLabel: "Ver estado de mi solicitud",
  },
  {
    key: "APPOINTMENT_CONFIRMATION",
    name: "Confirmación de Cita",
    category: "TRANSACTIONAL",
    subject: "Cita confirmada · ESPACIO Q Madrid",
    preheader: "Tu cita en ESPACIO Q Madrid está confirmada.",
    heading: "Confirmación de tu cita en ESPACIO Q",
    bodyTemplate:
      "Tu reserva ha quedado confirmada. Desde el enlace inferior puedes consultar los detalles, reprogramar o cancelar dentro del plazo permitido.",
    ctaLabel: "Gestionar mi cita",
  },
  {
    key: "SALON_INTERNAL_ALERT",
    name: "Aviso Interno al Salón (Nueva Cita / Solicitud)",
    category: "TRANSACTIONAL",
    subject: "Nueva reserva registrada en agenda · ESPACIO Q",
    preheader: "Se ha registrado una nueva cita o solicitud en el sistema.",
    heading: "Aviso de actividad en agenda",
    bodyTemplate:
      "Se ha registrado una nueva cita o solicitud desde la web pública. Accede al panel de administración para consultar la ficha.",
    ctaLabel: "Abrir agenda",
  },
  {
    key: "APPOINTMENT_REMINDER_24H",
    name: "Recordatorio de Cita (24 horas antes)",
    category: "TRANSACTIONAL",
    subject: "Recordatorio de tu cita mañana · ESPACIO Q Madrid",
    preheader: "Te recordamos tu cita programada para mañana en ESPACIO Q.",
    heading: "Recordatorio: tu cita de mañana en ESPACIO Q",
    bodyTemplate:
      "Te recordamos que mañana te esperamos en ESPACIO Q Madrid. Si necesitas gestionar tu cita, utiliza el enlace seguro.",
    ctaLabel: "Ver detalles de mi cita",
  },
  {
    key: "APPOINTMENT_REMINDER_2H",
    name: "Recordatorio de Cita (2 horas antes)",
    category: "TRANSACTIONAL",
    subject: "Tu cita de hoy en ESPACIO Q comienza pronto",
    preheader: "Nos vemos en unas horas en ESPACIO Q Madrid.",
    heading: "Tu cita de hoy en ESPACIO Q",
    bodyTemplate:
      "Faltan pocas horas para tu visita de hoy en ESPACIO Q Madrid.",
    ctaLabel: "Ver ubicación y cita",
  },
  {
    key: "APPOINTMENT_RESCHEDULED",
    name: "Notificación de Reprogramación de Cita",
    category: "TRANSACTIONAL",
    subject: "Cambio de fecha/hora de tu cita · ESPACIO Q Madrid",
    preheader: "Tu cita ha sido reprogramada con éxito.",
    heading: "Tu cita ha sido reprogramada",
    bodyTemplate:
      "Te confirmamos el nuevo horario de tu cita en ESPACIO Q Madrid. Los recordatorios anteriores han sido actualizados automáticamente.",
    ctaLabel: "Ver cita actualizada",
  },
  {
    key: "APPOINTMENT_CANCELLED",
    name: "Confirmación de Cancelación de Cita",
    category: "TRANSACTIONAL",
    subject: "Confirmación de cancelación de cita · ESPACIO Q Madrid",
    preheader: "Tu cita en ESPACIO Q ha quedado cancelada.",
    heading: "Cita cancelada correctamente",
    bodyTemplate:
      "Hemos procesado la cancelación de tu cita y liberado la franja horaria. Esperamos verte pronto en ESPACIO Q.",
    ctaLabel: "Reservar nueva cita",
  },
  {
    key: "CONTACT_ACK",
    name: "Acuse de Recibo de Consulta de Contacto",
    category: "TRANSACTIONAL",
    subject: "Hemos recibido tu consulta · ESPACIO Q Madrid",
    preheader: "Gracias por contactar con ESPACIO Q Madrid.",
    heading: "Consulta recibida",
    bodyTemplate:
      "Gracias por escribirnos. Nuestro equipo revisará tu consulta y te responderá a la mayor brevedad en horario de apertura.",
    ctaLabel: "Visitar web de ESPACIO Q",
  },
  {
    key: "CLIENT_WELCOME",
    name: "Bienvenida a cliente nuevo (primera cita)",
    category: "TRANSACTIONAL",
    subject: "Te damos la bienvenida a ESPACIO Q",
    preheader: "Gracias por confiar en ESPACIO Q Madrid para tu primera cita.",
    heading: "Te damos la bienvenida a ESPACIO Q",
    bodyTemplate:
      "Gracias por reservar tu primera cita con nosotras. Ya tienes los detalles de tu reserva en un correo aparte.\nTe esperamos en Calle de Pelayo 41, Madrid. Si necesitas cambiar o cancelar tu cita, puedes hacerlo desde el enlace de gestión de tu reserva.",
    ctaLabel: "Visitar ESPACIO Q",
    footerNote: "ESPACIO Q · Salón de belleza en Madrid. Recibes este correo porque has reservado una cita.",
  },
  {
    key: "SALON_NOTICE_BOOKING",
    name: "Aviso interno al salón: nueva reserva",
    category: "TRANSACTIONAL",
    subject: "Nueva reserva recibida",
    heading: "Nueva reserva recibida",
    bodyTemplate: "Aviso automático con los datos de la reserva (servicio, profesional, fecha y hora en Madrid, estado y datos del cliente).",
  },
  {
    key: "SALON_NOTICE_CONTACT",
    name: "Aviso interno al salón: mensaje de contacto",
    category: "TRANSACTIONAL",
    subject: "Nuevo mensaje de contacto",
    heading: "Nuevo mensaje desde la web",
    bodyTemplate: "Aviso automático con el mensaje del formulario de contacto. Responder a este correo contesta directamente al remitente.",
  },
];

const DEFAULT_AUTOMATION_RULES = [
  {
    key: "AUTO_NEWSLETTER_VERIFY",
    name: "Verificación Newsletter (Double Opt-In)",
    triggerEvent: "NEWSLETTER_OPT_IN_REQUESTED",
    templateKey: "NEWSLETTER_VERIFY",
    offsetMinutes: 0,
    description: "Envía enlace con token seguro y mantiene estado pendiente.",
  },
  {
    key: "AUTO_NEWSLETTER_WELCOME",
    name: "Bienvenida Newsletter tras confirmación",
    triggerEvent: "NEWSLETTER_DOUBLE_OPT_IN_CONFIRMED",
    templateKey: "NEWSLETTER_WELCOME",
    offsetMinutes: 0,
    description:
      "Se envía una única vez tras confirmar el double opt-in; nunca incluye descuentos no configurados.",
  },
  {
    key: "AUTO_BOOKING_REQUEST",
    name: "Acuse de Solicitud de Cita (Modo Manual)",
    triggerEvent: "APPOINTMENT_REQUESTED",
    templateKey: "APPOINTMENT_REQUEST_PENDING",
    offsetMinutes: 0,
    description:
      "Informa claramente de que la solicitud está pendiente de confirmación.",
  },
  {
    key: "AUTO_BOOKING_CONFIRMED",
    name: "Confirmación de Cita",
    triggerEvent: "APPOINTMENT_CONFIRMED",
    templateKey: "APPOINTMENT_CONFIRMATION",
    offsetMinutes: 0,
    description:
      "Envía servicio, profesional, fecha/hora y enlace opaco de gestión.",
  },
  {
    key: "AUTO_SALON_ALERT",
    name: "Aviso Interno al Salón",
    triggerEvent: "APPOINTMENT_CREATED",
    templateKey: "SALON_INTERNAL_ALERT",
    offsetMinutes: 0,
    description:
      "Notifica a los destinatarios internos configurados sin exponer PII innecesaria.",
  },
  {
    key: "AUTO_REMINDER_24H",
    name: "Recordatorio 24 h antes de cita",
    triggerEvent: "APPOINTMENT_SCHEDULED_OFFSET",
    templateKey: "APPOINTMENT_REMINDER_24H",
    offsetMinutes: -1440,
    description:
      "Revalida estado y versión de la cita antes de enviar; se omite si se reserva con menos de 24 h.",
  },
  {
    key: "AUTO_REMINDER_2H",
    name: "Recordatorio 2 h antes de cita",
    triggerEvent: "APPOINTMENT_SCHEDULED_OFFSET",
    templateKey: "APPOINTMENT_REMINDER_2H",
    offsetMinutes: -120,
    description:
      "Revalida estado y versión de la cita antes de enviar; se omite si se reserva con menos de 2 h.",
  },
  {
    key: "AUTO_BOOKING_RESCHEDULED",
    name: "Aviso de Reprogramación",
    triggerEvent: "APPOINTMENT_RESCHEDULED",
    templateKey: "APPOINTMENT_RESCHEDULED",
    offsetMinutes: 0,
    description:
      "Informa del cambio de fecha/hora y anula los recordatorios antiguos.",
  },
  {
    key: "AUTO_BOOKING_CANCELLED",
    name: "Confirmación de Cancelación",
    triggerEvent: "APPOINTMENT_CANCELLED",
    templateKey: "APPOINTMENT_CANCELLED",
    offsetMinutes: 0,
    description: "Confirma la cancelación y libera disponibilidad.",
  },
  {
    key: "AUTO_CONTACT_ACK",
    name: "Respuesta Automática a Formulario de Contacto",
    triggerEvent: "CONTACT_MESSAGE_CREATED",
    templateKey: "CONTACT_ACK",
    offsetMinutes: 0,
    description: "Envía acuse de recibo al remitente de la consulta.",
  },
];

/** Semilla idempotente (upserts por clave única): segura de re-ejecutar. */
export async function runSeed() {
  console.log("Inicializando configuración base y CMS de ESPACIO Q...");
  const currentSettings = await ensureBaseCmsAndSettings();
  await ensureDefaultServicesCatalog({ upsertMissingDefaults: true });
  await ensureDefaultProfessionalsCatalog({ upsertMissingDefaults: true });
  await ensureDefaultWorkingSchedule({ replaceSetupTemplate: true });

  // Aperturar reservas online con horario y ubicación verificada de Espacio Q (Calle de Pelayo, 41)
  await prisma.salonSettings.update({
    where: { id: "default" },
    data: {
      scheduleConfirmed: true,
      publicBookingEnabled: true,
      slotIntervalMin: 15,
      addressLine:
        currentSettings.addressLine || ESPACIO_Q_LOCATION_METADATA.addressLine,
      postalCode:
        currentSettings.postalCode || ESPACIO_Q_LOCATION_METADATA.postalCode,
      neighborhood:
        currentSettings.neighborhood || ESPACIO_Q_LOCATION_METADATA.neighborhood,
      phone: currentSettings.phone || ESPACIO_Q_LOCATION_METADATA.phone,
      googleMapsUrl: ESPACIO_Q_LOCATION_METADATA.googleMapsUrl,
    },
  });

  for (const tpl of DEFAULT_EMAIL_TEMPLATES) {
    await prisma.emailTemplate.upsert({
      where: { key: tpl.key },
      update: {},
      create: tpl,
    });
  }

  for (const rule of DEFAULT_AUTOMATION_RULES) {
    await prisma.automationRule.upsert({
      where: { key: rule.key },
      update: {},
      create: rule,
    });
  }

  const integrations = [
    {
      provider: "GOOGLE_BUSINESS",
      status: process.env.GOOGLE_CLIENT_ID
        ? "DISCONNECTED"
        : "PENDING_CREDENTIALS",
    },
    {
      provider: "GOOGLE_PLACES",
      status: process.env.GOOGLE_PLACES_API_KEY
        ? "DISCONNECTED"
        : "PENDING_CREDENTIALS",
    },
    {
      provider: "EMAIL_RESEND",
      status: isEmailProviderConfigured() ? "CONNECTED" : "PENDING_CREDENTIALS",
    },
  ];

  for (const integ of integrations) {
    await prisma.integrationConnection.upsert({
      where: { provider: integ.provider },
      update: {},
      create: integ,
    });
  }

  console.log("✓ Semilla inicial, horario oficial (Mar-Vie 10:30-21:00, Sáb 09:00-16:00) y reservas de ESPACIO Q activadas.");
}

/** Arranque: si la base está vacía (p. ej. tras reciclar el pod de preview) carga la semilla automáticamente. */
export async function ensureSeeded(): Promise<boolean> {
  const settings = await prisma.salonSettings.findUnique({ where: { id: "default" } });
  const services = await prisma.service.count();
  if (settings && services > 0) {
    await ensureEmailDefaults();
    return false;
  }
  await runSeed();
  return true;
}

/** Plantillas nuevas (solo alta, nunca sobrescribe ediciones) + estado real del proveedor de email en el panel. */
export async function ensureEmailDefaults(): Promise<void> {
  for (const tpl of DEFAULT_EMAIL_TEMPLATES) {
    await prisma.emailTemplate.upsert({ where: { key: tpl.key }, update: {}, create: tpl });
  }
  const status = isEmailProviderConfigured() ? "CONNECTED" : "PENDING_CREDENTIALS";
  await prisma.integrationConnection.upsert({
    where: { provider: "EMAIL_RESEND" },
    update: { status, accountLabel: status === "CONNECTED" ? "Resend gestionado por Emergent" : null },
    create: { provider: "EMAIL_RESEND", status },
  });
}
