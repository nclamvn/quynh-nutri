import { describe, it, expect } from "vitest";
import { dayMicros, pregnancyMicroAdequacy, MICRO_RNI } from "./micronutrients";
import { COMMODITY_BY_ID } from "@/data/seed/commodity";
import type { Dish, Household, Member } from "@/domain/types";

const src = (id: string) => COMMODITY_BY_ID[id];
// A dish for 4: 350g beef (Fe 3.1/100g → 10.85mg) + 200g water spinach (Fe 1.4 → 2.8mg).
const dish = (): Dish => ({
  id: "d", vnName: "Bò xào rau muống", proteinType: "bo", method: "xao", slot: "MAN", quick: false, baseServings: 4,
  lines: [{ commodityId: "thit_bo", qtyBase: 350, unit: "g" }, { commodityId: "rau_muong", qtyBase: 200, unit: "g" }],
  origin: "B0",
});

describe("micronutrients (real VN FCT data, honest coverage)", () => {
  it("sums iron from real P1 values, scaled to servings", () => {
    const { totals } = dayMicros([dish()], src, 4);
    // 350g beef ×3.1/100 + 200g spinach ×1.4/100 = 10.85 + 2.8 = 13.65 mg
    expect(totals.iron).toBeCloseTo(13.65, 1);
    // folate: beef has none, spinach 194/100g ×200 = 388 µg
    expect(totals.folate).toBeCloseTo(388, 0);
  });

  it("coverage reflects the mass that actually has data for the nutrient", () => {
    const { massWith, totalMass } = dayMicros([dish()], src, 4);
    expect(totalMass).toBe(550);
    expect(massWith.iron).toBe(550); // both ingredients have iron
    expect(massWith.folate).toBe(200); // only spinach has folate → lower coverage
  });

  it("pregnancy adequacy states need + coverage, never fabricates iodine", () => {
    const member: Member = { id: "m", role: "adult", sex: "F", activity: "moderate", healthProfile: { lifeStage: "pregnant_t2", mode: "wellness" } };
    const hh: Household = { id: "h", name: "H", size: 1, marketMode: "mixed", cookTimeCapMin: 45, busyDays: [], lactatingMember: false, members: [member] };
    const rows = pregnancyMicroAdequacy([dish()], member, hh, src);
    expect(rows.map((r) => r.nutrient)).toEqual(["iron", "folate", "calcium", "zinc", "vitA", "vitC"]);
    const iron = rows.find((r) => r.nutrient === "iron")!;
    expect(iron.need).toBe(27);
    expect(iron.ratioPct).toBeGreaterThan(0);
    expect(iron.coveragePct).toBe(100);
    const folate = rows.find((r) => r.nutrient === "folate")!;
    expect(folate.coveragePct).toBeLessThan(100); // partial data → honest coverage
    // iodine is intentionally absent (no reliable food data)
    expect(rows.find((r) => (r.nutrient as string) === "iodine")).toBeUndefined();
    expect(MICRO_RNI.iron.unit).toBe("mg");
  });
});
