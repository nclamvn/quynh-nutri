import type { Dish, Household, WeekPlan } from "@/domain/types";
import type { CommoditySource } from "@/domain/nutrition/calculator";

export type TripKind = "fresh" | "dry";

export interface ShoppingItem {
  commodityId: string;
  qtyTotal: number;
  unit: string;
  vendor: string;
  trip: number; // 1..N fresh, then the dry trip
  kind: TripKind;
  checked: boolean;
}

const DRY_GROUPS = new Set(["gia vị", "ngũ cốc"]);
const UNASSIGNED_VENDOR = "Chưa gán";

function freshTripCount(household: Household): number {
  // "2–3 chuyến đồ tươi + 1 chuyến đồ khô" — traditional shops most often,
  // supermarket does one big run. (INTAKE-SEED §2, R-SHOP-2)
  switch (household.marketMode) {
    case "traditional":
      return 3;
    case "supermarket":
      return 1;
    default:
      return 2; // mixed
  }
}

/** Bucket a use-day into a fresh trip index (1-based) so tươi is bought near use. */
function tripForDay(day: number, freshTrips: number): number {
  if (freshTrips <= 1) return 1;
  const size = Math.ceil(7 / freshTrips);
  return Math.min(freshTrips, Math.floor(day / size) + 1);
}

interface Acc {
  commodityId: string;
  qtyTotal: number;
  unit: string;
  vendor: string;
  earliestDay: number;
  kind: TripKind;
}

/**
 * Derive the shopping list from a week plan (R-SHOP-1/2). Aggregates ingredient
 * mass by (commodity, vendor) — NOT by dish — scaled to household size, then
 * splits fresh produce across trips (bought near use) and dry goods into one run.
 * `previous` carries checked ticks over: buying something already shouldn't be
 * undone by re-planning.
 */
export function aggregateShopping(
  plan: WeekPlan,
  dishes: (id: string) => Dish | undefined,
  commodities: CommoditySource,
  household: Household,
  previous: ShoppingItem[] = [],
): ShoppingItem[] {
  const freshTrips = freshTripCount(household);
  const acc = new Map<string, Acc>();

  for (const slot of plan.slots) {
    const dish = dishes(slot.dishId);
    if (!dish) continue;
    const scale = dish.baseServings > 0 ? household.size / dish.baseServings : 1;
    for (const line of dish.lines) {
      const commodity = commodities(line.commodityId);
      const vendor = dish.vendor ?? UNASSIGNED_VENDOR;
      const kind: TripKind = commodity && DRY_GROUPS.has(commodity.group) ? "dry" : "fresh";
      const key = `${line.commodityId}|${vendor}`;
      const prev = acc.get(key);
      // Dish lines are EDIBLE grams; gross up by edibleYield to get what to buy.
      const yieldF = commodity?.edibleYield ?? 1;
      const qty = (line.qtyBase * scale) / yieldF;
      if (prev) {
        prev.qtyTotal += qty;
        prev.earliestDay = Math.min(prev.earliestDay, slot.day);
      } else {
        acc.set(key, { commodityId: line.commodityId, qtyTotal: qty, unit: line.unit, vendor, earliestDay: slot.day, kind });
      }
    }
  }

  const checkedKeys = new Set(previous.filter((i) => i.checked).map((i) => `${i.commodityId}|${i.vendor}`));

  const items: ShoppingItem[] = [];
  for (const a of acc.values()) {
    const trip = a.kind === "dry" ? freshTrips + 1 : tripForDay(a.earliestDay, freshTrips);
    items.push({
      commodityId: a.commodityId,
      qtyTotal: Math.round(a.qtyTotal),
      unit: a.unit,
      vendor: a.vendor,
      trip,
      kind: a.kind,
      checked: checkedKeys.has(`${a.commodityId}|${a.vendor}`),
    });
  }

  // Stable sort: by trip, then vendor, then commodity id.
  items.sort((x, y) => x.trip - y.trip || x.vendor.localeCompare(y.vendor) || x.commodityId.localeCompare(y.commodityId));
  return items;
}

/** Group items by trip for display (fresh trips + a final dry trip). */
export function groupByTrip(items: ShoppingItem[]): { trip: number; kind: TripKind; items: ShoppingItem[] }[] {
  const map = new Map<number, { trip: number; kind: TripKind; items: ShoppingItem[] }>();
  for (const it of items) {
    const g = map.get(it.trip) ?? { trip: it.trip, kind: it.kind, items: [] };
    g.items.push(it);
    map.set(it.trip, g);
  }
  return [...map.values()].sort((a, b) => a.trip - b.trip);
}
