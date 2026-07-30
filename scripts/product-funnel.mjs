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
const days = Number.parseInt(process.argv[2] ?? "28", 10);

if (!Number.isInteger(days) || days < 1 || days > 365) {
  console.error("Usage: npm run metrics:activation -- [days between 1 and 365]");
  process.exit(2);
}

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("DATABASE_URL or POSTGRES_URL is required.");
  process.exit(2);
}

const client = new Client({ connectionString });
await client.connect();

try {
  const { rows } = await client.query(
    `
      WITH recent AS (
        SELECT "householdId", "name", "occurredAt"
        FROM "ProductEvent"
        WHERE "occurredAt" >= NOW() - ($1::int * INTERVAL '1 day')
      ),
      households AS (
        SELECT
          "householdId",
          BOOL_OR("name" = 'onboarding_started') AS started,
          BOOL_OR("name" = 'onboarding_completed') AS onboarded,
          BOOL_OR("name" = 'week_proposal_confirmed') AS planned,
          BOOL_OR("name" = 'shopping_item_received') AS shopped,
          BOOL_OR("name" IN ('cooking_started', 'meal_run_started')) AS cooked,
          BOOL_OR("name" = 'leftover_recorded') AS closed_loop
        FROM recent
        GROUP BY "householdId"
      )
      SELECT
        COUNT(*) FILTER (WHERE started)::int AS "startedHouseholds",
        COUNT(*) FILTER (WHERE onboarded)::int AS "onboardedHouseholds",
        COUNT(*) FILTER (WHERE planned)::int AS "plannedHouseholds",
        COUNT(*) FILTER (WHERE shopped)::int AS "shoppedHouseholds",
        COUNT(*) FILTER (WHERE cooked)::int AS "cookedHouseholds",
        COUNT(*) FILTER (WHERE closed_loop)::int AS "closedLoopHouseholds"
      FROM households
    `,
    [days],
  );

  const result = rows[0] ?? {};
  const started = result.startedHouseholds ?? 0;
  const percent = (value) =>
    started > 0 ? Math.round((value / started) * 1000) / 10 : 0;

  console.log(JSON.stringify({
    windowDays: days,
    households: result,
    conversionFromStartedPct: {
      onboarded: percent(result.onboardedHouseholds ?? 0),
      planned: percent(result.plannedHouseholds ?? 0),
      shopped: percent(result.shoppedHouseholds ?? 0),
      cooked: percent(result.cookedHouseholds ?? 0),
      closedLoop: percent(result.closedLoopHouseholds ?? 0),
    },
    privacy: "aggregate-only",
  }, null, 2));
} finally {
  await client.end();
}
