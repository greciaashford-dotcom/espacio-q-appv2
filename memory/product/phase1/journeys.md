# Phase 1 Journeys — Next.js on Emergent + MongoDB

- id: JRN-1
  steps: Open the preview URL home page, then Servicios, a service detail, Equipo, Galería and Contacto.
  expected: Every page loads with the Zen Linen design, real seeded content (services with prices/durations, professionals) and no error screen; no request to PostgreSQL is needed (app runs with only MongoDB).

- id: JRN-2
  steps: Call GET /api/openapi.json.
  expected: HTTP 200 with a JSON OpenAPI document listing the /api/v1 routes (bookings, availability, manage, contact, newsletter, admin media/clients).

- id: JRN-3
  steps: On an empty database open /acceso.
  expected: The first-owner wizard is shown with the button "Crear cuenta propietaria y entrar"; after creating the owner, the user lands in /admin.

- id: JRN-4
  steps: With an owner already existing, open /acceso.
  expected: Only the login form is shown; the first-owner wizard is not offered.

- id: JRN-5
  steps: Log in as OWNER_ADMIN with the test credentials; then log out and try to open /admin and GET /api/v1/admin/clients/export without a session.
  expected: Login lands on the dashboard; after logout /admin redirects to /acceso and the admin API returns 401/403.

- id: JRN-6
  steps: As a visitor, go to /reservar, pick a seeded service, a professional and an open day (Tue–Sat), choose a time and submit name, email, phone and accepted conditions.
  expected: Success screen with appointment summary; the appointment appears in /admin/agenda; the chosen slot no longer appears as available for that professional.

- id: JRN-7
  steps: Request availability for a Monday or Sunday, and for a Saturday after 16:00.
  expected: No slots offered on closed days or outside salon hours (Tue–Fri 10:30–21:00, Sat 09:00–16:00, Europe/Madrid).

- id: JRN-8
  steps: Request availability for the DST-change Sundays' neighbouring open days (e.g. Saturday 28 March 2026 / Tuesday 31 March 2026 and Saturday 24 Oct 2026 / Tuesday 27 Oct 2026).
  expected: Slots start at the correct local times (first slot 09:00 Sat, 10:30 Tue) with no shifted hour.

- id: JRN-9
  steps: Fire 10 concurrent POST /api/v1/bookings for the same service, professional and exact time slot (different customer emails).
  expected: Exactly 1 request succeeds; the other 9 get HTTP 409 with code CONCURRENT_OVERLAP (or the "ya no está disponible" 409) and alternatives; the database holds exactly one active occupancy for that slot.

- id: JRN-10
  steps: Book a slot, then try to book an overlapping slot (starting inside the first appointment's duration) for the same professional.
  expected: HTTP 409 "La franja horaria seleccionada ya no está disponible…" with alternatives; no second appointment created.

- id: JRN-11
  steps: Repeat the same POST /api/v1/bookings with the same idempotency key twice.
  expected: Only one appointment exists; the second response returns the same appointment instead of a duplicate.

- id: JRN-12
  steps: Open the private manage link (/reservar/gestion/[token]) of a booking, reschedule it to another free slot.
  expected: Appointment shows the new time; the old slot becomes bookable again.

- id: JRN-13
  steps: From the manage link, try to reschedule to a slot already taken by another booking.
  expected: Message "La nueva fecha u hora seleccionada no está disponible. Tu cita original se mantiene intacta." and the original time is unchanged.

- id: JRN-14
  steps: Cancel a booking from its manage link, then book that same slot as a new visitor.
  expected: Cancellation confirmed; the new booking for that slot succeeds.

- id: JRN-15
  steps: Open the manage link with an invalid/random token.
  expected: A not-found / invalid-link message; no appointment data shown.

- id: JRN-16
  steps: In /admin/contenido edit a home section text, save as draft, check the public home, then publish and check again.
  expected: Draft text not visible publicly; after publishing the new text is visible on the home page and a revision appears in the history.

- id: JRN-17
  steps: In /admin/multimedia upload a valid JPG/PNG/WebP image; restart the app services; open the image URL and the media library.
  expected: The image is listed and loads after the restart (file stored in Emergent Object Storage, not local disk).

- id: JRN-18
  steps: In /admin/multimedia upload an SVG file and a text file renamed to .jpg.
  expected: Both rejected with an error message; nothing added to the library.

- id: JRN-19
  steps: As a visitor, subscribe to the newsletter from the footer form with consent checked; then try again with consent unchecked.
  expected: First: confirmation message and a pending subscriber; a NEWSLETTER_VERIFY entry appears in /admin/automatizaciones outbox as simulated. Second: blocked with a consent-required message.

- id: JRN-20
  steps: Submit the contact form on /contacto with valid data; then submit with an invalid email.
  expected: Valid: success message, message visible in the panel, CONTACT_ACK entry in the outbox. Invalid: validation error, nothing stored.

- id: JRN-21
  steps: In /admin/clientes download the template, import a valid .xlsx with 3 clients (one cell starting with "="), then export clients.
  expected: Dry-run preview then import creates 3 clients with marketing consent off; formula cell stored as text; export downloads a valid .xlsx containing them.

- id: JRN-22
  steps: POST /api/internal/jobs without Authorization, then with "Bearer <CRON_SECRET>".
  expected: 401 without token; 200 with a processing summary with the token.

- id: JRN-23
  steps: Create a booking more than 24 h ahead; check queued jobs; wait for the scheduled processor (≤5 min) or click «Procesar cola pendiente ahora».
  expected: Confirmation/request job processed into the outbox automatically; 24 h / 2 h reminder jobs exist with the correct scheduled times.

- id: JRN-24
  steps: Run the seed twice on the same database.
  expected: Services, professionals, schedules, templates and rules exist once each (no duplicates).

- id: JRN-25
  steps: Log in as a RECEPTION user (created by the owner in /admin/configuracion) and try to open owner-only areas (configuration / integrations).
  expected: Access denied for owner-only areas as in the repo; agenda remains usable.
