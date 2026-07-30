import "server-only";

import { loadHouseholdState } from "@/data/repo/household";
import { REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import { buildHouseholdMealMemory } from "@/domain/feedback/meal-memory";

export async function getHouseholdMealMemorySnapshot() {
  const state = await loadHouseholdState();
  const memory = buildHouseholdMealMemory({
    completions: state.mealCompletions,
    feedback: state.mealFeedback,
  });
  return {
    totalFeedbackCount: memory.totalFeedbackCount,
    dishes: memory.dishes.map((item) => ({
      dishId: item.dishId,
      dish: REPERTOIRE_BY_ID[item.dishId]?.vnName ?? item.dishId,
      feedbackCount: item.feedbackCount,
      repeatCount: item.repeatCount,
      neutralCount: item.neutralCount,
      avoidCount: item.avoidCount,
      tooLittleCount: item.tooLittleCount,
      rightPortionCount: item.rightPortionCount,
      tooMuchCount: item.tooMuchCount,
      easyCount: item.easyCount,
      manageableCount: item.manageableCount,
      tooMuchEffortCount: item.tooMuchEffortCount,
      evidenceState: item.evidenceState,
    })),
  };
}
