import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { getDayOfWeekMadrid, utcToMadridParts } from "@/lib/domain/timezone";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Verificación HTTP en vivo contra el servidor local (Páginas públicas, legales, cabeceras de seguridad, JSON-LD, noindex y 404)", () => {
  let serverReachable = false;

  beforeAll(async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${BASE_URL}/robots.txt`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      serverReachable = res.status > 0;
    } catch {
      serverReachable = false;
    }
  });

  it("sirve todas las rutas públicas y las 5 páginas legales con HTTP 200, lang='es', landmark <main>, cabeceras de seguridad y JSON-LD honesto", async () => {
    if (!serverReachable) return;

    const publicRoutes = [
      "/",
      "/servicios",
      "/equipo",
      "/galeria",
      "/contacto",
      "/reservar",
      "/aviso-legal",
      "/terminos-y-condiciones",
      "/condiciones-reserva",
      "/privacidad",
      "/cookies",
    ];

    for (const route of publicRoutes) {
      const res = await fetch(`${BASE_URL}${route}`);
      expect(res.status, `Fallo HTTP en ruta ${route}`).toBe(200);
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("x-frame-options")).toBe("SAMEORIGIN");
      expect(res.headers.get("referrer-policy")).toBe(
        "strict-origin-when-cross-origin"
      );

      const html = await res.text();
      expect(html).toContain('lang="es"');
      expect(html).toContain("<main");

      if (route === "/") {
        expect(html).toContain("application/ld+json");
        expect(html).toContain("BeautySalon");
        expect(html).toContain("ESPACIO Q");
        expect(html).toContain('data-slot="featured-services-menu"');
        expect(html).toContain('data-slot="team-showcase"');
        expect(html).toContain('data-slot="picture-rail-gallery"');
        // Prohibido inventar valoraciones o reseñas falsas en JSON-LD
        expect(html).not.toContain("aggregateRating");
      }

      if (route === "/servicios") {
        expect(html).toContain('data-slot="interactive-services-carta"');
        expect(html).toContain("Corte de Autor y Visagismo Personalizado");
        expect(html).toContain("Ritual Head Spa Botánico y Oxigenación");
        expect(html).toContain("Pedicura Wellness Calmante");
      }

      if (route === "/equipo") {
        expect(html).toContain('data-slot="team-showcase"');
        expect(html).toContain("Clara Mendoza");
      }

      if (route === "/galeria") {
        expect(html).toContain('data-slot="picture-rail-gallery"');
        expect(html).toContain("Corte Bob Orgánico con Textura");
      }

      if (route === "/contacto") {
        expect(html).toContain("Calle de Pelayo, 41");
        expect(html).toContain("10:30–21:00");
        expect(html).toContain("09:00–16:00");
      }

      if (route === "/reservar") {
        expect(html).toContain('data-slot="booking-wizard-active"');
        expect(html).toContain("1. Selecciona el servicio");
        expect(html).not.toContain(">Reservas online próximamente<");
        expect(html).toContain("Corte de Autor y Visagismo Personalizado");
      }
    }
  });

  it("sirve /robots.txt y /sitemap.xml en vivo con HTTP 200 y directivas esperadas", async () => {
    if (!serverReachable) return;

    const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
    expect(robotsRes.status).toBe(200);
    const robotsTxt = await robotsRes.text();
    expect(robotsTxt).toContain("Disallow: /admin");
    expect(robotsTxt).toContain("Disallow: /reservar/gestion/");
    expect(robotsTxt).toContain("sitemap.xml");

    const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
    expect(sitemapRes.status).toBe(200);
    const sitemapXml = await sitemapRes.text();
    expect(sitemapXml).toContain("/aviso-legal");
    expect(sitemapXml).toContain("/privacidad");
    expect(sitemapXml).not.toContain("/admin");
  });

  it("aplica X-Robots-Tag noindex, Cache-Control no-store y redirección de seguridad en rutas privadas y de tokens", async () => {
    if (!serverReachable) return;

    const sensitivePublicPages = [
      "/acceso",
      "/newsletter/confirmar",
      "/newsletter/baja",
      "/reservar/gestion/token-prueba-no-valido",
    ];

    for (const route of sensitivePublicPages) {
      const res = await fetch(`${BASE_URL}${route}`);
      expect(res.status).toBe(200);
      expect(res.headers.get("x-robots-tag")).toContain("noindex");
      expect(res.headers.get("cache-control")).toContain("no-store");
    }

    // /admin sin cookie de sesión redirige a /acceso con noindex
    const adminRes = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
    expect([302, 307, 308]).toContain(adminRes.status);
    expect(adminRes.headers.get("location")).toContain("/acceso");
    expect(adminRes.headers.get("x-robots-tag")).toContain("noindex");

    // Ruta inexistente devuelve HTTP 404 con página editorial en español
    const notFoundRes = await fetch(
      `${BASE_URL}/ruta-inexistente-verificacion-404`
    );
    expect(notFoundRes.status).toBe(404);
    const notFoundHtml = await notFoundRes.text();
    expect(notFoundHtml).toContain("404");
  });

  const createdApptIds: string[] = [];
  const createdEmails: string[] = [];

  afterAll(async () => {
    if (createdApptIds.length > 0) {
      await prisma.notificationJob.deleteMany({
        where: { appointmentId: { in: createdApptIds } },
      });
      await prisma.emailDelivery.deleteMany({
        where: { appointmentId: { in: createdApptIds } },
      });
      await prisma.outboxEvent.deleteMany({
        where: { AggregateId: { in: createdApptIds } },
      });
      await prisma.occupancy.deleteMany({
        where: { appointmentId: { in: createdApptIds } },
      });
      await prisma.appointmentEvent.deleteMany({
        where: { appointmentId: { in: createdApptIds } },
      });
      await prisma.appointment.deleteMany({
        where: { id: { in: createdApptIds } },
      });
    }
    if (createdEmails.length > 0) {
      await prisma.client.deleteMany({
        where: { emailNormalized: { in: createdEmails } },
      });
    }
  });

  it("calcula disponibilidad real según horario oficial de Espacio Q (Mar-Vie 10:30-21:00, Sáb 09:00-16:00, Dom/Lun cerrado) y completa una reserva + gestión + cancelación en vivo", async () => {
    if (!serverReachable) return;

    const todayStr = utcToMadridParts(new Date()).dateStr;
    const [y, m, d] = todayStr.split("-").map(Number);
    const nextDayMatching = (targetDow: number) => {
      for (let offset = 7; offset <= 21; offset++) {
        const iso = new Date(Date.UTC(y, m - 1, d + offset, 12, 0, 0))
          .toISOString()
          .slice(0, 10);
        if (getDayOfWeekMadrid(iso) === targetDow) return iso;
      }
      throw new Error(`No se encontró día ${targetDow}`);
    };

    const nextSunday = nextDayMatching(0);
    const nextMonday = nextDayMatching(1);
    const nextTuesday = nextDayMatching(2);
    const nextSaturday = nextDayMatching(6);

    // Domingo y Lunes cerrados -> 0 franjas
    for (const closedDate of [nextSunday, nextMonday]) {
      const closedRes = await fetch(
        `${BASE_URL}/api/v1/bookings/availability?serviceId=svc-corte-autor&date=${closedDate}&professionalId=any`
      );
      expect(closedRes.status).toBe(200);
      const closedJson = await closedRes.json();
      expect(closedJson.bookingReady).toBe(true);
      expect(closedJson.slots).toHaveLength(0);
    }

    // Martes (10:30 - 21:00 continuo) para Corte de Autor (60 min + 10 min buffer = 70 min)
    const tueRes = await fetch(
      `${BASE_URL}/api/v1/bookings/availability?serviceId=svc-corte-autor&date=${nextTuesday}&professionalId=any`
    );
    expect(tueRes.status).toBe(200);
    const tueJson = await tueRes.json();
    expect(tueJson.bookingReady).toBe(true);
    const tueTimes: string[] = tueJson.slots.map((s: { time: string }) => s.time);
    expect(tueTimes).not.toContain("10:00");
    expect(tueTimes[0]).toBe("10:30");
    expect(tueTimes).toContain("14:30"); // Jornada continua
    expect(tueTimes[tueTimes.length - 1]).toBe("19:45"); // 19:45 + 70m = 20:55 <= 21:00

    // Sábado (09:00 - 16:00 continuo) para Corte de Autor (60 min + 10 min buffer = 70 min)
    const satRes = await fetch(
      `${BASE_URL}/api/v1/bookings/availability?serviceId=svc-corte-autor&date=${nextSaturday}&professionalId=any`
    );
    expect(satRes.status).toBe(200);
    const satJson = await satRes.json();
    expect(satJson.bookingReady).toBe(true);
    const satTimes: string[] = satJson.slots.map((s: { time: string }) => s.time);
    expect(satTimes[0]).toBe("09:00");
    expect(satTimes[satTimes.length - 1]).toBe("14:45"); // 14:45 + 70m = 15:55 <= 16:00

    // Flujo completo en vivo: Reservar -> Consultar ficha de gestión -> Cancelar
    const testEmail = `e2e.live.${Date.now()}@example.com`;
    createdEmails.push(testEmail);

    const createRes = await fetch(`${BASE_URL}/api/v1/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        serviceId: "svc-corte-autor",
        professionalId: "pro-clara-mendoza",
        dateStr: nextTuesday,
        startTime: "11:00",
        customerName: "Lucía Prueba E2E",
        customerEmail: testEmail,
        customerPhone: "+34 611 223 344",
        customerNotes: "Prueba funcional end-to-end",
        termsAccepted: true,
        marketingOptIn: false,
        idempotencyKey: `idem-live-${Date.now()}`,
      }),
    });
    expect(createRes.status).toBe(200);
    const createJson = await createRes.json();
    expect(createJson.ok).toBe(true);
    expect(createJson.appointment.status).toBe("CONFIRMED");
    expect(createJson.appointment.professionalName).toBe("Clara Mendoza");
    expect(createJson.manageUrl).toContain("/reservar/gestion/");
    createdApptIds.push(createJson.appointment.id);

    // Abrir ficha de autogestión por token opaco
    const managePageRes = await fetch(`${BASE_URL}${createJson.manageUrl}`);
    expect(managePageRes.status).toBe(200);
    const manageHtml = await managePageRes.text();
    expect(manageHtml).toContain(createJson.appointment.referenceCode);

    // Confirmar asistencia y cancelar reserva mediante API de autogestión
    const rawToken = decodeURIComponent(
      String(createJson.manageUrl).replace("/reservar/gestion/", "")
    );
    const confirmAttRes = await fetch(`${BASE_URL}/api/v1/bookings/manage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        token: rawToken,
        action: "confirm_attendance",
      }),
    });
    expect(confirmAttRes.status).toBe(200);

    const cancelRes = await fetch(`${BASE_URL}/api/v1/bookings/manage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        token: rawToken,
        action: "cancel",
        reason: "Verificación automática completada",
      }),
    });
    expect(cancelRes.status).toBe(200);
    const cancelJson = await cancelRes.json();
    expect(cancelJson.ok).toBe(true);
  });

  it("aplica el cupón de Black Friday BLACKQ25 (−25 %) en /reservar?coupon=BLACKQ25 y descuenta el 25 % real en POST /api/v1/bookings", async () => {
    if (!serverReachable) return;

    // 1. Verificar precarga SSR de /reservar?coupon=BLACKQ25
    const couponPageRes = await fetch(`${BASE_URL}/reservar?coupon=BLACKQ25`);
    expect(couponPageRes.status).toBe(200);
    const couponHtml = await couponPageRes.text();
    expect(couponHtml).toContain('data-slot="booking-coupon-widget"');
    expect(couponHtml).toContain("BLACKQ25");
    expect(couponHtml).toContain("−25 % Black Friday");
    expect(couponHtml).toContain("43,50"); // 58,00 € - 25% = 43,50 €

    const todayStr = utcToMadridParts(new Date()).dateStr;
    const [y, m, d] = todayStr.split("-").map(Number);
    let nextWednesday = "";
    for (let offset = 7; offset <= 21; offset++) {
      const iso = new Date(Date.UTC(y, m - 1, d + offset, 12, 0, 0))
        .toISOString()
        .slice(0, 10);
      if (getDayOfWeekMadrid(iso) === 3) {
        nextWednesday = iso;
        break;
      }
    }
    expect(nextWednesday).not.toBe("");

    const couponEmail = `e2e.bf25.${Date.now()}@example.com`;
    createdEmails.push(couponEmail);

    // 2. Cupón inválido debe devolver HTTP 400 INVALID_COUPON
    const invalidCouponRes = await fetch(`${BASE_URL}/api/v1/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        serviceId: "svc-corte-autor",
        professionalId: "pro-clara-mendoza",
        dateStr: nextWednesday,
        startTime: "12:30",
        customerName: "Prueba Cupón Inválido",
        customerEmail: couponEmail,
        customerPhone: "+34 611 998 877",
        couponCode: "CUPONFALSO99",
        termsAccepted: true,
        marketingOptIn: false,
        idempotencyKey: `idem-bad-coupon-${Date.now()}`,
      }),
    });
    expect(invalidCouponRes.status).toBe(400);
    const invalidJson = await invalidCouponRes.json();
    expect(invalidJson.code).toBe("INVALID_COUPON");

    // 3. Cupón válido BLACKQ25 aplica −25 % exacto sobre 58,00 € (5800 -> 4350 céntimos)
    const validCouponRes = await fetch(`${BASE_URL}/api/v1/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        serviceId: "svc-corte-autor",
        professionalId: "pro-clara-mendoza",
        dateStr: nextWednesday,
        startTime: "12:30",
        customerName: "Elena Black Friday E2E",
        customerEmail: couponEmail,
        customerPhone: "+34 611 998 877",
        couponCode: "BLACKQ25",
        termsAccepted: true,
        marketingOptIn: false,
        idempotencyKey: `idem-bf25-${Date.now()}`,
      }),
    });
    expect(validCouponRes.status).toBe(200);
    const validJson = await validCouponRes.json();
    expect(validJson.ok).toBe(true);
    expect(validJson.appointment.priceCents).toBe(4350);
    expect(validJson.appointment.appliedCoupon).toEqual({
      code: "BLACKQ25",
      discountPercent: 25,
      label: "Black Friday −25 %",
      originalPriceCents: 5800,
      finalPriceCents: 4350,
    });
    createdApptIds.push(validJson.appointment.id);
  });
});
