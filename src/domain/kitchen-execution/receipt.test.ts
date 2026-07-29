import { describe, expect, it } from "vitest";
import type { ReceiveShoppingItemInput } from "@/domain/types";
import { validateReceiptBusinessRules } from "./receipt";

const BASE: ReceiveShoppingItemInput = {
  idempotencyKey: "51d86f62-11d3-4458-989a-85b70a8997be",
  weekRef: "2026-07-27",
  commodityId: "tom",
  vendor: "Chưa gán",
  plannedQty: 500,
  actualQty: 480,
  unit: "g",
  boughtAt: "2026-07-29T02:00:00.000Z",
  addToPantry: true,
  storageLocation: "fridge",
};

describe("receive shopping item business rules", () => {
  const now = new Date("2026-07-29T02:00:00.000Z").getTime();

  it("accepts a receipt with no fabricated best-before", () => {
    expect(validateReceiptBusinessRules(BASE, now)).toEqual([]);
    expect(BASE.bestBefore).toBeUndefined();
  });

  it("requires storage when creating a lot", () => {
    expect(validateReceiptBusinessRules({ ...BASE, storageLocation: undefined }, now))
      .toContain("STORAGE_REQUIRED");
  });

  it("rejects purchase time more than five minutes in the future", () => {
    const input = { ...BASE, boughtAt: "2026-07-29T02:06:00.000Z" };
    expect(validateReceiptBusinessRules(input, now)).toContain("PURCHASE_TIME_IN_FUTURE");
  });

  it("requires the label date to follow purchase time", () => {
    const input = { ...BASE, bestBefore: "2026-07-29T01:00:00.000Z" };
    expect(validateReceiptBusinessRules(input, now)).toContain("BEST_BEFORE_MUST_FOLLOW_PURCHASE");
  });
});
