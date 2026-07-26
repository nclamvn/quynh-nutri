import type { Commodity, Dish, Macro } from "@/domain/types";

/** Resolve a commodity by id. Domain stays pure — the caller injects the source. */
export type CommoditySource = (id: string) => Commodity | undefined;

export const ZERO_MACRO: Macro = { kcal: 0, proteinG: 0, carbG: 0, fatG: 0, fiberG: 0 };

export function addMacro(a: Macro, b: Macro): Macro {
  return {
    kcal: a.kcal + b.kcal,
    proteinG: a.proteinG + b.proteinG,
    carbG: a.carbG + b.carbG,
    fatG: a.fatG + b.fatG,
    fiberG: a.fiberG + b.fiberG,
  };
}

export function scaleMacro(m: Macro, factor: number): Macro {
  return {
    kcal: m.kcal * factor,
    proteinG: m.proteinG * factor,
    carbG: m.carbG * factor,
    fatG: m.fatG * factor,
    fiberG: m.fiberG * factor,
  };
}

export function roundMacro(m: Macro): Macro {
  return {
    kcal: Math.round(m.kcal),
    proteinG: Math.round(m.proteinG * 10) / 10,
    carbG: Math.round(m.carbG * 10) / 10,
    fatG: Math.round(m.fatG * 10) / 10,
    fiberG: Math.round(m.fiberG * 10) / 10,
  };
}

/**
 * Macro of a dish at `servings` people. Macros are DERIVED from commodity A
 * (single source): Σ line.qty/100 × commodity.macro, scaled from baseServings.
 * A line whose commodity is unknown contributes 0 (and drags coverage down).
 */
export function dishMacro(dish: Dish, source: CommoditySource, servings = dish.baseServings): Macro {
  let total = ZERO_MACRO;
  for (const line of dish.lines) {
    const c = source(line.commodityId);
    if (!c) continue;
    const per = line.qtyBase / 100; // qty is grams; macros are per 100g
    total = addMacro(total, scaleMacro(c, per));
  }
  const factor = dish.baseServings > 0 ? servings / dish.baseServings : 1;
  return scaleMacro(total, factor);
}

/**
 * Coverage = fraction of ingredient MASS backed by a `corroborated` commodity.
 * Mass-weighted (INTAKE-SEED §6): a corroborated staple + protein can cover
 * most mass even when a low-mass garnish is unknown. Missing commodities count
 * as uncovered mass. Returns 1 for an empty dish (nothing to doubt).
 */
export function dishCoverage(dish: Dish, source: CommoditySource): number {
  let total = 0;
  let corroborated = 0;
  for (const line of dish.lines) {
    total += line.qtyBase;
    const c = source(line.commodityId);
    if (c && c.confidence === "corroborated") corroborated += line.qtyBase;
  }
  return total > 0 ? corroborated / total : 1;
}

/** Mass-weighted coverage across many dishes (a day / a member's share). */
export function aggregateCoverage(dishes: Dish[], source: CommoditySource): number {
  let total = 0;
  let corroborated = 0;
  for (const dish of dishes) {
    for (const line of dish.lines) {
      total += line.qtyBase;
      const c = source(line.commodityId);
      if (c && c.confidence === "corroborated") corroborated += line.qtyBase;
    }
  }
  return total > 0 ? corroborated / total : 1;
}
