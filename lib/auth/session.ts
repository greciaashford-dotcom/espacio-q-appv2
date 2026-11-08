import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { generateOpaqueToken, hashToken } from "@/lib/security/crypto";
import type { UserRole } from "@prisma/client";

export const SESSION_COOKIE_NAME = "espacioq_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 días

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  professionalId: string | null;
  canExportData: boolean;
  canManageMarketing: boolean;
};

export async function createSession(
  userId: string,
  meta?: { userAgent?: string; ipRedacted?: string }
): Promise<string> {
  const rawToken = generateOpaqueToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      userAgent: meta?.userAgent?.slice(0, 200),
      ipRedacted: meta?.ipRedacted,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return rawToken;
}

export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (rawToken) {
    const tokenHash = hashToken(rawToken);
    await prisma.session.deleteMany({ where: { tokenHash } });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!rawToken) return null;

    const tokenHash = hashToken(rawToken);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date() || !session.user.active) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      professionalId: session.user.professionalId,
      canExportData:
        session.user.role === "OWNER_ADMIN" || session.user.canExportData,
      canManageMarketing:
        session.user.role === "OWNER_ADMIN" || session.user.canManageMarketing,
    };
  } catch {
    return null;
  }
}

export function canAccessProfessionalAgenda(
  user: AuthenticatedUser,
  targetProfessionalId: string
): boolean {
  if (user.role === "OWNER_ADMIN" || user.role === "RECEPTION") {
    return true;
  }
  return user.role === "PROFESSIONAL" && user.professionalId === targetProfessionalId;
}

export function canManageCatalogOrCms(user: AuthenticatedUser): boolean {
  return user.role === "OWNER_ADMIN" || user.role === "RECEPTION";
}

export function canManageSettingsOrUsers(user: AuthenticatedUser): boolean {
  return user.role === "OWNER_ADMIN";
}

export function canExportCrm(user: AuthenticatedUser): boolean {
  return user.role === "OWNER_ADMIN" || (user.role === "RECEPTION" && user.canExportData);
}

export function canManageCampaigns(user: AuthenticatedUser): boolean {
  return (
    user.role === "OWNER_ADMIN" ||
    (user.role === "RECEPTION" && user.canManageMarketing)
  );
}
