// Completa el servidor autónomo de Next.js: public/ y .next/static no se incluyen por defecto en .next/standalone.
import { cpSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const standalone = path.join(root, ".next", "standalone");
if (!existsSync(path.join(standalone, "server.js"))) {
  console.error("[postbuild] No existe .next/standalone/server.js (¿output: 'standalone'?)");
  process.exit(1);
}
cpSync(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
cpSync(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), { recursive: true });
// En preview las variables viven en .env (en producción las inyecta la plataforma y no hay .env)
if (existsSync(path.join(root, ".env"))) cpSync(path.join(root, ".env"), path.join(standalone, ".env"));
console.log("[postbuild] standalone listo: public/ y .next/static copiados");
