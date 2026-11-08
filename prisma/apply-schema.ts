import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

async function main() {
  console.log("1. Sincronizando esquema Prisma con PostgreSQL...");
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });

  console.log("2. Generando cliente Prisma...");
  execSync("npx prisma generate", { stdio: "inherit" });

  console.log("3. Aplicando restricciones SQL de exclusión temporal (btree_gist)...");
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS btree_gist;`);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'occupancy_no_overlap_gist'
        ) THEN
          ALTER TABLE "Occupancy"
            ADD CONSTRAINT occupancy_no_overlap_gist
            EXCLUDE USING gist (
              "professionalId" WITH =,
              tsrange("startAtUtc", "endAtUtc", '[)') WITH &&
            )
            WHERE ("active" = true);
        END IF;
      END
      $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'resource_reservation_no_overlap_gist'
        ) THEN
          ALTER TABLE "ResourceReservation"
            ADD CONSTRAINT resource_reservation_no_overlap_gist
            EXCLUDE USING gist (
              "resourceKey" WITH =,
              tsrange("startAtUtc", "endAtUtc", '[)') WITH &&
            )
            WHERE ("active" = true);
        END IF;
      END
      $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'occupancy_valid_range_chk'
        ) THEN
          ALTER TABLE "Occupancy"
            ADD CONSTRAINT occupancy_valid_range_chk
            CHECK ("startAtUtc" < "endAtUtc");
        END IF;
      END
      $$;
    `);

    console.log("✓ Esquema y restricciones GIST aplicadas correctamente en PostgreSQL.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Error aplicando esquema:", err);
  process.exit(1);
});
