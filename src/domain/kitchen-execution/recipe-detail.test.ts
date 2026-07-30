import { describe, expect, it } from "vitest";
import { REPERTOIRE, REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import {
  COOKING_GUIDES,
  cookingGuideFor,
} from "@/data/seed/cooking-guides";
import {
  detailedCookingGuide,
  resolveDishCooking,
} from "./recipe-detail";
import type { Dish } from "@/domain/types";

describe("reviewed recipe detail", () => {
  it("covers every B0 dish with equipment, timed steps and sensory cues", () => {
    expect(COOKING_GUIDES).toHaveLength(REPERTOIRE.length);
    for (const dish of REPERTOIRE) {
      const resolved = cookingGuideFor(dish.id);
      expect(resolved, dish.id).toBeDefined();
      const detail = detailedCookingGuide(dish, resolved!.guide);
      expect(detail.summary.vi.trim(), dish.id).not.toBe("");
      expect(detail.summary.en.trim(), dish.id).not.toBe("");
      expect(detail.equipment.length, dish.id).toBeGreaterThan(0);
      expect(detail.steps).toHaveLength(resolved!.guide.steps.length);
      for (const step of detail.steps) {
        expect(step.estimatedMin, `${dish.id}:${step.id}`).toBeGreaterThan(0);
        expect(step.sensoryCue.vi.trim(), `${dish.id}:${step.id}`).not.toBe("");
        expect(step.sensoryCue.en.trim(), `${dish.id}:${step.id}`).not.toBe("");
      }
      expect(
        detail.steps.reduce((sum, step) => sum + step.estimatedMin, 0),
        dish.id,
      ).toBe(resolved!.guide.estimatedTotalMin);
    }
  });

  it("adds a thermometer only when a reviewed step has a temperature check", () => {
    const pork = REPERTOIRE_BY_ID.thit_kho_trung;
    const rice = REPERTOIRE_BY_ID.com_trang;
    const porkDetail = detailedCookingGuide(
      pork,
      cookingGuideFor(pork.id)!.guide,
    );
    const riceDetail = detailedCookingGuide(
      rice,
      cookingGuideFor(rice.id)!.guide,
    );
    expect(porkDetail.equipment.some((item) => item.vi.includes("Nhiệt kế"))).toBe(true);
    expect(riceDetail.equipment.some((item) => item.vi.includes("Nhiệt kế"))).toBe(false);
  });

  it("inherits only an unchanged household fork and discloses the source", () => {
    const source = REPERTOIRE_BY_ID.ca_kho_to;
    const fork: Dish = {
      ...source,
      id: "hh-ca",
      origin: "B1",
      sourceRepertoireId: source.id,
      lines: source.lines.map((line) => ({ ...line })),
    };
    expect(resolveDishCooking(fork, source, cookingGuideFor)).toMatchObject({
      inheritedFromDishId: source.id,
    });
    expect(resolveDishCooking(
      { ...fork, lines: [{ ...fork.lines[0], qtyBase: fork.lines[0].qtyBase + 1 }] },
      source,
      cookingGuideFor,
    )).toBeUndefined();
  });

  it("never assigns reviewed guidance to a custom household dish", () => {
    const custom: Dish = {
      ...REPERTOIRE_BY_ID.ca_kho_to,
      id: "custom",
      origin: "B1",
      sourceRepertoireId: undefined,
    };
    expect(resolveDishCooking(custom, undefined, cookingGuideFor)).toBeUndefined();
  });
});
