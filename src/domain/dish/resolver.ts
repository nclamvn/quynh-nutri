import type { Dish, DishLine, Slot } from "@/domain/types";

/**
 * Override invariant, dish tier (Blueprint §2): a household's B1 dish wins over
 * the B0 repertoire it was forked from; custom B1 dishes are added; untouched B0
 * dishes remain. This is the same shape as the ingredient-tier override below —
 * a low-provenance default is always superseded by the household's ground truth.
 */
export function effectiveRepertoire(b0: Dish[], b1: Dish[] = []): Dish[] {
  const overridden = new Set(b1.map((d) => d.sourceRepertoireId).filter(Boolean) as string[]);
  const kept = b0.filter((d) => !overridden.has(d.id));
  return [...b1, ...kept];
}

/** Resolve a single dish id against a household's overrides. */
export function resolveDish(id: string, b0: Dish[], b1: Dish[] = []): Dish | undefined {
  const fork = b1.find((d) => d.sourceRepertoireId === id || d.id === id);
  if (fork) return fork;
  return b0.find((d) => d.id === id);
}

/** Effective dishes for one slot, after override. */
export function resolveSlot(slot: Slot, b0: Dish[], b1: Dish[] = []): Dish[] {
  return effectiveRepertoire(b0, b1).filter((d) => d.slot === slot);
}

/**
 * Override invariant, ingredient tier: a household's adjusted quantity for a
 * commodity wins over the B0 default. macro/100g is NEVER overridden here — it
 * always comes from commodity A, keeping numbers single-source.
 */
export function resolveLineQty(
  commodityId: string,
  b0Lines: DishLine[],
  b1Overrides: Record<string, number> = {},
): number | undefined {
  if (commodityId in b1Overrides) return b1Overrides[commodityId];
  return b0Lines.find((l) => l.commodityId === commodityId)?.qtyBase;
}
