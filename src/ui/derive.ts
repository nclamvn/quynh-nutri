import type { Dish, Household, Member, WeekPlan } from "@/domain/types";
import type { CommoditySource } from "@/domain/nutrition/calculator";
import {
  dishMacro,
  aggregateCoverage,
  addMacro,
  roundMacro,
  ZERO_MACRO,
  toDisplay,
  type MacroDisplay,
  householdAdequacy,
  memberAdequacy,
  groupsCheck,
  type Adequacy,
  type GroupsCheck,
} from "@/domain/nutrition";

/** Dishes planned for a given day, in slot order. */
export function dayDishes(plan: WeekPlan, day: number, dish: (id: string) => Dish | undefined): Dish[] {
  const order = ["COM", "MAN", "RAU", "CANH", "TRANGMIENG"];
  return plan.slots
    .filter((s) => s.day === day)
    .sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot))
    .map((s) => dish(s.dishId))
    .filter((d): d is Dish => Boolean(d));
}

export interface DayNutrition {
  display: MacroDisplay; // household-total kcal etc for the day
  adequacy: Adequacy;
  groups: GroupsCheck;
}

/** Whole-day nutrition for the household, honest about coverage (D3). */
export function dayNutrition(
  dishes: Dish[],
  household: Household,
  commodity: CommoditySource,
): DayNutrition {
  let total = ZERO_MACRO;
  for (const d of dishes) total = addMacro(total, dishMacro(d, commodity, household.size));
  const point = roundMacro(total);
  const coverage = aggregateCoverage(dishes, commodity);
  return {
    display: toDisplay(point, coverage),
    adequacy: householdAdequacy(point, household),
    groups: groupsCheck(dishes, commodity),
  };
}

export function memberDayAdequacy(
  dishes: Dish[],
  member: Member,
  household: Household,
  commodity: CommoditySource,
): Adequacy {
  let total = ZERO_MACRO;
  for (const d of dishes) total = addMacro(total, dishMacro(d, commodity, household.size));
  return memberAdequacy(roundMacro(total), member, household);
}

/** Per-dish display (used in the change sheet / dish library). */
export function dishDisplay(dish: Dish, household: Household, commodity: CommoditySource): MacroDisplay {
  const macro = roundMacro(dishMacro(dish, commodity, household.size));
  const coverage = aggregateCoverage([dish], commodity);
  return toDisplay(macro, coverage);
}
