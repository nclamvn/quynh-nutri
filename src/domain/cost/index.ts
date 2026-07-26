import type { Commodity } from "@/domain/types";
import type { ShoppingItem } from "@/domain/shopping";
import type { CommoditySource } from "@/domain/nutrition/calculator";

// Cost engine — turns the (already grossed-up) shopping list into a spend
// estimate. Honesty discipline mirrors the D3 nutrition gate:
//  · Price is a market reference, never precise → the total is always an
//    ESTIMATE ("~"), never a claimed exact figure.
//  · Items without a seeded price are NOT invented — they drop out and lower
//    the basket's PRICE COVERAGE, so the total is an explicit LOWER BOUND when
//    coverage < 100%. ("adequacy-denominator-precedent": every % states its base.)
//  · "over budget" only fires when the lower-bound total already exceeds the cap
//    (safe); we never claim "within budget" off an incomplete basket.

export interface LineCost {
  commodityId: string;
  vnName: string;
  group: string;
  qtyTotal: number;
  unit: string;
  vendor: string;
  trip: number;
  kind: string;
  priceVndPerKg?: number;
  costVnd: number | null; // null = no reference price (unpriced)
}

export interface CostReport {
  totalVnd: number; // sum of PRICED lines — a lower bound when coverage < 100%
  pricedCount: number;
  totalCount: number;
  coveragePct: number; // % of distinct basket items that have a reference price
  byGroup: { group: string; vnd: number }[];
  byTrip: { trip: number; kind: string; vnd: number }[];
  top: LineCost[];
  lines: LineCost[];
  budgetWeeklyVnd?: number;
  overBudget: boolean; // lower-bound total already exceeds the cap
  remainingVnd?: number;
}

/** Cost of one shopping line, or null if we can't price it honestly. */
export function lineCostVnd(item: ShoppingItem, c: Commodity | undefined): number | null {
  if (!c?.priceVndPerKg || item.unit !== "g") return null; // only mass lines are priceable here
  return (item.qtyTotal / 1000) * c.priceVndPerKg;
}

export function costReport(
  items: ShoppingItem[],
  source: CommoditySource,
  budgetWeeklyVnd?: number,
): CostReport {
  const lines: LineCost[] = items.map((it) => {
    const c = source(it.commodityId);
    return {
      commodityId: it.commodityId,
      vnName: c?.canonicalVn ?? it.commodityId,
      group: c?.group ?? "khác",
      qtyTotal: it.qtyTotal,
      unit: it.unit,
      vendor: it.vendor,
      trip: it.trip,
      kind: it.kind,
      priceVndPerKg: c?.priceVndPerKg,
      costVnd: lineCostVnd(it, c),
    };
  });

  const priced = lines.filter((l): l is LineCost & { costVnd: number } => l.costVnd != null);
  const totalVnd = Math.round(priced.reduce((s, l) => s + l.costVnd, 0));
  const coveragePct = lines.length ? Math.round((priced.length / lines.length) * 100) : 0;

  const g = new Map<string, number>();
  for (const l of priced) g.set(l.group, (g.get(l.group) ?? 0) + l.costVnd);
  const byGroup = [...g].map(([group, vnd]) => ({ group, vnd: Math.round(vnd) })).sort((a, b) => b.vnd - a.vnd);

  const tp = new Map<string, number>();
  for (const l of priced) { const k = `${l.trip}|${l.kind}`; tp.set(k, (tp.get(k) ?? 0) + l.costVnd); }
  const byTrip = [...tp].map(([k, vnd]) => { const [trip, kind] = k.split("|"); return { trip: Number(trip), kind, vnd: Math.round(vnd) }; }).sort((a, b) => a.trip - b.trip);

  const top = [...priced].sort((a, b) => b.costVnd - a.costVnd).slice(0, 5);
  const overBudget = budgetWeeklyVnd != null && totalVnd > budgetWeeklyVnd;
  const remainingVnd = budgetWeeklyVnd != null ? budgetWeeklyVnd - totalVnd : undefined;

  return { totalVnd, pricedCount: priced.length, totalCount: lines.length, coveragePct, byGroup, byTrip, top, lines, budgetWeeklyVnd, overBudget, remainingVnd };
}

/** Compact VND formatter — "125.000đ", "1,2tr". */
export function formatVnd(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1).replace(".", ",")}tr`;
  return `${Math.round(v).toLocaleString("vi-VN")}đ`;
}
