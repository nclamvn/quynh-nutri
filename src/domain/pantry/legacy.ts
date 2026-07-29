import type { PantryItem } from "@/domain/types";

/** Preserve Household.pantry JSON while relation-backed InventoryLot rolls out. */
export function normalizeLegacyPantry(householdId: string, items: PantryItem[]): PantryItem[] {
  return items.map((item, index) => ({
    ...item,
    id: item.id ?? `legacy:${householdId}:${item.commodityId}:${index}`,
    bestBefore: item.bestBefore ?? item.expiry,
    legacy: true,
  }));
}
