import { describe, expect, it, vi } from "vitest";
import type { HouseholdState } from "@/data/repo/household";
import { DEFAULT_HOUSEHOLD } from "@/data/seed/household";

vi.mock("server-only", () => ({}));
const loadState = vi.hoisted(() => vi.fn());
vi.mock("@/data/repo/household", () => ({
  loadHouseholdState: loadState,
}));

import { getHouseholdMealMemorySnapshot } from "./meal-memory";

describe("assistant household meal memory snapshot", () => {
  it("returns only the deterministic explicit projection and performs no write", async () => {
    const state: HouseholdState = {
      household: structuredClone(DEFAULT_HOUSEHOLD),
      favorites: ["dish-from-bookmark"],
      notes: [],
      pantry: [],
      suppliers: [],
      orders: [],
      purchases: [],
      fulfillments: [],
      inventoryMovements: [],
      leftoverLots: [],
      leftoverMovements: [],
      mealCompletions: [{
        id: "completion-1",
        idempotencyKey: "completion-key",
        weekRef: "2026-07-27",
        day: 0,
  occasion: "dinner",
        dishRefs: ["ca_kho_to"],
        sourceSessionCreatedAt: "2026-07-30T10:00:00.000Z",
        completedAt: "2026-07-30T11:00:00.000Z",
        createdAt: "2026-07-30T11:00:00.000Z",
        updatedAt: "2026-07-30T11:00:00.000Z",
      }],
      mealFeedback: [{
        id: "feedback-1",
        mealCompletionId: "completion-1",
        dishRef: "ca_kho_to",
        idempotencyKey: "feedback-key",
        repeatIntent: "repeat",
        version: 1,
        createdAt: "2026-07-30T11:05:00.000Z",
        updatedAt: "2026-07-30T11:05:00.000Z",
      }],
    };
    loadState.mockResolvedValue(structuredClone(state));

    await expect(getHouseholdMealMemorySnapshot()).resolves.toMatchObject({
      totalFeedbackCount: 1,
      dishes: [{
        dishId: "ca_kho_to",
        feedbackCount: 1,
        repeatCount: 1,
        evidenceState: "single",
      }],
    });
    expect(loadState).toHaveBeenCalledTimes(1);
  });
});
