import type { Dish, PantryItem } from "@/domain/types";

export interface PantryMatch {
  dish: Dish;
  coverage: number; // fraction of ingredient MASS whose commodity is in the pantry
  missing: string[]; // commodity ids not on hand
}

/**
 * "What can I cook with what I have?" – ranks dishes by how much of their
 * ingredient mass the pantry already covers. Presence-based (any qty counts),
 * so it surfaces near-makeable dishes even when exact grams differ. Honest: a
 * dish with a missing staple simply ranks lower + lists what's missing.
 */
export function cookFromPantry(pantry: PantryItem[], repertoire: Dish[]): PantryMatch[] {
  const have = new Set(pantry.filter((item) => item.qty > 0).map((p) => p.commodityId));
  return repertoire
    .map((dish) => {
      let total = 0;
      let covered = 0;
      const missing: string[] = [];
      for (const l of dish.lines) {
        total += l.qtyBase;
        if (have.has(l.commodityId)) covered += l.qtyBase;
        else missing.push(l.commodityId);
      }
      return { dish, coverage: total > 0 ? covered / total : 1, missing };
    })
    .sort((a, b) => b.coverage - a.coverage);
}
