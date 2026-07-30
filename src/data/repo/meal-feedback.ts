import "server-only";

import { Prisma } from "@prisma/client";
import type {
  DeleteMealFeedbackResult,
  MealCompletion,
  MealFeedback,
  SaveMealFeedbackInput,
  SaveMealFeedbackResult,
} from "@/domain/types";
import { getDb } from "@/lib/db";
import { isE2EMode } from "@/lib/auth";

type MealFeedbackRow = {
  id: string;
  mealCompletionId: string;
  dishRef: string;
  idempotencyKey: string;
  repeatIntent: string | null;
  portionFit: string | null;
  effortFit: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

export const toMealFeedback = (row: MealFeedbackRow): MealFeedback => ({
  id: row.id,
  mealCompletionId: row.mealCompletionId,
  dishRef: row.dishRef,
  idempotencyKey: row.idempotencyKey,
  repeatIntent: row.repeatIntent
    ? row.repeatIntent as NonNullable<MealFeedback["repeatIntent"]>
    : undefined,
  portionFit: row.portionFit
    ? row.portionFit as NonNullable<MealFeedback["portionFit"]>
    : undefined,
  effortFit: row.effortFit
    ? row.effortFit as NonNullable<MealFeedback["effortFit"]>
    : undefined,
  version: row.version,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const e2eByHousehold = new Map<string, MealFeedback[]>();
const e2eRows = (householdId: string) => {
  const existing = e2eByHousehold.get(householdId);
  if (existing) return existing;
  const rows: MealFeedback[] = [];
  e2eByHousehold.set(householdId, rows);
  return rows;
};

export function mergeE2EMealFeedbackState<T extends {
  mealFeedback: MealFeedback[];
}>(householdId: string, state: T): T {
  state.mealFeedback = structuredClone(e2eRows(householdId));
  return state;
}

export async function loadMealFeedbackForHousehold(
  householdId: string,
): Promise<MealFeedback[]> {
  if (isE2EMode()) return structuredClone(e2eRows(householdId));
  const rows = await getDb().mealFeedback.findMany({
    where: { householdId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toMealFeedback);
}

function validateCompletion(
  completion: MealCompletion | undefined,
  dishRef: string,
): void {
  if (!completion || !completion.dishRefs.includes(dishRef)) {
    throw new Error("MEAL_FEEDBACK_SOURCE_INVALID");
  }
}

export async function saveMealFeedbackRecord(
  input: SaveMealFeedbackInput & {
    householdId: string;
    userId: string;
  },
  e2eCompletion?: MealCompletion,
): Promise<SaveMealFeedbackResult> {
  if (isE2EMode()) {
    validateCompletion(e2eCompletion, input.dishRef);
    const rows = e2eRows(input.householdId);
    const replay = rows.find(
      (item) => item.idempotencyKey === input.idempotencyKey,
    );
    if (replay) return { ok: true, feedback: structuredClone(replay) };
    const existingIndex = rows.findIndex(
      (item) =>
        item.mealCompletionId === input.mealCompletionId
        && item.dishRef === input.dishRef,
    );
    const existing = existingIndex >= 0 ? rows[existingIndex] : undefined;
    if (
      existing
      && (
        input.expectedVersion === null
        || input.expectedVersion !== existing.version
      )
    ) {
      return {
        ok: false,
        kind: "conflict",
        canonical: structuredClone(existing),
      };
    }
    if (!existing && input.expectedVersion !== null) {
      throw new Error("MEAL_FEEDBACK_NOT_FOUND");
    }
    const now = new Date().toISOString();
    const feedback: MealFeedback = {
      id: existing?.id ?? `meal_feedback_${crypto.randomUUID()}`,
      mealCompletionId: input.mealCompletionId,
      dishRef: input.dishRef,
      idempotencyKey: input.idempotencyKey,
      repeatIntent: input.repeatIntent,
      portionFit: input.portionFit,
      effortFit: input.effortFit,
      version: (existing?.version ?? 0) + 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    if (existingIndex >= 0) rows[existingIndex] = feedback;
    else rows.push(feedback);
    return { ok: true, feedback: structuredClone(feedback) };
  }

  const db = getDb();
  const replay = await db.mealFeedback.findUnique({
    where: {
      householdId_idempotencyKey: {
        householdId: input.householdId,
        idempotencyKey: input.idempotencyKey,
      },
    },
  });
  if (replay) return { ok: true, feedback: toMealFeedback(replay) };

  try {
    return await db.$transaction(async (tx) => {
      const completion = await tx.mealCompletion.findFirst({
        where: {
          id: input.mealCompletionId,
          householdId: input.householdId,
        },
        select: { dishRefs: true },
      });
      if (!completion?.dishRefs.includes(input.dishRef)) {
        throw new Error("MEAL_FEEDBACK_SOURCE_INVALID");
      }
      const existing = await tx.mealFeedback.findUnique({
        where: {
          mealCompletionId_dishRef: {
            mealCompletionId: input.mealCompletionId,
            dishRef: input.dishRef,
          },
        },
      });
      if (
        existing
        && (
          input.expectedVersion === null
          || existing.version !== input.expectedVersion
        )
      ) {
        return {
          ok: false as const,
          kind: "conflict" as const,
          canonical: toMealFeedback(existing),
        };
      }
      if (!existing && input.expectedVersion !== null) {
        throw new Error("MEAL_FEEDBACK_NOT_FOUND");
      }
      if (!existing) {
        const created = await tx.mealFeedback.create({
          data: {
            householdId: input.householdId,
            mealCompletionId: input.mealCompletionId,
            dishRef: input.dishRef,
            idempotencyKey: input.idempotencyKey,
            repeatIntent: input.repeatIntent ?? null,
            portionFit: input.portionFit ?? null,
            effortFit: input.effortFit ?? null,
            createdByUserId: input.userId,
            updatedByUserId: input.userId,
          },
        });
        return { ok: true as const, feedback: toMealFeedback(created) };
      }
      const updated = await tx.mealFeedback.update({
        where: { id: existing.id },
        data: {
          idempotencyKey: input.idempotencyKey,
          repeatIntent: input.repeatIntent ?? null,
          portionFit: input.portionFit ?? null,
          effortFit: input.effortFit ?? null,
          updatedByUserId: input.userId,
          version: { increment: 1 },
        },
      });
      return { ok: true as const, feedback: toMealFeedback(updated) };
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
      && error.code === "P2034"
    ) {
      const canonical = await db.mealFeedback.findUnique({
        where: {
          mealCompletionId_dishRef: {
            mealCompletionId: input.mealCompletionId,
            dishRef: input.dishRef,
          },
        },
      });
      if (canonical) {
        return {
          ok: false,
          kind: "conflict",
          canonical: toMealFeedback(canonical),
        };
      }
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
      && error.code === "P2002"
    ) {
      const replayAfterRace = await db.mealFeedback.findUnique({
        where: {
          householdId_idempotencyKey: {
            householdId: input.householdId,
            idempotencyKey: input.idempotencyKey,
          },
        },
      });
      if (replayAfterRace) {
        return { ok: true, feedback: toMealFeedback(replayAfterRace) };
      }
      const canonical = await db.mealFeedback.findUnique({
        where: {
          mealCompletionId_dishRef: {
            mealCompletionId: input.mealCompletionId,
            dishRef: input.dishRef,
          },
        },
      });
      if (canonical) {
        return {
          ok: false,
          kind: "conflict",
          canonical: toMealFeedback(canonical),
        };
      }
    }
    throw error;
  }
}

export async function deleteMealFeedbackRecord(input: {
  householdId: string;
  feedbackId: string;
  expectedVersion: number;
}): Promise<DeleteMealFeedbackResult> {
  if (isE2EMode()) {
    const rows = e2eRows(input.householdId);
    const index = rows.findIndex((item) => item.id === input.feedbackId);
    if (index < 0) throw new Error("MEAL_FEEDBACK_NOT_FOUND");
    const canonical = rows[index]!;
    if (canonical.version !== input.expectedVersion) {
      return {
        ok: false,
        kind: "conflict",
        canonical: structuredClone(canonical),
      };
    }
    rows.splice(index, 1);
    return { ok: true, feedbackId: input.feedbackId };
  }

  const db = getDb();
  const existing = await db.mealFeedback.findFirst({
    where: { id: input.feedbackId, householdId: input.householdId },
  });
  if (!existing) throw new Error("MEAL_FEEDBACK_NOT_FOUND");
  if (existing.version !== input.expectedVersion) {
    return {
      ok: false,
      kind: "conflict",
      canonical: toMealFeedback(existing),
    };
  }
  const deleted = await db.mealFeedback.deleteMany({
    where: {
      id: input.feedbackId,
      householdId: input.householdId,
      version: input.expectedVersion,
    },
  });
  if (deleted.count === 1) return { ok: true, feedbackId: input.feedbackId };
  const canonical = await db.mealFeedback.findFirst({
    where: { id: input.feedbackId, householdId: input.householdId },
  });
  if (canonical) {
    return {
      ok: false,
      kind: "conflict",
      canonical: toMealFeedback(canonical),
    };
  }
  throw new Error("MEAL_FEEDBACK_NOT_FOUND");
}

export function resetE2EMealFeedbackForTests(): void {
  e2eByHousehold.clear();
}
