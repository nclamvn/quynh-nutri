import "server-only";

import { Prisma } from "@prisma/client";
import type {
  ConfirmMealCloseoutInput,
  ConfirmMealCloseoutResult,
  InventoryLot,
  InventoryMovement,
  MealCompletion,
  MealOccasion,
  PantryItem,
} from "@/domain/types";
import {
  parseMealRunSession,
  type MealRunSession,
} from "@/domain/kitchen-execution/meal-coordination";
import { getDb } from "@/lib/db";
import { isE2EMode } from "@/lib/auth";

type CompletionRow = {
  id: string;
  idempotencyKey: string;
  weekRef: string;
  day: number;
  occasion: MealOccasion;
  dishRefs: string[];
  sourceSessionCreatedAt: Date;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const toCompletion = (row: CompletionRow): MealCompletion => ({
  id: row.id,
  idempotencyKey: row.idempotencyKey,
  weekRef: row.weekRef,
  day: row.day,
  occasion: row.occasion,
  dishRefs: [...row.dishRefs],
  sourceSessionCreatedAt: row.sourceSessionCreatedAt.toISOString(),
  completedAt: row.completedAt.toISOString(),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const toLot = (row: {
  id: string;
  commodityId: string;
  qty: number;
  unit: string;
  purchasedAt: Date;
  storageLocation: string;
  bestBefore: Date | null;
  sourceWeekRef: string | null;
  sourceShoppingKey: string | null;
}): InventoryLot => ({
  id: row.id,
  commodityId: row.commodityId,
  qty: row.qty,
  unit: row.unit,
  purchasedAt: row.purchasedAt.toISOString(),
  storageLocation: row.storageLocation as InventoryLot["storageLocation"],
  bestBefore: row.bestBefore?.toISOString(),
  expiry: row.bestBefore?.toISOString(),
  sourceWeekRef: row.sourceWeekRef ?? undefined,
  sourceShoppingKey: row.sourceShoppingKey ?? undefined,
});

const toMovement = (row: {
  id: string;
  idempotencyKey: string;
  inventoryLotId: string;
  commodityId: string;
  kind: string;
  qty: number;
  unit: string;
  qtyBefore: number;
  qtyAfter: number;
  occurredAt: Date;
  note: string | null;
  sourceMealCompletionId: string | null;
  createdAt: Date;
}): InventoryMovement => ({
  id: row.id,
  idempotencyKey: row.idempotencyKey,
  inventoryLotId: row.inventoryLotId,
  commodityId: row.commodityId,
  kind: row.kind as InventoryMovement["kind"],
  qty: row.qty,
  unit: row.unit,
  qtyBefore: row.qtyBefore,
  qtyAfter: row.qtyAfter,
  occurredAt: row.occurredAt.toISOString(),
  note: row.note ?? undefined,
  sourceMealCompletionId: row.sourceMealCompletionId ?? undefined,
  createdAt: row.createdAt.toISOString(),
});

interface ConfirmMealCloseoutRecordInput extends ConfirmMealCloseoutInput {
  householdId: string;
  userId: string;
  allowedDishIds: string[];
}

interface E2EMealState {
  completions: MealCompletion[];
  movements: InventoryMovement[];
  lotQty: Map<string, number>;
}

const e2eByHousehold = new Map<string, E2EMealState>();

const e2eState = (householdId: string): E2EMealState => {
  const existing = e2eByHousehold.get(householdId);
  if (existing) return existing;
  const created: E2EMealState = {
    completions: [],
    movements: [],
    lotQty: new Map(),
  };
  e2eByHousehold.set(householdId, created);
  return created;
};

export function mergeE2EMealCompletionState<T extends {
  pantry: PantryItem[];
  inventoryMovements: InventoryMovement[];
  mealCompletions: MealCompletion[];
}>(householdId: string, state: T): T {
  const mealState = e2eState(householdId);
  state.mealCompletions = structuredClone(mealState.completions);
  state.inventoryMovements = [
    ...structuredClone(mealState.movements),
    ...state.inventoryMovements.filter(
      (movement) => !mealState.movements.some((item) => item.id === movement.id),
    ),
  ];
  state.pantry = state.pantry.map((lot) => {
    if (!lot.id || !mealState.lotQty.has(lot.id)) return lot;
    return { ...lot, qty: mealState.lotQty.get(lot.id)! };
  });
  return state;
}

export async function loadMealCompletionsForHousehold(
  householdId: string,
  weekRef?: string,
): Promise<MealCompletion[]> {
  if (isE2EMode()) {
    return structuredClone(
      e2eState(householdId).completions.filter(
        (item) => !weekRef || item.weekRef === weekRef,
      ),
    );
  }
  const rows = await getDb().mealCompletion.findMany({
    where: { householdId, ...(weekRef && { weekRef }) },
    orderBy: { completedAt: "asc" },
  });
  return rows.map(toCompletion);
}

function parseCompletedSession(
  payload: unknown,
  day: number,
  allowedDishIds: readonly string[],
): MealRunSession {
  const parsed = parseMealRunSession(
    JSON.stringify(payload),
    day,
    new Set(allowedDishIds),
  );
  if (!parsed) throw new Error("MEAL_SESSION_INVALID");
  if (parsed.tasks.length === 0 || parsed.tasks.some((task) => !task.completedAt)) {
    throw new Error("MEAL_SESSION_INCOMPLETE");
  }
  return parsed;
}

async function confirmE2E(
  input: ConfirmMealCloseoutRecordInput,
  pantry: readonly PantryItem[],
  session: { payload: unknown; version: number } | undefined,
): Promise<ConfirmMealCloseoutResult> {
  const state = e2eState(input.householdId);
  const replay = state.completions.find(
    (item) => item.idempotencyKey === input.idempotencyKey,
  );
  if (replay) {
    return {
      ok: true,
      completion: structuredClone(replay),
      movements: structuredClone(
        state.movements.filter(
          (item) => item.sourceMealCompletionId === replay.id,
        ),
      ),
      lots: pantry
        .filter((lot): lot is InventoryLot => Boolean(lot.id))
        .filter((lot) =>
          state.movements.some(
            (movement) =>
              movement.sourceMealCompletionId === replay.id
              && movement.inventoryLotId === lot.id,
          ),
        )
        .map((lot) => ({
          ...structuredClone(lot),
          qty: state.lotQty.get(lot.id!) ?? lot.qty,
        })),
    };
  }
  if (!session || session.version !== input.expectedSessionVersion) {
    throw new Error("MEAL_SESSION_CONFLICT");
  }
  const parsed = parseCompletedSession(
    session.payload,
    input.day,
    input.allowedDishIds,
  );
  const conflict = state.completions.find(
    (item) =>
      item.weekRef === input.weekRef
      && item.day === input.day
      && item.occasion === input.occasion
      && item.sourceSessionCreatedAt === parsed.createdAt,
  );
  if (conflict) {
    return { ok: false, kind: "conflict", completion: structuredClone(conflict) };
  }
  const lots = input.consumptions.map((selection) => {
    const lot = pantry.find((item) => item.id === selection.lotId);
    if (!lot) throw new Error("LOT_NOT_FOUND");
    const currentQty = state.lotQty.get(selection.lotId) ?? lot.qty;
    if (selection.qty > currentQty + Number.EPSILON) {
      throw new Error("INSUFFICIENT_STOCK");
    }
    return { lot, currentQty, selection };
  });
  const now = new Date().toISOString();
  const completion: MealCompletion = {
    id: `meal_${crypto.randomUUID()}`,
    idempotencyKey: input.idempotencyKey,
    weekRef: input.weekRef,
    day: input.day,
    occasion: input.occasion,
    dishRefs: parsed.tasks.map((task) => task.dishId),
    sourceSessionCreatedAt: parsed.createdAt,
    completedAt: input.completedAt,
    createdAt: now,
    updatedAt: now,
  };
  const movements = lots.map(({ lot, currentQty, selection }) => {
    const qtyAfter = currentQty - selection.qty;
    state.lotQty.set(selection.lotId, qtyAfter);
    return {
      id: `movement_${crypto.randomUUID()}`,
      idempotencyKey: `${input.idempotencyKey}:${selection.lotId}`,
      inventoryLotId: selection.lotId,
      commodityId: lot.commodityId,
      kind: "consumed" as const,
      qty: selection.qty,
      unit: lot.unit,
      qtyBefore: currentQty,
      qtyAfter,
      occurredAt: input.completedAt,
      sourceMealCompletionId: completion.id,
      createdAt: now,
    };
  });
  state.completions.push(completion);
  state.movements.unshift(...movements);
  return {
    ok: true,
    completion: structuredClone(completion),
    movements: structuredClone(movements),
    lots: lots.map(({ lot, selection }) => ({
      ...structuredClone(lot),
      qty: state.lotQty.get(selection.lotId)!,
    })) as InventoryLot[],
  };
}

export async function confirmMealCloseoutRecord(
  input: ConfirmMealCloseoutRecordInput,
  e2e?: {
    pantry: readonly PantryItem[];
    session: { payload: unknown; version: number } | undefined;
  },
): Promise<ConfirmMealCloseoutResult> {
  if (isE2EMode()) {
    return confirmE2E(input, e2e?.pantry ?? [], e2e?.session);
  }

  const db = getDb();
  const replay = await db.mealCompletion.findUnique({
    where: {
      householdId_idempotencyKey: {
        householdId: input.householdId,
        idempotencyKey: input.idempotencyKey,
      },
    },
    include: {
      inventoryMovements: {
        include: { inventoryLot: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (replay) {
    return {
      ok: true,
      completion: toCompletion(replay),
      movements: replay.inventoryMovements.map((movement) =>
        toMovement({
          ...movement,
          commodityId: movement.inventoryLot.commodityId,
        }),
      ),
      lots: replay.inventoryMovements.map((movement) =>
        toLot(movement.inventoryLot),
      ),
    };
  }

  let sourceSessionCreatedAt: Date | undefined;
  try {
    return await db.$transaction(async (tx) => {
      const scopeKey = `${input.weekRef}:${input.day}:${input.occasion}`;
      const session = await tx.kitchenSession.findUnique({
        where: {
          householdId_kind_scopeKey: {
            householdId: input.householdId,
            kind: "meal-run",
            scopeKey,
          },
        },
      });
      if (!session || session.version !== input.expectedSessionVersion) {
        throw new Error("MEAL_SESSION_CONFLICT");
      }
      const parsed = parseCompletedSession(
        session.payload,
        input.day,
        input.allowedDishIds,
      );
      sourceSessionCreatedAt = new Date(parsed.createdAt);
      const prior = await tx.mealCompletion.findUnique({
        where: {
          householdId_weekRef_day_occasion_sourceSessionCreatedAt: {
            householdId: input.householdId,
            weekRef: input.weekRef,
            day: input.day,
            occasion: input.occasion,
            sourceSessionCreatedAt,
          },
        },
      });
      if (prior) {
        return {
          ok: false as const,
          kind: "conflict" as const,
          completion: toCompletion(prior),
        };
      }
      const selectedIds = input.consumptions.map((item) => item.lotId);
      const lots = await tx.inventoryLot.findMany({
        where: { householdId: input.householdId, id: { in: selectedIds } },
      });
      if (lots.length !== selectedIds.length) throw new Error("LOT_NOT_FOUND");
      const lotById = new Map(lots.map((lot) => [lot.id, lot]));
      for (const selection of input.consumptions) {
        const lot = lotById.get(selection.lotId)!;
        if (selection.qty > lot.qty + Number.EPSILON) {
          throw new Error("INSUFFICIENT_STOCK");
        }
      }
      const completion = await tx.mealCompletion.create({
        data: {
          householdId: input.householdId,
          idempotencyKey: input.idempotencyKey,
          weekRef: input.weekRef,
          day: input.day,
          occasion: input.occasion,
          dishRefs: parsed.tasks.map((task) => task.dishId),
          sourceSessionCreatedAt,
          completedAt: new Date(input.completedAt),
          createdByUserId: input.userId,
        },
      });
      const movements: InventoryMovement[] = [];
      const updatedLots: InventoryLot[] = [];
      for (const selection of input.consumptions) {
        const lot = lotById.get(selection.lotId)!;
        const updated = await tx.inventoryLot.update({
          where: { id: lot.id },
          data: { qty: { decrement: selection.qty } },
        });
        const movement = await tx.inventoryMovement.create({
          data: {
            idempotencyKey: `${input.idempotencyKey}:${selection.lotId}`,
            householdId: input.householdId,
            inventoryLotId: lot.id,
            kind: "consumed",
            qty: selection.qty,
            unit: lot.unit,
            qtyBefore: lot.qty,
            qtyAfter: updated.qty,
            occurredAt: new Date(input.completedAt),
            note: `meal:${completion.id}`,
            sourceMealCompletionId: completion.id,
          },
          include: { inventoryLot: true },
        });
        movements.push(toMovement({
          ...movement,
          commodityId: movement.inventoryLot.commodityId,
        }));
        updatedLots.push(toLot(updated));
      }
      const deleted = await tx.kitchenSession.deleteMany({
        where: {
          id: session.id,
          householdId: input.householdId,
          version: input.expectedSessionVersion,
        },
      });
      if (deleted.count !== 1) throw new Error("MEAL_SESSION_CONFLICT");
      await tx.productEvent.create({
        data: {
          householdId: input.householdId,
          name: "meal_completed",
          dedupeKey: `meal_completed:${input.idempotencyKey}`,
          properties: {
            dishCount: parsed.tasks.length,
            occasion: input.occasion,
            inventoryMovementCount: movements.length,
            openedLeftoverCapture: true,
          } as Prisma.InputJsonValue,
        },
      });
      return {
        ok: true as const,
        completion: toCompletion(completion),
        movements,
        lots: updatedLots,
      };
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
      && error.code === "P2002"
    ) {
      const replayAfterRace = await db.mealCompletion.findUnique({
        where: {
          householdId_idempotencyKey: {
            householdId: input.householdId,
            idempotencyKey: input.idempotencyKey,
          },
        },
        include: {
          inventoryMovements: {
            include: { inventoryLot: true },
            orderBy: { createdAt: "asc" },
          },
        },
      });
      if (replayAfterRace) {
        return {
          ok: true,
          completion: toCompletion(replayAfterRace),
          movements: replayAfterRace.inventoryMovements.map((movement) =>
            toMovement({
              ...movement,
              commodityId: movement.inventoryLot.commodityId,
            }),
          ),
          lots: replayAfterRace.inventoryMovements.map((movement) =>
            toLot(movement.inventoryLot),
          ),
        };
      }
      const canonical = sourceSessionCreatedAt
        ? await db.mealCompletion.findUnique({
          where: {
            householdId_weekRef_day_occasion_sourceSessionCreatedAt: {
              householdId: input.householdId,
              weekRef: input.weekRef,
              day: input.day,
              occasion: input.occasion,
              sourceSessionCreatedAt,
            },
          },
        })
        : undefined;
      if (canonical) {
        return {
          ok: false,
          kind: "conflict",
          completion: toCompletion(canonical),
        };
      }
    }
    throw error;
  }
}

export function resetE2EMealCompletionsForTests(): void {
  e2eByHousehold.clear();
}
