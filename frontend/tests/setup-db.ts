import { beforeAll } from "vitest";
import { ensureSeeded } from "@/lib/db/seed";

beforeAll(async () => {
  await ensureSeeded();
});
