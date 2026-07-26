import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 moves the connection URL out of schema.prisma. Wire a real Postgres
// (Supabase/Neon) via DATABASE_URL when provisioning; Phase 1 dev runs on the
// typed TS seed in src/data/seed and does not need a live DB.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
