"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser, canManageCatalogOrCms } from "@/lib/auth/session";

export async function updateContactMessageStatusAction(
  messageId: string,
  status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "ARCHIVED"
) {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return { ok: false, error: "No autorizado." };
  }

  await prisma.contactMessage.update({
    where: { id: messageId },
    data: {
      status,
      ...(status === "RESOLVED" ? { repliedAt: new Date() } : {}),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/informes");
  return { ok: true };
}
