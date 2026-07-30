import type {
  MealCompletion,
  MealFeedback,
} from "@/domain/types";

export type MealMemoryEvidenceState =
  | "single"
  | "emerging"
  | "established"
  | "mixed";

export interface DishMealMemory {
  dishId: string;
  feedbackCount: number;
  repeatCount: number;
  neutralCount: number;
  avoidCount: number;
  tooLittleCount: number;
  rightPortionCount: number;
  tooMuchCount: number;
  easyCount: number;
  manageableCount: number;
  tooMuchEffortCount: number;
  evidenceState: MealMemoryEvidenceState;
  latestFeedbackAt: string;
}

export interface HouseholdMealMemory {
  generatedAt: string;
  dishes: DishMealMemory[];
  totalFeedbackCount: number;
}

export interface MemoryPreference {
  score: number;
  reasons: Array<"explicit_repeat" | "explicit_avoid" | "busy_day_effort">;
  evidenceCount: number;
  evidenceState?: MealMemoryEvidenceState;
}

const strictRepeatMajority = (memory: Pick<
  DishMealMemory,
  "repeatCount" | "neutralCount" | "avoidCount"
>) => {
  const counts = [memory.repeatCount, memory.neutralCount, memory.avoidCount];
  const total = counts.reduce((sum, count) => sum + count, 0);
  const max = Math.max(...counts);
  return total > 0 && max > total / 2;
};

function evidenceState(memory: Omit<
  DishMealMemory,
  "evidenceState" | "latestFeedbackAt"
>): MealMemoryEvidenceState {
  if (memory.feedbackCount <= 1) return "single";
  const repeatAnswerCount =
    memory.repeatCount + memory.neutralCount + memory.avoidCount;
  const hasMajority = strictRepeatMajority(memory);
  if (repeatAnswerCount >= 2 && !hasMajority) return "mixed";
  return memory.feedbackCount >= 4 && hasMajority
    ? "established"
    : "emerging";
}

/**
 * Only explicit MealFeedback rows enter this projection. Completion and
 * operational facts are used exclusively to validate the dish relationship.
 */
export function buildHouseholdMealMemory(input: {
  completions: readonly MealCompletion[];
  feedback: readonly MealFeedback[];
  generatedAt?: Date;
}): HouseholdMealMemory {
  const completionById = new Map(
    input.completions.map((completion) => [completion.id, completion]),
  );
  const byDish = new Map<string, MealFeedback[]>();

  for (const item of input.feedback) {
    const completion = completionById.get(item.mealCompletionId);
    if (!completion?.dishRefs.includes(item.dishRef)) continue;
    const rows = byDish.get(item.dishRef) ?? [];
    rows.push(item);
    byDish.set(item.dishRef, rows);
  }

  const dishes = [...byDish.entries()]
    .map(([dishId, rows]) => {
      const base = {
        dishId,
        feedbackCount: rows.length,
        repeatCount: rows.filter((item) => item.repeatIntent === "repeat").length,
        neutralCount: rows.filter((item) => item.repeatIntent === "neutral").length,
        avoidCount: rows.filter((item) => item.repeatIntent === "avoid").length,
        tooLittleCount: rows.filter((item) => item.portionFit === "too_little").length,
        rightPortionCount: rows.filter((item) => item.portionFit === "right").length,
        tooMuchCount: rows.filter((item) => item.portionFit === "too_much").length,
        easyCount: rows.filter((item) => item.effortFit === "easy").length,
        manageableCount: rows.filter((item) => item.effortFit === "manageable").length,
        tooMuchEffortCount: rows.filter((item) => item.effortFit === "too_much").length,
      };
      return {
        ...base,
        evidenceState: evidenceState(base),
        latestFeedbackAt: rows.reduce(
          (latest, item) => item.updatedAt > latest ? item.updatedAt : latest,
          rows[0]!.updatedAt,
        ),
      };
    })
    .sort(
      (left, right) =>
        right.latestFeedbackAt.localeCompare(left.latestFeedbackAt)
        || left.dishId.localeCompare(right.dishId),
    );

  return {
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    dishes,
    totalFeedbackCount: dishes.reduce(
      (sum, item) => sum + item.feedbackCount,
      0,
    ),
  };
}

export function memoryPreferenceForDish(
  memory: DishMealMemory | undefined,
  busyDay: boolean,
): MemoryPreference {
  if (!memory || memory.evidenceState === "mixed") {
    return {
      score: 0,
      reasons: [],
      evidenceCount: memory?.feedbackCount ?? 0,
      evidenceState: memory?.evidenceState,
    };
  }
  const reasons: MemoryPreference["reasons"] = [];
  let score = 0;
  if (memory.repeatCount > memory.avoidCount) {
    score += 2;
    reasons.push("explicit_repeat");
  } else if (memory.avoidCount > memory.repeatCount) {
    score -= 2;
    reasons.push("explicit_avoid");
  }
  if (
    busyDay
    && memory.tooMuchEffortCount > memory.easyCount + memory.manageableCount
  ) {
    score -= 1;
    reasons.push("busy_day_effort");
  }
  return {
    score,
    reasons,
    evidenceCount: memory.feedbackCount,
    evidenceState: memory.evidenceState,
  };
}

export function aggregateMemoryEvidenceState(
  memory: HouseholdMealMemory,
): "none" | MealMemoryEvidenceState {
  if (memory.dishes.length === 0) return "none";
  const rank: Record<MealMemoryEvidenceState, number> = {
    single: 0,
    emerging: 1,
    established: 2,
    mixed: 3,
  };
  return memory.dishes.reduce(
    (strongest, item) =>
      rank[item.evidenceState] > rank[strongest]
        ? item.evidenceState
        : strongest,
    memory.dishes[0]!.evidenceState,
  );
}
