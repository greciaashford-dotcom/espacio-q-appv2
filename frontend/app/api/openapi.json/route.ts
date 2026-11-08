import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const json = (schema: Record<string, unknown>) => ({ content: { "application/json": { schema } } });
const str = { type: "string" };
const bool = { type: "boolean" };
const err = (description: string) => ({ description, ...json({ type: "object", properties: { error: str } }) });
const q = (name: string, required = false, description?: string) => ({ name, in: "query", required, schema: str, description });

const slot = {
  type: "object",
  properties: { time: str, endTime: str, startAtUtc: str, endAtUtc: str, availableProfessionalIds: { type: "array", items: str } },
};

function buildSpec(serverUrl: string) {
  return {
    openapi: "3.0.3",
    info: {
      title: "ESPACIO Q · API HTTP",
      version: "1.0.0",
      description:
        "Route handlers Next.js (App Router). Las escrituras públicas exigen mismo origen (cabecera Origin). Las rutas /api/v1/admin/* exigen la cookie de sesión `espacioq_session` (login en /acceso).",
    },
    servers: [{ url: serverUrl }],
    components: {
      securitySchemes: {
        session: { type: "apiKey", in: "cookie", name: "espacioq_session" },
        cronBearer: { type: "http", scheme: "bearer", description: "CRON_SECRET / WEBHOOK_CRON_SECRET" },
      },
    },
    paths: {
      "/api/v1/bookings/availability": {
        get: {
          tags: ["Reservas"],
          summary: "Franjas disponibles (Europe/Madrid) para un servicio, fecha y profesional",
          parameters: [q("serviceId", true), q("date", true, "YYYY-MM-DD"), q("professionalId", false, "id o 'any'")],
          responses: {
            "200": { description: "Disponibilidad", ...json({ type: "object", properties: { bookingReady: bool, dateStr: str, slots: { type: "array", items: slot } } }) },
            "400": err("Parámetros inválidos"),
          },
        },
      },
      "/api/v1/bookings": {
        post: {
          tags: ["Reservas"],
          summary: "Crear reserva (anti-solapamiento garantizado, idempotente por idempotencyKey). Encola email de solicitud/confirmación, recordatorios 24 h/2 h, CLIENT_WELCOME (solo primera cita del cliente) y SALON_NOTICE_BOOKING",
          requestBody: {
            required: true,
            ...json({
              type: "object",
              required: ["serviceId", "dateStr", "startTime", "customerName", "customerEmail", "customerPhone", "termsAccepted", "idempotencyKey"],
              properties: {
                serviceId: str, professionalId: { type: "string", default: "any" }, dateStr: str, startTime: str,
                customerName: str, customerEmail: str, customerPhone: str, customerNotes: str, couponCode: str,
                termsAccepted: { type: "boolean", enum: [true] }, marketingOptIn: bool, idempotencyKey: str,
              },
            }),
          },
          responses: {
            "200": { description: "Reserva creada o repetición idempotente" },
            "400": err("Datos inválidos"),
            "403": err("Origen no permitido"),
            "409": {
              description: "SLOT_UNAVAILABLE / CONCURRENT_OVERLAP con alternativas",
              ...json({ type: "object", properties: { error: str, code: str, alternatives: { type: "array", items: slot } } }),
            },
            "422": err("Reservas no disponibles"),
            "429": err("Demasiadas solicitudes"),
          },
        },
      },
      "/api/v1/bookings/manage": {
        post: {
          tags: ["Reservas"],
          summary: "Gestión por enlace privado: confirmar asistencia, cancelar o reprogramar",
          requestBody: {
            required: true,
            ...json({
              oneOf: [
                { type: "object", properties: { action: { enum: ["confirm_attendance"] }, token: str } },
                { type: "object", properties: { action: { enum: ["cancel"] }, token: str, reason: str } },
                { type: "object", properties: { action: { enum: ["reschedule"] }, token: str, newDateStr: str, newStartTime: str } },
              ],
            }),
          },
          responses: { "200": { description: "OK" }, "400": err("Inválido"), "403": err("Fuera de plazo / origen"), "404": err("Enlace no válido"), "409": err("Franja no disponible; la cita original se mantiene") },
        },
      },
      "/api/v1/contact": {
        post: {
          tags: ["Contacto"],
          summary: "Enviar mensaje de contacto (guarda mensaje, envía acuse CONTACT_ACK al remitente y aviso SALON_NOTICE_CONTACT al salón con Reply-To del remitente)",
          requestBody: { required: true, ...json({ type: "object", properties: { name: str, email: str, phone: str, subject: str, message: str, privacyAccepted: { type: "boolean", enum: [true] }, website: { type: "string", description: "honeypot, vacío" } } }) },
          responses: { "200": { description: "Mensaje recibido" }, "400": err("Validación"), "403": err("Origen"), "429": err("Límite") },
        },
      },
      "/api/v1/newsletter/subscribe": {
        post: {
          tags: ["Newsletter"],
          summary: "Alta con doble opt-in (crea suscriptor PENDING y encola NEWSLETTER_VERIFY)",
          requestBody: { required: true, ...json({ type: "object", properties: { email: str, firstName: str, consentAccepted: { type: "boolean", enum: [true] }, source: { enum: ["newsletter_dialog", "footer_form"] } } }) },
          responses: { "200": { description: "Solicitud registrada" }, "400": err("Consentimiento requerido / validación"), "403": err("Origen"), "429": err("Límite") },
        },
      },
      "/api/v1/newsletter/action": {
        post: {
          tags: ["Newsletter"],
          summary: "Confirmar suscripción o darse de baja",
          requestBody: { required: true, ...json({ oneOf: [{ type: "object", properties: { action: { enum: ["confirm"] }, token: str } }, { type: "object", properties: { action: { enum: ["unsubscribe"] }, email: str, token: str } }] }) },
          responses: { "200": { description: "OK" }, "400": err("Token inválido"), "403": err("Origen") },
        },
      },
      "/api/v1/admin/clients/export": {
        get: {
          tags: ["Admin"],
          security: [{ session: [] }],
          summary: "Exportar clientes a .xlsx",
          parameters: [q("q"), q("tag"), q("cols", false, "columnas separadas por coma")],
          responses: { "200": { description: "Fichero XLSX", content: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { schema: { type: "string", format: "binary" } } } }, "401": err("Sin sesión"), "403": err("Sin permiso") },
        },
      },
      "/api/v1/admin/clients/import": {
        post: {
          tags: ["Admin"],
          security: [{ session: [] }],
          summary: "Importar clientes desde .xlsx (dry-run o confirmación; nunca activa consentimiento de marketing)",
          requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" }, mode: { enum: ["CREATE_ONLY", "UPSERT_BY_EMAIL"] }, dryRun: str } } } } },
          responses: { "200": { description: "Resultado" }, "400": err("Fichero inválido"), "403": err("Sin permiso"), "413": err("Demasiado grande") },
        },
      },
      "/api/v1/admin/clients/template": {
        get: { tags: ["Admin"], security: [{ session: [] }], summary: "Plantilla .xlsx de importación", responses: { "200": { description: "XLSX" }, "403": err("Sin permiso") } },
      },
      "/api/v1/admin/media/upload": {
        post: {
          tags: ["Admin"],
          security: [{ session: [] }],
          summary: "Subir imagen (JPEG/PNG/WebP/AVIF validada por magic bytes → Emergent Object Storage) o registrar/importar URL HTTPS (anti-SSRF)",
          requestBody: {
            content: {
              "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" }, internalName: str, altText: str, category: str, licenseNote: str } } },
              "application/json": { schema: { type: "object", properties: { url: str, importCopy: bool, internalName: str, altText: str, category: str, licenseNote: str } } },
            },
          },
          responses: { "200": { description: "Asset creado" }, "400": err("Formato/URL rechazados"), "403": err("Sin permiso") },
        },
      },
      "/api/internal/jobs": {
        post: {
          tags: ["Interno"],
          security: [{ cronBearer: [] }],
          summary: "Procesar cola de notificaciones/campañas (cron cada 5 min)",
          parameters: [q("syncGoogle", false, "1 para sincronizar horario Google")],
          responses: { "200": { description: "Resumen de procesamiento" }, "401": err("Token inválido"), "503": err("CRON_SECRET no configurado") },
        },
      },
      "/api/webhooks/email": { post: { tags: ["Interno"], summary: "Webhook firmado del proveedor de email (entregas/rebotes)", responses: { "200": { description: "Procesado" } } } },
      "/api/integrations/google/connect": { get: { tags: ["Integraciones"], security: [{ session: [] }], summary: "Iniciar OAuth Google Business Profile", responses: { "302": { description: "Redirección" } } } },
      "/api/integrations/google/callback": { get: { tags: ["Integraciones"], summary: "Callback OAuth Google", parameters: [q("code"), q("state")], responses: { "302": { description: "Redirección a /admin/horarios" } } } },
      "/media/{filename}": {
        get: { tags: ["Media"], summary: "Servir imagen subida (desde Emergent Object Storage)", parameters: [{ name: "filename", in: "path", required: true, schema: str }], responses: { "200": { description: "Imagen" }, "404": { description: "No encontrada" } } },
      },
    },
  };
}

export function GET() {
  const appUrl = process.env.APP_URL?.trim() || "/";
  return NextResponse.json(buildSpec(appUrl), { headers: { "Cache-Control": "no-store" } });
}
