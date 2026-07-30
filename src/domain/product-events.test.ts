import { describe, expect, it } from "vitest";
import { parseProductEvent } from "./product-events";

describe("product event privacy contract", () => {
  it("accepts an allowlisted event with bounded properties", () => {
    expect(parseProductEvent({
      name: "onboarding_completed",
      dedupeKey: "onboarding:1",
      properties: {
        adults: 2,
        children: 1,
        hasRestrictions: false,
        busyDayCount: 2,
        marketMode: "mixed",
      },
    })).toMatchObject({ name: "onboarding_completed" });
  });

  it("rejects free text and identity-like extra properties", () => {
    expect(() => parseProductEvent({
      name: "onboarding_completed",
      dedupeKey: "onboarding:2",
      properties: {
        adults: 2,
        children: 0,
        hasRestrictions: false,
        busyDayCount: 1,
        marketMode: "mixed",
        memberName: "Quỳnh",
        clerkUserId: "user_123",
      },
    })).toThrow();
  });

  it("rejects unknown events and oversized values", () => {
    expect(() => parseProductEvent({
      name: "member_health_changed",
      dedupeKey: "health:1",
      properties: {},
    })).toThrow();
    expect(() => parseProductEvent({
      name: "meal_run_started",
      dedupeKey: "meal:1",
      properties: { dishCount: 100 },
    })).toThrow();
  });

  it("keeps meal completion measurement aggregate and privacy-minimal", () => {
    expect(parseProductEvent({
      name: "meal_completed",
      dedupeKey: "meal_completed:1",
      properties: {
        dishCount: 3,
        inventoryMovementCount: 2,
        openedLeftoverCapture: true,
      },
    })).toMatchObject({ name: "meal_completed" });
    expect(() => parseProductEvent({
      name: "meal_completed",
      dedupeKey: "meal_completed:2",
      properties: {
        dishCount: 3,
        inventoryMovementCount: 2,
        openedLeftoverCapture: true,
        dishName: "Cá kho",
      },
    })).toThrow();
  });

  it("allows only aggregate meal-memory measurement", () => {
    expect(parseProductEvent({
      name: "meal_feedback_saved",
      dedupeKey: "meal_feedback_saved:1",
      properties: {
        dimensionsAnswered: 2,
        isEdit: false,
      },
    })).toMatchObject({ name: "meal_feedback_saved" });
    expect(parseProductEvent({
      name: "memory_guided_proposal_created",
      dedupeKey: "memory_proposal:1",
      properties: {
        changedSlotCount: 3,
        reasonCategoryCount: 1,
        evidenceState: "emerging",
      },
    })).toMatchObject({ name: "memory_guided_proposal_created" });
    expect(() => parseProductEvent({
      name: "meal_feedback_saved",
      dedupeKey: "meal_feedback_saved:2",
      properties: {
        dimensionsAnswered: 1,
        isEdit: true,
        dishId: "ca-kho",
        repeatIntent: "repeat",
      },
    })).toThrow();
  });
});
