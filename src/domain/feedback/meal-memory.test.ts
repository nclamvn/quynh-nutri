import { describe, expect, it } from "vitest";
import type { MealCompletion, MealFeedback } from "@/domain/types";
import {
  buildHouseholdMealMemory,
  memoryPreferenceForDish,
} from "./meal-memory";

const completion = (
  id: string,
  dishRefs: string[] = ["fish"],
): MealCompletion => ({
  id,
  idempotencyKey: `key-${id}`,
  weekRef: "2026-07-27",
  day: 0,
  occasion: "dinner",
  dishRefs,
  sourceSessionCreatedAt: "2026-07-30T10:00:00.000Z",
  completedAt: "2026-07-30T11:00:00.000Z",
  createdAt: "2026-07-30T11:00:00.000Z",
  updatedAt: "2026-07-30T11:00:00.000Z",
});
const feedback = (
  index: number,
  overrides: Partial<MealFeedback> = {},
): MealFeedback => ({
  id: `feedback-${index}`,
  mealCompletionId: `completion-${index}`,
  dishRef: "fish",
  idempotencyKey: `feedback-key-${index}`,
  repeatIntent: "repeat",
  portionFit: "right",
  effortFit: "manageable",
  version: 1,
  createdAt: `2026-07-${20 + index}T12:00:00.000Z`,
  updatedAt: `2026-07-${20 + index}T12:00:00.000Z`,
  ...overrides,
});

describe("household meal memory", () => {
  it("uses only feedback whose dish belongs to the immutable completion", () => {
    const memory = buildHouseholdMealMemory({
      completions: [completion("completion-1", ["fish", "rice"])],
      feedback: [
        feedback(1),
        feedback(2, {
          mealCompletionId: "missing",
          dishRef: "rice",
        }),
        feedback(3, {
          mealCompletionId: "completion-1",
          dishRef: "stale",
        }),
      ],
      generatedAt: new Date("2026-07-30T12:00:00.000Z"),
    });
    expect(memory.dishes).toMatchObject([{
      dishId: "fish",
      feedbackCount: 1,
      repeatCount: 1,
      evidenceState: "single",
    }]);
    expect(memory.totalFeedbackCount).toBe(1);
  });

  it("counts exact dimensions and marks strict-majority evidence", () => {
    const rows = [
      feedback(1),
      feedback(2),
      feedback(3, { repeatIntent: "neutral", portionFit: "too_much" }),
      feedback(4, { effortFit: "easy" }),
    ];
    const memory = buildHouseholdMealMemory({
      completions: rows.map((_, index) => completion(`completion-${index + 1}`)),
      feedback: rows,
    }).dishes[0]!;
    expect(memory).toMatchObject({
      feedbackCount: 4,
      repeatCount: 3,
      neutralCount: 1,
      avoidCount: 0,
      rightPortionCount: 3,
      tooMuchCount: 1,
      easyCount: 1,
      manageableCount: 3,
      evidenceState: "established",
    });
  });

  it("keeps conflicting evidence mixed and neutral in ranking", () => {
    const rows = [
      feedback(1, { repeatIntent: "repeat" }),
      feedback(2, { repeatIntent: "avoid", effortFit: "too_much" }),
    ];
    const memory = buildHouseholdMealMemory({
      completions: rows.map((_, index) => completion(`completion-${index + 1}`)),
      feedback: rows,
    }).dishes[0]!;
    expect(memory.evidenceState).toBe("mixed");
    expect(memoryPreferenceForDish(memory, true)).toMatchObject({
      score: 0,
      reasons: [],
    });
  });

  it("does not call portion-only evidence a repeat-intent conflict", () => {
    const rows = [
      feedback(1, { repeatIntent: undefined, portionFit: "too_little" }),
      feedback(2, { repeatIntent: undefined, portionFit: "right" }),
    ];
    const memory = buildHouseholdMealMemory({
      completions: rows.map((_, index) => completion(`completion-${index + 1}`)),
      feedback: rows,
    }).dishes[0]!;
    expect(memory).toMatchObject({
      feedbackCount: 2,
      evidenceState: "emerging",
      repeatCount: 0,
      avoidCount: 0,
    });
  });

  it("uses explicit repeat and busy-day effort only as bounded soft signals", () => {
    const rows = [
      feedback(1, { effortFit: "too_much" }),
      feedback(2, { effortFit: "too_much" }),
      feedback(3, { effortFit: "too_much" }),
    ];
    const memory = buildHouseholdMealMemory({
      completions: rows.map((_, index) => completion(`completion-${index + 1}`)),
      feedback: rows,
    }).dishes[0]!;
    expect(memoryPreferenceForDish(memory, true)).toEqual({
      score: 1,
      reasons: ["explicit_repeat", "busy_day_effort"],
      evidenceCount: 3,
      evidenceState: "emerging",
    });
    expect(memoryPreferenceForDish(memory, false).score).toBe(2);
  });
});
