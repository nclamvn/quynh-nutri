import { describe, expect, it } from "vitest";
import type {
  Dish,
  MealCompletion,
  PantryItem,
  WeekPlan,
} from "@/domain/types";
import { buildTodayMealReadiness } from "./meal-readiness";

const dish = (id: string, commodityId: string): Dish => ({
  id,
  vnName: id,
  proteinType: "rau",
  method: "luoc",
  slot: "RAU",
  quick: true,
  baseServings: 4,
  lines: [{ commodityId, qtyBase: 400, unit: "g" }],
  origin: "B0",
});

const dishes = {
  reviewed: dish("reviewed", "rau-muong"),
  changed: dish("changed", "ca-chua"),
  unsupported: dish("unsupported", "thit-bo"),
};

const plan = (dishIds: string[]): WeekPlan => ({
  householdId: "household",
  weekStart: "2026-07-27",
  slots: dishIds.map((dishId, index) => ({
    day: 3,
    slot: ["COM", "MAN", "RAU", "CANH", "TRANGMIENG"][index] as WeekPlan["slots"][number]["slot"],
    dishId,
    locked: false,
  })),
});

const completion = (dishRefs: string[], source: string): MealCompletion => ({
  id: `completion:${source}`,
  idempotencyKey: source,
  weekRef: "2026-07-27",
  day: 3,
  dishRefs,
  sourceSessionCreatedAt: source,
  completedAt: "2026-07-30T11:00:00.000Z",
  createdAt: "2026-07-30T11:00:00.000Z",
  updatedAt: "2026-07-30T11:00:00.000Z",
});

const build = (
  dishIds: string[],
  pantry: PantryItem[] = [],
  completions: MealCompletion[] = [],
) => buildTodayMealReadiness({
  now: new Date("2026-07-30T05:00:00.000Z"),
  timeZone: "Asia/Ho_Chi_Minh",
  plan: plan(dishIds),
  pantry,
  completions,
  dish: (id) => dishes[id as keyof typeof dishes],
  reviewedCookingDishIds: new Set(["reviewed", "changed"]),
});

describe("today meal readiness", () => {
  it("reports recorded presence without claiming quantity sufficiency", () => {
    const result = build(["reviewed"], [{
      id: "lot-1",
      commodityId: "rau-muong",
      qty: 1,
      unit: "g",
      purchasedAt: "2026-07-30T00:00:00.000Z",
      storageLocation: "fridge",
    }]);
    expect(result.ingredientPresence).toEqual([{
      commodityId: "rau-muong",
      status: "recorded",
      requiredByDishIds: ["reviewed"],
      lots: [{
        id: "lot-1",
        qty: 1,
        unit: "g",
        storageLocation: "fridge",
        bestBefore: undefined,
      }],
    }]);
  });

  it("keeps unsupported dishes visible without adding ingredient claims", () => {
    const result = build(["reviewed", "unsupported"]);
    expect(result.supportedDishes.map((item) => item.dishId)).toEqual(["reviewed"]);
    expect(result.unsupportedDishes.map((item) => item.dishId)).toEqual(["unsupported"]);
    expect(result.ingredientPresence.map((item) => item.commodityId)).toEqual(["rau-muong"]);
  });

  it("unions immutable completions and keeps a changed planned dish pending", () => {
    const result = build(
      ["reviewed", "changed"],
      [],
      [completion(["reviewed"], "first"), completion(["reviewed"], "retry")],
    );
    expect(result.completedDishIds).toEqual(["reviewed"]);
    expect(result.pendingDishIds).toEqual(["changed"]);
  });
});
