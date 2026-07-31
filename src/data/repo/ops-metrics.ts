import "server-only";

import { Prisma } from "@prisma/client";
import {
  buildOpsMetrics,
  buildReportingBounds,
  type OpsCohortStart,
  type OpsEventRow,
  type OpsMetricsDto,
  type ReportingWindowDays,
} from "@/domain/ops/metrics-contract";
import { isE2EMode } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { requireOperatorUserId } from "@/lib/operator-auth";

const QUERY_TIMEOUT_MS = 1_500;

type LoadedMetricInput = {
  events: OpsEventRow[];
  firstOnboardingStarts: OpsCohortStart[];
  canonicalCompletions: { current: number; previous: number };
};

function e2eEvent(
  householdId: string,
  name: string,
  occurredAt: Date,
  properties: Record<string, unknown>,
): OpsEventRow {
  return { householdId, name, occurredAt, properties, schemaVersion: 1 };
}

function e2eMetricInput(
  now: Date,
  windowDays: ReportingWindowDays,
): LoadedMetricInput {
  const starts: OpsCohortStart[] = [];
  const events: OpsEventRow[] = [];
  for (let index = 0; index < 8; index += 1) {
    const householdId = `e2e-household-${index}`;
    const started = new Date(now.getTime() - (20 - index) * 24 * 60 * 60 * 1000);
    starts.push({ householdId, occurredAt: started });
    events.push(
      e2eEvent(householdId, "onboarding_started", started, {}),
      e2eEvent(
        householdId,
        "onboarding_completed",
        new Date(started.getTime() + 60 * 60 * 1000),
        {
          adults: 2,
          children: index % 2,
          hasRestrictions: false,
          busyDayCount: 2,
          marketMode: "mixed",
        },
      ),
      e2eEvent(
        householdId,
        "week_proposal_confirmed",
        new Date(started.getTime() + 2 * 60 * 60 * 1000),
        { changedSlotCount: 3 },
      ),
      e2eEvent(
        householdId,
        "shopping_item_received",
        new Date(started.getTime() + 3 * 60 * 60 * 1000),
        { addedToPantry: true },
      ),
      e2eEvent(
        householdId,
        "meal_run_started",
        new Date(started.getTime() + 4 * 60 * 60 * 1000),
        { occasion: "dinner", dishCount: 3 },
      ),
      e2eEvent(
        householdId,
        "meal_completed",
        new Date(started.getTime() + 5 * 60 * 60 * 1000),
        {
          occasion: "dinner",
          dishCount: 3,
          inventoryMovementCount: 2,
          openedLeftoverCapture: true,
        },
      ),
      e2eEvent(
        householdId,
        "meal_feedback_saved",
        new Date(started.getTime() + 26 * 60 * 60 * 1000),
        { dimensionsAnswered: 2, isEdit: false },
      ),
    );
  }
  const bounds = buildReportingBounds(now, windowDays);
  const completions = events.filter((item) => item.name === "meal_completed");
  return {
    events,
    firstOnboardingStarts: starts,
    canonicalCompletions: {
      current: completions.filter(
        (item) =>
          item.occurredAt >= bounds.currentStart
          && item.occurredAt < bounds.currentEnd,
      ).length,
      previous: completions.filter(
        (item) =>
          item.occurredAt >= bounds.previousStart
          && item.occurredAt < bounds.currentStart,
      ).length,
    },
  };
}

async function loadMetricInput(
  windowDays: ReportingWindowDays,
  now: Date,
): Promise<LoadedMetricInput> {
  const bounds = buildReportingBounds(now, windowDays);
  const db = getDb();
  return db.$transaction(async (tx) => {
    await tx.$queryRaw(
      Prisma.sql`SELECT set_config('statement_timeout', ${String(QUERY_TIMEOUT_MS)}, true)`,
    );
    const eventRows = await tx.productEvent.findMany({
      where: {
        occurredAt: {
          gte: bounds.previousStart,
          lt: bounds.currentEnd,
        },
      },
      select: {
        householdId: true,
        name: true,
        schemaVersion: true,
        properties: true,
        occurredAt: true,
      },
      orderBy: { occurredAt: "asc" },
      take: 100_000,
    });
    const cohortRows = await tx.productEvent.groupBy({
      by: ["householdId"],
      where: {
        name: "onboarding_started",
        occurredAt: { lt: bounds.currentEnd },
      },
      _min: { occurredAt: true },
    });
    const currentCompletions = await tx.mealCompletion.count({
      where: {
        completedAt: {
          gte: bounds.currentStart,
          lt: bounds.currentEnd,
        },
      },
    });
    const previousCompletions = await tx.mealCompletion.count({
      where: {
        completedAt: {
          gte: bounds.previousStart,
          lt: bounds.currentStart,
        },
      },
    });

    return {
      events: eventRows.map((row) => ({
        ...row,
        properties: row.properties,
      })),
      firstOnboardingStarts: cohortRows.flatMap((row) =>
        row._min.occurredAt
          ? [{ householdId: row.householdId, occurredAt: row._min.occurredAt }]
          : []
      ),
      canonicalCompletions: {
        current: currentCompletions,
        previous: previousCompletions,
      },
    };
  }, {
    timeout: QUERY_TIMEOUT_MS + 1_000,
  });
}

export async function getOpsMetrics(
  windowDays: ReportingWindowDays,
  now = new Date(),
): Promise<OpsMetricsDto> {
  await requireOperatorUserId();
  const startedAt = performance.now();
  const input = isE2EMode()
    ? e2eMetricInput(now, windowDays)
    : await loadMetricInput(windowDays, now);
  return buildOpsMetrics({
    ...input,
    now,
    windowDays,
    queryDurationMs: performance.now() - startedAt,
  });
}
