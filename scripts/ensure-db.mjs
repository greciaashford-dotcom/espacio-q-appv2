import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const pgDataDir = path.join(rootDir, ".pgdata");
const pgLogFile = path.join(pgDataDir, "postgres.log");

function readDatabasePortAndHost() {
  let dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl) {
    const envPath = path.join(rootDir, ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
      if (match) dbUrl = match[1];
    }
  }
  try {
    const parsed = new URL(dbUrl);
    return {
      host: parsed.hostname || "localhost",
      port: Number(parsed.port) || 5432,
    };
  } catch {
    return { host: "localhost", port: 5433 };
  }
}

function checkTcpOpen(host, port, timeoutMs = 600) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const done = (ok) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(ok);
      }
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
    socket.connect(port, host);
  });
}

function findPostgresExecutable() {
  const candidates =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\PostgreSQL\\16\\bin\\postgres.exe",
          "C:\\Program Files\\PostgreSQL\\17\\bin\\postgres.exe",
          "C:\\Program Files\\PostgreSQL\\15\\bin\\postgres.exe",
          "C:\\Program Files\\PostgreSQL\\14\\bin\\postgres.exe",
        ]
      : [
          "/usr/lib/postgresql/16/bin/postgres",
          "/opt/homebrew/opt/postgresql@16/bin/postgres",
          "/usr/local/bin/postgres",
        ];

  for (const bin of candidates) {
    if (fs.existsSync(bin)) return bin;
  }
  return "postgres";
}

function cleanStalePidIfDead() {
  const pidFile = path.join(pgDataDir, "postmaster.pid");
  if (!fs.existsSync(pidFile)) return;
  try {
    const firstLine = fs.readFileSync(pidFile, "utf8").split(/\r?\n/)[0]?.trim();
    const pid = Number(firstLine);
    if (Number.isFinite(pid) && pid > 0) {
      try {
        process.kill(pid, 0);
        // El proceso sigue vivo
        return;
      } catch {
        // Proceso inexistente: limpiar postmaster.pid huérfano tras cierre brusco
        fs.unlinkSync(pidFile);
      }
    }
  } catch {
    // Ignorar si no se puede leer
  }
}

async function main() {
  const { host, port } = readDatabasePortAndHost();

  const isLocalHost =
    host === "localhost" || host === "127.0.0.1" || host === "::1";

  const alreadyUp = await checkTcpOpen(host, port);
  if (alreadyUp) {
    console.log(`[db] PostgreSQL activo en ${host}:${port}`);
    return;
  }

  if (!isLocalHost || !fs.existsSync(pgDataDir)) {
    console.warn(
      `[db] No se detectó conexión en ${host}:${port} ni clúster local .pgdata. Asegúrate de que tu servidor PostgreSQL esté iniciado.`
    );
    return;
  }

  cleanStalePidIfDead();

  const postgresBin = findPostgresExecutable();
  console.log(`[db] Iniciando PostgreSQL local (.pgdata) en ${host}:${port}...`);

  const outFd = fs.openSync(pgLogFile, "a");
  const child = spawn(postgresBin, ["-D", pgDataDir, "-p", String(port)], {
    cwd: rootDir,
    detached: true,
    windowsHide: true,
    stdio: ["ignore", outFd, outFd],
  });
  child.unref();

  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 350));
    if (await checkTcpOpen(host, port)) {
      console.log(`[db] PostgreSQL listo y aceptando conexiones en ${host}:${port}`);
      return;
    }
  }

  console.error(
    `[db] No se pudo verificar PostgreSQL en ${host}:${port} tras 10s. Revisa .pgdata/postgres.log`
  );
  process.exit(1);
}

main();
