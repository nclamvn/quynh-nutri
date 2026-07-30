import type { PurchaseRecord, PurchaseLine } from "@/domain/types";

// Purchase-log provenance rules – the discipline wired into the foundation so Lane 3
// can never build fake optimization on sparse data.
// - a real logged price = B1 ground truth, overrides the B0 reference price
// - no logged price = honest-null (never fabricated)
// - a supplier with too few purchases is NOT ranked ("chưa đủ dữ liệu")
// This module only READS records; it computes no trends/rankings (that's Lane 3).

/** Minimum purchases from a supplier before any "optimize" claim is allowed. */
export const MIN_SAMPLES = 3;

export type PriceSource = "B1" | "B0";
export interface ResolvedPrice { vndPerKg: number; source: PriceSource; }

/** Normalize a logged line to VND/kg – ONLY for mass units (g/kg). Non-mass units
 *  (bìa, quả, …) can't be honestly converted → null. */
export function lineUnitPriceVndPerKg(line: PurchaseLine): number | null {
  if (line.pricePaid == null || !(line.pricePaid > 0) || !(line.qty > 0)) return null;
  const u = line.unit.trim().toLowerCase();
  if (u === "kg") return line.pricePaid / line.qty;
  if (u === "g" || u === "gram") return line.pricePaid / (line.qty / 1000);
  return null;
}

/** Latest real paid unit-price for a commodity (optionally from one supplier), as
 *  B1 ground truth. Returns null (honest-null) when nothing usable was logged. */
export function loggedPrice(
  records: PurchaseRecord[],
  commodityId: string,
  opts?: { supplierId?: string },
): { vndPerKg: number; date: string } | null {
  let best: { vndPerKg: number; date: string } | null = null;
  for (const r of records) {
    if (opts?.supplierId && r.supplierId !== opts.supplierId) continue;
    for (const l of r.lines) {
      if (l.commodityId !== commodityId) continue;
      const p = lineUnitPriceVndPerKg(l);
      if (p == null) continue;
      if (!best || r.date > best.date) best = { vndPerKg: p, date: r.date };
    }
  }
  return best;
}

/** Cost price with provenance: prefer the household's real logged price (B1) over
 *  the reference (B0); null when neither exists (honest-null, not a guess). */
export function resolvePrice(
  commodityId: string,
  records: PurchaseRecord[],
  referenceVndPerKg?: number,
  opts?: { supplierId?: string },
): ResolvedPrice | null {
  const b1 = loggedPrice(records, commodityId, opts);
  if (b1) return { vndPerKg: b1.vndPerKg, source: "B1" };
  if (referenceVndPerKg != null && referenceVndPerKg > 0) return { vndPerKg: referenceVndPerKg, source: "B0" };
  return null;
}

/** Fraction of logged lines that carry a real price (price coverage). */
export function priceCoverage(records: PurchaseRecord[]): number {
  let total = 0, priced = 0;
  for (const r of records) for (const l of r.lines) { total++; if (l.pricePaid != null && l.pricePaid > 0) priced++; }
  return total === 0 ? 0 : priced / total;
}

export function supplierPurchaseCount(records: PurchaseRecord[], supplierId: string): number {
  return records.filter((r) => r.supplierId === supplierId).length;
}

/** Whether a supplier has enough real purchases to be reasoned about. Below this,
 *  the hub says "chưa đủ dữ liệu" instead of ranking – hub knows when it doesn't know. */
export function supplierReady(records: PurchaseRecord[], supplierId: string, min = MIN_SAMPLES): boolean {
  return supplierPurchaseCount(records, supplierId) >= min;
}
