import { describe, it, expect } from "vitest";
import { pregnancyWarnings, hasPregnancyData, householdHasPregnancy } from "./pregnancy";
import type { Dish, Member, Commodity } from "@/domain/types";

const C: Record<string, Partial<Commodity>> = {
  ca_thu_vua: { canonicalVn: "Cá thu vua", group: "cá", pregnancyHazards: [{ hazard: "high_mercury", source: "P6" }] },
  ca_hoi: { canonicalVn: "Cá hồi", group: "cá" }, // untagged
};
const src = (id: string) => (C[id] ? ({ id, ...C[id] } as Commodity) : undefined);
const dish = (ids: string[]): Dish => ({
  id: "d", vnName: "Món", proteinType: "ca", method: "kho", slot: "MAN", quick: false, baseServings: 4,
  lines: ids.map((commodityId) => ({ commodityId, qtyBase: 100, unit: "g" })), origin: "B0",
});
const preg: Member = { id: "m", role: "adult", sex: "F", activity: "moderate", healthProfile: { lifeStage: "pregnant_t2", mode: "wellness" } };
const none: Member = { id: "m", role: "adult", sex: "F", activity: "moderate" };

describe("pregnancy avoid-list (soft, sourced)", () => {
  it("warns on a sourced hazard ingredient for a pregnant member", () => {
    const w = pregnancyWarnings(dish(["ca_thu_vua", "ca_hoi"]), preg, src);
    expect(w).toEqual([{ hazard: "high_mercury", commodityId: "ca_thu_vua", source: "P6" }]);
  });

  it("no warning for a non-pregnant member (or untagged ingredients)", () => {
    expect(pregnancyWarnings(dish(["ca_thu_vua"]), none, src)).toEqual([]);
    expect(pregnancyWarnings(dish(["ca_hoi"]), preg, src)).toEqual([]); // untagged ≠ warning, ≠ "safe"
  });

  it("never excludes – it only returns warnings (dish stays available)", () => {
    // pregnancyWarnings returns data, not a filter; a warned dish is still in the repertoire.
    expect(Array.isArray(pregnancyWarnings(dish(["ca_thu_vua"]), preg, src))).toBe(true);
  });

  it("detects registry-seeded state + household pregnancy", () => {
    expect(hasPregnancyData([{ ...C.ca_thu_vua } as Commodity])).toBe(true);
    expect(hasPregnancyData([{ ...C.ca_hoi } as Commodity])).toBe(false);
    expect(householdHasPregnancy([preg])).toBe(true);
    expect(householdHasPregnancy([none])).toBe(false);
  });
});
