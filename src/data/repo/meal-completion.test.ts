import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({
  isE2EMode: () => true,
}));
vi.mock("@/lib/db", () => ({
  getDb: () => {
    throw new Error("E2E repository adapter must not access the database");
  },
}));

import {
  confirmMealCloseoutRecord,
  loadMealCompletionsForHousehold,
  mergeE2EMealCompletionState,
  resetE2EMealCompletionsForTests,
} from "./meal-completion";

const completedSession = {
  version: 3,
  payload: {
    day: 0,
    targetServeAt: "2026-07-30T12:00:00.000Z",
    createdAt: "2026-07-30T10:00:00.000Z",
    tasks: [{
      dishId: "dish-a",
      estimatedMin: 30,
      startedAt: "2026-07-30T10:30:00.000Z",
      completedAt: "2026-07-30T11:30:00.000Z",
    }],
  },
};
const pantry = [{
  id: "lot-a",
  commodityId: "rice",
  qty: 500,
  unit: "g",
  purchasedAt: "2026-07-29T08:00:00.000Z",
  storageLocation: "pantry" as const,
}];
const baseInput = {
  householdId: "household-a",
  userId: "user-a",
  idempotencyKey: "88b9f001-bd7b-4c44-8988-468fd0de27ff",
  weekRef: "2026-07-27",
  day: 0,
  expectedSessionVersion: 3,
  completedAt: "2026-07-30T11:31:00.000Z",
  allowedDishIds: ["dish-a"],
  consumptions: [{ lotId: "lot-a", qty: 120 }],
};

describe("meal completion repository E2E adapter", () => {
  beforeEach(() => resetE2EMealCompletionsForTests());

  it("records one immutable completion and exact inventory before-to-after facts", async () => {
    const result = await confirmMealCloseoutRecord(
      baseInput,
      { pantry, session: completedSession },
    );
    expect(result).toMatchObject({
      ok: true,
      completion: { dishRefs: ["dish-a"] },
      movements: [{ qtyBefore: 500, qtyAfter: 380, qty: 120 }],
      lots: [{ id: "lot-a", qty: 380 }],
    });
    expect(await loadMealCompletionsForHousehold("household-a")).toHaveLength(1);
  });

  it("replays by idempotency without consuming stock twice", async () => {
    const first = await confirmMealCloseoutRecord(
      baseInput,
      { pantry, session: completedSession },
    );
    const replay = await confirmMealCloseoutRecord(
      baseInput,
      { pantry, session: undefined },
    );
    expect(replay).toEqual(first);
    const merged = mergeE2EMealCompletionState("household-a", {
      pantry: structuredClone(pantry),
      inventoryMovements: [],
      mealCompletions: [],
    });
    expect(merged.pantry[0].qty).toBe(380);
    expect(merged.inventoryMovements).toHaveLength(1);
  });

  it("leaves every fact untouched when any selected lot is invalid", async () => {
    await expect(
      confirmMealCloseoutRecord(
        {
          ...baseInput,
          consumptions: [
            ...baseInput.consumptions,
            { lotId: "missing", qty: 1 },
          ],
        },
        { pantry, session: completedSession },
      ),
    ).rejects.toThrow("LOT_NOT_FOUND");
    expect(await loadMealCompletionsForHousehold("household-a")).toEqual([]);
    const merged = mergeE2EMealCompletionState("household-a", {
      pantry: structuredClone(pantry),
      inventoryMovements: [],
      mealCompletions: [],
    });
    expect(merged.pantry[0].qty).toBe(500);
    expect(merged.inventoryMovements).toEqual([]);
  });

  it("isolates households and rejects a second closeout of the same source session", async () => {
    await confirmMealCloseoutRecord(
      baseInput,
      { pantry, session: completedSession },
    );
    const conflict = await confirmMealCloseoutRecord(
      {
        ...baseInput,
        idempotencyKey: "3b57bdfa-f82c-47db-9378-3b50fb78d852",
        consumptions: [],
      },
      { pantry, session: completedSession },
    );
    expect(conflict).toMatchObject({
      ok: false,
      kind: "conflict",
      completion: { dishRefs: ["dish-a"] },
    });
    expect(await loadMealCompletionsForHousehold("household-b")).toEqual([]);
  });
});
