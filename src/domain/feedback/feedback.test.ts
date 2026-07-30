import { describe, expect, it } from "vitest";
import type {
  Commodity,
  Dish,
  InventoryMovement,
  LeftoverLot,
  LeftoverMovement,
  PurchaseRecord,
  ShoppingFulfillment,
} from "@/domain/types";
import type { ShoppingItem } from "@/domain/shopping";
import { weeklyFeedback } from "./index";

const commodities: Record<string, Commodity> = {
  pork: {
    id: "pork",
    canonicalVn: "Thịt heo",
    group: "thịt",
    provenanceLevel: "P1",
    confidence: "corroborated",
    sourceRefs: [],
    kcal: 0,
    proteinG: 0,
    carbG: 0,
    fatG: 0,
    fiberG: 0,
    edibleYield: 0.8,
    priceVndPerKg: 100_000,
  },
  herb: {
    id: "herb",
    canonicalVn: "Rau thơm",
    group: "rau",
    provenanceLevel: "P1",
    confidence: "corroborated",
    sourceRefs: [],
    kcal: 0,
    proteinG: 0,
    carbG: 0,
    fatG: 0,
    fiberG: 0,
  },
};
const commodity = (id: string) => commodities[id];
const shopping: ShoppingItem[] = [{
  commodityId: "pork",
  qtyTotal: 1_000,
  unit: "g",
  vendor: "Chợ",
  trip: 1,
  kind: "fresh",
  checked: false,
}];
const fulfillment: ShoppingFulfillment = {
  id: "fulfill-1",
  weekRef: "2026-07-27",
  commodityId: "pork",
  vendor: "Chợ",
  plannedQty: 1_000,
  actualQty: 800,
  unit: "g",
  boughtAt: "2026-07-28T02:00:00.000Z",
  pricePaid: 96_000,
  inventoryLotId: "lot-1",
};
const movement = (
  kind: "consumed" | "discarded",
  qty: number,
  unit = "g",
): InventoryMovement => ({
  id: `${kind}-${qty}`,
  idempotencyKey: crypto.randomUUID(),
  inventoryLotId: "lot-1",
  commodityId: "pork",
  kind,
  qty,
  unit,
  qtyBefore: 800,
  qtyAfter: 800 - qty,
  occurredAt: "2026-07-29T02:00:00.000Z",
  createdAt: "2026-07-29T02:00:00.000Z",
});
const dish: Dish = {
  id: "dish-1",
  vnName: "Thịt luộc rau thơm",
  proteinType: "heo",
  method: "luoc",
  slot: "MAN",
  quick: false,
  baseServings: 4,
  origin: "B0",
  lines: [
    { commodityId: "pork", qtyBase: 400, unit: "g" },
    { commodityId: "herb", qtyBase: 40, unit: "bó" },
  ],
};
const leftoverLot: LeftoverLot = {
  id: "leftover-1",
  idempotencyKey: crypto.randomUUID(),
  dishRef: dish.id,
  dishLabelSnapshot: dish.vnName,
  remainingServings: 1,
  preparedAt: "2026-07-29T04:00:00.000Z",
  chilledAt: "2026-07-29T04:30:00.000Z",
  storageLocation: "fridge",
  hotWeatherConfirmed: false,
  policyVersion: "test",
  sourceMealRunRef: "household:2026-07-27:1:created",
  createdAt: "2026-07-29T04:30:00.000Z",
  updatedAt: "2026-07-29T04:30:00.000Z",
};
const leftoverMovement = (
  kind: "consumed" | "discarded" | "corrected",
  servings: number,
): LeftoverMovement => ({
  id: `left-${kind}`,
  idempotencyKey: crypto.randomUUID(),
  leftoverLotId: leftoverLot.id,
  dishLabelSnapshot: dish.vnName,
  kind,
  servings,
  beforeServings: 2,
  afterServings: 2 - servings,
  occurredAt: "2026-07-30T02:00:00.000Z",
  createdAt: "2026-07-30T02:00:00.000Z",
});

const report = (overrides: Partial<Parameters<typeof weeklyFeedback>[0]> = {}) =>
  weeklyFeedback({
    weekRef: "2026-07-27",
    hasPlan: true,
    shopping,
    fulfillments: [fulfillment],
    inventoryMovements: [],
    leftoverLots: [],
    leftoverMovements: [],
    purchases: [],
    commodity,
    dish: (id) => id === dish.id ? dish : undefined,
    ...overrides,
  });

describe("weekly feedback", () => {
  it("keeps planned reference and actual paid bases separate", () => {
    const result = report();
    expect(result.planned.totalVnd).toBe(100_000);
    expect(result.actualSpend.valueVnd).toBe(96_000);
    expect(result.actualSpend.coveragePct).toBe(100);
  });

  it("derives quantity avoidance at the same paid line rate", () => {
    const result = report();
    expect(result.quantityVariance.avoidedSpendVnd).toBe(24_000);
    expect(result.quantityVariance.extraSpendVnd).toBe(0);
    expect(result.quantityVariance.coveragePct).toBe(100);
  });

  it("keeps missing actual price as a lower bound instead of zero certainty", () => {
    const result = report({
      fulfillments: [{ ...fulfillment, pricePaid: undefined }],
    });
    expect(result.actualSpend.valueVnd).toBe(0);
    expect(result.actualSpend.lowerBound).toBe(true);
    expect(result.quantityVariance.comparableCount).toBe(0);
  });

  it("values linked pantry use/waste only with compatible paid units", () => {
    const result = report({
      inventoryMovements: [
        movement("consumed", 200),
        movement("discarded", 100),
        movement("discarded", 1, "kg"),
      ],
    });
    expect(result.inventory.consumed.valueVnd).toBe(24_000);
    expect(result.inventory.discarded.valueVnd).toBe(12_000);
    expect(result.inventory.discarded.coveragePct).toBe(50);
    expect(result.inventory.discarded.lowerBound).toBe(true);
  });

  it("ignores pantry movements not linked to this week's fulfillment", () => {
    const result = report({
      inventoryMovements: [{ ...movement("discarded", 100), inventoryLotId: "other-lot" }],
    });
    expect(result.inventory.lines).toHaveLength(0);
    expect(result.stages.discarded).toBe(false);
  });

  it("estimates leftover reuse with edible yield and honest ingredient coverage", () => {
    const purchases: PurchaseRecord[] = [{
      id: "purchase",
      date: "2026-07-28T02:00:00.000Z",
      lines: [{ commodityId: "pork", qty: 800, unit: "g", pricePaid: 96_000 }],
    }];
    const result = report({
      purchases,
      leftoverLots: [leftoverLot],
      leftoverMovements: [
        leftoverMovement("consumed", 0.5),
        leftoverMovement("discarded", 0.25),
        leftoverMovement("corrected", 1),
      ],
    });
    // 400g edible / .8 yield = 500g purchased; 120k/kg / 4 = 15k/serving.
    expect(result.leftovers.reusedEstimated.valueVnd).toBe(7_500);
    expect(result.leftovers.discardedEstimated.valueVnd).toBe(3_750);
    expect(result.leftovers.reusedEstimated.coveragePct).toBe(50);
    expect(result.leftovers.correctionCount).toBe(1);
    expect(result.leftovers.consumedServings).toBe(0.5);
  });

  it("does not count another week's leftover activity", () => {
    const result = report({
      leftoverLots: [{ ...leftoverLot, sourceMealRunRef: "household:2026-07-20:1:created" }],
      leftoverMovements: [leftoverMovement("discarded", 1)],
    });
    expect(result.leftovers.lines).toHaveLength(0);
    expect(result.stages.discarded).toBe(false);
  });

  it("keeps a real plan stage when pantry coverage leaves nothing to buy", () => {
    const result = report({ shopping: [] });
    expect(result.stages.planned).toBe(true);
    expect(result.planned.totalCount).toBe(0);
    expect(result.planned.totalVnd).toBe(0);
  });
});
