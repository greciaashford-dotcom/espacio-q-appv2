/**
 * Alta segura de la cuenta propietaria (bootstrap). No existe registro público ni contraseña por defecto.
 * Uso: npm run admin:create -- --email propietaria@dominio.es --name "Nombre"
 * La contraseña se pide por consola (o BOOTSTRAP_PASSWORD en entornos no interactivos).
 */
import readline from "node:readline";
import { prisma } from "../lib/db/prisma";
import { hashPassword } from "../lib/security/crypto";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function ask(q: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(q, (a) => { rl.close(); resolve(a); }));
}

async function main() {
  const email = (arg("email") || (await ask("Email: "))).trim().toLowerCase();
  const name = (arg("name") || (await ask("Nombre: "))).trim();
  const role = (arg("role") || "OWNER_ADMIN") as "OWNER_ADMIN" | "RECEPTION" | "PROFESSIONAL";
  const password = process.env.BOOTSTRAP_PASSWORD || (await ask("Contraseña (mín. 12 caracteres): "));

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email no válido.");
  if (password.length < 12) throw new Error("La contraseña debe tener al menos 12 caracteres.");

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash: hashPassword(password), active: true },
    create: { email, name, role, passwordHash: hashPassword(password) },
  });
  await prisma.auditEvent.create({
    data: { action: "USER_BOOTSTRAP", entityType: "User", entityId: user.id, summary: `Alta/actualización por consola de ${email} (${role})` },
  });
  console.log(`✓ Usuario ${email} (${role}) listo. Accede en /acceso`);
}

main()
  .catch((e) => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
