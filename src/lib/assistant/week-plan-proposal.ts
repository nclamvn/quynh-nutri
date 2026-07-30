import "server-only";

import { randomUUID } from "node:crypto";
import { COMMODITY_BY_ID } from "@/data/seed/commodity";
import {
  loadHouseholdState,
  type HouseholdState,
} from "@/data/repo/household";
import { loadOrCreateCurrentWeekPlan } from "@/data/repo/week-plan";
import { REPERTOIRE } from "@/data/seed/repertoire";
import {
  type AssistantWeekPlanProposal,
  type ConfirmAssistantWeekPlanProposalInput,
  weekPlanProposalChanges,
} from "@/domain/assistant/week-plan-proposal";
import { dietaryRepertoire } from "@/domain/dish";
import { generateWeek } from "@/domain/rotation";
import {
  samePlannedSlots,
  type SaveWeekPlanResult,
} from "@/domain/planning/persisted-week-plan";
import type { WeekPlanEnvelope } from "@/data/repo/week-plan";
import {
  aggregateMemoryEvidenceState,
  buildHouseholdMealMemory,
  memoryPreferenceForDish,
} from "@/domain/feedback/meal-memory";
import { recordProductEventSafely } from "@/data/repo/product-events";

function generateCandidate(
  state: HouseholdState,
  envelope: WeekPlanEnvelope,
  seed: number,
) {
  const { household } = state;
  const repertoire = dietaryRepertoire(
    [...REPERTOIRE, ...envelope.householdDishes],
    household,
    (id) => COMMODITY_BY_ID[id],
  );
  const memory = buildHouseholdMealMemory({
    completions: state.mealCompletions,
    feedback: state.mealFeedback,
  });
  const memoryByDish = new Map(
    memory.dishes.map((item) => [item.dishId, item]),
  );
  const dinner = generateWeek({
    household,
    repertoire,
    weekStart: envelope.plan.weekStart,
    seed,
    locked: envelope.plan.slots.filter(
      (slot) => slot.occasion === "dinner" && slot.locked,
    ),
    dishScore: (dish, context) =>
      memoryPreferenceForDish(memoryByDish.get(dish.id), context.busy).score,
  });
  return {
    generated: {
      ...dinner,
      plan: {
        ...dinner.plan,
        slots: [
          ...envelope.plan.slots.filter((slot) => slot.occasion !== "dinner"),
          ...dinner.plan.slots,
        ],
      },
    },
    memory,
    memoryByDish,
  };
}

export async function createAssistantWeekPlanProposal(): Promise<
  AssistantWeekPlanProposal | null
> {
  const [state, envelope] = await Promise.all([
    loadHouseholdState(),
    loadOrCreateCurrentWeekPlan(),
  ]);
  for (let offset = 1; offset <= 32; offset += 1) {
    const seed = envelope.plan.version * 97 + offset;
    const candidate = generateCandidate(state, envelope, seed);
    const generated = candidate.generated;
    const changes = weekPlanProposalChanges(
      envelope.plan.slots,
      generated.plan.slots,
    ).map((change) => {
      if (!change.afterDishId) return change;
      const busy = state.household.busyDays.includes(
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][change.day] as
          typeof state.household.busyDays[number],
      );
      const preference = memoryPreferenceForDish(
        candidate.memoryByDish.get(change.afterDishId),
        busy,
      );
      return preference.reasons.length === 0
        ? change
        : {
            ...change,
            memoryReasons: preference.reasons,
            memoryEvidenceCount: preference.evidenceCount,
            memoryEvidenceState: preference.evidenceState,
          };
    });
    if (changes.length === 0) continue;
    const proposal: AssistantWeekPlanProposal = {
      id: randomUUID(),
      kind: "week-plan",
      weekStart: envelope.plan.weekStart,
      baseVersion: envelope.plan.version,
      seed,
      createdAt: new Date().toISOString(),
      slots: generated.plan.slots,
      changes,
      notes: generated.notes,
    };
    await recordProductEventSafely({
      name: "memory_guided_proposal_created",
      dedupeKey: `memory_guided_proposal_created:${proposal.id}`,
      properties: {
        changedSlotCount: changes.length,
        reasonCategoryCount: new Set(
          changes.flatMap((change) => change.memoryReasons ?? []),
        ).size,
        evidenceState: aggregateMemoryEvidenceState(candidate.memory),
      },
    });
    return proposal;
  }

  return null;
}

export async function verifyAssistantWeekPlanProposal(
  input: ConfirmAssistantWeekPlanProposalInput,
): Promise<
  | {
      ok: true;
      slots: ConfirmAssistantWeekPlanProposalInput["slots"];
      changeCount: number;
    }
  | Extract<SaveWeekPlanResult, { ok: false }>
> {
  const [state, envelope] = await Promise.all([
    loadHouseholdState(),
    loadOrCreateCurrentWeekPlan(),
  ]);
  if (
    envelope.plan.version !== input.baseVersion
    || envelope.plan.weekStart !== input.weekStart
  ) {
    return {
      ok: false,
      kind: "conflict",
      canonical: envelope.plan,
    };
  }
  const generated = generateCandidate(state, envelope, input.seed).generated;
  const changes = weekPlanProposalChanges(
    envelope.plan.slots,
    generated.plan.slots,
  );
  if (
    changes.length === 0
    || !samePlannedSlots(generated.plan.slots, input.slots)
  ) {
    throw new Error("PROPOSAL_CANDIDATE_MISMATCH");
  }
  return {
    ok: true,
    slots: generated.plan.slots,
    changeCount: changes.length,
  };
}
