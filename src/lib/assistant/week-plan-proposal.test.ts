import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_HOUSEHOLD } from "@/data/seed/household";
import { REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import { generateWeek } from "@/domain/rotation";
import type { WeekPlanEnvelope } from "@/data/repo/week-plan";
import type { HouseholdState } from "@/data/repo/household";

vi.mock("server-only", () => ({}));
const refs = vi.hoisted(() => ({
  state: { current: undefined as HouseholdState | undefined },
  envelope: { current: undefined as WeekPlanEnvelope | undefined },
  loadState: vi.fn(),
  loadPlan: vi.fn(),
}));
vi.mock("@/data/repo/household", () => ({
  loadHouseholdState: refs.loadState,
}));
vi.mock("@/data/repo/week-plan", () => ({
  loadOrCreateCurrentWeekPlan: refs.loadPlan,
}));

import {
  createAssistantWeekPlanProposal,
  verifyAssistantWeekPlanProposal,
} from "./week-plan-proposal";

describe("server assistant week plan proposal", () => {
  beforeEach(() => {
    const household = structuredClone(DEFAULT_HOUSEHOLD);
    const generated = generateWeek({
      household,
      repertoire: Object.values(REPERTOIRE_BY_ID),
      weekStart: "2026-07-27",
      seed: 1,
    }).plan;
    const lockedTarget = generated.slots.find((item) => item.slot === "MAN")!;
    const slots = generated.slots.map((item) =>
      item.day === lockedTarget.day && item.slot === lockedTarget.slot
        ? { ...item, locked: true }
        : item
    );
    refs.state.current = {
      household,
      favorites: [],
      notes: [],
      pantry: [],
      suppliers: [],
      orders: [],
      purchases: [],
      fulfillments: [],
      inventoryMovements: [],
      leftoverLots: [],
    leftoverMovements: [],
    mealCompletions: [],
    };
    refs.envelope.current = {
      plan: {
        ...generated,
        id: "plan-1",
        version: 4,
        updatedAt: "2026-07-30T00:00:00.000Z",
        slots,
      },
      householdDishes: [],
    };
    refs.loadState.mockReset();
    refs.loadPlan.mockReset();
    refs.loadState.mockImplementation(async () =>
      structuredClone(refs.state.current!)
    );
    refs.loadPlan.mockImplementation(async () =>
      structuredClone(refs.envelope.current!)
    );
  });

  it("creates a changed, version-bound preview while preserving locked slots", async () => {
    const proposal = await createAssistantWeekPlanProposal();
    expect(proposal).not.toBeNull();
    expect(proposal).toMatchObject({
      kind: "week-plan",
      weekStart: "2026-07-27",
      baseVersion: 4,
      seed: expect.any(Number),
    });
    expect(proposal!.changes.length).toBeGreaterThan(0);

    const locked = refs.envelope.current!.plan.slots.filter(
      (item) => item.locked,
    );
    for (const item of locked) {
      expect(
        proposal!.slots.find(
          (candidate) =>
            candidate.day === item.day && candidate.slot === item.slot,
        ),
      ).toEqual(item);
      expect(
        proposal!.changes.some(
          (change) =>
            change.day === item.day && change.slot === item.slot,
        ),
      ).toBe(false);
    }
    expect(refs.loadState).toHaveBeenCalledTimes(1);
    expect(refs.loadPlan).toHaveBeenCalledTimes(1);
  });

  it("recomputes the candidate and rejects a client-tampered payload", async () => {
    const proposal = (await createAssistantWeekPlanProposal())!;
    const verified = await verifyAssistantWeekPlanProposal({
      proposalId: proposal.id,
      kind: proposal.kind,
      weekStart: proposal.weekStart,
      baseVersion: proposal.baseVersion,
      seed: proposal.seed,
      slots: proposal.slots,
      confirmedByUser: true,
    });
    expect(verified).toMatchObject({ ok: true, slots: proposal.slots });

    const tampered = proposal.slots.map((item, index) =>
      index === 0 ? { ...item, dishId: "tampered" } : item
    );
    await expect(
      verifyAssistantWeekPlanProposal({
        proposalId: proposal.id,
        kind: proposal.kind,
        weekStart: proposal.weekStart,
        baseVersion: proposal.baseVersion,
        seed: proposal.seed,
        slots: tampered,
        confirmedByUser: true,
      }),
    ).rejects.toThrow("PROPOSAL_CANDIDATE_MISMATCH");
  });
});
