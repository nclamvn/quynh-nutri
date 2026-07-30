import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_HOUSEHOLD } from "@/data/seed/household";
import { REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import type { HouseholdState } from "./household";

vi.mock("server-only", () => ({}));
const { requireUserId, stateRef } = vi.hoisted(() => ({
  requireUserId: vi.fn(async () => "e2e-user"),
  stateRef: { current: undefined as HouseholdState | undefined },
}));
vi.mock("@/lib/auth", () => ({
  isE2EMode: () => true,
  requireUserId,
}));
vi.mock("@/lib/db", () => ({
  getDb: () => {
    throw new Error("E2E repository adapter must not access the database");
  },
}));
vi.mock("@/data/repo/household", () => ({
  currentHouseholdId: async () => stateRef.current?.household.id,
  loadHouseholdState: async () => structuredClone(stateRef.current),
}));

import {
  loadHouseholdDishLibrary,
  loadOrCreateWeekPlan,
  loadWeekPlan,
  resetE2EWeekPlansForTests,
  saveWeekPlan,
  syncMissingHouseholdDishes,
} from "./week-plan";

const emptyState = (householdId: string): HouseholdState => ({
  household: { ...structuredClone(DEFAULT_HOUSEHOLD), id: householdId },
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
});

describe("canonical week plan repository E2E adapter", () => {
  beforeEach(() => {
    resetE2EWeekPlansForTests();
    stateRef.current = emptyState("household-a");
    requireUserId.mockClear();
  });

  it("load-or-create is stable and concurrent calls converge on one aggregate", async () => {
    const [first, second] = await Promise.all([
      loadOrCreateWeekPlan("2026-07-27"),
      loadOrCreateWeekPlan("2026-07-27"),
    ]);
    expect(second.plan).toEqual(first.plan);
    expect((await loadWeekPlan("2026-07-27"))?.plan.id).toBe(first.plan.id);
    expect(first.plan.version).toBe(1);
    expect(first.plan.slots.length).toBeGreaterThan(0);
  });

  it("saves with OCC, makes identical retries idempotent and rejects stale divergence", async () => {
    const initial = (await loadOrCreateWeekPlan("2026-07-27")).plan;
    const target = initial.slots.find((slot) => slot.slot === "MAN")!;
    const changed = initial.slots.map((slot) =>
      slot.day === target.day && slot.slot === target.slot
        ? { ...slot, dishId: slot.dishId === "ga_kho_gung" ? "ca_kho_to" : "ga_kho_gung" }
        : slot
    );
    const first = await saveWeekPlan({
      weekStart: initial.weekStart,
      expectedVersion: initial.version,
      slots: changed,
    });
    expect(first).toMatchObject({ ok: true, plan: { version: 2 } });

    const replay = await saveWeekPlan({
      weekStart: initial.weekStart,
      expectedVersion: initial.version,
      slots: changed,
    });
    expect(replay).toMatchObject({ ok: true, plan: { version: 2 } });

    const staleDivergence = await saveWeekPlan({
      weekStart: initial.weekStart,
      expectedVersion: initial.version,
      slots: initial.slots,
    });
    expect(staleDivergence).toMatchObject({
      ok: false,
      kind: "conflict",
      canonical: { version: 2 },
    });
    expect((await loadWeekPlan(initial.weekStart))?.plan.slots).toEqual(changed);
  });

  it("persists an owned B1 exactly and rejects it from another household", async () => {
    const initial = (await loadOrCreateWeekPlan("2026-07-27")).plan;
    const fork = {
      ...structuredClone(REPERTOIRE_BY_ID.ga_kho_gung),
      id: "hh-owned-chicken",
      origin: "B1" as const,
      sourceRepertoireId: "ga_kho_gung",
    };
    const target = initial.slots.find((slot) => slot.slot === "MAN")!;
    const withFork = initial.slots.map((slot) =>
      slot.day === target.day && slot.slot === target.slot
        ? { ...slot, dishId: fork.id }
        : slot
    );
    expect(await saveWeekPlan({
      weekStart: initial.weekStart,
      expectedVersion: initial.version,
      slots: withFork,
      householdDishes: [fork],
    })).toMatchObject({ ok: true });
    expect((await loadWeekPlan(initial.weekStart))?.householdDishes).toContainEqual(fork);

    stateRef.current = emptyState("household-b");
    const other = (await loadOrCreateWeekPlan("2026-07-27")).plan;
    const otherTarget = other.slots.find((slot) => slot.slot === "MAN")!;
    await expect(saveWeekPlan({
      weekStart: other.weekStart,
      expectedVersion: other.version,
      slots: other.slots.map((slot) =>
        slot.day === otherTarget.day && slot.slot === otherTarget.slot
          ? { ...slot, dishId: fork.id }
          : slot
      ),
    })).rejects.toThrow("UNKNOWN_OR_UNOWNED_DISH");
  });

  it("persists an unselected B1 library item and keeps canonical same-ID data", async () => {
    const fork = {
      ...structuredClone(REPERTOIRE_BY_ID.ga_kho_gung),
      id: "hh-library-only",
      origin: "B1" as const,
      sourceRepertoireId: "ga_kho_gung",
    };
    expect(await syncMissingHouseholdDishes([fork])).toContainEqual(fork);
    expect(await loadHouseholdDishLibrary()).toContainEqual(fork);

    const staleDeviceCopy = { ...fork, vnName: "Tên cũ trên thiết bị" };
    const reconciled = await syncMissingHouseholdDishes([staleDeviceCopy]);
    expect(reconciled.find((dish) => dish.id === fork.id)?.vnName).toBe(
      fork.vnName,
    );

    stateRef.current = emptyState("household-b");
    await expect(
      syncMissingHouseholdDishes([fork]),
    ).rejects.toThrow("B1_OWNERSHIP_MISMATCH");
  });

  it("rechecks new household restrictions before saving", async () => {
    const initial = (await loadOrCreateWeekPlan("2026-07-27")).plan;
    stateRef.current = {
      ...stateRef.current!,
      household: {
        ...stateRef.current!.household,
        restrictions: ["vegetarian"],
      },
    };
    await expect(saveWeekPlan({
      weekStart: initial.weekStart,
      expectedVersion: initial.version,
      slots: initial.slots,
    })).rejects.toThrow("DISH_RESTRICTION_UNSAFE");
  });
});
