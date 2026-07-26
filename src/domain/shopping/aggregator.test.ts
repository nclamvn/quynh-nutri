import { describe, it, expect } from "vitest";
import { COMMODITY_BY_ID } from "@/data/seed/commodity";
import { REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import { DEFAULT_HOUSEHOLD } from "@/data/seed/household";
import type { CommoditySource } from "@/domain/nutrition/calculator";
import type { WeekPlan, PlannedSlot } from "@/domain/types";
import { aggregateShopping, groupByTrip } from "./aggregator";

const commodities: CommoditySource = (id) => COMMODITY_BY_ID[id];
const dishes = (id: string) => REPERTOIRE_BY_ID[id];

function planWith(slots: Partial<PlannedSlot>[]): WeekPlan {
  return {
    householdId: "hh_default",
    weekStart: "2026-07-27",
    slots: slots.map((s) => ({ day: 0, slot: "MAN", locked: false, dishId: "", ...s })) as PlannedSlot[],
  };
}

describe("aggregateShopping — derive list from plan", () => {
  it("aggregates the same commodity across dishes, grossed up by yield", () => {
    // tôm edible: tom_rang(352) + canh_bi_dao_tom(96) = 448; yield 0.6 → buy ~747g
    const plan = planWith([
      { day: 0, slot: "MAN", dishId: "tom_rang" },
      { day: 1, slot: "CANH", dishId: "canh_bi_dao_tom" },
    ]);
    const items = aggregateShopping(plan, dishes, commodities, DEFAULT_HOUSEHOLD);
    const tom = items.find((i) => i.commodityId === "tom");
    expect(tom).toBeDefined();
    expect(tom!.qtyTotal).toBe(747);
  });

  it("scales quantities to household size (edible → purchased)", () => {
    // thịt gà edible 352 for 4 → 704 for 8; yield 0.66 → buy ~1067g
    const plan = planWith([{ day: 0, slot: "MAN", dishId: "ga_luoc" }]);
    const big = { ...DEFAULT_HOUSEHOLD, size: 8 };
    const items = aggregateShopping(plan, dishes, commodities, big);
    const ga = items.find((i) => i.commodityId === "thit_ga");
    expect(ga!.qtyTotal).toBe(1067);
  });

  it("routes dry goods to the dry trip and fresh to fresh trips", () => {
    const plan = planWith([{ day: 5, slot: "MAN", dishId: "ca_kho_to" }]);
    const items = aggregateShopping(plan, dishes, commodities, DEFAULT_HOUSEHOLD);
    const oilOrSauce = items.find((i) => i.commodityId === "nuoc_mam");
    const fish = items.find((i) => i.commodityId === "ca_dieu_hong");
    expect(oilOrSauce!.kind).toBe("dry");
    expect(fish!.kind).toBe("fresh");
    // mixed household → 2 fresh trips; dry trip is 3
    expect(oilOrSauce!.trip).toBe(3);
  });

  it("buys fresh produce near its use day", () => {
    const early = planWith([{ day: 0, slot: "RAU", dishId: "rau_muong_luoc" }]);
    const late = planWith([{ day: 6, slot: "RAU", dishId: "rau_muong_luoc" }]);
    const e = aggregateShopping(early, dishes, commodities, DEFAULT_HOUSEHOLD);
    const l = aggregateShopping(late, dishes, commodities, DEFAULT_HOUSEHOLD);
    expect(e.find((i) => i.commodityId === "rau_muong")!.trip).toBe(1);
    expect(l.find((i) => i.commodityId === "rau_muong")!.trip).toBe(2);
  });

  it("preserves checked ticks across a re-plan (does not reset bought items)", () => {
    const plan = planWith([{ day: 0, slot: "MAN", dishId: "ga_luoc" }]);
    const first = aggregateShopping(plan, dishes, commodities, DEFAULT_HOUSEHOLD);
    const bought = first.map((i) => (i.commodityId === "thit_ga" ? { ...i, checked: true } : i));
    // re-plan adds a dish but ga is still needed → tick stays
    const plan2 = planWith([
      { day: 0, slot: "MAN", dishId: "ga_luoc" },
      { day: 1, slot: "RAU", dishId: "rau_muong_luoc" },
    ]);
    const second = aggregateShopping(plan2, dishes, commodities, DEFAULT_HOUSEHOLD, bought);
    expect(second.find((i) => i.commodityId === "thit_ga")!.checked).toBe(true);
    expect(second.find((i) => i.commodityId === "rau_muong")!.checked).toBe(false);
  });

  it("groups items by trip for display", () => {
    const plan = planWith([
      { day: 0, slot: "MAN", dishId: "ca_kho_to" },
      { day: 5, slot: "RAU", dishId: "rau_muong_luoc" },
    ]);
    const groups = groupByTrip(aggregateShopping(plan, dishes, commodities, DEFAULT_HOUSEHOLD));
    expect(groups.length).toBeGreaterThanOrEqual(2);
    expect(groups.map((g) => g.trip)).toEqual([...groups.map((g) => g.trip)].sort((a, b) => a - b));
  });
});
