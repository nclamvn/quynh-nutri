import pg from "pg";
import { existsSync } from "node:fs";

const { Client } = pg;
if (
  !process.env.DATABASE_URL
  && !process.env.POSTGRES_URL
  && existsSync(".env.local")
) {
  process.loadEnvFile(".env.local");
}

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("DATABASE_URL or POSTGRES_URL is required.");
  process.exit(2);
}

const client = new Client({ connectionString });
await client.connect();
try {
  await client.query("SET statement_timeout TO '1500ms'");
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const { rows } = await client.query(
    `
      SELECT COUNT(*)::int AS "eligibleCount"
      FROM "ProductEvent"
      WHERE "occurredAt" < $1
    `,
    [cutoff],
  );
  console.log(JSON.stringify({
    dryRun: true,
    cutoff: cutoff.toISOString(),
    eligibleCount: rows[0]?.eligibleCount ?? 0,
    table: "ProductEvent",
  }, null, 2));
} finally {
  await client.end();
}
