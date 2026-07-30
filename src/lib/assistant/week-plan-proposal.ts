import "server-only";

import { randomUUID } from "node:crypto";
import { COMMODITY_BY_ID } from "@/data/seed/commodity";
import { loadHouseholdState } from "@/data/repo/household";
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
import type { Household } from "@/domain/types";
import type { WeekPlanEnvelope } from "@/data/repo/week-plan";

function generateCandidate(
  household: Household,
  envelope: WeekPlanEnvelope,
  seed: number,
) {
  const repertoire = dietaryRepertoire(
    [...REPERTOIRE, ...envelope.householdDishes],
    household,
    (id) => COMMODITY_BY_ID[id],
  );
  return generateWeek({
    household,
    repertoire,
    weekStart: envelope.plan.weekStart,
    seed,
    locked: envelope.plan.slots.filter((slot) => slot.locked),
  });
}

export async function createAssistantWeekPlanProposal(): Promise<
  AssistantWeekPlanProposal | null
> {
  const [{ household }, envelope] = await Promise.all([
    loadHouseholdState(),
    loadOrCreateCurrentWeekPlan(),
  ]);
  for (let offset = 1; offset <= 32; offset += 1) {
    const seed = envelope.plan.version * 97 + offset;
    const generated = generateCandidate(household, envelope, seed);
    const changes = weekPlanProposalChanges(
      envelope.plan.slots,
      generated.plan.slots,
    );
    if (changes.length === 0) continue;
    return {
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
  }

  return null;
}

export async function verifyAssistantWeekPlanProposal(
  input: ConfirmAssistantWeekPlanProposalInput,
): Promise<
  | { ok: true; slots: ConfirmAssistantWeekPlanProposalInput["slots"] }
  | Extract<SaveWeekPlanResult, { ok: false }>
> {
  const [{ household }, envelope] = await Promise.all([
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
  const generated = generateCandidate(household, envelope, input.seed);
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
  return { ok: true, slots: generated.plan.slots };
}
