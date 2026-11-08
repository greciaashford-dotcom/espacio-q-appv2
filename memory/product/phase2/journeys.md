# Phase 2 Journeys — Real email (Resend), welcome emails, salon notices

Phase 1 journeys (JRN-1…JRN-25) stay valid except where superseded below.

- id: JRN-26
  superseded: [JRN-19, JRN-20]
  steps: Subscribe to the newsletter with consent; submit the contact form with valid data.
  expected: Same on-screen results as JRN-19/JRN-20, but NEWSLETTER_VERIFY and CONTACT_ACK appear in /admin/automatizaciones as ACCEPTED with a Resend message id (not SIMULATED_LOCAL).

- id: JRN-27
  steps: Open the admin dashboard / automations page.
  expected: Email provider status shows Resend active; the "Pendiente de configurar (Modo Buzón Local Seguro)" label is gone.

- id: JRN-28
  steps: Subscribe with a new email, open the confirmation link from the verification email (or its URL in the outbox), then open it again.
  expected: Subscriber becomes verified; exactly one NEWSLETTER_WELCOME "Te damos la bienvenida a ESPACIO Q" delivery is ACCEPTED; the second click does not create another welcome.

- id: JRN-29
  steps: Book online with an email never used before.
  expected: Outbox shows the booking email (APPOINTMENT_REQUEST_PENDING or APPOINTMENT_CONFIRMATION depending on approval mode) and one CLIENT_WELCOME, both ACCEPTED; the welcome has no promotional content.

- id: JRN-30
  steps: Book a second appointment with the same email.
  expected: A new booking email is sent; no second CLIENT_WELCOME is created.

- id: JRN-31 (interpreted)
  steps: In /admin/agenda create an appointment for a client that has no previous appointments (e.g. imported via Excel) and has an email.
  expected: One CLIENT_WELCOME ACCEPTED for that client.

- id: JRN-32
  steps: In /admin/configuracion set "Email de avisos del salón" to a test address; make a new online booking.
  expected: A salon notice delivery to that address is ACCEPTED containing service, professional, date/time in Madrid time, status, client name, email and phone.

- id: JRN-33
  steps: With the salon notice address set, submit the contact form.
  expected: A salon notice delivery to that address is ACCEPTED with the message content and Reply-To equal to the sender's email; the visitor still gets CONTACT_ACK.

- id: JRN-34
  steps: Clear both the salon notice address and the salon contact email; make a booking.
  expected: Booking succeeds; no salon notice is sent; the admin dashboard shows a warning that the salon notice address is missing.

- id: JRN-35
  steps: Reschedule and cancel a booking from its manage link.
  expected: APPOINTMENT_RESCHEDULED and APPOINTMENT_CANCELLED deliveries ACCEPTED via Resend.

- id: JRN-36
  steps: Create a booking more than 24 h ahead; force the reminder jobs due (or run the worker after adjusting scheduled time in a test record); run the worker twice.
  expected: APPOINTMENT_REMINDER_24H and APPOINTMENT_REMINDER_2H each ACCEPTED exactly once.

- id: JRN-37
  steps: Send a campaign test email, then a campaign to a segment containing one verified, one pending and one suppressed subscriber.
  expected: Test email ACCEPTED; campaign delivered only to the verified subscriber, with an unsubscribe link that works (/newsletter/baja).

- id: JRN-38
  steps: Simulate a Resend failure (e.g. invalid recipient rejected by provider, or provider unreachable in a test) on a contact submission.
  expected: Contact message still saved and visible in the panel; delivery shows FAILED with an error text; nothing claims it was sent.

- id: JRN-39
  steps: Wait for the scheduled cron (≤5 min) without clicking anything after creating a due job.
  expected: The job is processed automatically (cron log / job status COMPLETED).

- id: JRN-40 (human)
  steps: The salon owner books, subscribes and writes via contact using her own email.
  expected: Emails arrive in her inbox (not spam), look right in Gmail web and mobile, Spanish accents correct.
