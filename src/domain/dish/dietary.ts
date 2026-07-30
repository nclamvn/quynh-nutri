import type { Dish, Household, Allergen } from "@/domain/types";
import type { CommoditySource } from "@/domain/nutrition/calculator";

// Dietary filter (Phase A). Allergen + restriction checked at the INGREDIENT
// level via commodity groups/allergens – so a "canh" whose proteinType is "rau"
// but which contains tôm is still caught (a bug a proteinType-only check misses).

const MEAT_GROUPS = new Set(["thịt"]);
const ANIMAL_FLESH_GROUPS = new Set(["thịt", "cá", "hải sản"]);

export function householdAllergens(h: Household): Set<Allergen> {
  const s = new Set<Allergen>();
  for (const m of h.members) for (const a of m.allergies ?? []) s.add(a);
  return s;
}

/** A dish is allowed if no ingredient trips an allergy or a diet restriction. */
export function dishAllowed(dish: Dish, household: Household, source: CommoditySource): boolean {
  const allergens = householdAllergens(household);
  const restrictions = household.restrictions ?? [];
  if (allergens.size === 0 && restrictions.length === 0) return true;

  for (const line of dish.lines) {
    const c = source(line.commodityId);
    if (!c) continue;
    if (c.allergens?.some((a) => allergens.has(a))) return false;
    if (restrictions.includes("vegetarian") && ANIMAL_FLESH_GROUPS.has(c.group)) return false;
    if (restrictions.includes("pescatarian") && MEAT_GROUPS.has(c.group)) return false;
  }
  // pork/beef restrictions keyed by the dish's primary protein
  if (restrictions.includes("no_pork") && dish.proteinType === "heo") return false;
  if (restrictions.includes("no_beef") && dish.proteinType === "bo") return false;
  return true;
}

/** Repertoire narrowed to what the household can eat (feed this to rotation). */
export function dietaryRepertoire(repertoire: Dish[], household: Household, source: CommoditySource): Dish[] {
  return repertoire.filter((d) => dishAllowed(d, household, source));
}
