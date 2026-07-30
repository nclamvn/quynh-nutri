import { describe, it, expect } from "vitest";
import { COMMODITY_BY_ID } from "@/data/seed/commodity";
import { REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import { DEFAULT_HOUSEHOLD } from "@/data/seed/household";
import type { CommoditySource } from "./calculator";
import { dishMacro, dishCoverage } from "./calculator";
import { displayModeFor, toDisplay, marginRatio } from "./d3-gate";
import { householdAdequacy, memberAdequacy, groupsCheck, householdNeed } from "./adequacy";
import { D3_CONFIG } from "./config";

const src: CommoditySource = (id) => COMMODITY_BY_ID[id];
const dish = (id: string) => REPERTOIRE_BY_ID[id];

describe("dishMacro – derived from commodity A", () => {
  it("computes gà luộc from a single commodity", () => {
    const m = dishMacro(dish("ga_luoc"), src); // 352g edible thịt gà @ 199kcal/100g
    expect(m.kcal).toBeCloseTo(700.48, 1);
    expect(m.proteinG).toBeCloseTo(71.46, 1);
  });

  it("scales linearly with servings", () => {
    const four = dishMacro(dish("ga_luoc"), src, 4);
    const eight = dishMacro(dish("ga_luoc"), src, 8);
    expect(eight.kcal).toBeCloseTo(four.kcal * 2, 5);
  });

  it("ignores unknown commodities (contributes zero)", () => {
    const ghost = { ...dish("ga_luoc"), lines: [{ commodityId: "does_not_exist", qtyBase: 500, unit: "g" }] };
    expect(dishMacro(ghost, src).kcal).toBe(0);
  });
});

describe("dishCoverage – mass-weighted corroboration", () => {
  it("is 1.0 when every ingredient is corroborated", () => {
    expect(dishCoverage(dish("ga_luoc"), src)).toBe(1);
  });

  it("drops to the range tier when a disputed cut dominates", () => {
    // canh su su sườn: su_su(208, corr) + suon_heo(154, disputed) → 0.57 (<0.60)
    const cov = dishCoverage(dish("canh_su_su_suon"), src);
    expect(cov).toBeCloseTo(0.575, 2);
    expect(cov).toBeLessThan(0.6);
  });

  it("sits in the anchored tier for a disputed condiment", () => {
    // gà kho nước dừa: thịt gà(352, corr) + nước dừa(200, disputed) + mắm(25) → 0.65
    const cov = dishCoverage(dish("ga_kho_nuoc_dua"), src);
    expect(cov).toBeGreaterThanOrEqual(0.6);
    expect(cov).toBeLessThan(0.85);
  });
});

describe("D3 gate – 3 tiers, honest about certainty", () => {
  it("maps coverage to the right mode at the configured thresholds", () => {
    expect(displayModeFor(0.95)).toBe("number");
    expect(displayModeFor(D3_CONFIG.number)).toBe("number");
    expect(displayModeFor(0.7)).toBe("anchored");
    expect(displayModeFor(D3_CONFIG.range)).toBe("anchored");
    expect(displayModeFor(0.4)).toBe("range");
  });

  it("emits no range for a confident number", () => {
    const d = toDisplay({ kcal: 500, proteinG: 30, carbG: 40, fatG: 20, fiberG: 5 }, 0.9);
    expect(d.mode).toBe("number");
    expect(d.range).toBeUndefined();
  });

  it("widens the band as coverage falls", () => {
    const point = { kcal: 500, proteinG: 30, carbG: 40, fatG: 20, fiberG: 5 };
    const mid = toDisplay(point, 0.7);
    const low = toDisplay(point, 0.3);
    expect(mid.range).toBeDefined();
    const midSpread = mid.range!.high.kcal - mid.range!.low.kcal;
    const lowSpread = low.range!.high.kcal - low.range!.low.kcal;
    expect(lowSpread).toBeGreaterThan(midSpread);
  });

  it("clamps the margin ratio to [0.05, 0.30]", () => {
    expect(marginRatio(1)).toBeCloseTo(0.05, 5);
    expect(marginRatio(0)).toBeCloseTo(0.3, 5);
  });

  it("never produces a negative lower bound", () => {
    const d = toDisplay({ kcal: 10, proteinG: 0, carbG: 0, fatG: 0, fiberG: 0 }, 0.1);
    expect(d.range!.low.proteinG).toBeGreaterThanOrEqual(0);
  });
});

describe("adequacy – đủ/thiếu vs Nhu cầu 2016 (no restriction framing)", () => {
  const hh = DEFAULT_HOUSEHOLD;

  it("sums household need across members", () => {
    const need = householdNeed(hh);
    // 2 adults (2200F+2700M) + 2 children (1740 + 1320) = 7960 kcal
    expect(need.kcal).toBe(7960);
  });

  it("labels a well-fed day as đủ", () => {
    const day = { kcal: 8000, proteinG: 260, carbG: 1000, fatG: 200, fiberG: 40 };
    const a = householdAdequacy(day, hh);
    expect(a.kcalLabel).toBe("đủ");
  });

  it("labels a thin day as thiếu – never as vượt", () => {
    const day = { kcal: 3000, proteinG: 80, carbG: 400, fatG: 60, fiberG: 15 };
    const a = householdAdequacy(day, hh);
    expect(a.kcalLabel).toBe("thiếu");
    // adequacy vocabulary has no "vượt" – only đủ | thiếu
    expect(["đủ", "thiếu"]).toContain(a.kcalLabel);
  });

  it("gives each member their need-weighted share", () => {
    const day = { kcal: 8000, proteinG: 260, carbG: 1000, fatG: 200, fiberG: 40 };
    const child = hh.members.find((m) => m.ageBand === "3-5")!;
    const a = memberAdequacy(day, child, hh);
    expect(a.kcalRatio).toBeGreaterThan(0.9);
  });
});

describe("groupsCheck – 4 nhóm + trái cây", () => {
  it("flags a rice+protein+veg+fruit day as complete", () => {
    const dishes = [dish("ga_kho_gung"), dish("rau_muong_xao_toi"), dish("tm_chuoi")];
    const check = groupsCheck(dishes, src);
    expect(check.present.has("đạm")).toBe(true);
    expect(check.present.has("xơ")).toBe(true);
    expect(check.hasFruit).toBe(true);
  });

  it("reports missing core groups for a veg-only meal", () => {
    const check = groupsCheck([dish("rau_muong_luoc")], src);
    expect(check.missingCore).toContain("đạm");
    expect(check.missingCore).toContain("tinh bột");
  });
});
