# Plan de Implementación · ESPACIO Q

## Decisiones de Arquitectura (Fase 0)

1. **Framework y Lenguaje:**
   - **Next.js (App Router)** con **TypeScript** estricto.
   - Renderizado en servidor (React Server Components) para rutas públicas y SEO, combinando componentes cliente interactivos (`"use client"`) únicamente donde se requiere estado, animaciones o formularios interactivos.

2. **Sistema de Diseño (Zen Linen):**
   - **Tailwind CSS** + componentes reutilizables estilo **shadcn/ui** + **Radix UI** en `components/ui`.
   - Tipografías editoriales vía `next/font/google`: **Cormorant Garamond** (titulares editoriales) y **Manrope** (cuerpo, formularios, agenda y dashboard).
   - Tokens CSS exactos en `:root` con paleta Zen Linen (`#E9E4D8`, `#F4EFE4`, `#2E2E2E`, `#1E1E1E`, `#5E5A52`, `#D2CBBB`, `#F26A4B`) y soporte de modo oscuro Zen Linen en el panel de administración.

3. **Persistencia, Concurrencia y Base de Datos:**
   - Esquema **Prisma ORM** (`prisma/schema.prisma`) diseñado para PostgreSQL gestionado/local (y SQLite/PostgreSQL con transacciones serializadas y bloqueo de intervalos `Occupancy` mediante claves de ranura y verificación atómica dentro de transacción interactiva + migración SQL con restricción de exclusión `EXCLUDE USING gist` para PostgreSQL).
   - Semántica de intervalos semiabiertos `[startAtUtc, endAtUtc)` en UTC, con conversión a `Europe/Madrid` mediante `Intl` / `date-fns-tz`.

4. **CMS Estructurado Integral y Páginas Legales Editables:**
   - Todas las secciones de la web pública (Cabecera, Hero 3D, Presentación editorial, Servicios destacados, Experiencia, Equipo, Galería, Reseñas, FAQ, Ubicación/Contacto, Newsletter, Footer, Textos de Reserva y Configuración SEO) y **todas las páginas legales** (`/aviso-legal`, `/terminos-y-condiciones`, `/condiciones-reserva`, `/privacidad`, `/cookies`) se almacenan en base de datos (`PageContent`, `LegalDocument`, `ContentRevision`, `SalonSettings`) y son 100 % editables desde `/admin/contenido` y `/admin/configuracion`.
   - Incluye control de versiones/revisiones, estado borrador vs. publicado, previsualización e indicadores claros de datos fiscales/empresariales pendientes de completar por el titular de ESPACIO Q.

5. **Biblioteca Multimedia y Protección SSRF:**
   - Subida local/objeto validada (MIME real por magic bytes, tamaño, dimensiones y sanitización) e importación/referencia de URLs externas HTTPS con validador anti-SSRF (`lib/security/ssrf.ts`) que bloquea IPs privadas, loopback, link-local y metadatos cloud.

6. **Motor de Reservas, CRM, Excel, Email y Horarios Google:**
   - Cálculo de disponibilidad en servidor cruzando horario efectivo del salón (Excepción local > Excepción Google > Horario regular), turnos de profesionales, ausencias, duración de servicio, buffers pre/post y citas/ocupaciones activas.
   - Importación y exportación real en formato `.xlsx` (ExcelJS) con plantilla descargable, mapeo de columnas, vista previa de validación, protección contra inyección de fórmulas y respeto estricto del consentimiento RGPD/LSSI.
   - Adaptador de email (Resend + buzón local de desarrollo/auditoría cuando no hay API key configurada), outbox transaccional, cola de trabajos (`NotificationJob`) y endpoint de cron/worker autenticado (`/api/internal/jobs/run`).
   - Módulo de horarios con soporte para Google Business Profile API (OAuth2), Google Places API (Place ID verificado) y modo Manual operativo con detección de conflictos sobre citas existentes.

---

## Fases de Ejecución

- **Fase 0 · Base y decisiones:** Inspección del entorno, inicialización de Next.js + TypeScript + Tailwind + Prisma, definición del esquema completo de datos, documentación técnica (`MASTER_SPEC.md`, `IMPLEMENTATION_PLAN.md`, `REQUIREMENTS_MATRIX.md`, `INTEGRATIONS.md`, `OPERATIONS.md`) y semilla inicial honesta sin datos inventados.
- **Fase 1 · Diseño público, Hero 3D, Páginas Legales y CMS completo:** Layout público Zen Linen, `PerspectiveTunnelHero`, `NewsletterDialog`, todas las rutas públicas (`/`, `/servicios`, `/servicios/[slug]`, `/equipo`, `/galeria`, `/contacto`, `/aviso-legal`, `/terminos-y-condiciones`, `/condiciones-reserva`, `/privacidad`, `/cookies`), banner/configurador de cookies honesto y CMS completo en el dashboard para editar cada bloque de la web y cada documento legal.
- **Fase 2 · Administración, Autenticación, Catálogo, Multimedia y CRM con Excel:** Autenticación por sesión segura (`HttpOnly`) con roles (`OWNER_ADMIN`, `RECEPTION`, `PROFESSIONAL`), asistente de configuración inicial, CRUD de categorías/servicios, profesionales, horarios manuales, biblioteca multimedia con anti-SSRF, y CRM con importación/exportación `.xlsx`.
- **Fase 3 · Motor de reservas y Agenda:** Cálculo de disponibilidad en servidor, flujo público `/reservar`, reserva atómica e idempotente con snapshot de servicio, gestión segura por token opaco (`/reservar/gestion/[token]`) con confirmación/reprogramación/cancelación vía POST, y agenda administrativa (vistas día, semana y lista).
- **Fase 4 · Newsletter Double Opt-In, Automatizaciones y Outbox de Email:** Suscripción con consentimiento explícito, verificación por token (`/newsletter/confirmar`), baja directa (`/newsletter/baja`), plantillas transaccionales, outbox, cola de trabajos (`NotificationJob`) y webhook de eventos de email (`/api/webhooks/email`).
- **Fase 5 · Email Marketing y Sincronización Google:** Campañas, segmentación con exclusión automática de bajas/supresiones, previsualización, envío de prueba, programación y módulo de conexión con Google Business Profile / Places API + detector de conflictos horarios.
- **Fase 6 · Endurecimiento, SEO, Accesibilidad y Pruebas:** `sitemap.ts`, `robots.ts`, JSON-LD `BeautySalon`, cabeceras de seguridad, pruebas unitarias/concurrencia (Vitest) y verificación de build de producción.
