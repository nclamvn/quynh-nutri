import { describe, it, expect } from "vitest";
import { canGenerate, activeLifeStages, isPregnant, isLactating, canSetMaternalStage } from "./index";
import type { Household, HealthProfile } from "@/domain/types";

const hh = (members: Household["members"]): Household => ({
  id: "h", name: "H", size: members.length, marketMode: "mixed", cookTimeCapMin: 45,
  busyDays: [], lactatingMember: false, members,
});

describe("special-diets guard (dormant clinical backstop)", () => {
  it("wellness or no profile always allows generation", () => {
    expect(canGenerate(undefined)).toBe(true);
    expect(canGenerate({ lifeStage: "pregnant_t2", mode: "wellness" })).toBe(true);
  });

  it("REFUSES clinical mode without an expert-set record (app executes, not prescribes)", () => {
    const p: HealthProfile = { lifeStage: "none", mode: "clinical" };
    expect(canGenerate(p)).toBe(false);
  });

  it("allows clinical mode only once a professional set it", () => {
    const p: HealthProfile = { lifeStage: "none", mode: "clinical", expertSet: { by: "BS. A", at: "2026-01-01", ref: "QĐ2879" } };
    expect(canGenerate(p)).toBe(true);
  });

  it("lists members with an active life stage", () => {
    const h = hh([
      { id: "m1", role: "adult", sex: "F", activity: "moderate", healthProfile: { lifeStage: "pregnant_t2", mode: "wellness" } },
      { id: "m2", role: "adult", sex: "M", activity: "moderate" },
      { id: "m3", role: "adult", sex: "F", activity: "light", healthProfile: { lifeStage: "none", mode: "wellness" } },
    ]);
    expect(activeLifeStages(h)).toEqual([{ memberId: "m1", lifeStage: "pregnant_t2" }]);
  });

  it("classifies stages", () => {
    expect(isPregnant("pregnant_t1")).toBe(true);
    expect(isPregnant("lactating_0_6")).toBe(false);
    expect(isLactating("lactating_7_12")).toBe(true);
  });

  it("gates maternal stages to adult females (respects data, no inference)", () => {
    expect(canSetMaternalStage({ role: "adult", sex: "F" })).toBe(true);
    expect(canSetMaternalStage({ role: "adult", sex: "M" })).toBe(false);
    expect(canSetMaternalStage({ role: "child", sex: "F" })).toBe(false);
  });
});
