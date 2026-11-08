import fs from "node:fs";
import path from "node:path";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
}));

import { PerspectiveTunnelHero } from "@/components/ui/perspective-tunnel-hero";
import FlipGallery, {
  DEFAULT_FLIP_AUTOPLAY_MS,
  DEFAULT_SALON_FLIP_IMAGES,
} from "@/components/ui/flip-gallery";
import ExperienceSteps, {
  DEFAULT_EXPERIENCE_STEP_DURATION_MS,
} from "@/components/ui/experience-steps";
import PictureRailGallery, {
  DEFAULT_SALON_RAIL_ITEMS,
} from "@/components/ui/picture-rail-gallery";
import TeamShowcase, {
  DEFAULT_SALON_TEAM_MEMBERS,
} from "@/components/ui/team-showcase";
import { ServicesCatalogClient } from "@/components/public/services-catalog-client";
import { FeaturedServicesMenu } from "@/components/public/featured-services-menu";
import {
  DEFAULT_SERVICE_CATEGORIES,
  DEFAULT_SERVICES_CATALOG,
  RITUAL_NEED_OPTIONS,
} from "@/lib/domain/default-services-catalog";
import {
  NewsletterInlineForm,
  type NewsletterConfigData,
} from "@/components/ui/newsletter-dialog";
import {
  DEFAULT_CMS_PAGES,
  DEFAULT_GALLERY_RAIL_ITEMS,
  DEFAULT_INTRO_FLIP_IMAGES,
  DEFAULT_MEDIA_ASSETS,
  DEFAULT_TEAM_SHOWCASE_MEMBERS,
  type SalonHeroContent,
} from "@/lib/domain/cms-defaults";
import {
  BLACK_FRIDAY_PROMO,
  calculateDiscountedCents,
  validatePromoCoupon,
} from "@/lib/domain/promo-coupon";
import { PromoCouponPopup } from "@/components/public/promo-coupon-popup";
import {
  CookieConsentManager,
  type CookieBannerContent,
} from "@/components/public/cookie-consent-manager";

describe("Identidad visual Zen Linen, Hero 3D accesible y Newsletter UI honesta", () => {
  it("define los tokens exactos Zen Linen (:root y .dark) y Tailwind los consume directamente con var(--...)", () => {
    const globalsCss = fs.readFileSync(
      path.resolve(process.cwd(), "app/globals.css"),
      "utf8"
    );
    const tailwindConfig = fs.readFileSync(
      path.resolve(process.cwd(), "tailwind.config.ts"),
      "utf8"
    );

    const requiredLightTokens = [
      "--background: #E9E4D8;",
      "--foreground: #1E1E1E;",
      "--card: #F4EFE4;",
      "--popover: #F4EFE4;",
      "--primary: #2E2E2E;",
      "--primary-foreground: #E6E4D7;",
      "--secondary: #D8D2C4;",
      "--accent: #E6E4D7;",
      "--muted: #CFC8B8;",
      "--muted-foreground: #5E5A52;",
      "--border: #D2CBBB;",
      "--destructive: #DC2626;",
      "--chart-1: #F26A4B;",
      "--chart-2: #1E1E1E;",
      "--chart-3: #5E5A52;",
      "--chart-4: #A89F8F;",
      "--chart-5: #CFC8B8;",
    ];

    for (const token of requiredLightTokens) {
      expect(globalsCss).toContain(token);
    }

    expect(globalsCss).toContain(".dark");
    expect(globalsCss).toContain("--background: #141414;");
    expect(globalsCss).toContain("--card: #1C1C1C;");
    expect(globalsCss).toContain("--primary: #D1CFC0;");

    // Tailwind no debe envolver tokens HEX en hsl(var(--...)) que rompería los colores
    expect(tailwindConfig).not.toContain("hsl(var(--");
    expect(tailwindConfig).toContain("var(--background)");
    expect(tailwindConfig).toContain("var(--primary)");
    expect(tailwindConfig).toContain("--font-cormorant");
    expect(tailwindConfig).toContain("--font-manrope");
  });

  it("renderiza PerspectiveTunnelHero con H1, CTAs clicables y salida accesible por teclado desde el primer render (3D y modo reducido)", () => {
    const sampleHero: SalonHeroContent = {
      eyebrow: "ESPACIO Q · MADRID",
      title: "Belleza serena y oficio contemporáneo",
      description:
        "Cuidado capilar personalizado en un espacio pensado para la calma.",
      primaryCta: { label: "Reservar cita", href: "/reservar" },
      secondaryCta: { label: "Explorar servicios", href: "/servicios" },
      discoverLabel: "Descubrir el salón",
      animationEnabled: true,
      photos: DEFAULT_MEDIA_ASSETS.slice(0, 4).map((m, idx) => ({
        id: m.id,
        assetId: m.id,
        src: m.src,
        alt: m.altText,
        focalPoint: { x: m.focalPointX, y: m.focalPointY },
        order: idx + 1,
      })),
    };

    // 1. Modo túnel 3D activo
    const html3d = ReactDOMServer.renderToStaticMarkup(
      React.createElement(PerspectiveTunnelHero, {
        content: sampleHero,
        nextSectionId: "intro-salon",
      })
    );

    expect(html3d).toContain("<h1");
    expect(html3d).toContain("Belleza serena y oficio contemporáneo");
    expect(html3d).toContain('href="/reservar"');
    expect(html3d).toContain("Reservar cita");
    expect(html3d).toContain('href="/servicios"');
    expect(html3d).toContain('href="#intro-salon"');
    expect(html3d).toContain("preserve-3d");

    // 2. Modo accesible / movimiento reducido (animationEnabled: false)
    const htmlStatic = ReactDOMServer.renderToStaticMarkup(
      React.createElement(PerspectiveTunnelHero, {
        content: { ...sampleHero, animationEnabled: false },
        nextSectionId: "intro-salon",
      })
    );

    expect(htmlStatic).toContain("<h1");
    expect(htmlStatic).toContain("Belleza serena y oficio contemporáneo");
    expect(htmlStatic).toContain('href="/reservar"');
    expect(htmlStatic).toContain('href="#intro-salon"');
    expect(htmlStatic).toContain(DEFAULT_MEDIA_ASSETS[0].altText);
    expect(htmlStatic).not.toContain("preserve-3d");
  });

  it("mantiene la Newsletter sin descuentos falsos (sin 10% inventado), en apertura manual por defecto y con consentimiento desmarcado", () => {
    const newsletterCms = DEFAULT_CMS_PAGES.find(
      (p) => p.key === "newsletter_config"
    );
    expect(newsletterCms).toBeDefined();

    const config = newsletterCms!.data as NewsletterConfigData;
    expect(config.openMode).toBe("manual");
    expect(config.promoText).toBe("");

    const serializedNewsletter = JSON.stringify(config).toLowerCase();
    expect(serializedNewsletter).not.toContain("10%");
    expect(serializedNewsletter).not.toContain("descuento");

    const formHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(NewsletterInlineForm, { config })
    );

    expect(formHtml).toContain('type="email"');
    expect(formHtml).toContain('type="checkbox"');
    // La casilla de consentimiento RGPD nunca puede renderizarse premarcada
    expect(formHtml).not.toContain('checked=""');
    expect(formHtml).not.toContain("checked=");
    expect(formHtml).toContain('href="/privacidad"');
  });

  it("renderiza FlipGallery responsivo en la 2.ª sección incluyendo la imagen original del salón más varias fotografías adicionales", () => {
    const replacedImage =
      "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1000&q=80";

    expect(DEFAULT_SALON_FLIP_IMAGES.length).toBeGreaterThanOrEqual(5);
    expect(DEFAULT_SALON_FLIP_IMAGES[0].url).toBe(replacedImage);
    expect(DEFAULT_INTRO_FLIP_IMAGES[0].url).toBe(replacedImage);

    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(FlipGallery, { images: DEFAULT_INTRO_FLIP_IMAGES })
    );

    expect(DEFAULT_FLIP_AUTOPLAY_MS).toBe(3000);
    expect(html).toContain('data-autoplay="true"');
    expect(html).toContain('data-autoplay-interval="3000"');
    expect(html).toContain("photo-1633681926022-84c23e8cb2d6");
    expect(html).toContain("overlay-top");
    expect(html).toContain("overlay-bottom");
    expect(html).toContain("Imagen anterior");
    expect(html).toContain("Siguiente imagen");
    expect(html).toContain("01 / 06");
    expect(html).toContain("aspect-[4/5]");
    expect(html).toContain("touch-pan-y");
    expect(html).toContain("max-w-[280px]");
    expect(html).toContain("min-[360px]:max-w-[330px]");
    expect(html).toContain("orientation: landscape");
    expect(html).toContain("Ir a imagen 1");
    expect(html).toContain("h-11 w-11");
  });

  it("garantiza adaptabilidad multidispositivo global: viewport con safe-area, unidades dinámicas dvh/svh e inputs a 16px en móvil contra auto-zoom en iOS", () => {
    const layoutSource = fs.readFileSync(
      path.resolve(process.cwd(), "app/layout.tsx"),
      "utf8"
    );
    const inputSource = fs.readFileSync(
      path.resolve(process.cwd(), "components/ui/input.tsx"),
      "utf8"
    );
    const textareaSource = fs.readFileSync(
      path.resolve(process.cwd(), "components/ui/textarea.tsx"),
      "utf8"
    );
    const heroSource = fs.readFileSync(
      path.resolve(process.cwd(), "components/ui/perspective-tunnel-hero.tsx"),
      "utf8"
    );

    expect(layoutSource).toContain("export const viewport: Viewport");
    expect(layoutSource).toContain('viewportFit: "cover"');
    expect(layoutSource).toContain("min-h-[100dvh]");
    expect(inputSource).toContain("text-base");
    expect(inputSource).toContain("sm:text-sm");
    expect(textareaSource).toContain("text-base");
    expect(textareaSource).toContain("sm:text-sm");
    expect(heroSource).toContain("h-[100svh]");
  });

  it("renderiza la 4.ª sección (ExperienceSteps) con pasos de atención interactivos, animados, accesibles por teclado y sincronizados con imagen", () => {
    const homeSections = DEFAULT_CMS_PAGES.find(
      (p) => p.key === "home_sections"
    )!.data as Record<string, any>;
    const exp = homeSections.experience;

    expect(DEFAULT_EXPERIENCE_STEP_DURATION_MS).toBeGreaterThanOrEqual(3000);

    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(ExperienceSteps, {
        eyebrow: exp.eyebrow,
        title: exp.title,
        description: exp.description,
        fallbackImageUrl: exp.imageUrl,
        pillars: exp.pillars,
      })
    );

    expect(html).toContain('aria-current="step"');
    expect(html).toContain("Pasos del ritual de atención");
    expect(html).toContain("Diagnóstico previo");
    expect(html).toContain("Agenda sin prisas");
    expect(html).toContain("Seguimiento honesto");
    expect(html).toContain("Escucha y valoración");
    expect(html).toContain("Pausar recorrido automático de pasos");
    expect(html).toContain("Siguiente paso de atención");
  });

  it("renderiza PictureRailGallery adaptado a peluquería sin precios ni venta, mostrando la descripción del peinado o corte realizado y usando variables Zen Linen", () => {
    const componentSource = fs.readFileSync(
      path.resolve(process.cwd(), "components/ui/picture-rail-gallery.tsx"),
      "utf8"
    );

    // Debe usar los tokens reales del proyecto (--card, --foreground, --muted) y nunca --color-*
    expect(componentSource).toContain("var(--card)");
    expect(componentSource).toContain("var(--foreground)");
    expect(componentSource).toContain("var(--muted)");
    expect(componentSource).not.toContain("var(--color-");

    // Prohibido cualquier rastro de tienda de láminas, precios o ediciones de venta
    const serializedDefaults = JSON.stringify({
      DEFAULT_SALON_RAIL_ITEMS,
      DEFAULT_GALLERY_RAIL_ITEMS,
    });
    expect(serializedDefaults).not.toContain("$");
    expect(serializedDefaults).not.toContain("€");
    expect(serializedDefaults.toLowerCase()).not.toContain("edition");
    expect(serializedDefaults.toLowerCase()).not.toContain("print shop");
    expect(serializedDefaults.toLowerCase()).not.toContain("signed on the back");

    const htmlActive = ReactDOMServer.renderToStaticMarkup(
      React.createElement(PictureRailGallery, {
        items: DEFAULT_GALLERY_RAIL_ITEMS,
        eyebrow: "TRABAJOS Y ESTILISMO",
        heading: "Cortes, peinados y mirada estética",
        active: 0,
      })
    );

    expect(htmlActive).toContain('data-slot="picture-rail-gallery"');
    expect(htmlActive).toContain("Cortes, peinados y mirada estética");
    expect(htmlActive).toContain("Corte Bob Orgánico con Textura");
    expect(htmlActive).toContain("Corte en seco y desfilado interno");
    expect(htmlActive).toContain(
      "Línea bob a la altura de la mandíbula trabajada en seco"
    );
    expect(htmlActive).toContain("Ampliar y ver ficha del trabajo");
  });

  it("renderiza TeamShowcase con los perfiles provisionales de ESPACIO Q, mosaico escalonado en 3 columnas e iconos accesibles", () => {
    expect(DEFAULT_SALON_TEAM_MEMBERS).toHaveLength(6);
    expect(DEFAULT_TEAM_SHOWCASE_MEMBERS).toHaveLength(6);

    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(TeamShowcase, {
        members: DEFAULT_TEAM_SHOWCASE_MEMBERS,
      })
    );

    expect(html).toContain('data-slot="team-showcase"');
    expect(html).toContain("Integrantes del equipo de ESPACIO Q");
    expect(html).toContain("Clara Mendoza");
    expect(html).toContain("Mateo Valdés");
    expect(html).toContain("Sofía Alarcón");
    expect(html).toContain("Lucas Ferrer");
    expect(html).toContain("Valeria Soto");
    expect(html).toContain("Elena Quiroga");
    expect(html).toContain("DIRECCIÓN ARTÍSTICA · CORTE Y FORMA");
    expect(html).toContain("grid-cols-3");
  });

  it("renderiza la Carta Interactiva de Servicios (6 capítulos · 24 rituales) con brújula de necesidades, progreso de lectura, ficha sensorial y menú en Home", () => {
    expect(DEFAULT_SERVICE_CATEGORIES).toHaveLength(6);
    expect(DEFAULT_SERVICES_CATALOG).toHaveLength(24);
    expect(RITUAL_NEED_OPTIONS).toHaveLength(6);

    for (const svc of DEFAULT_SERVICES_CATALOG) {
      expect(["FIXED", "FROM", "CONSULT"]).toContain(svc.priceType);
      expect(svc.ritualIncludes.length).toBeGreaterThanOrEqual(3);
    }

    const categories = DEFAULT_SERVICE_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
    }));

    const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

    const services = DEFAULT_SERVICES_CATALOG.map((s) => ({
      id: s.id,
      categoryId: catBySlug[s.categorySlug].id,
      categoryName: catBySlug[s.categorySlug].name,
      categorySlug: s.categorySlug,
      name: s.name,
      slug: s.slug,
      shortDescription: s.shortDescription,
      description: s.description,
      durationMin: s.durationMin,
      priceType: s.priceType,
      priceCents: s.priceCents,
      currency: "EUR",
      featured: s.featured,
    }));

    const cartaHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(ServicesCatalogClient, {
        categories,
        services,
        pageCms: {},
      })
    );

    expect(cartaHtml).toContain('data-slot="interactive-services-carta"');
    expect(cartaHtml).toContain("¿Qué necesita hoy tu cabello o tu piel?");
    expect(cartaHtml).toContain("1 de 6 capítulos explorados");
    expect(cartaHtml).toContain("Capítulo I");
    expect(cartaHtml).toContain("Capítulo VI");
    expect(cartaHtml).toContain("Corte de Autor y Visagismo Personalizado");
    expect(cartaHtml).toContain("Ritual Head Spa Botánico y Oxigenación");
    expect(cartaHtml).toContain("Pedicura Wellness Calmante");
    expect(cartaHtml).toContain("Qué incluye tu momento");
    expect(cartaHtml).toContain("Continuar con");

    const homeMenuHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(FeaturedServicesMenu, {
        categories,
        services,
      })
    );

    expect(homeMenuHtml).toContain('data-slot="featured-services-menu"');
    expect(homeMenuHtml).toContain("Imprescindibles");
    expect(homeMenuHtml).toContain("Abrir carta completa");
  });

  it("configura y renderiza el popup Black Friday (−25 %, 4 segundos) y calcula descuentos exactos para la reserva", () => {
    expect(BLACK_FRIDAY_PROMO.enabled).toBe(true);
    expect(BLACK_FRIDAY_PROMO.delayMs).toBe(4000);
    expect(BLACK_FRIDAY_PROMO.discountPercent).toBe(25);
    expect(BLACK_FRIDAY_PROMO.code).toBe("BLACKQ25");

    const okValidation = validatePromoCoupon(" blackq25 ");
    expect(okValidation.valid).toBe(true);
    if (okValidation.valid) {
      expect(okValidation.code).toBe("BLACKQ25");
      expect(okValidation.discountPercent).toBe(25);
    }

    const badValidation = validatePromoCoupon("NOEXISTE10");
    expect(badValidation.valid).toBe(false);

    // 58,00 € (5800 céntimos) con 25 % dto -> 43,50 € (4350 céntimos)
    expect(calculateDiscountedCents(5800, 25)).toBe(4350);
    expect(calculateDiscountedCents(null, 25)).toBeNull();

    const popupHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(PromoCouponPopup, { forceOpenForTest: true })
    );

    expect(popupHtml).toContain('data-slot="black-friday-promo-popup"');
    expect(popupHtml).toContain('role="dialog"');
    expect(popupHtml).toContain("−25%");
    expect(popupHtml).toContain("BLACKQ25");
    expect(popupHtml).toContain("Copiar cupón");
    expect(popupHtml).toContain("Aplicar 25 % y reservar cita");
    expect(popupHtml).toContain("max-h-[92dvh]");
  });

  it("renderiza el aviso compacto de cookies conforme a normativa europea RGPD / AEPD sin tapar toda la web", () => {
    const cookieCms = DEFAULT_CMS_PAGES.find(
      (p) => p.key === "cookie_banner"
    )!.data as CookieBannerContent;

    const bannerHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(CookieConsentManager, {
        content: cookieCms,
        forceBannerForTest: true,
      })
    );

    expect(bannerHtml).toContain('data-slot="compact-eu-cookie-banner"');
    expect(bannerHtml).toContain("RGPD UE");
    expect(bannerHtml).toContain('href="/cookies"');
    expect(bannerHtml).toContain("Política de Cookies");
    // Formato flotante compacto en esquina (nunca ocupa todo el ancho en pantallas >= sm)
    expect(bannerHtml).toContain("max-w-[360px]");
    expect(bannerHtml).toContain("sm:w-[360px]");
    // Primera capa con Configurar, Rechazar y Aceptar al mismo nivel e idéntica prominencia
    expect(bannerHtml).toContain("Configurar");
    expect(bannerHtml).toContain("Rechazar");
    expect(bannerHtml).toContain("Aceptar");
  });
});
