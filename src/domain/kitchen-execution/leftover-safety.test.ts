import { describe, expect, it } from "vitest";
import type { LeftoverLot } from "@/domain/types";
import {
  evaluateCoolingWindow,
  evaluateLeftoverGuidance,
  LEFTOVER_POLICY_VERSION,
  sortLeftoversForReview,
} from "./leftover-safety";

const now = new Date("2026-07-29T12:00:00.000Z");
const minutesBefore = (minutes: number) =>
  new Date(now.getTime() - minutes * 60_000).toISOString();

describe("evaluateCoolingWindow", () => {
  it.each([
    [false, 119, true],
    [false, 120, true],
    [false, 121, false],
    [true, 59, true],
    [true, 60, true],
    [true, 61, false],
  ])("applies the reviewed %s hot-weather boundary at %i minutes", (hot, elapsed, accepted) => {
    const result = evaluateCoolingWindow({
      preparedAt: minutesBefore(elapsed),
      chilledAt: now,
      hotWeatherConfirmed: hot,
      now,
    });
    expect(result.accepted).toBe(accepted);
    expect(result.limitMinutes).toBe(hot ? 60 : 120);
    expect(result.reasonCode).toBe(accepted ? undefined : "COOLING_WINDOW_EXCEEDED");
  });

  it("rejects invalid, reversed and future timestamps with stable codes", () => {
    expect(evaluateCoolingWindow({
      preparedAt: "not-a-date", chilledAt: now, hotWeatherConfirmed: false, now,
    }).reasonCode).toBe("INVALID_TIMESTAMP");
    expect(evaluateCoolingWindow({
      preparedAt: now, chilledAt: minutesBefore(1), hotWeatherConfirmed: false, now,
    }).reasonCode).toBe("CHILLED_BEFORE_PREPARED");
    expect(evaluateCoolingWindow({
      preparedAt: now, chilledAt: new Date(now.getTime() + 6 * 60_000), hotWeatherConfirmed: false, now,
    }).reasonCode).toBe("TIMESTAMP_IN_FUTURE");
  });
});

describe("evaluateLeftoverGuidance", () => {
  it.each([
    [71.99, "within-guidance-window"],
    [72, "review-guidance"],
    [95.99, "review-guidance"],
    [96, "review-guidance"],
    [96.01, "past-guidance-window"],
  ])("uses elapsed hours rather than calendar dates at %f hours", (hours, signal) => {
    expect(evaluateLeftoverGuidance({
      chilledAt: new Date(now.getTime() - hours * 3_600_000),
      storageLocation: "fridge",
      now,
    })).toMatchObject({ signal, policyVersion: LEFTOVER_POLICY_VERSION });
  });

  it("labels freezer timing as quality-only, never as a safety expiry", () => {
    expect(evaluateLeftoverGuidance({
      chilledAt: new Date("2025-01-01T00:00:00.000Z"),
      storageLocation: "freezer",
      now,
    }).signal).toBe("freezer-quality-only");
  });
});

describe("sortLeftoversForReview", () => {
  const lot = (
    id: string,
    hours: number,
    storageLocation: LeftoverLot["storageLocation"] = "fridge",
    remainingServings = 1,
  ): LeftoverLot => ({
    id,
    idempotencyKey: `key-${id}`,
    dishRef: id,
    dishLabelSnapshot: id,
    remainingServings,
    preparedAt: new Date(now.getTime() - (hours + 1) * 3_600_000).toISOString(),
    chilledAt: new Date(now.getTime() - hours * 3_600_000).toISOString(),
    storageLocation,
    hotWeatherConfirmed: false,
    policyVersion: LEFTOVER_POLICY_VERSION,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  it("prioritizes past/review fridge lots, then fresh and freezer, excluding empty lots", () => {
    const sorted = sortLeftoversForReview([
      lot("frozen", 200, "freezer"),
      lot("fresh", 5),
      lot("past-newer", 100),
      lot("review", 80),
      lot("past-older", 110),
      lot("empty", 120, "fridge", 0),
    ], now);
    expect(sorted.map((item) => item.id)).toEqual([
      "past-older", "past-newer", "review", "fresh", "frozen",
    ]);
  });
});
