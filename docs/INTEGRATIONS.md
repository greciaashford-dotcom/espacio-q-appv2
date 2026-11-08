# Integraciones y Servicios Externos · ESPACIO Q

Este documento detalla todas las integraciones del sistema, su finalidad, credenciales requeridas, permisos, cuotas/costes pendientes de confirmar, estado actual y comportamiento degradado seguro.

---

## 1. Base de Datos: PostgreSQL 16 (`DATABASE_URL`)

- **Finalidad:** Persistencia relacional, integridad transaccional, auditoría, CMS y protección anti-solapamiento de citas en base de datos mediante la extensión `btree_gist` y restricción `EXCLUDE USING gist` sobre `tstzrange(start_at_utc, end_at_utc, '[)')`.
- **Proveedor objetivo:** PostgreSQL 16 (gestionado en región UE en producción; instancia dedicada de PostgreSQL 16 configurada localmente en `.pgdata` puerto `5433` para desarrollo y pruebas).
- **Credenciales:** `DATABASE_URL` (ej. `postgresql://postgres@localhost:5433/espacio_q?schema=public`).
- **Estado:** **Implementado y Probado** (PostgreSQL 16.x con `btree_gist` activo).
- **Comportamiento degradado:** Si la base de datos no está disponible, los endpoints devuelven error controlado (`503 Service Unavailable`) sin exponer trazas SQL ni secretos.

---

## 2. Proveedor de Email Transaccional y Marketing (`Resend`)

- **Finalidad:** Envío de emails transaccionales (verificación double opt-in de newsletter, bienvenida, solicitud/confirmación/reprogramación/cancelación de cita, recordatorios 24 h y 2 h antes, avisos internos al salón, respuesta a contacto) y campañas de email marketing a suscriptores con consentimiento verificado.
- **Proveedor objetivo:** Resend (`https://api.resend.com/emails`) mediante adaptador desacoplado (`lib/email/provider.ts`).
- **Credenciales requeridas:**
  - `EMAIL_PROVIDER_API_KEY`: API key de Resend con permiso de envío (`sending_access`).
  - `EMAIL_FROM`: Remitente verificado (ej. `ESPACIO Q <citas@espacioq.es>`).
  - `EMAIL_REPLY_TO`: Dirección de respuesta del salón.
  - `EMAIL_WEBHOOK_SECRET`: Secreto de firma Svix/HMAC para `/api/webhooks/email`.
- **Requisitos DNS del dominio:** Configurar registros `SPF`, `DKIM` y `DMARC` (`v=DMARC1; p=quarantine;`) en el proveedor de DNS del dominio oficial del salón antes de activar envíos en producción.
- **Coste/Cuota:** Sujeto al plan contratado por el salón en Resend.
- **Estado:** **Adaptador, Outbox, Cola de Jobs y Webhook implementados · Pendiente de credenciales de producción (`EMAIL_PROVIDER_API_KEY`)**.
- **Comportamiento degradado:** Sin `EMAIL_PROVIDER_API_KEY`, el sistema registra el estado como `Pendiente de configurar (Modo Buzón Local Seguro)` en el dashboard, guarda cada correo renderizado en `EmailDelivery` con estado `SIMULATED_LOCAL` para inspección/previsualización en `/admin/automatizaciones` y **nunca** afirma haber enviado un correo real al exterior.

---

## 3. Sincronización de Horarios con Google

### 3.1. Fuente Preferida: Google Business Profile API (OAuth 2.0)
- **Finalidad:** Lectura oficial del horario regular (`regularHours`), horario especial/festivos (`specialHours`) y estado de apertura (`openInfo`) de la ficha de **ESPACIO Q** en Madrid.
- **Credenciales y permisos:**
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (`/api/integrations/google/callback`).
  - `GOOGLE_BUSINESS_LOCATION_ID`: Identificador de ubicación validado tras OAuth.
  - Alcance OAuth: `https://www.googleapis.com/auth/business.manage` (uso estricto de solo lectura en nuestra aplicación).
  - Requiere aprobación previa del proyecto en Google Cloud para **Google Business Profile APIs** y autorización por la cuenta propietaria/gestora de la ficha.
- **Estado:** **Módulo OAuth, cifrado AES-256-GCM de tokens, sincronizador y detector de conflictos implementados · Pendiente de credenciales OAuth y aprobación de Google Business Profile API**.

### 3.2. Fuente Alternativa: Google Places API (New)
- **Finalidad:** Consulta de `regularOpeningHours` y `currentOpeningHours` de la ubicación verificada de ESPACIO Q cuando aún no se dispone de aprobación de Business Profile API.
- **Credenciales:**
  - `GOOGLE_PLACES_API_KEY`: Clave de servidor restringida a Places API.
  - `GOOGLE_PLACE_ID`: Place ID verificado (no se asume que el CID hexadecimal `0xd4228618d8af967:0xa4f32211fe6d024d` del enlace de Maps sea un Place ID sin resolución oficial).
- **Política de almacenamiento:** Respeta las condiciones de Google Maps Platform; separa la visualización/consulta de los horarios operativos aprobados por el administrador del salón.
- **Estado:** **Cliente Places API y validador implementados · Pendiente de `GOOGLE_PLACES_API_KEY` y `GOOGLE_PLACE_ID`**.

### 3.3. Alternativa Operativa: Modo Manual Verificado
- **Estado:** **Implementado y Activo por defecto**.
- Mientras no existan credenciales de Google conectadas, el sistema muestra honestamente el estado `Manual` (nunca `Sincronizado con Google`), permite editar el horario semanal, turnos partidos y excepciones/festivos por fecha desde `/admin/horarios`, y detecta cualquier conflicto con citas existentes.

---

## 4. Almacenamiento de Medios (`Storage`)

- **Finalidad:** Almacenamiento de imágenes del hero, newsletter, servicios, equipo, galería y Open Graph, separado de las importaciones/exportaciones privadas de Excel.
- **Credenciales opcionales S3/R2:** `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`.
- **Estado:** **Implementado adaptador local persistente + soporte de enlaces externos HTTPS con protección anti-SSRF · Pendiente de credenciales S3/R2 para despliegue multi-instancia**.
