import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const pgDataDir = path.join(rootDir, ".pgdata");

function findPgCtl() {
  const candidates =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_ctl.exe",
          "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_ctl.exe",
          "C:\\Program Files\\PostgreSQL\\15\\bin\\pg_ctl.exe",
        ]
      : ["pg_ctl"];
  for (const bin of candidates) {
    if (bin === "pg_ctl" || fs.existsSync(bin)) return bin;
  }
  return "pg_ctl";
}

if (fs.existsSync(pgDataDir)) {
  const pgCtl = findPgCtl();
  spawnSync(pgCtl, ["-D", pgDataDir, "stop", "-m", "fast"], {
    stdio: "inherit",
  });
} else {
  console.log("[db] No existe directorio .pgdata local que detener.");
}
