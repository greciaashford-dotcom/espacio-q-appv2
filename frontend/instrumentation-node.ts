import { ensureSeeded } from "./lib/db/seed";
import { startJobScheduler } from "./lib/jobs/scheduler";

// Arranque del servidor Node: carga la semilla si MongoDB está vacía (pods de preview reciclados)
// y arranca el planificador interno de la cola (cada 5 min, lease en MongoDB).
ensureSeeded()
  .then(async (seeded) => {
    if (seeded) console.log("[boot] Base de datos vacía: semilla ESPACIO Q cargada.");
    // Nuevos bloques/textos por defecto (FAQ, «Cómo llegar», SEO) sin pisar ediciones del salón
    const { ensureBaseCmsAndSettings } = await import("./lib/domain/cms");
    await ensureBaseCmsAndSettings();
  })
  .catch((err) => console.error("[boot] No se pudo verificar/cargar la semilla en MongoDB:", err));

startJobScheduler();
