import pg from "pg";
import { existsSync } from "node:fs";
import {
  buildOpsMetrics,
  buildReportingBounds,
  parseHistoricalWindow,
  type OpsCohortStart,
  type OpsEventRow,
} from "../src/domain/ops/metrics-contract";

const { Client } = pg;
if (
  !process.env.DATABASE_URL
  && !process.env.POSTGRES_URL
  && existsSync(".env.local")
) {
  process.loadEnvFile(".env.local");
}

const days = parseHistoricalWindow(process.argv[2] ?? "28");
if (days === null) {
  console.error("Usage: npm run metrics:activation -- [days between 1 and 365]");
  process.exit(2);
}

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("DATABASE_URL or POSTGRES_URL is required.");
  process.exit(2);
}

async function main(): Promise<void> {
  const client = new Client({ connectionString });
  const now = new Date();
  const bounds = buildReportingBounds(now, days);
  await client.connect();

  try {
    await client.query("SET statement_timeout TO '1500ms'");
    const startedAt = performance.now();
    const eventResult = await client.query<{
      householdId: string;
      name: string;
      schemaVersion: number;
      properties: unknown;
      occurredAt: Date;
    }>(
      `
        SELECT "householdId", "name", "schemaVersion", "properties", "occurredAt"
        FROM "ProductEvent"
        WHERE "occurredAt" >= $1 AND "occurredAt" < $2
        ORDER BY "occurredAt" ASC
        LIMIT 100000
      `,
      [bounds.previousStart, bounds.currentEnd],
    );
    const cohortResult = await client.query<{
      householdId: string;
      occurredAt: Date;
    }>(
      `
        SELECT "householdId", MIN("occurredAt") AS "occurredAt"
        FROM "ProductEvent"
        WHERE "name" = 'onboarding_started' AND "occurredAt" < $1
        GROUP BY "householdId"
      `,
      [bounds.currentEnd],
    );
    const completionResult = await client.query<{
      current: number;
      previous: number;
    }>(
      `
        SELECT
          COUNT(*) FILTER (
            WHERE "completedAt" >= $1 AND "completedAt" < $2
          )::int AS "current",
          COUNT(*) FILTER (
            WHERE "completedAt" >= $3 AND "completedAt" < $1
          )::int AS "previous"
        FROM "MealCompletion"
      `,
      [bounds.currentStart, bounds.currentEnd, bounds.previousStart],
    );

    const dto = buildOpsMetrics({
      events: eventResult.rows as OpsEventRow[],
      firstOnboardingStarts: cohortResult.rows as OpsCohortStart[],
      canonicalCompletions: completionResult.rows[0] ?? {
        current: 0,
        previous: 0,
      },
      now,
      windowDays: days,
      queryDurationMs: performance.now() - startedAt,
    });
    console.log(JSON.stringify(dto, null, 2));
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Operator metrics query failed.",
    );
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

void main();
