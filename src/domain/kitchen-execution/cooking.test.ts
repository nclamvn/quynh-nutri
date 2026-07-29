import { describe, expect, it } from "vitest";
import { REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
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

const REQUIRED_DISH_IDS = [
  "com_trang",
  "thit_kho_trung",
  "ga_kho_gung",
  "ca_kho_to",
  "ca_chien_sot_ca",
  "tom_rang",
  "trung_chien",
  "rau_muong_xao_toi",
  "cai_ngot_luoc",
  "bi_xanh_luoc",
  "canh_bi_dao_tom",
  "canh_rau_ngot_thit",
];

describe("cooking guide registry", () => {
  it("contains exactly the 12 reviewed dish-specific guides with stable steps", () => {
    expect(COOKING_GUIDES.map((guide) => guide.dishId).sort()).toEqual(
      REQUIRED_DISH_IDS.slice().sort(),
    );
    expect(new Set(COOKING_GUIDES.map((guide) => guide.dishId)).size).toBe(12);
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
