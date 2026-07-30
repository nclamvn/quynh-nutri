import type { MealOccasion } from "@/domain/types";

export const MEAL_OCCASIONS = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
] as const satisfies readonly MealOccasion[];

export const DEFAULT_MEAL_OCCASION: MealOccasion = "dinner";

export const MEAL_OCCASION_LABELS: Record<MealOccasion, { vn: string; en: string }> = {
  breakfast: { vn: "Bữa sáng", en: "Breakfast" },
  lunch: { vn: "Bữa trưa", en: "Lunch" },
  dinner: { vn: "Bữa tối", en: "Dinner" },
  snack: { vn: "Bữa phụ", en: "Snack" },
};

export function isMealOccasion(value: unknown): value is MealOccasion {
  return typeof value === "string"
    && MEAL_OCCASIONS.includes(value as MealOccasion);
}

export function mealOccasionOrder(occasion: MealOccasion): number {
  return MEAL_OCCASIONS.indexOf(occasion);
}

export function mealRunScopeKey(
  weekRef: string,
  day: number,
  occasion: MealOccasion,
): string {
  return `${weekRef}:${day}:${occasion}`;
}
