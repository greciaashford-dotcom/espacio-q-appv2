# Phase 1 Requirement — Next.js on Emergent + MongoDB

- Version: phase-1
- Goal: The imported ESPACIO Q Next.js app runs in the Emergent preview on Emergent MongoDB, with every existing feature behaving as before, no double-bookings, media in Emergent Object Storage and the job queue processed automatically.
- Context and features: see `/app/memory/product/overview.md` (F-1…F-6). Existing behaviour reference: `/app/README.md`, `/app/docs/MASTER_SPEC.md`, `/app/docs/USER_GUIDE.md`.
- Email in this phase stays in the repo's honest local mode (`SIMULATED_LOCAL` in the panel outbox). Real Resend sending is phase 2.

## Functional requirements

### Stack & runtime
- REQ-1 [always] The system shall keep the application code in Next.js 14 App Router with TypeScript (pages, server actions and Next.js API route handlers).
- REQ-2 [always] The system shall serve the public website, `/acceso`, `/admin/*` and every `/api/v1/*` route from the Emergent preview URL.
- REQ-3 [always] The system shall expose an OpenAPI description of its HTTP API routes at `/api/openapi.json`.
- REQ-4 [unwanted] If a required secret (`AUTH_SECRET`, `CRON_SECRET`, `TOKEN_ENCRYPTION_KEY`) is missing, then the system shall fail with a clear server log message instead of using a hard-coded default.

### Database
- REQ-5 [always] The system shall read the database connection only from the `MONGO_URL` and `DB_NAME` environment variables.
- REQ-6 [always] The system shall persist every entity of the current Prisma schema (users, sessions, settings, services, professionals, schedules, clients, appointments, occupancies, CMS content & revisions, media, newsletter, consent, suppression, campaigns, templates, automations, jobs, email deliveries, imports/exports, integrations, audit, contact messages, rate limits) in MongoDB.
- REQ-7 [always] The system shall no longer require PostgreSQL to start, seed, run or test (interpreted: PostgreSQL scripts `ensure-db`/`.pgdata` removed from the run path).
- REQ-8 [always] The system shall enforce the repo's unique constraints (e.g. user email, dedup keys, idempotency keys, client normalized email) with MongoDB unique indexes.
- REQ-9 [unwanted] If the database is unreachable, then the system shall answer API calls with HTTP 503 without exposing stack traces.

### Anti-double-booking
- REQ-10 [always] The system shall never hold two active occupancies of the same professional whose `[start, end)` intervals overlap.
- REQ-11 [always] The system shall never hold two active reservations of the same shared resource whose `[start, end)` intervals overlap.
- REQ-12 [event] When two booking requests for the same professional and overlapping time arrive concurrently, the system shall confirm exactly one of them.
- REQ-13 [unwanted] If a booking loses the race, then the system shall return HTTP 409 with "Otra reserva acaba de ocupar esta franja horaria de forma simultánea. Tu solicitud no se ha duplicado; por favor elige una de las franjas alternativas." and alternative slots.
- REQ-14 [unwanted] If a multi-step write (booking, reschedule, cancel) fails half-way, then the system shall leave no orphan occupancy blocking that slot.
- REQ-15 [event] When an appointment is cancelled, the system shall free its slot for new bookings.
- REQ-16 [event] When a reschedule targets an unavailable slot, the system shall keep the original appointment with "La nueva fecha u hora seleccionada no está disponible. Tu cita original se mantiene intacta."

### Existing features parity (unchanged behaviour on MongoDB)
- REQ-17 [always] The system shall compute availability in Europe/Madrid (DST, split shifts, exceptions/holidays, professional ∩ salon hours, buffers) exactly as before.
- REQ-18 [event] When the user count is 0, the system shall offer the first-owner wizard on `/acceso` ("Crear cuenta propietaria y entrar").
- REQ-19 [unwanted] If at least one user exists, then the system shall not offer the first-owner wizard.
- REQ-20 [event] When an admin edits CMS content as draft and publishes it, the system shall show the published text on the public page and keep a revision.
- REQ-21 [event] When a visitor subscribes to the newsletter with consent checked, the system shall create a pending subscriber and queue the verification email (visible in the panel outbox as simulated).
- REQ-22 [event] When a visitor sends the contact form, the system shall store the message and record the acknowledgement email in the outbox.
- REQ-23 [event] When an admin imports a valid `.xlsx` client file, the system shall create the clients without enabling marketing consent.
- REQ-24 [event] When an admin exports clients, the system shall download a real `.xlsx` file.
- REQ-25 [always] The system shall keep role permissions (OWNER_ADMIN, RECEPTION, PROFESSIONAL) as in the repo.

### Seed
- REQ-26 [event] When the seed runs on an empty database, the system shall create salon settings, the default services catalog, professionals, weekly schedule (Tue–Fri 10:30–21:00, Sat 09:00–16:00, Sun/Mon closed), CMS defaults, email templates, automation rules and integration placeholders.
- REQ-27 [event] When the seed runs again, the system shall not duplicate any record.

### Media (Emergent Object Storage)
- REQ-28 [event] When an admin uploads a valid image in `/admin/multimedia`, the system shall store the file in Emergent Object Storage.
- REQ-29 [always] The system shall serve uploaded media through the app's media URLs after a server restart.
- REQ-30 [unwanted] If an uploaded file fails the magic-bytes check (e.g. SVG or renamed non-image), then the system shall reject it with an error message.

### Job queue
- REQ-31 [always] The system shall process due notification jobs automatically at least every 5 minutes without manual action (interpreted: Emergent scheduled job calling `/api/internal/jobs` with `CRON_SECRET`).
- REQ-32 [unwanted] If `/api/internal/jobs` is called without a valid `CRON_SECRET` bearer token, then the system shall return HTTP 401.
- REQ-33 [event] When an admin clicks «Procesar cola pendiente ahora» in `/admin/automatizaciones`, the system shall process the due jobs.

## Quality requirements

```
Q-1  Tag: Booking.DoubleBooking
     Scale: number of overlapping active occupancies for one professional after N concurrent requests for the same slot
     Meter: script firing 10 parallel POST /api/v1/bookings for the same professional+slot, 3 runs
     Must: 0 overlaps and exactly 1 success per run
     Plan: 0 overlaps and exactly 1 success per run
```
```
Q-2  Tag: Booking.Timezone
     Scale: slots offered vs salon schedule on DST-change dates (last Sunday of March / October) and normal days
     Meter: availability API checks on 4 dates
     Must: 0 slots outside salon hours
     Plan: 0 slots outside salon hours
```
```
Q-3  Tag: Data.Persistence
     Scale: records/media still present after an app restart
     Meter: create booking, CMS publish, media upload → restart services → verify
     Must: 100 %
     Plan: 100 %
```
```
Q-4  Tag: Public.Speed
     Scale: ms until home and /reservar are interactive on preview (warm)
     Meter: browser timing, 3 loads each
     Must: < 4000 ms (estimate)
     Plan: < 2000 ms
```
```
Q-5  Tag: Security.Access
     Scale: admin pages/API reachable without a valid session
     Meter: unauthenticated requests to /admin/* and /api/v1/admin/*
     Must: 0
     Plan: 0
```
```
Q-6  Tag: Parity.Visual
     Scale: public pages visibly broken vs the repo design (missing images, broken layout, raw errors)
     Meter: human / screenshot review of home, servicios, equipo, galería, contacto, reservar
     Must: 0
     Plan: 0
```
