import type {
  Dish,
  MealCompletion,
  PantryItem,
  WeekPlan,
} from "@/domain/types";
import {
  calendarDateInTimeZone,
} from "@/domain/kitchen-execution/kitchen-agenda";
import { planDayForDate } from "@/domain/kitchen-execution/inventory";

export type IngredientPresenceStatus =
  | "recorded"
  | "not-recorded";

export interface TodayMealDish {
  dishId: string;
  dish: Dish;
  reviewed: boolean;
  completed: boolean;
}

export interface IngredientPresence {
  commodityId: string;
  status: IngredientPresenceStatus;
  requiredByDishIds: string[];
  lots: {
    id: string;
    qty: number;
    unit: string;
    storageLocation?: PantryItem["storageLocation"];
    bestBefore?: string;
  }[];
}

export interface TodayMealReadiness {
  calendarDate: string;
  weekRef: string;
  day?: number;
  plannedDishes: TodayMealDish[];
  supportedDishes: TodayMealDish[];
  unsupportedDishes: TodayMealDish[];
  ingredientPresence: IngredientPresence[];
  completedDishIds: string[];
  pendingDishIds: string[];
}

export interface TodayMealReadinessInput {
  now: Date;
  timeZone: string;
  plan: WeekPlan;
  pantry: readonly PantryItem[];
  completions: readonly MealCompletion[];
  dish: (id: string) => Dish | undefined;
  reviewedCookingDishIds: ReadonlySet<string>;
}

/**
 * Presence is intentionally weaker than sufficiency. A positive lot proves
 * only that the household recorded some quantity; this projection never
 * converts units or claims enough stock for the planned meal.
 */
export function buildTodayMealReadiness(
  input: TodayMealReadinessInput,
): TodayMealReadiness {
  const calendarDate = calendarDateInTimeZone(input.now, input.timeZone);
  const day = planDayForDate(input.plan.weekStart, input.now, input.timeZone);
  const completedDishIds = new Set(
    day === undefined
      ? []
      : input.completions
          .filter(
            (completion) =>
              completion.weekRef === input.plan.weekStart
              && completion.day === day,
          )
          .flatMap((completion) => completion.dishRefs),
  );
  const plannedIds = day === undefined
    ? []
    : [...new Set(
        input.plan.slots
          .filter((slot) => slot.day === day)
          .map((slot) => slot.dishId),
      )];
  const plannedDishes = plannedIds.flatMap((dishId) => {
    const resolved = input.dish(dishId);
    if (!resolved) return [];
    return [{
      dishId,
      dish: resolved,
      reviewed: input.reviewedCookingDishIds.has(dishId),
      completed: completedDishIds.has(dishId),
    }];
  });
  const supportedDishes = plannedDishes.filter((item) => item.reviewed);
  const unsupportedDishes = plannedDishes.filter((item) => !item.reviewed);
  const requiredByCommodity = new Map<string, Set<string>>();
  for (const item of supportedDishes) {
    for (const line of item.dish.lines) {
      const requiredBy = requiredByCommodity.get(line.commodityId) ?? new Set();
      requiredBy.add(item.dishId);
      requiredByCommodity.set(line.commodityId, requiredBy);
    }
  }
  const ingredientPresence = [...requiredByCommodity.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([commodityId, requiredBy]) => {
      const lots = input.pantry
        .filter(
          (lot) =>
            lot.commodityId === commodityId
            && lot.qty > 0
            && typeof lot.id === "string",
        )
        .map((lot) => ({
          id: lot.id!,
          qty: lot.qty,
          unit: lot.unit,
          storageLocation: lot.storageLocation,
          bestBefore: lot.bestBefore,
        }));
      return {
        commodityId,
        status: lots.length > 0 ? "recorded" as const : "not-recorded" as const,
        requiredByDishIds: [...requiredBy],
        lots,
      };
    });

  return {
    calendarDate,
    weekRef: input.plan.weekStart,
    day,
    plannedDishes,
    supportedDishes,
    unsupportedDishes,
    ingredientPresence,
    completedDishIds: [...completedDishIds].sort(),
    pendingDishIds: supportedDishes
      .filter((item) => !item.completed)
      .map((item) => item.dishId),
  };
}
