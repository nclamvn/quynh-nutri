import { describe, expect, it } from "vitest";
import { COMMODITY_BY_ID } from "@/data/seed/commodity";
import {
  INGREDIENT_HANDLING_GUIDES,
  KITCHEN_GUIDE_SOURCES,
  kitchenGuideFor,
} from "@/data/seed/kitchen-guides";

describe("kitchen execution guide registry", () => {
  it("prefers ingredient guidance over category fallback", () => {
    const fish = kitchenGuideFor(COMMODITY_BY_ID.ca_dieu_hong);
    const vegetable = kitchenGuideFor(COMMODITY_BY_ID.rau_muong);

    expect(fish?.guide.id).toBe("fresh-whole-fish");
    expect(fish?.guide.specificity).toBe("ingredient");
    expect(vegetable?.guide.id).toBe("fresh-produce-category");
    expect(vegetable?.guide.specificity).toBe("category");
  });

  it("returns undefined instead of inventing guidance for uncovered food", () => {
    expect(kitchenGuideFor(COMMODITY_BY_ID.duong)).toBeUndefined();
  });

  it("requires every guide to have complete, HTTPS provenance", () => {
    const sources = new Map(KITCHEN_GUIDE_SOURCES.map((source) => [source.id, source]));

    for (const guide of INGREDIENT_HANDLING_GUIDES) {
      expect(guide.sourceIds.length, `${guide.id} has no source`).toBeGreaterThan(0);
      expect(guide.selection.length, `${guide.id} has no selection guidance`).toBeGreaterThan(0);
      expect(guide.storage.length, `${guide.id} has no storage guidance`).toBeGreaterThan(0);
      expect(guide.preparation.length, `${guide.id} has no preparation guidance`).toBeGreaterThan(0);

      for (const sourceId of guide.sourceIds) {
        const source = sources.get(sourceId);
        expect(source, `${guide.id} references missing source ${sourceId}`).toBeDefined();
        expect(source?.url.startsWith("https://")).toBe(true);
        expect(source?.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});
