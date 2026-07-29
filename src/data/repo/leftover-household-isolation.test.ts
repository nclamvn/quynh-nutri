import { describe, expect, it, vi } from "vitest";
import type { CreateLeftoverLotInput } from "@/domain/types";

vi.mock("server-only", () => ({}));

const harness = vi.hoisted(() => {
  let currentUser = "user-a";
  let sequence = 0;
  type LotRow = {
    id: string;
    idempotencyKey: string;
    householdId: string;
    dishRef: string;
    dishLabelSnapshot: string;
    remainingServings: number;
    preparedAt: Date;
    chilledAt: Date;
    storageLocation: string;
    hotWeatherConfirmed: boolean;
    policyVersion: string;
    sourceMealRunRef: string | null;
    note: string | null;
    createdByUserId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  const lots: LotRow[] = [];
  const householdForUser = new Map([
    ["user-a", "household-a"],
    ["user-b", "household-b"],
  ]);
  const delegates = {
    household: {
      findUnique: async ({ where }: { where: { userId?: string } }) => {
        const id = where.userId ? householdForUser.get(where.userId) : undefined;
        return id ? { id } : null;
      },
    },
    leftoverLot: {
      findUnique: async ({
        where,
      }: {
        where: {
          householdId_idempotencyKey: { householdId: string; idempotencyKey: string };
        };
      }) => {
        const key = where.householdId_idempotencyKey;
        return lots.find(
          (lot) => lot.householdId === key.householdId
            && lot.idempotencyKey === key.idempotencyKey,
        ) ?? null;
      },
      findFirst: async ({
        where,
      }: {
        where: { id: string; householdId: string };
      }) => lots.find(
        (lot) => lot.id === where.id && lot.householdId === where.householdId,
      ) ?? null,
      create: async ({ data }: { data: Omit<LotRow, "id" | "createdAt" | "updatedAt"> }) => {
        const now = new Date();
        const row: LotRow = {
          ...data,
          id: `leftover-${++sequence}`,
          createdAt: now,
          updatedAt: now,
        };
        lots.push(row);
        return row;
      },
    },
    leftoverMovement: {
      findUnique: async () => null,
    },
  };
  return {
    delegates,
    getCurrentUser: () => currentUser,
    setCurrentUser: (userId: string) => { currentUser = userId; },
    lots,
  };
});

vi.mock("@/lib/auth", () => ({
  isE2EMode: () => false,
  requireUserId: vi.fn(async () => harness.getCurrentUser()),
}));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    ...harness.delegates,
    $transaction: async (
      callback: (tx: typeof harness.delegates) => Promise<unknown>,
    ) => callback(harness.delegates),
  }),
}));

import {
  createLeftoverLotRecord,
  recordLeftoverMovementRecord,
} from "./household";

const input = (): CreateLeftoverLotInput & { dishLabelSnapshot: string } => {
  const chilledAt = new Date();
  return {
    idempotencyKey: "00000000-0000-4000-8000-000000000006",
    dishRef: "com-trang",
    dishLabelSnapshot: "Cơm trắng",
    servings: 2,
    preparedAt: new Date(chilledAt.getTime() - 20 * 60_000).toISOString(),
    chilledAt: chilledAt.toISOString(),
    storageLocation: "fridge",
    hotWeatherConfirmed: false,
  };
};

describe("leftover household isolation contract", () => {
  it("allows the same idempotency key per household and blocks cross-household mutation", async () => {
    harness.setCurrentUser("user-a");
    const householdALot = await createLeftoverLotRecord(input());
    const householdAReplay = await createLeftoverLotRecord(input());
    expect(householdAReplay.id).toBe(householdALot.id);

    harness.setCurrentUser("user-b");
    const householdBLot = await createLeftoverLotRecord(input());
    expect(householdBLot.id).not.toBe(householdALot.id);
    expect(harness.lots).toHaveLength(2);

    await expect(recordLeftoverMovementRecord({
      idempotencyKey: "00000000-0000-4000-8000-000000000007",
      lotId: householdALot.id,
      kind: "consumed",
      servings: 1,
      occurredAt: new Date().toISOString(),
    })).rejects.toThrow("LEFTOVER_NOT_FOUND");
  });
});
