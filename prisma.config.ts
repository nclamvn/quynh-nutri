import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { defineConfig } from "prisma/config";

// Neon Postgres (provisioned via Vercel Marketplace). Migrations use the direct
// (non-pooling) URL; runtime client uses the pooled URL. Env from .env.local
// (gitignored) — Prisma CLI/tsx don't auto-load it, so dotenv does above.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
