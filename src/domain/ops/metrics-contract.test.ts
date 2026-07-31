import { describe, expect, it } from "vitest";
import {
  buildOpsMetrics,
  buildReportingBounds,
  OPS_METRICS_CONTRACT_VERSION,
  parseHistoricalWindow,
  parseInteractiveWindow,
  type OpsEventRow,
} from "./metrics-contract";

const NOW = new Date("2026-07-31T03:00:00.000Z");

function event(
  householdId: string,
  name: string,
  occurredAt: string,
  properties: Record<string, unknown> = {},
  schemaVersion = 1,
): OpsEventRow {
  return {
    householdId,
    name,
    schemaVersion,
    properties,
    occurredAt: new Date(occurredAt),
  };
}

function fullJourney(householdId: string, day: number): OpsEventRow[] {
  const iso = (hour: number) =>
    `2026-07-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00.000Z`;
  return [
    event(householdId, "onboarding_started", iso(0)),
    event(householdId, "onboarding_completed", iso(1), {
      adults: 2,
      children: 1,
      hasRestrictions: false,
      busyDayCount: 2,
      marketMode: "mixed",
    }),
    event(householdId, "week_proposal_confirmed", iso(2), {
      changedSlotCount: 3,
    }),
    event(householdId, "shopping_item_received", iso(3), {
      addedToPantry: true,
    }),
    event(householdId, "meal_run_started", iso(4), {
      occasion: "dinner",
      dishCount: 3,
    }),
    event(householdId, "meal_completed", iso(5), {
      occasion: "dinner",
      dishCount: 3,
      inventoryMovementCount: 2,
      openedLeftoverCapture: true,
    }),
    event(householdId, "leftover_recorded", iso(6), {
      storageLocation: "fridge",
    }),
  ];
}

describe("KE-031 reporting contract", () => {
  it("uses Vietnam local-midnight half-open windows", () => {
    const bounds = buildReportingBounds(
      new Date("2026-07-31T18:30:00.000Z"),
      7,
    );
    expect(bounds.currentEnd.toISOString()).toBe("2026-08-01T17:00:00.000Z");
    expect(bounds.currentStart.toISOString()).toBe("2026-07-25T17:00:00.000Z");
  });

  it("defaults unsupported interactive windows to 28 days", () => {
    expect(parseInteractiveWindow("7")).toBe(7);
    expect(parseInteractiveWindow("365")).toBe(28);
    expect(parseInteractiveWindow(undefined)).toBe(28);
  });

  it("rejects malformed historical CLI windows", () => {
    expect(parseHistoricalWindow("1")).toBe(1);
    expect(parseHistoricalWindow("365")).toBe(365);
    expect(parseHistoricalWindow("0")).toBeNull();
    expect(parseHistoricalWindow("366")).toBeNull();
    expect(parseHistoricalWindow("7abc")).toBeNull();
    expect(parseHistoricalWindow("7.5")).toBeNull();
    expect(parseHistoricalWindow(undefined)).toBeNull();
  });

  it("counts independent milestones and labels a direct completion path", () => {
    const events = [
      event("direct", "onboarding_started", "2026-07-20T00:00:00.000Z"),
      event("direct", "onboarding_completed", "2026-07-20T01:00:00.000Z", {
        adults: 2,
        children: 0,
        hasRestrictions: false,
        busyDayCount: 1,
        marketMode: "traditional",
      }),
      event("direct", "meal_completed", "2026-07-21T01:00:00.000Z", {
        occasion: "dinner",
        dishCount: 2,
        inventoryMovementCount: 0,
        openedLeftoverCapture: false,
      }),
    ];
    const dto = buildOpsMetrics({
      events,
      firstOnboardingStarts: [{
        householdId: "direct",
        occurredAt: new Date("2026-07-20T00:00:00.000Z"),
      }],
      canonicalCompletions: { current: 1, previous: 0 },
      now: NOW,
      windowDays: 28,
      queryDurationMs: 12,
    });
    expect(dto.milestones.find((item) => item.key === "meal_completed")?.households).toBe(1);
    expect(dto.milestones.find((item) => item.key === "plan_participated")?.households).toBe(0);
    expect(dto.journey.directPathHouseholds).toBe(1);
  });

  it("suppresses small cohorts and exposes no household identifier in the DTO", () => {
    const events = fullJourney("household-secret", 10);
    const dto = buildOpsMetrics({
      events,
      firstOnboardingStarts: [{
        householdId: "household-secret",
        occurredAt: events[0].occurredAt,
      }],
      canonicalCompletions: { current: 1, previous: 0 },
      now: NOW,
      windowDays: 28,
      queryDurationMs: 4,
    });
    expect(dto.timeToValue.firstClosedMeal.medianHours.state).toBe("suppressed");
    expect(dto.occasions.find((item) => item.occasion === "dinner")?.completedHouseholds.state)
      .toBe("suppressed");
    expect(JSON.stringify(dto)).not.toContain("household-secret");
  });

  it("publishes latency only with five mature samples", () => {
    const events = Array.from({ length: 5 }, (_, index) =>
      fullJourney(`household-${index}`, 10 + index)
    ).flat();
    const dto = buildOpsMetrics({
      events,
      firstOnboardingStarts: Array.from({ length: 5 }, (_, index) => ({
        householdId: `household-${index}`,
        occurredAt: new Date(`2026-07-${10 + index}T00:00:00.000Z`),
      })),
      canonicalCompletions: { current: 5, previous: 0 },
      now: NOW,
      windowDays: 28,
      queryDurationMs: 7,
    });
    expect(dto.contractVersion).toBe(OPS_METRICS_CONTRACT_VERSION);
    expect(dto.timeToValue.firstOperationalAction.medianHours).toMatchObject({
      state: "available",
      value: 1,
      sampleSize: 5,
    });
    expect(dto.timeToValue.firstClosedMeal.p75Hours).toMatchObject({
      state: "available",
      value: 4,
      sampleSize: 5,
    });
  });

  it("separates malformed, unsupported, unknown and future evidence", () => {
    const dto = buildOpsMetrics({
      events: [
        event("a", "unknown_event", "2026-07-20T00:00:00.000Z"),
        event("b", "onboarding_started", "2026-07-20T00:00:00.000Z", {}, 2),
        event("c", "meal_completed", "2026-07-20T00:00:00.000Z", {}),
        event("d", "onboarding_started", "2026-08-02T00:00:00.000Z"),
      ],
      firstOnboardingStarts: [],
      canonicalCompletions: { current: 0, previous: 0 },
      now: NOW,
      windowDays: 28,
      queryDurationMs: 1,
    });
    expect(dto.health).toMatchObject({
      state: "attention",
      unknownEventNames: 1,
      unsupportedSchemaVersions: 1,
      malformedProperties: 1,
      futureTimestamps: 1,
    });
  });

  it("does not call a quiet period an outage", () => {
    const dto = buildOpsMetrics({
      events: [],
      firstOnboardingStarts: [],
      canonicalCompletions: { current: 0, previous: 0 },
      now: NOW,
      windowDays: 28,
      queryDurationMs: 1,
    });
    expect(dto.health.state).toBe("insufficient_traffic");
    expect(dto.health.limitations.join(" ")).toContain("không đồng nghĩa");
  });
});
