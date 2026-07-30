import { describe, it, expect } from "vitest";
import { COMMODITY_BY_ID } from "@/data/seed/commodity";
import { REPERTOIRE_BY_ID, REPERTOIRE } from "@/data/seed/repertoire";
import { DEFAULT_HOUSEHOLD } from "@/data/seed/household";
import type { Household } from "@/domain/types";
import type { CommoditySource } from "@/domain/nutrition/calculator";
import { dishAllowed, dietaryRepertoire, householdAllergens } from "./dietary";

const src: CommoditySource = (id) => COMMODITY_BY_ID[id];
const dish = (id: string) => REPERTOIRE_BY_ID[id];
const withDiet = (patch: Partial<Household>): Household => ({ ...DEFAULT_HOUSEHOLD, ...patch });

describe("dietary filter", () => {
  it("allows everything when no allergies/restrictions", () => {
    expect(dishAllowed(dish("tom_rang"), DEFAULT_HOUSEHOLD, src)).toBe(true);
    expect(dietaryRepertoire(REPERTOIRE, DEFAULT_HOUSEHOLD, src).length).toBe(REPERTOIRE.length);
  });

  it("shellfish allergy excludes shrimp/crab dishes – even a soup whose proteinType is 'rau'", () => {
    const hh = withDiet({ members: [{ id: "m", role: "adult", activity: "moderate", allergies: ["shellfish"] }] });
    expect(householdAllergens(hh).has("shellfish")).toBe(true);
    expect(dishAllowed(dish("tom_rang"), hh, src)).toBe(false); // MẶN shrimp
    expect(dishAllowed(dish("ghe_hap"), hh, src)).toBe(false); // crab
    expect(dishAllowed(dish("canh_bi_dao_tom"), hh, src)).toBe(false); // canh (proteinType rau) w/ tôm
    expect(dishAllowed(dish("ga_luoc"), hh, src)).toBe(true); // chicken ok
  });

  it("vegetarian excludes any dish with meat/fish/seafood ingredients", () => {
    const hh = withDiet({ restrictions: ["vegetarian"] });
    expect(dishAllowed(dish("bo_kho"), hh, src)).toBe(false);
    expect(dishAllowed(dish("ca_kho_to"), hh, src)).toBe(false);
    expect(dishAllowed(dish("canh_cua_rau_day"), hh, src)).toBe(false); // field crab
    expect(dishAllowed(dish("rau_muong_xao_toi"), hh, src)).toBe(true);
    expect(dishAllowed(dish("dau_hu_sot_ca"), hh, src)).toBe(false); // has pork
    expect(dishAllowed(dish("trung_chien"), hh, src)).toBe(true); // egg ok (lacto-ovo)
  });

  it("no_pork / no_beef exclude by primary protein", () => {
    expect(dishAllowed(dish("thit_kho_trung"), withDiet({ restrictions: ["no_pork"] }), src)).toBe(false);
    expect(dishAllowed(dish("bo_luc_lac"), withDiet({ restrictions: ["no_beef"] }), src)).toBe(false);
    expect(dishAllowed(dish("ga_luoc"), withDiet({ restrictions: ["no_pork"] }), src)).toBe(true);
  });

  it("dietaryRepertoire shrinks the pool honestly", () => {
    const veg = dietaryRepertoire(REPERTOIRE, withDiet({ restrictions: ["vegetarian"] }), src);
    expect(veg.length).toBeGreaterThan(0);
    expect(veg.length).toBeLessThan(REPERTOIRE.length);
    expect(veg.every((d) => dishAllowed(d, withDiet({ restrictions: ["vegetarian"] }), src))).toBe(true);
  });
});
