import { describe, it, expect } from "vitest";
import { COMMODITY_BY_ID } from "@/data/seed/commodity";
import { REPERTOIRE, REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import { DEFAULT_HOUSEHOLD } from "@/data/seed/household";
import type { CommoditySource } from "@/domain/nutrition/calculator";
import type { WeekPlan, PantryItem } from "@/domain/types";
import { aggregateShopping } from "@/domain/shopping";
import { cookFromPantry } from "./index";

const commodities: CommoditySource = (id) => COMMODITY_BY_ID[id];
const dishes = (id: string) => REPERTOIRE_BY_ID[id];
const planWith = (dishId: string): WeekPlan => ({
  householdId: "hh", weekStart: "2026-07-27",
  slots: [{ day: 0, occasion: "dinner", slot: "MAN", dishId, locked: false }],
});

describe("pantry deduction in shopping", () => {
  // ga_luoc: 352g edible thịt gà ÷ 0.66 yield ≈ 533g to buy
  it("drops an item fully covered by pantry", () => {
    const pantry: PantryItem[] = [{ commodityId: "thit_ga", qty: 600, unit: "g" }];
    const items = aggregateShopping(planWith("ga_luoc"), dishes, commodities, DEFAULT_HOUSEHOLD, [], pantry);
    expect(items.find((i) => i.commodityId === "thit_ga")).toBeUndefined();
  });

  it("buys only the shortfall when pantry partly covers", () => {
    const pantry: PantryItem[] = [{ commodityId: "thit_ga", qty: 300, unit: "g" }];
    const items = aggregateShopping(planWith("ga_luoc"), dishes, commodities, DEFAULT_HOUSEHOLD, [], pantry);
    const ga = items.find((i) => i.commodityId === "thit_ga");
    expect(ga).toBeDefined();
    expect(ga!.qtyTotal).toBe(233); // 533 need − 300 have
  });

  it("no pantry → unchanged (buys full amount)", () => {
    const items = aggregateShopping(planWith("ga_luoc"), dishes, commodities, DEFAULT_HOUSEHOLD);
    expect(items.find((i) => i.commodityId === "thit_ga")!.qtyTotal).toBe(533);
  });
});

describe("cookFromPantry", () => {
  it("ranks a fully-stocked dish at coverage 1", () => {
    const pantry: PantryItem[] = [{ commodityId: "rau_muong", qty: 500, unit: "g" }];
    const matches = cookFromPantry(pantry, REPERTOIRE);
    const top = matches[0];
    expect(top.coverage).toBe(1); // rau_muong_luoc is only rau muống
    expect(top.dish.lines.every((l) => l.commodityId === "rau_muong")).toBe(true);
  });

  it("does not count a depleted lot as available", () => {
    const depleted = [{ commodityId: "rice", qty: 0, unit: "g" }];
    const dish = {
      id: "rice-dish",
      vnName: "Cơm",
      proteinType: "rau" as const,
      method: "luoc" as const,
      slot: "COM" as const,
      quick: true,
      baseServings: 4,
      origin: "B0" as const,
      lines: [{ commodityId: "rice", qtyBase: 100, unit: "g" }],
    };
    expect(cookFromPantry(depleted, [dish])[0]).toMatchObject({
      coverage: 0,
      missing: ["rice"],
    });
  });

  it("lists missing ingredients for partially-stocked dishes", () => {
    const pantry: PantryItem[] = [{ commodityId: "thit_ga", qty: 700, unit: "g" }];
    const matches = cookFromPantry(pantry, REPERTOIRE);
    const gaKho = matches.find((m) => m.dish.id === "ga_kho_gung")!;
    expect(gaKho.coverage).toBeGreaterThan(0);
    expect(gaKho.coverage).toBeLessThan(1);
    expect(gaKho.missing).toContain("gung");
  });
});
