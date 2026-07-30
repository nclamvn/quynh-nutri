import { describe, expect, it } from "vitest";
import { REPERTOIRE, REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import {
  COOKING_GUIDES,
  COOKING_GUIDE_SOURCE_BY_ID,
} from "@/data/seed/cooking-guides";
import {
  nextIncompleteStep,
  parseCookingSession,
  resolveCookingGuide,
  scaleDishLines,
} from "./cooking";

const REQUIRED_DISH_IDS = REPERTOIRE.map((dish) => dish.id);

describe("cooking guide registry", () => {
  it("covers every B0 dish exactly once with stable dish-specific steps", () => {
    expect(COOKING_GUIDES.map((guide) => guide.dishId).sort()).toEqual(
      REQUIRED_DISH_IDS.slice().sort(),
    );
    expect(new Set(COOKING_GUIDES.map((guide) => guide.dishId)).size).toBe(
      REPERTOIRE.length,
    );
    for (const guide of COOKING_GUIDES) {
      expect(REPERTOIRE_BY_ID[guide.dishId]).toBeDefined();
      expect(guide.specificity).toBe("dish");
      expect(guide.steps.length).toBeGreaterThanOrEqual(3);
      expect(guide.estimatedTotalMin).toBeGreaterThanOrEqual(5);
      expect(guide.estimatedTotalMin).toBeLessThanOrEqual(240);
      expect(Number.isInteger(guide.estimatedTotalMin)).toBe(true);
      expect(new Set(guide.steps.map((step) => step.id)).size).toBe(guide.steps.length);
      expect(guide.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(guide.sourceIds.length).toBeGreaterThan(0);
      expect(guide.sourceIds.every((id) => COOKING_GUIDE_SOURCE_BY_ID[id])).toBe(true);
    }
  });

  it("attaches an official source to every temperature or safety check", () => {
    for (const guide of COOKING_GUIDES) {
      for (const recipeStep of guide.steps) {
        if (!recipeStep.safetyCheck) continue;
        expect(recipeStep.sourceIds?.length).toBeGreaterThan(0);
        expect(
          recipeStep.sourceIds?.every((id) => COOKING_GUIDE_SOURCE_BY_ID[id]),
        ).toBe(true);
      }
    }
  });

  it("keeps produce guidance source-backed and free of soap washing", () => {
    const produceContent = COOKING_GUIDES
      .filter((guide) => guide.sourceIds.includes("fda-produce"))
      .map((guide) => guide.steps.map((item) => `${item.instruction.vi} ${item.instruction.en}`).join(" "))
      .join(" ")
      .toLowerCase();
    expect(produceContent).toContain("running water");
    expect(produceContent).not.toMatch(/rửa (bằng|với) xà phòng|wash (with|using) soap/);
  });

  it("uses the reviewed temperature or visual check for each newly covered risk group", () => {
    const contentFor = (dishId: string) =>
      JSON.stringify(COOKING_GUIDES.find((guide) => guide.dishId === dishId));
    for (const dishId of [
      "ba_chi_luoc", "suon_xao_chua_ngot", "suon_nuong",
      "bo_xao_can", "bo_kho", "bo_luc_lac",
      "canh_su_su_suon", "canh_bi_xanh_suon",
    ]) {
      expect(contentFor(dishId)).toContain("63°C");
      expect(contentFor(dishId)).toMatch(/3 phút|3 minutes/);
    }
    for (const dishId of ["thit_bam_xao_muop", "dau_hu_sot_ca", "canh_cai_thit", "trung_hap_thit"]) {
      expect(contentFor(dishId)).toContain("71°C");
    }
    for (const dishId of ["ga_luoc", "ga_rang_muoi", "ga_kho_nuoc_dua"]) {
      expect(contentFor(dishId)).toContain("74°C");
    }
    for (const dishId of ["ca_nuong", "ca_hap_xi_dau", "canh_chua_ca"]) {
      expect(contentFor(dishId)).toContain("63°C");
    }
    for (const dishId of ["tom_hap", "ghe_hap", "cua_rang_me", "canh_cua_rau_day", "canh_rieu_cua", "canh_mong_toi_tom"]) {
      expect(contentFor(dishId)).toMatch(/ngọc trai|pearly/);
      expect(contentFor(dishId)).toMatch(/đục|opaque/);
    }
  });

  it("treats fresh fruit as clean preparation rather than invented cooking", () => {
    for (const dishId of ["tm_chuoi", "tm_cam", "tm_dua_hau", "tm_thanh_long"]) {
      const guide = COOKING_GUIDES.find((item) => item.dishId === dishId)!;
      expect(guide.sourceIds).toContain("fda-produce");
      expect(guide.steps).toHaveLength(3);
      expect(JSON.stringify(guide)).toMatch(/Dọn bằng dụng cụ sạch|Serve with clean utensils/);
      expect(JSON.stringify(guide)).not.toMatch(/°C|temperature/);
    }
  });

  it("fails honestly for unsupported dishes", () => {
    expect(
      resolveCookingGuide("unsupported", COOKING_GUIDES, COOKING_GUIDE_SOURCE_BY_ID),
    ).toBeUndefined();
  });
});

describe("cooking domain", () => {
  it("scales ingredient lines and uses base servings for an empty household", () => {
    const dish = REPERTOIRE_BY_ID.ca_kho_to;
    const half = scaleDishLines(dish, 2);
    expect(half[0].qtyBase).toBe(dish.lines[0].qtyBase / 2);
    expect(scaleDishLines(dish, 0)).toEqual(dish.lines);
  });

  it("restores a valid session and rejects stale, malformed or unknown steps", () => {
    const guide = COOKING_GUIDES[0];
    const valid = {
      dishId: guide.dishId,
      guideId: guide.id,
      completedStepIds: [guide.steps[0].id],
      startedAt: "2026-07-29T00:00:00.000Z",
    };
    expect(parseCookingSession(JSON.stringify(valid), guide)).toEqual(valid);
    expect(parseCookingSession("{", guide)).toBeUndefined();
    expect(
      parseCookingSession(
        JSON.stringify({ ...valid, completedStepIds: ["removed-step"] }),
        guide,
      ),
    ).toBeUndefined();
    expect(
      parseCookingSession(JSON.stringify({ ...valid, guideId: "old-guide" }), guide),
    ).toBeUndefined();
  });

  it("returns the first incomplete step without mutating progress", () => {
    const guide = COOKING_GUIDES[0];
    expect(nextIncompleteStep(guide, [])?.id).toBe(guide.steps[0].id);
    expect(nextIncompleteStep(guide, [guide.steps[0].id])?.id).toBe(guide.steps[1].id);
    expect(nextIncompleteStep(guide, guide.steps.map((step) => step.id))).toBeUndefined();
  });
});
