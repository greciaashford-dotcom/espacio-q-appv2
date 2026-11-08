import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "path";

const env = loadEnv("test", process.cwd(), "");

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 45000,
    hookTimeout: 60000,
    // Misma MONGO_URL/DB_NAME que el servidor (los tests e2e en vivo y los de dominio limpian sus datos).
    env: { ...env, EMERGENT_EMAIL_KEY: "" },
    setupFiles: ["tests/setup-db.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
