# Phase 4 Requirement — Scroll-to-top, smaller popups on desktop, SEO + GEO, favicon

- Version: phase-4
- Goal: Every navigation and every booking step lands the visitor at the top, the discount and newsletter popups fit entirely on desktop screens, the site is optimised for Google local search ("peluquería Chueca") and for AI search engines (GEO) on the final domain https://espacioq.es, and the browser tab shows the ESPACIO Q "Q" favicon.
- Context: `/app/memory/product/overview.md` (F-14…F-18). Builds on phases 1–3 (Next.js in /app/frontend, CMS draft/publish, cookie manager, salon settings & schedule).
- User decisions: final domain `espacioq.es`; allow ALL AI crawlers; FAQ on its own page `/preguntas-frecuentes`, editable from the panel; target search "peluquería Chueca"; popups smaller on desktop only (mobile unchanged).
- Favicon source: https://customer-assets-jai6qajn.emergentagent.net/job_espacio-q-app--55y3g2cv/artifacts/7bbb25ccb10a787d_S%C3%ADmbolo%20Q%20minimalista%20en%20gris%20claro.png (thin black "Q" on light grey #F3F3F3, 1254×1254).

## Functional requirements

### Scroll to top
- REQ-72 [event] When a visitor follows any internal link to another page, the system shall show the new page scrolled to the top.
- REQ-73 [event] When a visitor clicks "Continuar" (or any next/back step control) in the booking wizard on /reservar, the system shall scroll to the top of the wizard with the step heading visible below the fixed header.
- REQ-74 [event] When a visitor moves between steps or confirms an action on the booking manage page (/reservar/gestion/[token]), the system shall scroll to the top of that page section.
- REQ-75 [event] When the booking is confirmed, the system shall scroll to the top of the confirmation summary.
- REQ-76 [always] The system shall keep in-page anchor links (services chapter index, "Saltar animación", skip-to-content) scrolling to their target section instead of the page top (interpreted).
- REQ-77 [event] When a visitor uses the browser Back button, the system shall restore the previous page's scroll position (interpreted: native behaviour kept).

### Popups (desktop only)
- REQ-78 [state] While the viewport is ≥ 1024 px wide and ≥ 700 px tall, the system shall display the discount (promo coupon) popup entirely within the viewport without inner scrolling.
- REQ-79 [state] While the viewport is ≥ 1024 px wide and ≥ 700 px tall, the system shall display the newsletter popup entirely within the viewport without inner scrolling.
- REQ-80 [always] The system shall keep both popups' layout unchanged below 768 px width (mobile).
- REQ-81 [always] The system shall keep every popup control (close, consent checkbox, submit, copy code) visible and usable after the size reduction.

### SEO
- REQ-82 [always] The system shall use `https://espacioq.es` as canonical base for canonical tags, sitemap, robots sitemap line, Open Graph URLs and structured data (interpreted: separate setting from APP_URL used in emails).
- REQ-83 [state] While the site is served from a host other than espacioq.es (preview, emergent domains), the system shall send `noindex` for all pages (interpreted: avoids duplicate content).
- REQ-84 [always] The system shall give every public page a unique title and meta description in Spanish.
- REQ-85 [always] The system shall include "Peluquería en Chueca" wording in the home page title and meta description, e.g. "ESPACIO Q · Peluquería y salón de belleza en Chueca, Madrid" (interpreted).
- REQ-86 [always] The system shall output a single H1 per public page.
- REQ-87 [always] The system shall output JSON-LD `HairSalon`/`BeautySalon` LocalBusiness data with name, address, geo coordinates, telephone, opening hours from the published schedule, price range, map URL, area served (Chueca, Justicia, Madrid) and booking URL.
- REQ-88 [always] The system shall output JSON-LD `Service` (with offer price where fixed) and `BreadcrumbList` on each service detail page.
- REQ-89 [always] The system shall output `WebSite` and `Organization` JSON-LD with the ESPACIO Q logo/icon.
- REQ-90 [always] The system shall output Open Graph and Twitter card tags with a 1200×630 share image on every public page.
- REQ-91 [always] The system shall output `hreflang="es-ES"` and geo meta tags (geo.region ES-MD, geo.placename Madrid, geo.position 40.4241269;-3.6976262).
- REQ-92 [always] The system shall list all public pages, active services and /preguntas-frecuentes in the sitemap.
- REQ-93 [always] The system shall keep /admin, /acceso, /api, /reservar/gestion and /newsletter out of the index.
- REQ-94 [always] The system shall give every content image a descriptive Spanish alt text.
- REQ-95 [unwanted] If structured data would need ratings or reviews, then the system shall omit them (no invented ratings).

### GEO (AI search engines)
- REQ-96 [always] The system shall allow in robots.txt all AI crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, CCBot) on public pages.
- REQ-97 [always] The system shall publish `/llms.txt` with the salon facts (name, what it is, address, neighbourhood, how to get there, hours, phone, services with prices, booking URL, FAQ URL) generated from live data.
- REQ-98 [always] The system shall render the main public content (services, prices, address, hours, FAQ) in server HTML readable without JavaScript.

### FAQ page
- REQ-99 [always] The system shall provide a public page `/preguntas-frecuentes` listing questions and answers.
- REQ-100 [always] The system shall make FAQ items (question, answer, order, add, remove) editable in /admin/contenido with the existing draft / publish / revision flow.
- REQ-101 [always] The system shall output `FAQPage` JSON-LD matching the published FAQ items.
- REQ-102 [always] The system shall link /preguntas-frecuentes from the footer.
- REQ-103 [event] When the seed runs, the system shall load default FAQs answerable only from existing real data (location & metro, hours, how to book, change/cancel a booking, parking, services & prices) without inventing facts (interpreted).
- REQ-104 [unwanted] If the FAQ has no published items, then the system shall show an empty-state message instead of a blank page.

### Favicon
- REQ-105 [always] The system shall use the supplied "Q" symbol as favicon, cropped so the Q fills the icon and stays legible at 16 px (interpreted).
- REQ-106 [always] The system shall provide favicon.ico (16/32/48), a 180 px apple-touch-icon, 192/512 px icons and a web manifest.

## Quality requirements

```
Q-16 Tag: Nav.ScrollTop
     Scale: % of page navigations and wizard step changes that end with the page/wizard top visible
     Meter: browser script on desktop 1440 px and mobile 390 px, all footer/header links + every wizard step
     Must: 100 %
     Plan: 100 %
```
```
Q-17 Tag: Popup.Fit
     Scale: popup height vs viewport on 1366×768, 1440×900, 1920×1080
     Meter: browser screenshots + bounding box
     Must: fully visible, no inner scroll on all three
     Plan: ≤ 90 % of viewport height
```
```
Q-18 Tag: SEO.Validity
     Scale: structured data errors in Google Rich Results / schema.org validator
     Meter: JSON-LD parse of home, a service page, contacto, FAQ
     Must: 0 errors
     Plan: 0 errors, 0 warnings on required fields
```
```
Q-19 Tag: SEO.Lighthouse
     Scale: Lighthouse SEO score (mobile) on home and a service page
     Meter: Lighthouse, 3 runs, with noindex rule disabled for measurement
     Must: ≥ 90
     Plan: 100
```
```
Q-20 Tag: Perf.LCP
     Scale: Largest Contentful Paint on home (mobile, preview)
     Meter: Lighthouse, 3 runs
     Must: < 4.0 s (estimate)
     Plan: < 2.5 s
```
```
Q-21 Tag: Favicon.Look
     Scale: favicon legible in a browser tab (16 px) and on iOS home screen
     Meter: human / screenshot
     Must: Q recognisable
     Plan: crisp, centred
```
