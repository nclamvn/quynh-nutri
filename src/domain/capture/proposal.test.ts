import { describe, expect, it } from "vitest";
import type { ShoppingItem } from "@/domain/shopping";
import {
  captureProposalSchema,
  matchCandidateToShopping,
  normalizeCaptureName,
} from "./proposal";

const shopping: ShoppingItem[] = [
  { commodityId: "bi_xanh", qtyTotal: 300, unit: "g", vendor: "Chợ", trip: 1, kind: "fresh", checked: false },
  { commodityId: "ca_chua", qtyTotal: 200, unit: "g", vendor: "Chợ", trip: 1, kind: "fresh", checked: false },
];
const names: Record<string, string> = { bi_xanh: "Bí xanh", ca_chua: "Cà chua" };

describe("capture proposal", () => {
  it("normalizes Vietnamese names without granting fuzzy authority", () => {
    expect(normalizeCaptureName("  Bí-xanh! ")).toBe("bi xanh");
    expect(matchCandidateToShopping("Bí xanh loại 1", shopping, (id) => names[id])).toEqual(shopping[0]);
    expect(matchCandidateToShopping("bí", shopping, (id) => names[id])).toBeUndefined();
  });

  it("leaves ambiguous matches unmapped", () => {
    const ambiguous = [...shopping, { ...shopping[0], vendor: "Siêu thị", trip: 2 }];
    expect(matchCandidateToShopping("Bí xanh", ambiguous, (id) => names[id])).toBeUndefined();
  });

  it("rejects fabricated nulls and invalid label dates", () => {
    expect(captureProposalSchema.safeParse({
      kind: "label",
      candidates: [{ rawName: "Sữa", printedDate: "không rõ" }],
      notes: [],
    }).success).toBe(false);
    expect(captureProposalSchema.safeParse({
      kind: "receipt",
      candidates: [{ rawName: "Cà chua", quantity: null }],
      notes: [],
    }).success).toBe(false);
  });
});

