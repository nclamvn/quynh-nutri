import { describe, it, expect } from "vitest";
import { costReport, lineCostVnd, formatVnd } from "./index";
import type { Commodity } from "@/domain/types";
import type { ShoppingItem } from "@/domain/shopping";

const C: Record<string, Partial<Commodity>> = {
  thit_heo_nac: { canonicalVn: "Thịt heo nạc", group: "thịt", priceVndPerKg: 120000 },
  rau_muong: { canonicalVn: "Rau muống", group: "rau", priceVndPerKg: 15000 },
  nuoc_mam: { canonicalVn: "Nước mắm", group: "gia vị" }, // unpriced
};
const source = (id: string) => (C[id] ? ({ id, ...C[id] } as Commodity) : undefined);
const item = (commodityId: string, qtyTotal: number, extra: Partial<ShoppingItem> = {}): ShoppingItem => ({
  commodityId, qtyTotal, unit: "g", vendor: "Chợ", trip: 1, kind: "fresh", checked: false, ...extra,
});

describe("cost engine", () => {
  it("prices a mass line by purchased kg", () => {
    expect(lineCostVnd(item("thit_heo_nac", 500), source("thit_heo_nac"))).toBe(60000); // 0.5kg × 120k
  });

  it("refuses to price an unpriced commodity (honest null, not zero-fabricated)", () => {
    expect(lineCostVnd(item("nuoc_mam", 100), source("nuoc_mam"))).toBeNull();
  });

  it("refuses to price a non-gram unit", () => {
    expect(lineCostVnd(item("thit_heo_nac", 2, { unit: "con" }), source("thit_heo_nac"))).toBeNull();
  });

  it("total is a lower bound and coverage states the base", () => {
    const r = costReport([item("thit_heo_nac", 500), item("rau_muong", 400), item("nuoc_mam", 50)], source);
    expect(r.totalVnd).toBe(60000 + 6000); // 66000; nuoc_mam excluded, not guessed
    expect(r.pricedCount).toBe(2);
    expect(r.totalCount).toBe(3);
    expect(r.coveragePct).toBe(67); // 2/3
  });

  it("flags over budget only when the lower-bound total already exceeds the cap", () => {
    const items = [item("thit_heo_nac", 1000)]; // 120k
    expect(costReport(items, source, 100000).overBudget).toBe(true);
    expect(costReport(items, source, 150000).overBudget).toBe(false);
    expect(costReport(items, source, 150000).remainingVnd).toBe(30000);
  });

  it("breaks down by group and by trip", () => {
    const r = costReport([item("thit_heo_nac", 500), item("rau_muong", 400, { trip: 2 })], source);
    expect(r.byGroup[0]).toEqual({ group: "thịt", vnd: 60000 });
    expect(r.byTrip.map((t) => t.trip)).toEqual([1, 2]);
  });

  it("formats VND compactly", () => {
    expect(formatVnd(66000)).toBe("66.000đ");
    expect(formatVnd(1_200_000)).toBe("1,2tr");
  });
});
