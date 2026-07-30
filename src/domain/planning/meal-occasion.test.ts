import { describe, expect, it } from "vitest";
import {
  MEAL_OCCASIONS,
  isMealOccasion,
  mealOccasionOrder,
  mealRunScopeKey,
} from "./meal-occasion";

describe("meal occasion contract", () => {
  it("keeps one stable household-day order", () => {
    expect(MEAL_OCCASIONS).toEqual([
      "breakfast",
      "lunch",
      "dinner",
      "snack",
    ]);
    expect(MEAL_OCCASIONS.map(mealOccasionOrder)).toEqual([0, 1, 2, 3]);
  });

  it("rejects invented occasion values", () => {
    expect(isMealOccasion("lunch")).toBe(true);
    expect(isMealOccasion("brunch")).toBe(false);
    expect(isMealOccasion(undefined)).toBe(false);
  });

  it("creates independent meal-run scopes", () => {
    expect(mealRunScopeKey("2026-07-27", 2, "lunch"))
      .toBe("2026-07-27:2:lunch");
    expect(mealRunScopeKey("2026-07-27", 2, "dinner"))
      .toBe("2026-07-27:2:dinner");
  });
});
