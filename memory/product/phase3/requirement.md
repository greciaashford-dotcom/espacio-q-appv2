# Phase 3 Requirement — Contact map, "Cómo llegar" and editable directions

- Version: phase-3
- Goal: On /contacto visitors see where the salon is on a map and get directions in one tap, without any third-party cookie before consent, plus metro/bus/parking text the salon edits from the panel.
- Context: `/app/memory/product/overview.md` (F-11…F-13). Salon location from `ESPACIO_Q_LOCATION_METADATA` / salon settings: Calle de Pelayo, 41, 28004 Madrid (Justicia · Chueca), lat 40.4241269, lng -3.6976262. Existing cookie manager: `components/public/cookie-consent-manager.tsx` (categories analytics, marketing).
- User choice: BOTH maps — OpenStreetMap by default (no cookies), Google Maps embed only after the visitor consents.

## Functional requirements

### Map
- REQ-54 [always] The system shall show a map of the salon location with a marker in the /contacto page.
- REQ-55 [state] While the visitor has not consented to third-party map cookies, the system shall render the map with OpenStreetMap and load no resource from Google domains.
- REQ-56 [always] The system shall add a cookie category "Mapas de terceros (Google Maps)" to the cookie preferences, off by default (interpreted).
- REQ-57 [state] While the visitor has consented to "Mapas de terceros (Google Maps)", the system shall render a Google Maps embed of the salon instead of OpenStreetMap.
- REQ-58 [event] When the visitor clicks "Ver en Google Maps" on the OpenStreetMap view, the system shall show a short consent notice with an "Aceptar y cargar Google Maps" button (interpreted).
- REQ-59 [event] When the visitor clicks "Aceptar y cargar Google Maps", the system shall store that consent and swap to the Google Maps embed without page reload.
- REQ-60 [event] When the visitor withdraws that consent in the cookie preferences, the system shall return to the OpenStreetMap view.
- REQ-61 [always] The system shall show the OpenStreetMap attribution "© OpenStreetMap" on the default map.
- REQ-62 [unwanted] If the map tiles fail to load, then the system shall still show the address text and the "Cómo llegar" button.
- REQ-63 [always] The system shall keep the map keyboard-accessible with an accessible label "Mapa de ubicación de ESPACIO Q".

### Directions
- REQ-64 [always] The system shall show a "Cómo llegar" button next to the map.
- REQ-65 [event] When the visitor clicks "Cómo llegar", the system shall open Google Maps directions to the salon (destination Calle de Pelayo 41, 28004 Madrid) in a new tab.
- REQ-66 [always] The system shall keep the existing "Abrir en Google Maps" link working.

### Editable directions text
- REQ-67 [always] The system shall show a "Cómo llegar" text block under the map with Metro, Autobús and Aparcamiento sections.
- REQ-68 [always] The system shall make the Metro, Autobús and Aparcamiento texts editable in /admin/contenido with the existing draft / publish / revision flow.
- REQ-69 [event] When the admin publishes new directions text, the system shall show it on /contacto.
- REQ-70 [unwanted] If a directions section is empty, then the system shall hide that section.
- REQ-71 [event] When the seed runs, the system shall load suggested defaults: Metro "Chueca (L5), a pocos pasos · Alonso Martínez (L4, L5, L10)"; Autobús empty (hidden until the salon fills it); Aparcamiento "Zona SER y Zona de Bajas Emisiones de Madrid: recomendamos parkings públicos cercanos (p. ej. Calle Hernán Cortés o Fuencarral – Santa Bárbara)" (interpreted).

## Quality requirements

```
Q-12 Tag: Privacy.CookiesBeforeConsent
     Scale: requests to Google domains (google.com, gstatic.com, googleapis.com) on /contacto before consent
     Meter: browser network log, fresh context, 3 loads
     Must: 0
     Plan: 0
```
```
Q-13 Tag: Map.Look
     Scale: visual defects (grey tiles, marker off location, map overflowing on mobile 375 px, stretched)
     Meter: screenshots desktop 1440 px + mobile 375 px
     Must: 0
     Plan: 0
```
```
Q-14 Tag: Map.Speed
     Scale: ms until map visible on /contacto (warm)
     Meter: browser timing, 3 loads
     Must: < 4000 ms (estimate)
     Plan: < 2000 ms
```
```
Q-15 Tag: Map.Accuracy
     Scale: distance between marker and 40.4241269, -3.6976262
     Meter: inspect map center/marker coords
     Must: < 50 m
     Plan: exact
```
