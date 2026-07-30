import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { householdRef } = vi.hoisted(() => ({
  householdRef: { current: "household-a" },
}));
vi.mock("@/lib/auth", () => ({
  isE2EMode: () => true,
  requireUserId: vi.fn(async () => "e2e-user"),
}));
vi.mock("@/lib/db", () => ({
  getDb: () => {
    throw new Error("E2E repository adapter must not access the database");
  },
}));
vi.mock("@/data/repo/household", () => ({
  currentHouseholdId: async () => householdRef.current,
}));

import {
  deleteKitchenSession,
  loadKitchenSession,
  resetE2EKitchenSessionsForTests,
  saveKitchenSession,
} from "./kitchen-session";

describe("kitchen session repository E2E adapter", () => {
  beforeEach(() => {
    resetE2EKitchenSessionsForTests();
    householdRef.current = "household-a";
  });

  it("persists by household and returns canonical state on stale writes", async () => {
    const first = await saveKitchenSession(
      "cooking",
      "dish-a",
      { completedStepIds: ["prepare"] },
      null,
    );
    expect(first).toMatchObject({ ok: true, session: { version: 1 } });

    const second = await saveKitchenSession(
      "cooking",
      "dish-a",
      { completedStepIds: ["prepare", "cook"] },
      1,
    );
    expect(second).toMatchObject({ ok: true, session: { version: 2 } });

    const stale = await saveKitchenSession(
      "cooking",
      "dish-a",
      { completedStepIds: [] },
      1,
    );
    expect(stale).toMatchObject({
      ok: false,
      kind: "conflict",
      canonical: {
        version: 2,
        payload: { completedStepIds: ["prepare", "cook"] },
      },
    });
  });

  it("isolates households and version-checks deletion", async () => {
    const created = await saveKitchenSession(
      "meal-run",
      "2026-07-27:0",
      { day: 0 },
      null,
    );
    expect(created.ok).toBe(true);

    householdRef.current = "household-b";
    expect(
      await loadKitchenSession("meal-run", "2026-07-27:0"),
    ).toBeUndefined();

    householdRef.current = "household-a";
    const conflict = await deleteKitchenSession(
      "meal-run",
      "2026-07-27:0",
      999,
    );
    expect(conflict).toMatchObject({ ok: false, kind: "conflict" });
    expect(
      await loadKitchenSession("meal-run", "2026-07-27:0"),
    ).toBeDefined();

    expect(
      await deleteKitchenSession("meal-run", "2026-07-27:0", 1),
    ).toEqual({ ok: true });
    expect(
      await loadKitchenSession("meal-run", "2026-07-27:0"),
    ).toBeUndefined();
  });
});
