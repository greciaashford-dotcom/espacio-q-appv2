import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  ensureBaseCmsAndSettings,
  getPublishedCmsBlock,
  saveCmsDraft,
} from "@/lib/domain/cms";
import { interpolateLegalPlaceholders } from "@/lib/utils";
import {
  canAccessProfessionalAgenda,
  canExportCrm,
  canManageCampaigns,
  canManageCatalogOrCms,
  canManageSettingsOrUsers,
  type AuthenticatedUser,
} from "@/lib/auth/session";
import type { LegalDocumentData } from "@/lib/domain/cms-defaults";
import { validateCmsPayload } from "@/lib/validation/cms";
import {
  normalizeEquipoPageData,
  normalizeGaleriaPageData,
  normalizeHomeSectionsData,
} from "@/lib/domain/cms";

describe("Edición CMS + páginas legales versionadas y matriz de permisos RBAC", () => {
  it("publica cambios en un documento legal creando revisión histórica y restaura el original", async () => {
    await ensureBaseCmsAndSettings();

    const original = await getPublishedCmsBlock<LegalDocumentData>("legal_cookies");
    const initialVersion = original.version;

    const modifiedIntro = "Introducción actualizada desde test automatizado de CMS legal.";
    await saveCmsDraft({
      key: "legal_cookies",
      draftData: {
        ...original.data,
        intro: modifiedIntro,
      },
      publishImmediately: true,
      actorName: "Test Runner",
      changeNote: "Test publicación legal",
    });

    const afterPublish = await getPublishedCmsBlock<LegalDocumentData>("legal_cookies");
    expect(afterPublish.data.intro).toBe(modifiedIntro);
    expect(afterPublish.version).toBe(initialVersion + 1);

    const revision = await prisma.contentRevision.findFirst({
      where: {
        pageContent: { key: "legal_cookies" },
        version: initialVersion + 1,
      },
    });
    expect(revision).not.toBeNull();

    // Restaurar contenido original y limpiar revisiones del test
    await prisma.pageContent.update({
      where: { key: "legal_cookies" },
      data: {
        draftData: original.data as any,
        publishedData: original.data as any,
        hasUnpublished: false,
        version: initialVersion,
      },
    });
    if (revision) {
      await prisma.contentRevision.delete({ where: { id: revision.id } });
    }
  });

  it("interpola marcadores honestos cuando faltan datos fiscales y valores reales cuando se configuran", () => {
    const template = "Titular: {{legalOwnerName}} · NIF: {{legalTaxId}}";

    const pendingOutput = interpolateLegalPlaceholders(template, {
      legalOwnerName: null,
      legalTaxId: null,
    });
    expect(pendingOutput).toContain("Dato pendiente de configurar");

    const filledOutput = interpolateLegalPlaceholders(template, {
      legalOwnerName: "Espacio Q Belleza S.L.",
      legalTaxId: "B00000000",
    });
    expect(filledOutput).toBe("Titular: Espacio Q Belleza S.L. · NIF: B00000000");
  });

  it("impide que un perfil PROFESSIONAL acceda a agendas ajenas, exportación CRM o configuración", () => {
    const proA: AuthenticatedUser = {
      id: "user-pro-a",
      email: "proa@espacioq.es",
      name: "Profesional A",
      role: "PROFESSIONAL",
      professionalId: "pro-id-a",
      canExportData: false,
      canManageMarketing: false,
    };

    expect(canAccessProfessionalAgenda(proA, "pro-id-a")).toBe(true);
    expect(canAccessProfessionalAgenda(proA, "pro-id-b")).toBe(false);
    expect(canManageCatalogOrCms(proA)).toBe(false);
    expect(canManageSettingsOrUsers(proA)).toBe(false);
    expect(canExportCrm(proA)).toBe(false);
    expect(canManageCampaigns(proA)).toBe(false);

    const receptionBasic: AuthenticatedUser = {
      id: "user-rec-1",
      email: "recepcion@espacioq.es",
      name: "Recepción",
      role: "RECEPTION",
      professionalId: null,
      canExportData: false,
      canManageMarketing: false,
    };
    expect(canAccessProfessionalAgenda(receptionBasic, "pro-id-b")).toBe(true);
    expect(canManageCatalogOrCms(receptionBasic)).toBe(true);
    expect(canManageSettingsOrUsers(receptionBasic)).toBe(false);
    expect(canExportCrm(receptionBasic)).toBe(false);
    expect(canManageCampaigns(receptionBasic)).toBe(false);

    const receptionWithPerms: AuthenticatedUser = {
      ...receptionBasic,
      canExportData: true,
      canManageMarketing: true,
    };
    expect(canExportCrm(receptionWithPerms)).toBe(true);
    expect(canManageCampaigns(receptionWithPerms)).toBe(true);
  });

  it("permite cambiar las imágenes de FlipGallery en home_sections con enlaces externos HTTPS desde cualquier dominio válido y bloquea esquemas inseguros", () => {
    const migrated = normalizeHomeSectionsData<Record<string, any>>({
      intro: {
        visible: true,
        title: "La calma como punto de partida",
        imageUrl:
          "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1000&q=80",
        imageAlt: "Interior sereno en tonos lino y piedra clara",
      },
    });

    expect(Array.isArray(migrated.intro.flipImages)).toBe(true);
    expect(migrated.intro.flipImages.length).toBeGreaterThanOrEqual(5);
    expect(migrated.intro.flipImages[0].url).toContain(
      "photo-1633681926022-84c23e8cb2d6"
    );

    // Enlaces externos HTTPS de distintos dominios (ej. 21st.dev, Pexels, Cloudinary, CDN propio) se aceptan en el dashboard
    const validExternalPayload = {
      intro: {
        visible: true,
        title: "La calma como punto de partida",
        flipImages: [
          {
            title: "Salón principal",
            url: "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg",
          },
          {
            title: "Tocadores",
            url: "https://cdn.21st.dev/assets/mirror/40/403296ddc532b5321cef6defb947a416ccf1f4c30d0ceb58eac16b6f32f01a13.jpg",
          },
          {
            title: "Biblioteca local",
            url: "/media/foto-salon.jpg",
          },
        ],
      },
    };
    expect(validateCmsPayload(validExternalPayload)).toHaveLength(0);

    // Esquemas inseguros o IPs internas se rechazan
    const invalidHttpPayload = {
      intro: {
        flipImages: [
          { title: "Insegura HTTP", url: "http://ejemplo.com/salon.jpg" },
        ],
      },
    };
    expect(validateCmsPayload(invalidHttpPayload).length).toBeGreaterThan(0);

    const invalidPrivateIpPayload = {
      intro: {
        flipImages: [
          { title: "SSRF local", url: "https://127.0.0.1/internal.jpg" },
        ],
      },
    };
    expect(validateCmsPayload(invalidPrivateIpPayload).length).toBeGreaterThan(0);
  });

  it("permite editar los peinados, cortes y enlaces externos HTTPS de PictureRailGallery desde home_sections y page_galeria", () => {
    const normalizedHome = normalizeHomeSectionsData<Record<string, any>>({
      gallerySection: { visible: true, title: "Mirada estética" },
    });
    expect(Array.isArray(normalizedHome.gallerySection.railItems)).toBe(true);
    expect(normalizedHome.gallerySection.railItems.length).toBeGreaterThanOrEqual(6);
    expect(normalizedHome.gallerySection.railItems[0].description.length).toBeGreaterThan(20);

    const normalizedGaleria = normalizeGaleriaPageData<Record<string, any>>({
      eyebrow: "UNIVERSO VISUAL",
      title: "Galería",
    });
    expect(Array.isArray(normalizedGaleria.railItems)).toBe(true);
    expect(normalizedGaleria.railItems.length).toBeGreaterThanOrEqual(6);

    const customGalleryCms = {
      gallerySection: {
        visible: true,
        eyebrow: "TRABAJOS REALES",
        title: "Cortes y peinados a medida",
        railItems: [
          {
            id: "look-custom-1",
            title: "Corte Pixie Texturizado",
            technique: "Tijera y navaja suave",
            categoryTag: "Corte corto",
            description:
              "Corte pixie con nuca despejada y volumen superior ligero trabajado mecha a mecha para adaptarse al remolino natural.",
            url: "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg",
            frame: "oak",
            aspect: 0.8,
            mat: true,
            details: ["Secado rápido con los dedos", "Cera mate ligera"],
          },
        ],
      },
    };
    expect(validateCmsPayload(customGalleryCms)).toHaveLength(0);

    const normalizedEquipo = normalizeEquipoPageData<Record<string, any>>({
      eyebrow: "PROFESIONALES",
      title: "El equipo detrás de ESPACIO Q",
    });
    expect(Array.isArray(normalizedEquipo.showcaseMembers)).toBe(true);
    expect(normalizedEquipo.showcaseMembers).toHaveLength(6);

    const customTeamCms = {
      teamSection: {
        visible: true,
        showcaseMembers: [
          {
            id: "eq-custom-1",
            name: "Lucía Serrano",
            role: "ESTILISTA SENIOR",
            specialty: "Corte orgánico y coloración luminosa.",
            url: "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg",
            instagramHref: "https://instagram.com/espacioq",
            linkedinHref: "",
          },
        ],
      },
    };
    expect(validateCmsPayload(customTeamCms)).toHaveLength(0);
  });
});
