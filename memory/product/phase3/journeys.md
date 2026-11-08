# Phase 3 Journeys — Contact map, "Cómo llegar", editable directions

Phase 1 and 2 journeys stay valid.

- id: JRN-41
  steps: In a fresh browser (no cookie choice), open /contacto, reject non-essential cookies.
  expected: OpenStreetMap map with a marker at Calle de Pelayo 41 and "© OpenStreetMap" attribution; zero network requests to google.com / gstatic.com / googleapis.com.

- id: JRN-42 (interpreted)
  steps: On the OpenStreetMap view click "Ver en Google Maps", then "Aceptar y cargar Google Maps".
  expected: A short consent notice appears first; after accepting, the Google Maps embed of ESPACIO Q replaces the map without reload; the cookie preferences now show "Mapas de terceros (Google Maps)" enabled.

- id: JRN-43
  steps: Reload /contacto after JRN-42.
  expected: Google Maps embed shown directly.

- id: JRN-44
  steps: Open cookie preferences, turn off "Mapas de terceros (Google Maps)", save; view /contacto.
  expected: OpenStreetMap view again; no new Google requests.

- id: JRN-45
  steps: Accept all cookies from the cookie banner on a fresh browser, open /contacto.
  expected: Google Maps embed is shown (category included in "accept all").

- id: JRN-46
  steps: Click "Cómo llegar".
  expected: New tab opens a Google Maps directions URL whose destination is ESPACIO Q, Calle de Pelayo 41, 28004 Madrid; the existing "Abrir en Google Maps" link still works.

- id: JRN-47
  steps: View the block under the map.
  expected: "Cómo llegar" section shows Metro "Chueca (L5), a pocos pasos · Alonso Martínez (L4, L5, L10)" and the Aparcamiento text; Autobús section is hidden (empty).

- id: JRN-48
  steps: As owner in /admin/contenido edit the directions: add an Autobús text, change Metro; save as draft, check /contacto; publish, check again. Restore originals afterwards.
  expected: Draft not visible publicly; after publish the new Metro text and the new Autobús section appear on /contacto; a revision is added.

- id: JRN-49
  steps: Open /contacto on a 375 px wide mobile viewport and on 1440 px desktop.
  expected: Map, button and text fit the screen with no horizontal scroll and no grey/stretched tiles; button reachable by keyboard (Tab) and map has label "Mapa de ubicación de ESPACIO Q".

- id: JRN-50
  steps: Block tile requests (simulate offline map) and open /contacto.
  expected: Address text and "Cómo llegar" button still visible and working.
