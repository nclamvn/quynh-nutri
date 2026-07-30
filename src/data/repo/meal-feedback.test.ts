import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ isE2EMode: () => true }));
vi.mock("@/lib/db", () => ({
  getDb: () => {
    throw new Error("E2E adapter must not access the database");
  },
}));

import type { MealCompletion } from "@/domain/types";
import {
  deleteMealFeedbackRecord,
  loadMealFeedbackForHousehold,
  resetE2EMealFeedbackForTests,
  saveMealFeedbackRecord,
} from "./meal-feedback";

const completion: MealCompletion = {
  id: "completion-a",
  idempotencyKey: "completion-key",
  weekRef: "2026-07-27",
  day: 0,
  occasion: "dinner",
  dishRefs: ["fish", "rice"],
  sourceSessionCreatedAt: "2026-07-30T10:00:00.000Z",
  completedAt: "2026-07-30T11:00:00.000Z",
  createdAt: "2026-07-30T11:00:00.000Z",
  updatedAt: "2026-07-30T11:00:00.000Z",
};
const base = {
  householdId: "household-a",
  userId: "user-a",
  idempotencyKey: "4d5368d2-8e3f-4e7d-a226-6fd35522a400",
  mealCompletionId: completion.id,
  dishRef: "fish",
  repeatIntent: "repeat" as const,
  expectedVersion: null,
};

describe("meal feedback repository E2E adapter", () => {
  beforeEach(() => resetE2EMealFeedbackForTests());

  it("creates only for a dish explicitly present in the completion and replays safely", async () => {
    const first = await saveMealFeedbackRecord(base, completion);
    const replay = await saveMealFeedbackRecord(base, completion);
    expect(replay).toEqual(first);
    expect(await loadMealFeedbackForHousehold("household-a")).toHaveLength(1);
    await expect(
      saveMealFeedbackRecord(
        {
          ...base,
          idempotencyKey: "915e9dae-32b8-4f1f-b11f-c62125e09f16",
          dishRef: "not-in-meal",
        },
        completion,
      ),
    ).rejects.toThrow("MEAL_FEEDBACK_SOURCE_INVALID");
  });

  it("returns canonical state for stale create and edit attempts", async () => {
    const created = await saveMealFeedbackRecord(base, completion);
    expect(created.ok).toBe(true);
    const createConflict = await saveMealFeedbackRecord(
      {
        ...base,
        idempotencyKey: "58d714e3-85b0-47f9-9294-bf80820ba16a",
      },
      completion,
    );
    expect(createConflict).toMatchObject({
      ok: false,
      kind: "conflict",
      canonical: { version: 1, repeatIntent: "repeat" },
    });
    const edited = await saveMealFeedbackRecord(
      {
        ...base,
        idempotencyKey: "d3186834-c1ac-438e-9838-44fc81713524",
        repeatIntent: "avoid",
        expectedVersion: 1,
      },
      completion,
    );
    expect(edited).toMatchObject({
      ok: true,
      feedback: { version: 2, repeatIntent: "avoid" },
    });
    const stale = await saveMealFeedbackRecord(
      {
        ...base,
        idempotencyKey: "370097ff-f3ea-4616-98f6-09ea65c23a28",
        expectedVersion: 1,
      },
      completion,
    );
    expect(stale).toMatchObject({
      ok: false,
      kind: "conflict",
      canonical: { version: 2, repeatIntent: "avoid" },
    });
  });

  it("deletes only with the current version and isolates households", async () => {
    const created = await saveMealFeedbackRecord(base, completion);
    if (!created.ok) throw new Error("fixture failed");
    expect(
      await loadMealFeedbackForHousehold("household-b"),
    ).toEqual([]);
    await expect(
      deleteMealFeedbackRecord({
        householdId: "household-b",
        feedbackId: created.feedback.id,
        expectedVersion: 1,
      }),
    ).rejects.toThrow("MEAL_FEEDBACK_NOT_FOUND");
    expect(
      await deleteMealFeedbackRecord({
        householdId: "household-a",
        feedbackId: created.feedback.id,
        expectedVersion: 999,
      }),
    ).toMatchObject({ ok: false, kind: "conflict" });
    expect(
      await deleteMealFeedbackRecord({
        householdId: "household-a",
        feedbackId: created.feedback.id,
        expectedVersion: 1,
      }),
    ).toEqual({ ok: true, feedbackId: created.feedback.id });
    expect(await loadMealFeedbackForHousehold("household-a")).toEqual([]);
  });
});
