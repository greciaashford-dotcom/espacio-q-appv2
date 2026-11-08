import { prisma } from "../lib/db/prisma";
import { runSeed } from "../lib/db/seed";

runSeed()
  .catch((err) => {
    console.error("Error en seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
