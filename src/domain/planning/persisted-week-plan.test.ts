import { describe, expect, it } from "vitest";
import type { Dish, Household, PlannedSlot } from "@/domain/types";
import { COMMODITY_BY_ID } from "@/data/seed/commodity";
import { REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import {
  assertMondayIsoDate,
  samePlannedSlots,
  sortPlannedSlots,
  validateWeekPlanSlots,
} from "./persisted-week-plan";

const household = (overrides: Partial<Household> = {}): Household => ({
  id: "household",
  name: "Nhà",
  size: 4,
  marketMode: "mixed",
  cookTimeCapMin: 45,
  busyDays: [],
  lactatingMember: false,
  members: [],
  restrictions: [],
  ...overrides,
});
const base: PlannedSlot[] = [
  { day: 1, occasion: "dinner", slot: "MAN", dishId: "ga_kho_gung", locked: false },
  { day: 0, occasion: "dinner", slot: "COM", dishId: "com_trang", locked: true },
];
const validate = (
  slots: PlannedSlot[],
  hh = household(),
  dish = (id: string): Dish | undefined => REPERTOIRE_BY_ID[id],
) => validateWeekPlanSlots({
  weekStart: "2026-07-27",
  expectedVersion: 1,
  slots,
  household: hh,
  dish,
  commodity: (id) => COMMODITY_BY_ID[id],
});

describe("canonical week plan contract", () => {
  it("accepts only a real Monday ISO date", () => {
    expect(() => assertMondayIsoDate("2026-07-27")).not.toThrow();
    expect(() => assertMondayIsoDate("2026-07-28")).toThrow("WEEK_START_MUST_BE_MONDAY");
    expect(() => assertMondayIsoDate("2026-02-30")).toThrow("INVALID_WEEK_START");
    expect(() => assertMondayIsoDate("27-07-2026")).toThrow("INVALID_WEEK_START");
  });

  it("sorts stably, round-trips exactly and never mutates input", () => {
    const before = JSON.stringify(base);
    const sorted = validate(base);
    expect(sorted.map((slot) => `${slot.day}:${slot.slot}`)).toEqual(["0:COM", "1:MAN"]);
    expect(samePlannedSlots(sorted, base)).toBe(true);
    expect(sortPlannedSlots(sorted)).toEqual(sorted);
    expect(JSON.stringify(base)).toBe(before);
  });

  it("permits the same food role in independent meal occasions", () => {
    const slots = validate([
      {
        day: 0,
        occasion: "lunch",
        slot: "MAN",
        dishId: "ga_kho_gung",
        locked: false,
      },
      {
        day: 0,
        occasion: "dinner",
        slot: "MAN",
        dishId: "ga_kho_gung",
        locked: false,
      },
    ]);
    expect(slots).toHaveLength(2);
    expect(slots.map((item) => item.occasion)).toEqual(["lunch", "dinner"]);
  });

  it.each([
    [[...base, { ...base[0] }], "DUPLICATE_DAY_SLOT"],
    [[{ ...base[0], day: 7 }], "INVALID_PLAN_DAY"],
    [[{ ...base[0], dishId: "unknown" }], "UNKNOWN_OR_UNOWNED_DISH"],
    [[{ ...base[0], slot: "RAU" as const }], "DISH_SLOT_MISMATCH"],
  ])("rejects invalid slots", (slots, code) => {
    expect(() => validate(slots as PlannedSlot[])).toThrow(code);
  });

  it("rechecks dietary restrictions at the server boundary", () => {
    expect(() => validate(
      [{ day: 0, occasion: "dinner", slot: "MAN", dishId: "ga_kho_gung", locked: false }],
      household({ restrictions: ["vegetarian"] }),
    )).toThrow("DISH_RESTRICTION_UNSAFE");
  });

  it("fails closed for an unowned B1 dish", () => {
    const foreign: Dish = {
      ...REPERTOIRE_BY_ID.ga_kho_gung,
      id: "foreign-b1",
      origin: "B1",
    };
    expect(() => validate(
      [{ day: 0, occasion: "dinner", slot: "MAN", dishId: foreign.id, locked: false }],
      household(),
      () => undefined,
    )).toThrow("UNKNOWN_OR_UNOWNED_DISH");
  });
});
