# ESPACIO Q · Plataforma Web y Panel de Gestión (Madrid, España)

Aplicación web integral de producción para **ESPACIO Q** (salón de belleza en Madrid, España), construida con **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS** (paleta editorial **Zen Linen**), **PostgreSQL 16** (con restricciones anti-solapamiento `EXCLUDE USING gist`) y **Prisma ORM**.

---

## Características Principales

1. **Web Pública Editorial (Zen Linen & WCAG 2.2 AA)**
   - Hero inmersivo 3D en profundidad Z (`components/ui/perspective-tunnel-hero.tsx`) conducido por scroll nativo con ángulo áureo, zona central despejada, enlace «Saltar animación» y degradación estática ante `prefers-reduced-motion` o desactivación desde CMS.
   - Catálogo de servicios (`/servicios`, `/servicios/[slug]`), equipo (`/equipo`), galería (`/galeria`), contacto (`/contacto` con enlace oficial a Google Maps de ESPACIO Q) y motor de reservas online (`/reservar` y gestión privada vía token opaco `/reservar/gestion/[token]`).
   - Diálogo único y formulario en footer de Newsletter (`components/ui/newsletter-dialog.tsx`) con consentimiento explícito desmarcado por defecto, sistema **double opt-in** real y baja firmada HMAC en un clic (`/newsletter/baja`).
2. **Páginas Legales Completas para España (100 % Editables desde Dashboard)**
   - `/aviso-legal` (LSSI-CE), `/terminos-y-condiciones`, `/condiciones-reserva`, `/privacidad` (RGPD / LOPDGDD) y `/cookies` (con gestor de consentimiento granular sin bloquear lectura).
   - Interpolación automática de datos fiscales/legales configurados en `/admin/configuracion` (mostrando marcadores honestos `[Dato pendiente de configurar...]` mientras el titular no los complete, sin inventar NIF ni razón social).
3. **CMS Integral Sin Tocar Código (`/admin/contenido` y `/admin/multimedia`)**
   - Edición con flujo **Borrador / Publicado** e historial de versiones (`ContentRevision`) para cabecera, pie de página, hero 3D, todas las secciones de portada, páginas secundarias, textos del asistente de reserva, textos de newsletter y los 5 documentos legales.
   - Biblioteca multimedia con subida local validada por magic bytes (bloqueando SVG ejecutable) e importación/referencia HTTPS con defensa anti-SSRF por resolución DNS.
4. **Motor de Reservas Atómico y Horarios en `Europe/Madrid`**
   - Cálculo de disponibilidad en servidor respetando cambios de hora DST (`Europe/Madrid`), turnos partidos, excepciones/festivos, intersección salón ∩ profesional y buffers pre/post servicio.
   - Protección contra condiciones de carrera en base de datos mediante `EXCLUDE USING gist` sobre `Occupancy` y `ResourceReservation`, snapshots inmutables del servicio/precio e idempotencia.
   - Sincronización preparada para **Google Business Profile API (OAuth 2.0)** y **Google Places API**, con fallback seguro a **Horario Manual** y detector de conflictos sobre citas futuras (`ScheduleConflictAlert`) sin cancelaciones automáticas.
5. **CRM, Excel `.xlsx` Real y Marketing con Supresión LSSI/RGPD**
   - Gestión de clientes (`/admin/clientes`), anonimización irreversible RGPD y descarga de plantilla, previsualización Dry-Run, importación y exportación en formato real **`.xlsx`** (`exceljs`) con protección frente a inyección de fórmulas (`=`, `+`, `-`, `@`) y sin activar jamás consentimiento comercial por importar un archivo.
   - Cola persistente `NotificationJob`, buzón auditable `EmailDelivery` (adaptador Resend o `SIMULATED_LOCAL` honesto en desarrollo), campañas segmentadas con revalidación en tiempo real contra `Suppression` y receptor de webhooks firmados HMAC (`/api/webhooks/email`).

---

## Requisitos Previos

- **Node.js** `>= 20.x` (probado en `v24.13.0`) y **npm**.
- **PostgreSQL 16+** con extensión estándar `btree_gist`.

---

## Instalación y Puesta en Marcha Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Copia `.env.example` a `.env` y ajusta `DATABASE_URL`, `AUTH_SECRET` (mínimo 32 caracteres) y `TOKEN_ENCRYPTION_KEY` (64 caracteres hexadecimales / 32 bytes):
   ```bash
   cp .env.example .env
   ```
   *(En este entorno local ya existe un clúster PostgreSQL 16 inicializado en `.pgdata` escuchando en `localhost:5433`, base de datos `espacio_q`).*

3. **Base de datos PostgreSQL local (auto-arranque integrado):**
   Al ejecutar `npm run dev`, `npm run start`, `npm run test` o `npm run db:migrate`, el script `scripts/ensure-db.mjs` comprueba si PostgreSQL está escuchando en `localhost:5433` y, si está detenido, lo arranca automáticamente desde `.pgdata`. También puedes iniciarlo o detenerlo manualmente:
   ```powershell
   npm run db:start
   npm run db:stop
   ```

4. **Aplicar esquema Prisma + restricciones SQL `EXCLUDE USING gist` y semilla inicial:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Crear el primer usuario administrador (`OWNER_ADMIN`):**
   Por seguridad no existen contraseñas por defecto en el código. Puedes crear la cuenta inicial desde la pantalla `/acceso` (asistente de primer arranque disponible únicamente cuando `User.count() === 0`) o mediante CLI:
   ```powershell
   $env:ADMIN_BOOTSTRAP_EMAIL="direccion@tudominio.es"
   $env:ADMIN_BOOTSTRAP_PASSWORD="TuPasswordSeguraDeAlMenos10Caracteres"
   $env:ADMIN_BOOTSTRAP_NAME="Dirección ESPACIO Q"
   npm run admin:create
   ```

6. **Arrancar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   - Web pública: http://localhost:3000
   - Acceso al panel: http://localhost:3000/acceso
   - Panel de gestión: http://localhost:3000/admin

---

## Verificación, Tests y Compilación de Producción

```bash
# Comprobación estricta de tipos TypeScript
npm run typecheck

# Linter Next.js / ESLint
npm run lint

# Suite completa de pruebas automatizadas (Vitest contra PostgreSQL real)
npm run test

# Build optimizado de producción
npm run build
npm run start
```

---

## Worker de Notificaciones y Sincronización Programada

En producción, programa un cron (cada 1–5 minutos) contra el endpoint interno protegido con `CRON_SECRET`:

```bash
curl -X POST "https://tu-dominio.es/api/internal/jobs?syncGoogle=1" \
  -H "Authorization: Bearer $CRON_SECRET"
```

También puede ejecutarse manualmente en cualquier momento desde **`/admin/automatizaciones` → «Procesar cola pendiente ahora»**.

---

## Checklist Antes de Abrir Tráfico Real en Producción

1. **Datos fiscales y de contacto (`/admin/configuracion`):** completar Razón Social/Titular, NIF/CIF, domicilio social en Madrid, datos registrales (si aplica), teléfono y correo de contacto/privacidad para sustituir todos los avisos `[Dato pendiente de configurar...]`.
2. **Catálogo, equipo y horarios (`/admin/servicios`, `/admin/equipo`, `/admin/horarios`):** dar de alta servicios reales con tarifas/duraciones, asignar profesionales, confirmar el horario semanal y activar `Habilitar reservas online públicas`.
3. **Fotografías propias (`/admin/multimedia`):** sustituir las 6 imágenes editoriales provisionales de referencia por fotografías reales del salón en Madrid.
4. **Proveedor de email y webhooks:** configurar `EMAIL_PROVIDER_API_KEY` (Resend), dominio remitente verificado en `EMAIL_FROM` (SPF/DKIM/DMARC) y `EMAIL_WEBHOOK_SECRET` apuntando a `/api/webhooks/email`.
5. **Google Business Profile / Places (opcional):** configurar `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_BUSINESS_LOCATION_ID` (o `GOOGLE_PLACES_API_KEY` + `GOOGLE_PLACE_ID`) para sincronización automática; sin ellos el sistema opera de forma completa en modo **Horario Manual**.
