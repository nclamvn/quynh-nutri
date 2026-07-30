import { describe, it, expect } from "vitest";
import { loggedPrice, resolvePrice, priceCoverage, supplierReady, lineUnitPriceVndPerKg } from "./index";
import type { PurchaseRecord } from "@/domain/types";

const rec = (date: string, over: Partial<PurchaseRecord> = {}): PurchaseRecord => ({
  id: date, date, lines: [], ...over,
});

describe("lineUnitPriceVndPerKg – mass units only", () => {
  it("converts g/kg to VND/kg", () => {
    expect(lineUnitPriceVndPerKg({ commodityId: "c", qty: 500, unit: "g", pricePaid: 40000 })).toBe(80000);
    expect(lineUnitPriceVndPerKg({ commodityId: "c", qty: 2, unit: "kg", pricePaid: 160000 })).toBe(80000);
  });
  it("returns null for non-mass units or missing price (honest-null)", () => {
    expect(lineUnitPriceVndPerKg({ commodityId: "c", qty: 2, unit: "bìa", pricePaid: 10000 })).toBeNull();
    expect(lineUnitPriceVndPerKg({ commodityId: "c", qty: 500, unit: "g" })).toBeNull();
  });
});

describe("loggedPrice – latest B1", () => {
  const records = [
    rec("2026-07-01", { supplierId: "s1", lines: [{ commodityId: "ghe", qty: 1000, unit: "g", pricePaid: 300000 }] }),
    rec("2026-07-20", { supplierId: "s1", lines: [{ commodityId: "ghe", qty: 500, unit: "g", pricePaid: 170000 }] }),
    rec("2026-07-10", { supplierId: "s2", lines: [{ commodityId: "ghe", qty: 1000, unit: "g", pricePaid: 280000 }] }),
  ];
  it("picks the most recent priced line", () => {
    expect(loggedPrice(records, "ghe")?.vndPerKg).toBe(340000); // 170000 / 0.5kg, 2026-07-20
  });
  it("filters by supplier when asked", () => {
    expect(loggedPrice(records, "ghe", { supplierId: "s2" })?.vndPerKg).toBe(280000);
  });
  it("honest-null when nothing usable", () => {
    expect(loggedPrice(records, "unknown")).toBeNull();
  });
});

describe("resolvePrice – B1 overrides B0", () => {
  const records = [rec("2026-07-20", { lines: [{ commodityId: "ghe", qty: 1000, unit: "g", pricePaid: 320000 }] })];
  it("prefers the real logged price (B1) over the reference (B0)", () => {
    expect(resolvePrice("ghe", records, 300000)).toEqual({ vndPerKg: 320000, source: "B1" });
  });
  it("falls back to B0 reference when nothing logged", () => {
    expect(resolvePrice("rau", records, 25000)).toEqual({ vndPerKg: 25000, source: "B0" });
  });
  it("honest-null when neither exists", () => {
    expect(resolvePrice("rau", records)).toBeNull();
  });
});

describe("priceCoverage", () => {
  it("reflects the real fraction of priced lines", () => {
    const records = [rec("2026-07-20", { lines: [
      { commodityId: "a", qty: 1, unit: "kg", pricePaid: 100000 },
      { commodityId: "b", qty: 1, unit: "kg" }, // no price
    ] })];
    expect(priceCoverage(records)).toBe(0.5);
    expect(priceCoverage([])).toBe(0);
  });
});

describe("supplierReady – sparse data is not ranked", () => {
  const two = [rec("d1", { supplierId: "s1" }), rec("d2", { supplierId: "s1" })];
  const three = [...two, rec("d3", { supplierId: "s1" })];
  it("false below MIN_SAMPLES (→ chưa đủ dữ liệu)", () => {
    expect(supplierReady(two, "s1")).toBe(false);
  });
  it("true at/above MIN_SAMPLES", () => {
    expect(supplierReady(three, "s1")).toBe(true);
  });
});
