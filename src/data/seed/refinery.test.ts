import { describe, it, expect } from "vitest";
import { COMMODITY_BY_ID } from "./commodity";
import { REPERTOIRE, REPERTOIRE_BY_ID } from "./repertoire";
import { slotTarget } from "./portions";
import { dishMacro, dishCoverage, displayModeFor, addMacro, ZERO_MACRO } from "@/domain/nutrition";
import type { CommoditySource } from "@/domain/nutrition/calculator";

const src: CommoditySource = (id) => COMMODITY_BY_ID[id];
const AE = 3.2; // baseServings 4 = 2 adults + 2 children
const PROTEIN_GROUPS = new Set(["thịt", "cá", "hải sản", "trứng", "đậu"]);

describe("refinery — every dish is principled & sourced", () => {
  it("references only known commodities", () => {
    for (const d of REPERTOIRE) {
      for (const l of d.lines) {
        expect(COMMODITY_BY_ID[l.commodityId], `${d.id} → ${l.commodityId}`).toBeDefined();
      }
    }
  });

  it("quantifies each MẶN main protein near the portion-model anchor", () => {
    const MAN = slotTarget("MAN", AE);
    const manDishes = REPERTOIRE.filter((d) => d.slot === "MAN");
    for (const d of manDishes) {
      const proteinGrams = d.lines
        .filter((l) => PROTEIN_GROUPS.has(COMMODITY_BY_ID[l.commodityId]?.group))
        .reduce((s, l) => s + l.qtyBase, 0);
      // within [0.65, 1.4] × anchor — derived from the model, not ad-hoc
      expect(proteinGrams, d.id).toBeGreaterThanOrEqual(MAN * 0.65);
      expect(proteinGrams, d.id).toBeLessThanOrEqual(MAN * 1.4);
    }
  });

  it("quantifies each RAU side near the veg anchor", () => {
    const RAU = slotTarget("RAU", AE);
    for (const d of REPERTOIRE.filter((x) => x.slot === "RAU")) {
      const veg = d.lines.filter((l) => COMMODITY_BY_ID[l.commodityId]?.group === "rau").reduce((s, l) => s + l.qtyBase, 0);
      expect(veg, d.id).toBeGreaterThanOrEqual(RAU * 0.8);
      expect(veg, d.id).toBeLessThanOrEqual(RAU * 1.2);
    }
  });

  it("gives a full dinner mâm a sane per-person energy & protein", () => {
    // COM + MẶN + RAU + CANH + tráng miệng
    const mam = ["com_trang", "ga_kho_gung", "rau_muong_xao_toi", "canh_rau_ngot_thit", "tm_chuoi"];
    let total = ZERO_MACRO;
    for (const id of mam) total = addMacro(total, dishMacro(REPERTOIRE_BY_ID[id], src, 4));
    const perAE_kcal = total.kcal / AE;
    const perAE_protein = total.proteinG / AE;
    // one substantial home dinner: generous but not absurd
    expect(perAE_kcal).toBeGreaterThan(450);
    expect(perAE_kcal).toBeLessThan(1200);
    expect(perAE_protein).toBeGreaterThan(20);
    expect(perAE_protein).toBeLessThan(70);
  });
});

describe("refinery — D3 coverage report", () => {
  it("exercises all three display tiers across the repertoire", () => {
    const tiers = { number: 0, anchored: 0, range: 0 };
    for (const d of REPERTOIRE) {
      tiers[displayModeFor(dishCoverage(d, src))]++;
    }
    // Log the distribution — this is the refinery's honesty readout.
    console.log(`D3 tiers → number:${tiers.number} anchored:${tiers.anchored} range:${tiers.range}`);
    expect(tiers.number).toBeGreaterThan(0);
    expect(tiers.anchored).toBeGreaterThan(0);
    expect(tiers.range).toBeGreaterThan(0);
  });

  it("keeps disputed sources honest (no false corroboration)", () => {
    // suon_heo, nuoc_dua stay disputed after refinery R1
    expect(COMMODITY_BY_ID["suon_heo"].confidence).toBe("disputed");
    expect(COMMODITY_BY_ID["nuoc_dua"].confidence).toBe("disputed");
    // cua_dong was correctly promoted (macro is well-attested)
    expect(COMMODITY_BY_ID["cua_dong"].confidence).toBe("corroborated");
  });
});
