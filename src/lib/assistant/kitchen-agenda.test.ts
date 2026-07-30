import { describe, expect, it, vi } from "vitest";
import type { HouseholdState } from "@/data/repo/household";
import type { WeekPlan } from "@/domain/types";

vi.mock("server-only", () => ({}));

const emptyState = (): HouseholdState => ({
  household: {
    id: "household-scoped",
    name: "Gia đình",
    size: 0,
    marketMode: "mixed",
    cookTimeCapMin: 45,
    busyDays: [],
    lactatingMember: false,
    members: [],
    restrictions: [],
  },
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
});

const { loadHouseholdState } = vi.hoisted(() => ({
  loadHouseholdState: vi.fn(),
}));
vi.mock("@/data/repo/household", () => ({ loadHouseholdState }));
vi.mock("@/data/repo/week-plan", () => ({
  loadOrCreateCurrentWeekPlan: vi.fn(async () => ({
    plan: {
      id: "week",
      householdId: "household-scoped",
      weekStart: "2026-07-27",
      version: 1,
      updatedAt: "2026-07-29T00:00:00.000Z",
      slots: [],
    },
    householdDishes: [],
  })),
}));

import {
  buildAssistantKitchenAgenda,
  getDailyHousekeeperBriefSnapshot,
  getKitchenAgendaSnapshot,
} from "./kitchen-agenda";

describe("assistant kitchen agenda adapter", () => {
  it("returns an empty array source when no task has evidence instead of inventing work", () => {
    const plan: WeekPlan = {
      householdId: "household-scoped",
      weekStart: "2026-07-27",
      slots: [],
    };
    const agenda = buildAssistantKitchenAgenda({
      state: emptyState(),
      plan,
      now: new Date("2026-07-29T05:00:00.000Z"),
    });
    expect(agenda.tasks).toEqual([]);
    expect(agenda.unsupported).toEqual([]);
  });

  it("loads the authenticated household internally without accepting model input", async () => {
    loadHouseholdState.mockClear();
    loadHouseholdState.mockResolvedValue(emptyState());
    const agenda = await getKitchenAgendaSnapshot();
    expect(loadHouseholdState).toHaveBeenCalledTimes(1);
    expect(Array.isArray(agenda.tasks)).toBe(true);
    expect(agenda.tasks.every((task) =>
      task.sourceRef.length > 0
      && task.actionHref.startsWith("/")
      && !("householdId" in task.evidence)
    )).toBe(true);
  });

  it("projects the same authenticated evidence into the three daily stations", async () => {
    loadHouseholdState.mockClear();
    loadHouseholdState.mockResolvedValue(emptyState());
    const brief = await getDailyHousekeeperBriefSnapshot();
    expect(brief.stations.map((station) => station.key)).toEqual([
      "prepare",
      "shop",
      "use-soon",
    ]);
    expect(brief.tasks).toEqual([]);
    expect(JSON.stringify(brief)).not.toContain("household-scoped");
  });
});
