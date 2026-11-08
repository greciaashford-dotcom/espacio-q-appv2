# Phase 2 Requirement — Real email everywhere (Resend) + welcome emails + salon notices

- Version: phase-2
- Goal: Every email the app produces is really sent through the Emergent-managed Resend integration, new newsletter subscribers and new clients get an automatic welcome, and the salon gets an email for each new booking and each contact message.
- Context: `/app/memory/product/overview.md` (F-7…F-10). Builds on phase 1 (Next.js in /app/frontend, MongoDB, outbox `EmailDelivery`, queue `NotificationJob`, worker `lib/jobs/worker.ts`, `dispatchEmailWithAudit` in `lib/email/provider.ts`).
- Provider: Resend via the Emergent-managed integration. The user is never asked for a Resend key. Until the salon verifies its own domain, the sender is whatever the managed integration allows (builder reports the exact From address and any recipient restrictions).

## Functional requirements

### Resend wiring (all places)
- REQ-34 [always] The system shall send every outgoing email through Resend using the Emergent-managed integration.
- REQ-35 [always] The system shall send through Resend each of these emails: NEWSLETTER_VERIFY, NEWSLETTER_WELCOME, APPOINTMENT_REQUEST_PENDING, APPOINTMENT_CONFIRMATION, APPOINTMENT_RESCHEDULED, APPOINTMENT_CANCELLED, APPOINTMENT_REMINDER_24H, APPOINTMENT_REMINDER_2H, CONTACT_ACK, campaign emails and campaign test emails.
- REQ-36 [event] When Resend accepts an email, the system shall record the delivery as ACCEPTED with the Resend message id in the panel outbox.
- REQ-37 [unwanted] If Resend rejects or times out, then the system shall record the delivery as FAILED with the error text.
- REQ-38 [unwanted] If an email send fails, then the system shall still keep the booking, contact message or subscription that triggered it.
- REQ-39 [unwanted] If a queued email job fails, then the system shall retry it up to its max attempts.
- REQ-40 [always] The system shall never send the same email twice for the same dedup key.
- REQ-41 [state] While Resend is configured, the panel email-provider status shall show Resend as active instead of "Pendiente de configurar (Modo Buzón Local Seguro)".
- REQ-42 [always] The system shall keep suppression/unsubscribe rules: marketing emails go only to verified, non-suppressed subscribers, each with a working unsubscribe link.
- REQ-43 [always] The system shall process the job queue automatically every 5 minutes in preview (scheduled cron verified firing).

### Welcome emails
- REQ-44 [event] When a subscriber confirms the newsletter double opt-in, the system shall send the "Te damos la bienvenida a ESPACIO Q" newsletter welcome email once.
- REQ-45 [event] When a client with no previous appointment makes their first booking (online or created in the panel) with an email address, the system shall send a client welcome email (template key CLIENT_WELCOME) once (interpreted).
- REQ-46 [unwanted] If the client already received the client welcome, then the system shall not send it again on later bookings.
- REQ-47 [always] The system shall keep the client welcome free of promotional content because it is sent without marketing consent (interpreted).
- REQ-48 [always] The system shall send the client welcome in addition to the booking request/confirmation email.
- REQ-49 [optional] Where the admin edits the welcome email templates in the panel, the system shall use the edited subject and text (interpreted: same template editing the repo already offers).

### Salon notices
- REQ-50 [always] The system shall provide a "Email de avisos del salón" field in /admin/configuracion (interpreted; falls back to the salon contact email when empty).
- REQ-51 [event] When a new booking is created, the system shall email the salon notice address with service, professional, date/time (Europe/Madrid), status and client name, email and phone.
- REQ-52 [event] When a contact message is received, the system shall email the salon notice address with name, email, phone, subject and message, with Reply-To set to the sender.
- REQ-53 [unwanted] If no salon notice address is configured, then the system shall skip the notice and show a warning in the admin dashboard.

## Quality requirements

```
Q-7  Tag: Email.Reliability
     Scale: % of triggered emails that reach ACCEPTED in the outbox
     Meter: trigger each REQ-35 email type once + welcome + notices, inspect EmailDelivery
     Must: 100 % ACCEPTED (or FAILED with a visible reason, never silently missing)
     Plan: 100 % ACCEPTED
```
```
Q-8  Tag: Email.Duplicates
     Scale: emails with the same dedup key sent more than once
     Meter: repeat triggers + re-run worker 3 times
     Must: 0
     Plan: 0
```
```
Q-9  Tag: Email.Latency
     Scale: seconds from user action to ACCEPTED for immediate emails (contact ack, newsletter verify, salon notices)
     Meter: timestamps in EmailDelivery, 3 trials
     Must: < 60 s for immediate, < 6 min for queued
     Plan: < 10 s immediate
```
```
Q-10 Tag: Email.Look
     Scale: rendering issues in Gmail web / mobile (broken layout, raw HTML, missing Spanish accents)
     Meter: human — open received emails
     Must: 0
     Plan: 0
```
```
Q-11 Tag: Privacy.Marketing
     Scale: marketing emails sent to unconfirmed or suppressed addresses
     Meter: campaign to a segment containing pending + suppressed + verified subscribers
     Must: 0
     Plan: 0
```
