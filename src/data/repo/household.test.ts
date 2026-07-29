import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateLeftoverLotInput, ReceiveShoppingItemInput } from "@/domain/types";

vi.mock("server-only", () => ({}));

const { requireUserId } = vi.hoisted(() => ({
  requireUserId: vi.fn(async () => "e2e-user"),
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

import {
  createManualInventoryLotRecord,
  createLeftoverLotRecord,
  loadHouseholdState,
  receiveShoppingItemRecord,
  recordInventoryMovementRecord,
  recordLeftoverMovementRecord,
} from "./household";

const receiveInput = (
  suffix: string,
  overrides: Partial<ReceiveShoppingItemInput> = {},
): ReceiveShoppingItemInput => ({
  idempotencyKey: crypto.randomUUID(),
  weekRef: "2026-07-27",
  commodityId: `test-commodity-${suffix}`,
  vendor: `test-vendor-${suffix}`,
  plannedQty: 300,
  actualQty: 310,
  unit: "g",
  boughtAt: "2026-07-29T02:00:00.000Z",
  addToPantry: true,
  storageLocation: "fridge",
  ...overrides,
});

describe("receiveShoppingItemRecord E2E adapter", () => {
  beforeEach(() => requireUserId.mockClear());

  it("replays one canonical fulfillment, purchase and lot for an idempotency retry", async () => {
    const input = receiveInput(crypto.randomUUID());
    const [first, replay] = await Promise.all([
      receiveShoppingItemRecord(input),
      receiveShoppingItemRecord(input),
    ]);

    expect(replay.fulfillment.id).toBe(first.fulfillment.id);
    expect(replay.purchase.id).toBe(first.purchase.id);
    expect(replay.lot?.id).toBe(first.lot?.id);

    const state = await loadHouseholdState();
    expect(state.fulfillments.filter((row) => row.id === first.fulfillment.id)).toHaveLength(1);
    expect(state.purchases.filter((row) => row.id === first.purchase.id)).toHaveLength(1);
    expect(state.pantry.filter((row) => row.id === first.lot?.id)).toHaveLength(1);
    expect(requireUserId).toHaveBeenCalled();
  });

  it("re-confirm updates the linked rows without creating new canonical IDs", async () => {
    const suffix = crypto.randomUUID();
    const first = await receiveShoppingItemRecord(receiveInput(suffix));
    const updated = await receiveShoppingItemRecord(
      receiveInput(suffix, {
        actualQty: 275,
        pricePaid: 24_000,
        storageLocation: "freezer",
      }),
    );

    expect(updated.fulfillment.id).toBe(first.fulfillment.id);
    expect(updated.purchase.id).toBe(first.purchase.id);
    expect(updated.lot?.id).toBe(first.lot?.id);
    expect(updated.fulfillment.actualQty).toBe(275);
    expect(updated.lot).toMatchObject({ qty: 275, storageLocation: "freezer" });
  });

  it("does not detach an existing lot when re-confirmed without pantry storage", async () => {
    const suffix = crypto.randomUUID();
    await receiveShoppingItemRecord(receiveInput(suffix));

    await expect(
      receiveShoppingItemRecord(
        receiveInput(suffix, {
          addToPantry: false,
          storageLocation: undefined,
        }),
      ),
    ).rejects.toThrow("LOT_ALREADY_CREATED");
  });
});

describe("recordInventoryMovementRecord E2E adapter", () => {
  it("decrements once and replays the same canonical movement for a retry", async () => {
    const lot = await createManualInventoryLotRecord({
      commodityId: "movement-item",
      qty: 310,
      unit: "g",
      purchasedAt: "2026-07-29T02:00:00.000Z",
      storageLocation: "fridge",
    });
    const input = {
      idempotencyKey: crypto.randomUUID(),
      lotId: lot.id,
      kind: "consumed" as const,
      qty: 100,
      occurredAt: "2026-07-29T03:00:00.000Z",
    };

    const first = await recordInventoryMovementRecord(input);
    const replay = await recordInventoryMovementRecord(input);

    expect(first.lot.qty).toBe(210);
    expect(replay.movement.id).toBe(first.movement.id);
    expect(replay.lot.qty).toBe(210);
    const state = await loadHouseholdState();
    expect(
      state.inventoryMovements.filter(
        (movement) => movement.idempotencyKey === input.idempotencyKey,
      ),
    ).toHaveLength(1);
  });

  it("rejects overdraw without changing the lot or creating a movement", async () => {
    const lot = await createManualInventoryLotRecord({
      commodityId: "overdraw-item",
      qty: 40,
      unit: "g",
      purchasedAt: "2026-07-29T02:00:00.000Z",
      storageLocation: "pantry",
    });
    const idempotencyKey = crypto.randomUUID();

    await expect(
      recordInventoryMovementRecord({
        idempotencyKey,
        lotId: lot.id,
        kind: "discarded",
        qty: 50,
        occurredAt: "2026-07-29T03:00:00.000Z",
      }),
    ).rejects.toThrow("INSUFFICIENT_STOCK");

    const state = await loadHouseholdState();
    expect(state.pantry.find((item) => item.id === lot.id)?.qty).toBe(40);
    expect(
      state.inventoryMovements.some(
        (movement) => movement.idempotencyKey === idempotencyKey,
      ),
    ).toBe(false);
  });

  it("rejects legacy pantry IDs", async () => {
    await expect(
      recordInventoryMovementRecord({
        idempotencyKey: crypto.randomUUID(),
        lotId: "legacy:hh:item:0",
        kind: "consumed",
        qty: 1,
        occurredAt: "2026-07-29T03:00:00.000Z",
      }),
    ).rejects.toThrow("LEGACY_LOT_READ_ONLY");
  });
});

const leftoverInput = (
  overrides: Partial<CreateLeftoverLotInput> = {},
): CreateLeftoverLotInput & { dishLabelSnapshot: string } => {
  const chilledAt = new Date();
  const preparedAt = new Date(chilledAt.getTime() - 30 * 60_000);
  return {
    idempotencyKey: crypto.randomUUID(),
    dishRef: "com-trang",
    dishLabelSnapshot: "Cơm trắng",
    servings: 2,
    preparedAt: preparedAt.toISOString(),
    chilledAt: chilledAt.toISOString(),
    storageLocation: "fridge",
    hotWeatherConfirmed: false,
    ...overrides,
  };
};

describe("leftover repository E2E adapter", () => {
  it("creates one dish-level lot for an idempotency retry without touching inventory", async () => {
    const before = await loadHouseholdState();
    const input = leftoverInput();
    const [first, replay] = await Promise.all([
      createLeftoverLotRecord(input),
      createLeftoverLotRecord(input),
    ]);

    expect(replay.id).toBe(first.id);
    expect(first).toMatchObject({
      dishRef: "com-trang",
      dishLabelSnapshot: "Cơm trắng",
      remainingServings: 2,
      policyVersion: "usda-fsis-2026-07-29",
    });
    const after = await loadHouseholdState();
    expect(after.leftoverLots.filter((lot) => lot.id === first.id)).toHaveLength(1);
    expect(after.pantry).toEqual(before.pantry);
    expect(after.inventoryMovements).toEqual(before.inventoryMovements);
  });

  it("rejects a cooling window over the reviewed threshold", async () => {
    const chilledAt = new Date();
    await expect(createLeftoverLotRecord(leftoverInput({
      preparedAt: new Date(chilledAt.getTime() - 121 * 60_000).toISOString(),
      chilledAt: chilledAt.toISOString(),
    }))).rejects.toThrow("COOLING_WINDOW_EXCEEDED");
  });

  it("decrements once, replays once and rejects overdraw without inventory mutation", async () => {
    const lot = await createLeftoverLotRecord(leftoverInput({ servings: 2 }));
    const inventoryBefore = await loadHouseholdState();
    const input = {
      idempotencyKey: crypto.randomUUID(),
      lotId: lot.id,
      kind: "consumed" as const,
      servings: 0.5,
      occurredAt: new Date().toISOString(),
    };
    const first = await recordLeftoverMovementRecord(input);
    const replay = await recordLeftoverMovementRecord(input);
    expect(first.lot.remainingServings).toBe(1.5);
    expect(replay.movement.id).toBe(first.movement.id);
    expect(replay.lot.remainingServings).toBe(1.5);

    await expect(recordLeftoverMovementRecord({
      ...input,
      idempotencyKey: crypto.randomUUID(),
      servings: 2,
    })).rejects.toThrow("INSUFFICIENT_LEFTOVER");

    const after = await loadHouseholdState();
    expect(after.leftoverMovements.filter(
      (movement) => movement.idempotencyKey === input.idempotencyKey,
    )).toHaveLength(1);
    expect(after.pantry).toEqual(inventoryBefore.pantry);
    expect(after.inventoryMovements).toEqual(inventoryBefore.inventoryMovements);
  });

  it("records corrections with before/after audit and allows an explicit zero balance", async () => {
    const lot = await createLeftoverLotRecord(leftoverInput({ servings: 3 }));
    const result = await recordLeftoverMovementRecord({
      idempotencyKey: crypto.randomUUID(),
      lotId: lot.id,
      kind: "corrected",
      servings: 0,
      occurredAt: new Date().toISOString(),
      note: "Đã kiểm lại hộp",
    });
    expect(result.lot.remainingServings).toBe(0);
    expect(result.movement).toMatchObject({
      kind: "corrected",
      servings: 3,
      beforeServings: 3,
      afterServings: 0,
    });
  });
});
