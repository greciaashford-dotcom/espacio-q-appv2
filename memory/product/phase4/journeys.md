# Phase 4 Journeys — Scroll-to-top, popups, SEO + GEO, FAQ, favicon

Phase 1–3 journeys stay valid.

- id: JRN-51
  steps: On desktop and mobile, scroll to the bottom of the home page and click each header and footer link to another page (Servicios, Equipo, Galería, Contacto, Reservar, legal pages, Preguntas frecuentes).
  expected: Each destination page opens at the very top (scroll position 0).

- id: JRN-52
  steps: On /reservar pick a service and scroll down; click "Continuar"; repeat on every step until the data form ("Continuar con mis datos") and submit.
  expected: After every step change the wizard's step heading is visible at the top under the header; the confirmation summary appears at the top after booking.

- id: JRN-53
  steps: Open a booking manage link, scroll down, start a reschedule, pick a new slot and confirm; then cancel another booking.
  expected: After each step/confirmation the relevant section heading is visible at the top.

- id: JRN-54 (interpreted)
  steps: On /servicios click a category in the chapter index; on home click "Saltar animación".
  expected: Page scrolls to the chosen section (not to the page top).

- id: JRN-55
  steps: Open the discount popup and the newsletter popup at 1366×768, 1440×900 and 1920×1080.
  expected: Each popup is fully visible with no inner scrollbar; close, consent checkbox, submit and copy-code controls visible and working.

- id: JRN-56
  steps: Open both popups at 390×844 (mobile).
  expected: Same layout and size as before this phase.

- id: JRN-57
  steps: View source of home, /servicios, one service detail, /contacto, /preguntas-frecuentes.
  expected: Unique Spanish title + meta description per page; home title/description contain "Chueca"; one H1 per page; canonical = https://espacioq.es/<path>; og:url, og:image (1200×630) and twitter card present; hreflang es-ES and geo meta tags present.

- id: JRN-58
  steps: Parse JSON-LD on home/contacto, a service page and the FAQ page.
  expected: Valid HairSalon/BeautySalon with address Calle de Pelayo 41, 28004 Madrid, geo 40.4241269/-3.6976262, telephone, opening hours Tue–Fri 10:30–21:00 and Sat 09:00–16:00, areaServed incl. Chueca; Service + BreadcrumbList on service page; FAQPage on FAQ page; WebSite + Organization; no rating/review fields.

- id: JRN-59
  steps: Open /robots.txt and /sitemap.xml.
  expected: robots allows "*" and each listed AI crawler on public pages, disallows /admin, /acceso, /api, /reservar/gestion, /newsletter, and points to https://espacioq.es/sitemap.xml; sitemap URLs use https://espacioq.es and include all public pages, active services and /preguntas-frecuentes.

- id: JRN-60 (interpreted)
  steps: Fetch any public page from the preview host.
  expected: `noindex` robots meta/header present on the preview host (would be absent on espacioq.es).

- id: JRN-61
  steps: Open /llms.txt.
  expected: Plain-text/markdown with salon name, description, address & neighbourhood, how to get there, hours, phone, services with prices, booking URL and FAQ URL, matching live data.

- id: JRN-62
  steps: Fetch home, /servicios and /preguntas-frecuentes with JavaScript disabled (raw HTML).
  expected: Services, prices, address, hours and FAQ answers are present in the HTML.

- id: JRN-63
  steps: Open /preguntas-frecuentes; open the footer link to it.
  expected: Seeded questions about location/metro, hours, how to book, change/cancel, parking and services/prices with answers consistent with salon data; footer link works.

- id: JRN-64
  steps: As owner in /admin/contenido edit the FAQ: add a question, edit one, reorder, remove one; save draft, check public page; publish, check again. Restore afterwards.
  expected: Draft not public; after publish the page and its FAQPage JSON-LD reflect the changes; a revision is added.

- id: JRN-65
  steps: Unpublish/remove all FAQ items (test only), open /preguntas-frecuentes. Restore afterwards.
  expected: An empty-state message is shown, no blank page, no FAQPage JSON-LD.

- id: JRN-66
  steps: Open the site in a browser tab; request /favicon.ico, /apple-touch-icon.png (or declared path), /manifest.webmanifest.
  expected: Tab shows the ESPACIO Q "Q" icon; all icon files return 200 with correct sizes (16/32/48, 180, 192, 512); manifest lists them.

- id: JRN-67 (human)
  steps: Look at the tab icon and add the site to an iPhone home screen.
  expected: The Q is recognisable and centred.
