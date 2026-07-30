import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { isE2EMode } from "@/lib/auth";

// Prisma 7 runtime client for Neon Postgres (driver adapter, pooled URL).
// Lazy singleton – NOT a Proxy (breaks adapter inspection per Vercel guidance).
// Server-only: the repo layer runs in Server Actions / route handlers.
let _db: PrismaClient | null = null;

export function getDb(): PrismaClient {
  if (isE2EMode()) {
    throw new Error("E2E isolation violation: Prisma is disabled while auth bypass is active.");
  }
  if (!_db) {
    const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    _db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  }
  return _db;
}
