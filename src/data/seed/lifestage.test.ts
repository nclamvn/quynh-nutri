import { describe, it, expect } from "vitest";
import { lifeStageUplift, lifeStageMicros, effectiveLifeStage } from "./lifestage";
import { dailyNeed } from "./needs";
import type { Member } from "@/domain/types";

const F = (healthProfile?: Member["healthProfile"]): Member => ({ id: "m", role: "adult", sex: "F", activity: "moderate", healthProfile });

describe("life-stage needs (honest when unsourced)", () => {
  it("applies the sourced lactating 0–6 uplift (P3): +505 kcal / +19 g", () => {
    const u = lifeStageUplift(F({ lifeStage: "lactating_0_6", mode: "wellness" }));
    expect(u).toMatchObject({ lifeStage: "lactating_0_6", applied: true, kcal: 505, proteinG: 19, source: "P3" });
    const base = dailyNeed(F());
    const withStage = dailyNeed(F({ lifeStage: "lactating_0_6", mode: "wellness" }));
    expect(withStage.kcal - base.kcal).toBe(505);
    expect(withStage.proteinG - base.proteinG).toBe(19);
  });

  it("applies the sourced VN pregnancy increments (P2): T2 +250 kcal / +10 g", () => {
    const u = lifeStageUplift(F({ lifeStage: "pregnant_t2", mode: "wellness" }));
    expect(u).toMatchObject({ lifeStage: "pregnant_t2", applied: true, kcal: 250, proteinG: 10, source: "P2" });
    const base = dailyNeed(F());
    const t3 = dailyNeed(F({ lifeStage: "pregnant_t3", mode: "wellness" }));
    expect(t3.kcal - base.kcal).toBe(450);
    expect(t3.proteinG - base.proteinG).toBe(31);
  });

  it("adds NO number for a still-unsourced stage (lactating 7–12) — honest, not fabricated", () => {
    const u = lifeStageUplift(F({ lifeStage: "lactating_7_12", mode: "wellness" }));
    expect(u).toMatchObject({ lifeStage: "lactating_7_12", applied: false, kcal: 0, proteinG: 0, source: null });
    expect(dailyNeed(F({ lifeStage: "lactating_7_12", mode: "wellness" }))).toEqual(dailyNeed(F()));
  });

  it("micronutrient needs are honest_null until sourced", () => {
    const rows = lifeStageMicros(F({ lifeStage: "pregnant_t3", mode: "wellness" }));
    expect(rows.map((r) => r.nutrient)).toEqual(["iron", "folate", "calcium", "iodine"]);
    expect(rows.every((r) => r.need === null && r.source === null)).toBe(true);
    expect(lifeStageMicros(F())).toEqual([]); // no stage → no rows
  });

  it("per-member profile wins over the legacy household lactating flag", () => {
    expect(effectiveLifeStage(F({ lifeStage: "pregnant_t1", mode: "wellness" }), true)).toBe("pregnant_t1");
    expect(effectiveLifeStage(F(), true)).toBe("lactating_0_6"); // legacy fallback for adult F
    expect(effectiveLifeStage(F(), false)).toBe("none");
  });
});
