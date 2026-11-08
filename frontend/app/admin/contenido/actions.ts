"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, canManageCatalogOrCms } from "@/lib/auth/session";
import { saveCmsDraft } from "@/lib/domain/cms";
import { validateCmsPayload } from "@/lib/validation/cms";
import { slugify } from "@/lib/utils";

export type CmsActionResult = { ok: boolean; error?: string; errors?: string[]; version?: number };

async function requireCmsUser() {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesión caducada. Vuelve a iniciar sesión." } as const;
  if (!canManageCatalogOrCms(user)) return { error: "No tienes permiso para editar contenido." } as const;
  return { user } as const;
}

function normalizeLegalSections(data: Record<string, any>) {
  if (!Array.isArray(data.sections)) return data;
  const seen = new Set<string>();
  data.sections = data.sections.map((s: any, i: number) => {
    let id = slugify(String(s?.id || s?.heading || `seccion-${i + 1}`)) || `seccion-${i + 1}`;
    while (seen.has(id)) id = `${id}-${i + 1}`;
    seen.add(id);
    return { id, heading: String(s?.heading || ""), content: String(s?.content || "") };
  });
  return data;
}

function revalidatePublic(slug: string | null) {
  revalidatePath("/", "layout");
  if (slug) revalidatePath(slug);
}

export async function saveCmsBlockAction(input: {
  key: string;
  data: Record<string, any>;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publish: boolean;
  changeNote?: string;
}): Promise<CmsActionResult> {
  const auth = await requireCmsUser();
  if ("error" in auth) return { ok: false, error: auth.error };

  const page = await prisma.pageContent.findUnique({ where: { key: input.key } });
  if (!page) return { ok: false, error: "Bloque de contenido no encontrado." };

  let data = structuredClone(input.data);
  if (page.category === "LEGAL") data = normalizeLegalSections(data);

  const errors = validateCmsPayload(data);
  if ((input.seoTitle?.length ?? 0) > 160) errors.push("El título SEO no debe superar 160 caracteres.");
  if ((input.seoDescription?.length ?? 0) > 320) errors.push("La descripción SEO no debe superar 320 caracteres.");
  if (errors.length > 0) return { ok: false, error: "Revisa los campos marcados.", errors };

  const updated = await saveCmsDraft({
    key: input.key,
    draftData: data,
    seoTitle: input.seoTitle?.trim() || null,
    seoDescription: input.seoDescription?.trim() || null,
    publishImmediately: input.publish,
    actorName: auth.user.name,
    changeNote: input.changeNote?.slice(0, 300),
  });

  await prisma.auditEvent.create({
    data: {
      actorUserId: auth.user.id,
      action: input.publish ? "CMS_PUBLISH" : "CMS_SAVE_DRAFT",
      entityType: "PageContent",
      entityId: page.id,
      summary: `${input.publish ? "Publicado" : "Borrador guardado"}: ${page.title} (v${updated.version})`,
    },
  });

  if (input.publish) revalidatePublic(page.slug);
  revalidatePath(`/admin/contenido/${input.key}`);
  return { ok: true, version: updated.version };
}

export async function discardDraftAction(key: string): Promise<CmsActionResult> {
  const auth = await requireCmsUser();
  if ("error" in auth) return { ok: false, error: auth.error };
  const page = await prisma.pageContent.findUnique({ where: { key } });
  if (!page) return { ok: false, error: "Bloque no encontrado." };
  await prisma.pageContent.update({
    where: { key },
    data: { draftData: page.publishedData as any, hasUnpublished: false },
  });
  revalidatePath(`/admin/contenido/${key}`);
  return { ok: true };
}

export async function restoreRevisionAction(key: string, revisionId: string): Promise<CmsActionResult> {
  const auth = await requireCmsUser();
  if ("error" in auth) return { ok: false, error: auth.error };
  const page = await prisma.pageContent.findUnique({ where: { key } });
  const rev = await prisma.contentRevision.findUnique({ where: { id: revisionId } });
  if (!page || !rev || rev.pageContentId !== page.id) return { ok: false, error: "Revisión no encontrada." };

  // Restaurar carga la versión como borrador; hay que publicarla explícitamente.
  await prisma.pageContent.update({
    where: { key },
    data: { draftData: rev.snapshotData as any, hasUnpublished: true },
  });
  await prisma.auditEvent.create({
    data: {
      actorUserId: auth.user.id,
      action: "CMS_RESTORE_REVISION",
      entityType: "PageContent",
      entityId: page.id,
      summary: `Revisión v${rev.version} de ${page.title} cargada como borrador`,
    },
  });
  revalidatePath(`/admin/contenido/${key}`);
  return { ok: true };
}
