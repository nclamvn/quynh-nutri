import { describe, expect, it } from "vitest";
import type { Dish, InventoryLot, WeekPlan } from "@/domain/types";
import {
  expirySignal,
  frozenLotsNeededForDay,
  planDayForDate,
  sortLotsFefo,
} from "./inventory";

const lot = (id: string, overrides: Partial<InventoryLot> = {}): InventoryLot => ({
  id,
  commodityId: id,
  qty: 100,
  unit: "g",
  purchasedAt: "2026-07-20T00:00:00.000Z",
  storageLocation: "fridge",
  ...overrides,
});

describe("inventory execution", () => {
  it("classifies only user-provided label dates", () => {
    const now = new Date("2026-07-29T08:00:00.000Z");
    expect(expirySignal({}, now)).toBe("unknown");
    expect(expirySignal({ bestBefore: "2026-07-28T23:59:59.000Z" }, now)).toBe("overdue");
    expect(expirySignal({ bestBefore: "2026-07-29T23:59:59.000Z" }, now)).toBe("today");
    expect(expirySignal({ bestBefore: "2026-07-31T23:59:59.000Z" }, now)).toBe("soon");
    expect(expirySignal({ bestBefore: "2026-08-01T23:59:59.000Z" }, now)).toBe("later");
  });

  it("classifies label dates in the supplied household timezone", () => {
    const now = new Date("2026-07-29T05:00:00.000Z");
    expect(expirySignal(
      { bestBefore: "2026-07-28T17:00:00.000Z" },
      now,
      "Asia/Ho_Chi_Minh",
    )).toBe("today");
  });

  it("sorts positive lots FEFO, then purchase/id, with undated last", () => {
    const result = sortLotsFefo([
      lot("undated-new", { purchasedAt: "2026-07-22T00:00:00.000Z" }),
      lot("empty", { qty: 0, bestBefore: "2026-07-27T00:00:00.000Z" }),
      lot("later", { bestBefore: "2026-08-02T00:00:00.000Z" }),
      lot("first", { bestBefore: "2026-07-30T00:00:00.000Z" }),
      lot("undated-old", { purchasedAt: "2026-07-18T00:00:00.000Z" }),
    ]);
    expect(result.map((item) => item.id)).toEqual([
      "first",
      "later",
      "undated-old",
      "undated-new",
    ]);
  });

  it("matches only positive freezer lots needed for the target plan day", () => {
    const dish: Dish = {
      id: "dish",
      vnName: "Món",
      proteinType: "ca",
      method: "kho",
      slot: "MAN",
      quick: false,
      baseServings: 4,
      origin: "B0",
      lines: [{ commodityId: "fish", qtyBase: 200, unit: "g" }],
    };
    const plan: WeekPlan = {
      householdId: "hh",
      weekStart: "2026-07-27",
      slots: [{ day: 3, occasion: "dinner", slot: "MAN", dishId: "dish", locked: false }],
    };
    const result = frozenLotsNeededForDay(
      [
        lot("frozen", { commodityId: "fish", storageLocation: "freezer" }),
        lot("cold", { commodityId: "fish", storageLocation: "fridge" }),
        lot("other", { commodityId: "veg", storageLocation: "freezer" }),
      ],
      plan,
      3,
      (id) => (id === dish.id ? dish : undefined),
    );
    expect(result.map((item) => item.id)).toEqual(["frozen"]);
    expect(planDayForDate(plan.weekStart, new Date("2026-07-30T12:00:00.000Z"))).toBe(3);
  });
});
