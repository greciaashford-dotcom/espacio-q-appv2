"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma, sequentialWrites, getMongoDb } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/security/crypto";
import { createSession, destroyCurrentSession } from "@/lib/auth/session";
import { checkRateLimit, clearRateLimit, clientIpFromForwarded } from "@/lib/security/rate-limit";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

const bootstrapSchema = z.object({
  name: z.string().trim().min(2, "Introduce tu nombre.").max(100),
  email: z.string().trim().toLowerCase().email("Introduce un email válido."),
  password: z
    .string()
    .min(12, "La contraseña debe tener al menos 12 caracteres.")
    .max(200),
});

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) {
    return { error: "Introduce un email y una contraseña válidos." };
  }

  const h = headers();
  const ip = clientIpFromForwarded(h.get("x-forwarded-for"), h.get("x-real-ip"));
  const allowed = await checkRateLimit({
    scope: "login",
    identifier: `${ip}|${parsed.data.email}`,
    limit: 8,
    windowSec: 900,
  });
  if (!allowed) {
    return {
      error:
        "Demasiados intentos. Espera unos minutos antes de volver a intentarlo.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (
    !user ||
    !user.active ||
    !verifyPassword(parsed.data.password, user.passwordHash)
  ) {
    return { error: "Credenciales incorrectas." };
  }

  // Un inicio de sesión correcto no consume el cupo anti fuerza bruta (solo cuentan los fallos)
  await clearRateLimit({ scope: "login", identifier: `${ip}|${parsed.data.email}` });

  await createSession(user.id, {
    userAgent: h.get("user-agent") ?? undefined,
  });
  await prisma.auditEvent.create({
    data: {
      actorUserId: user.id,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
      summary: "Inicio de sesión en el panel",
    },
  });

  const next = parsed.data.next;
  redirect(
    next && next.startsWith("/admin") && !next.startsWith("//")
      ? next
      : "/admin"
  );
}

/**
 * Bootstrap inicial seguro de propietario: SOLO funciona cuando no existe ningún usuario en la base de datos.
 * Una vez creada la cuenta propietaria inicial, queda bloqueado permanentemente frente al público.
 */
export async function bootstrapOwnerAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = bootstrapSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ||
        "Revisa los datos para crear la cuenta propietaria.",
    };
  }

  let createdUserId: string | null = null;
  try {
    const res = await sequentialWrites(async (tx) => {
      const existingCount = await tx.user.count();
      if (existingCount > 0) {
        return { blocked: true as const };
      }
      // Cerrojo único del asistente inicial: dos envíos simultáneos no pueden crear dos propietarias.
      const locks = (await getMongoDb()).collection<{ _id: string; at: Date }>("bootstrapLocks");
      try {
        await locks.insertOne({ _id: "first-owner", at: new Date() });
      } catch {
        if ((await tx.user.count()) > 0) return { blocked: true as const };
        await locks.deleteOne({ _id: "first-owner", at: { $lt: new Date(Date.now() - 60_000) } });
        return { blocked: true as const };
      }
      let user;
      try {
        if ((await tx.user.count()) > 0) return { blocked: true as const };
        user = await tx.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          passwordHash: hashPassword(parsed.data.password),
          role: "OWNER_ADMIN",
          canExportData: true,
          canManageMarketing: true,
          active: true,
        },
      });
      } finally {
        await locks.deleteOne({ _id: "first-owner" });
      }
      await tx.auditEvent.create({
        data: {
          actorUserId: user.id,
          action: "OWNER_BOOTSTRAP_INITIAL",
          entityType: "User",
          entityId: user.id,
          summary: `Configuración inicial de cuenta propietaria (${user.email})`,
        },
      });
      return { blocked: false as const, userId: user.id };
    });

    if (res.blocked) {
      return {
        error:
          "El sistema ya cuenta con un administrador configurado. Inicia sesión con tus credenciales.",
      };
    }
    createdUserId = res.userId;
  } catch {
    return { error: "No se pudo completar el alta inicial." };
  }

  if (createdUserId) {
    const h = headers();
    await createSession(createdUserId, {
      userAgent: h.get("user-agent") ?? undefined,
    });
    redirect("/admin");
  }
  return {};
}

export async function logoutAction() {
  await destroyCurrentSession();
  redirect("/acceso");
}
