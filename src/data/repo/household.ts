import "server-only";
import { getDb } from "@/lib/db";
import { isE2EMode, requireUserId } from "@/lib/auth";
import { DEFAULT_HOUSEHOLD } from "@/data/seed/household";
import { normalizeLegacyPantry } from "@/domain/pantry/legacy";
import type {
  Household,
  PantryItem,
  InventoryLot,
  ShoppingFulfillment,
  ReceiveShoppingItemInput,
  ReceiveShoppingItemResult,
  InventoryMovement,
  RecordInventoryMovementInput,
  RecordInventoryMovementResult,
  StorageLocation,
  LeftoverLot,
  LeftoverMovement,
  CreateLeftoverLotInput,
  RecordLeftoverMovementInput,
  RecordLeftoverMovementResult,
  DietRestriction,
  Allergen,
  Activity,
  MemberRole,
  DayName,
  HealthProfile,
  Member,
  MemberState,
  Supplier,
  SupplierChannel,
  SupplierType,
  Order,
  OrderLine,
  OrderStatus,
  ChannelKind,
  PurchaseRecord,
  PurchaseLine,
  OnTime,
  MealCompletion,
  MealFeedback,
} from "@/domain/types";
import { mergeE2EMealCompletionState } from "@/data/repo/meal-completion";
import {
  mergeE2EMealFeedbackState,
  toMealFeedback,
} from "@/data/repo/meal-feedback";
import {
  evaluateCoolingWindow,
  LEFTOVER_POLICY_VERSION,
} from "@/domain/kitchen-execution/leftover-safety";
import type {
  OnboardingInput,
  OnboardingResult,
} from "@/domain/onboarding";

const HH_ID = DEFAULT_HOUSEHOLD.id;

// Resolve the signed-in user's household – creating one from the seed template
// on first sign-in. Unauthenticated access fails closed; only the explicitly
// isolated E2E adapter below may use the template id.
export async function currentHouseholdId(): Promise<string> {
  const userId = await requireUserId();
  if (isE2EMode()) return HH_ID;
  const db = getDb();
  const existing = await db.household.findUnique({ where: { userId }, select: { id: true } });
  if (existing) return existing.id;
  const t = DEFAULT_HOUSEHOLD;
  // "Bắt đầu trống": a brand-new household declares its OWN family – no generic
  // template members, size 0 until they add people (portions follow member count).
  const created = await db.household.create({
    data: {
      userId,
      name: t.name,
      size: 0,
      marketMode: t.marketMode,
      cookTimeCapMin: t.cookTimeCapMin,
      busyDays: t.busyDays,
      lactatingMember: t.lactatingMember,
      restrictions: [],
      favorites: [],
      notes: [],
      pantry: [],
      members: { create: [] },
    },
    select: { id: true },
  });
  return created.id;
}

export interface HouseholdState {
  household: Household;
  favorites: string[];
  notes: { id: number; text: string }[];
  pantry: PantryItem[];
  suppliers: Supplier[];
  orders: Order[];
  purchases: PurchaseRecord[];
  fulfillments: ShoppingFulfillment[];
  inventoryMovements: InventoryMovement[];
  leftoverLots: LeftoverLot[];
  leftoverMovements: LeftoverMovement[];
  mealCompletions: MealCompletion[];
  mealFeedback: MealFeedback[];
}

const initialE2EHousehold = () => {
  if (process.env.E2E_EMPTY_HOUSEHOLD !== "1") {
    return structuredClone(DEFAULT_HOUSEHOLD);
  }
  return {
    ...structuredClone(DEFAULT_HOUSEHOLD),
    size: 0,
    members: [],
    restrictions: [],
  };
};

const e2eState: HouseholdState = {
  household: initialE2EHousehold(),
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
  mealFeedback: [],
};
const e2eReceiveResults = new Map<string, ReceiveShoppingItemResult>();
const cloneE2EState = (): HouseholdState =>
  mergeE2EMealFeedbackState(
    HH_ID,
    mergeE2EMealCompletionState(HH_ID, structuredClone(e2eState)),
  );
const e2eId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

export async function loadHouseholdState(): Promise<HouseholdState> {
  await requireUserId();
  if (isE2EMode()) return cloneE2EState();
  const id = await currentHouseholdId();
  return (await loadHouseholdStateForSystem(id)) ?? {
    household: DEFAULT_HOUSEHOLD,
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
    mealFeedback: [],
  };
}

/**
 * System-only household projection for the protected reminder dispatcher.
 * Callers must resolve the household id from server-owned rows, never request
 * input. Interactive flows must continue to use loadHouseholdState().
 */
export async function loadHouseholdStateForSystem(
  id: string,
): Promise<HouseholdState | null> {
  if (isE2EMode()) return cloneE2EState();
  const row = await getDb().household.findUnique({
    where: { id },
    include: {
      members: { include: { states: true } },
      suppliers: true,
      orders: true,
      purchases: true,
      inventoryLots: true,
      inventoryMovements: {
        include: { inventoryLot: true },
        orderBy: { occurredAt: "desc" },
        take: 50,
      },
      leftoverLots: { orderBy: { chilledAt: "asc" } },
      leftoverMovements: {
        include: { leftoverLot: { select: { dishLabelSnapshot: true } } },
        orderBy: { occurredAt: "desc" },
        take: 50,
      },
      mealCompletions: { orderBy: { completedAt: "asc" } },
      mealFeedbacks: { orderBy: { updatedAt: "desc" } },
      shoppingFulfillments: { include: { inventoryLot: true } },
    },
  });
  if (!row) return null;

  const household: Household = {
    id: row.id,
    name: row.name,
    size: row.size,
    marketMode: row.marketMode as Household["marketMode"],
    cookTimeCapMin: row.cookTimeCapMin,
    busyDays: row.busyDays as DayName[],
    lactatingMember: row.lactatingMember,
    restrictions: (row.restrictions as DietRestriction[]) ?? [],
    members: row.members.map((m) => ({
      id: m.id,
      name: m.name ?? undefined,
      role: m.role as MemberRole,
      sex: (m.sex as "M" | "F" | null) ?? undefined,
      ageBand: m.ageBand ?? undefined,
      activity: m.activity as Activity,
      allergies: (m.allergies as Allergen[]) ?? [],
      habits: m.habits ?? [],
      conditions: m.conditions ?? [],
      dislikes: m.dislikes ?? [],
      healthProfile: (m.healthProfile as unknown as HealthProfile) ?? undefined,
      states: m.states.map((s) => ({
        id: s.id,
        kind: s.kind as MemberState["kind"],
        value: s.value,
        validFrom: s.validFrom.toISOString(),
        validUntil: s.validUntil ? s.validUntil.toISOString() : undefined,
      })),
    })),
  };
  return {
    household,
    favorites: row.favorites ?? [],
    notes: (row.notes as unknown as { id: number; text: string }[]) ?? [],
    pantry: [
      ...normalizeLegacyPantry(row.id, (row.pantry as unknown as PantryItem[]) ?? []),
      ...row.inventoryLots.map(rowToInventoryLot),
    ],
    suppliers: row.suppliers.map(rowToSupplier),
    orders: row.orders.map(rowToOrder),
    purchases: row.purchases.map(rowToPurchase),
    fulfillments: row.shoppingFulfillments.map(rowToFulfillment),
    inventoryMovements: row.inventoryMovements.map(rowToInventoryMovement),
    leftoverLots: row.leftoverLots.map(rowToLeftoverLot),
    leftoverMovements: row.leftoverMovements.map(rowToLeftoverMovement),
    mealCompletions: row.mealCompletions.map(rowToMealCompletion),
    mealFeedback: row.mealFeedbacks.map(toMealFeedback),
  };
}

type InventoryLotRow = {
  id: string;
  commodityId: string;
  qty: number;
  unit: string;
  purchasedAt: Date;
  storageLocation: string;
  bestBefore: Date | null;
  sourceWeekRef: string | null;
  sourceShoppingKey: string | null;
};

function rowToInventoryLot(row: InventoryLotRow): InventoryLot {
  return {
    id: row.id,
    commodityId: row.commodityId,
    qty: row.qty,
    unit: row.unit,
    purchasedAt: row.purchasedAt.toISOString(),
    storageLocation: row.storageLocation as StorageLocation,
    bestBefore: row.bestBefore?.toISOString(),
    expiry: row.bestBefore?.toISOString(),
    sourceWeekRef: row.sourceWeekRef ?? undefined,
    sourceShoppingKey: row.sourceShoppingKey ?? undefined,
  };
}

type InventoryMovementRow = {
  id: string;
  idempotencyKey: string;
  inventoryLotId: string;
  kind: string;
  qty: number;
  unit: string;
  qtyBefore: number;
  qtyAfter: number;
  occurredAt: Date;
  note: string | null;
  sourceMealCompletionId: string | null;
  createdAt: Date;
  inventoryLot: { commodityId: string };
};

function rowToInventoryMovement(row: InventoryMovementRow): InventoryMovement {
  return {
    id: row.id,
    idempotencyKey: row.idempotencyKey,
    inventoryLotId: row.inventoryLotId,
    commodityId: row.inventoryLot.commodityId,
    kind: row.kind as InventoryMovement["kind"],
    qty: row.qty,
    unit: row.unit,
    qtyBefore: row.qtyBefore,
    qtyAfter: row.qtyAfter,
    occurredAt: row.occurredAt.toISOString(),
    note: row.note ?? undefined,
    sourceMealCompletionId: row.sourceMealCompletionId ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

type LeftoverLotRow = {
  id: string;
  idempotencyKey: string;
  dishRef: string;
  dishLabelSnapshot: string;
  remainingServings: number;
  preparedAt: Date;
  chilledAt: Date;
  storageLocation: string;
  hotWeatherConfirmed: boolean;
  policyVersion: string;
  sourceMealRunRef: string | null;
  mealCompletionId: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function rowToLeftoverLot(row: LeftoverLotRow): LeftoverLot {
  return {
    id: row.id,
    idempotencyKey: row.idempotencyKey,
    dishRef: row.dishRef,
    dishLabelSnapshot: row.dishLabelSnapshot,
    remainingServings: row.remainingServings,
    preparedAt: row.preparedAt.toISOString(),
    chilledAt: row.chilledAt.toISOString(),
    storageLocation: row.storageLocation as LeftoverLot["storageLocation"],
    hotWeatherConfirmed: row.hotWeatherConfirmed,
    policyVersion: row.policyVersion,
    sourceMealRunRef: row.sourceMealRunRef ?? undefined,
    mealCompletionId: row.mealCompletionId ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

type MealCompletionRow = {
  id: string;
  idempotencyKey: string;
  weekRef: string;
  day: number;
  dishRefs: string[];
  sourceSessionCreatedAt: Date;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

function rowToMealCompletion(row: MealCompletionRow): MealCompletion {
  return {
    id: row.id,
    idempotencyKey: row.idempotencyKey,
    weekRef: row.weekRef,
    day: row.day,
    dishRefs: [...row.dishRefs],
    sourceSessionCreatedAt: row.sourceSessionCreatedAt.toISOString(),
    completedAt: row.completedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

type LeftoverMovementRow = {
  id: string;
  idempotencyKey: string;
  leftoverLotId: string;
  kind: string;
  servings: number;
  beforeServings: number;
  afterServings: number;
  occurredAt: Date;
  note: string | null;
  createdAt: Date;
  leftoverLot: { dishLabelSnapshot: string };
};

function rowToLeftoverMovement(row: LeftoverMovementRow): LeftoverMovement {
  return {
    id: row.id,
    idempotencyKey: row.idempotencyKey,
    leftoverLotId: row.leftoverLotId,
    dishLabelSnapshot: row.leftoverLot.dishLabelSnapshot,
    kind: row.kind as LeftoverMovement["kind"],
    servings: row.servings,
    beforeServings: row.beforeServings,
    afterServings: row.afterServings,
    occurredAt: row.occurredAt.toISOString(),
    note: row.note ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

type FulfillmentRow = {
  id: string;
  weekRef: string;
  commodityId: string;
  vendor: string;
  plannedQty: number;
  actualQty: number;
  unit: string;
  boughtAt: Date;
  pricePaid: number | null;
  inventoryLot?: { id: string } | null;
};

function rowToFulfillment(row: FulfillmentRow): ShoppingFulfillment {
  return {
    id: row.id,
    weekRef: row.weekRef,
    commodityId: row.commodityId,
    vendor: row.vendor,
    plannedQty: row.plannedQty,
    actualQty: row.actualQty,
    unit: row.unit,
    boughtAt: row.boughtAt.toISOString(),
    pricePaid: row.pricePaid ?? undefined,
    inventoryLotId: row.inventoryLot?.id,
  };
}

type PurchaseRow = {
  id: string; date: Date; orderRef: string | null; supplierId: string | null;
  lines: unknown; onTime: string | null; note: string | null;
};
function rowToPurchase(r: PurchaseRow): PurchaseRecord {
  return {
    id: r.id,
    date: r.date.toISOString(),
    orderRef: r.orderRef ?? undefined,
    supplierId: r.supplierId ?? undefined,
    lines: (r.lines as PurchaseLine[]) ?? [],
    onTime: (r.onTime as OnTime | null) ?? undefined,
    note: r.note ?? undefined,
  };
}

/** Append a purchase record for the current household. */
export async function savePurchase(input: Omit<PurchaseRecord, "id">): Promise<PurchaseRecord> {
  await requireUserId();
  if (isE2EMode()) {
    const saved = { ...structuredClone(input), id: e2eId("purchase") };
    e2eState.purchases.unshift(saved);
    return saved;
  }
  const db = getDb();
  const householdId = await currentHouseholdId();
  const row = await db.purchaseRecord.create({
    data: {
      householdId,
      date: input.date ? new Date(input.date) : new Date(),
      orderRef: input.orderRef ?? null,
      supplierId: input.supplierId ?? null,
      lines: (input.lines ?? []) as never,
      onTime: input.onTime ?? null,
      note: input.note ?? null,
    },
  });
  return rowToPurchase(row as PurchaseRow);
}

function e2eResultForFulfillment(fulfillmentId: string): ReceiveShoppingItemResult | undefined {
  return [...e2eReceiveResults.values()].find((result) => result.fulfillment.id === fulfillmentId);
}

/**
 * Receive one derived shopping line. Production executes the purchase,
 * fulfillment, optional lot, and idempotency marker in one serializable
 * transaction. The E2E adapter mirrors the same externally visible contract.
 */
export async function receiveShoppingItemRecord(
  input: ReceiveShoppingItemInput,
): Promise<ReceiveShoppingItemResult> {
  await requireUserId();
  if (isE2EMode()) {
    const replay = e2eReceiveResults.get(input.idempotencyKey);
    if (replay) return structuredClone(replay);

    const existingIndex = e2eState.fulfillments.findIndex(
      (item) =>
        item.weekRef === input.weekRef &&
        item.commodityId === input.commodityId &&
        item.vendor === input.vendor,
    );
    const existing = existingIndex >= 0 ? e2eState.fulfillments[existingIndex] : undefined;
    const previous = existing ? e2eResultForFulfillment(existing.id) : undefined;
    if (previous?.lot && !input.addToPantry) throw new Error("LOT_ALREADY_CREATED");

    const purchase: PurchaseRecord = previous?.purchase ?? {
      id: e2eId("purchase"),
      date: input.boughtAt,
      lines: [],
    };
    purchase.date = input.boughtAt;
    purchase.lines = [{
      commodityId: input.commodityId,
      qty: input.actualQty,
      unit: input.unit,
      pricePaid: input.pricePaid,
    }];

    const fulfillment: ShoppingFulfillment = {
      id: existing?.id ?? e2eId("fulfillment"),
      weekRef: input.weekRef,
      commodityId: input.commodityId,
      vendor: input.vendor,
      plannedQty: input.plannedQty,
      actualQty: input.actualQty,
      unit: input.unit,
      boughtAt: input.boughtAt,
      pricePaid: input.pricePaid,
      inventoryLotId: previous?.lot?.id,
    };

    let lot = previous?.lot;
    if (input.addToPantry) {
      lot = {
        id: lot?.id ?? e2eId("lot"),
        commodityId: input.commodityId,
        qty: input.actualQty,
        unit: input.unit,
        purchasedAt: input.boughtAt,
        storageLocation: input.storageLocation as StorageLocation,
        bestBefore: input.bestBefore,
        expiry: input.bestBefore,
        sourceWeekRef: input.weekRef,
        sourceShoppingKey: `${input.commodityId}|${input.vendor}`,
      };
      fulfillment.inventoryLotId = lot.id;
      const lotIndex = e2eState.pantry.findIndex((item) => item.id === lot?.id);
      if (lotIndex >= 0) e2eState.pantry[lotIndex] = lot;
      else e2eState.pantry.push(lot);
    }

    if (existingIndex >= 0) e2eState.fulfillments[existingIndex] = fulfillment;
    else e2eState.fulfillments.push(fulfillment);
    const purchaseIndex = e2eState.purchases.findIndex((item) => item.id === purchase.id);
    if (purchaseIndex >= 0) e2eState.purchases[purchaseIndex] = purchase;
    else e2eState.purchases.unshift(purchase);

    const result = { fulfillment, lot, purchase };
    e2eReceiveResults.set(input.idempotencyKey, structuredClone(result));
    return structuredClone(result);
  }

  const db = getDb();
  const householdId = await currentHouseholdId();

  const replay = await db.shoppingReceiveRequest.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: {
      fulfillment: {
        include: { inventoryLot: true, purchaseRecord: true },
      },
    },
  });
  if (replay) {
    if (replay.householdId !== householdId) throw new Error("IDEMPOTENCY_CONFLICT");
    return {
      fulfillment: rowToFulfillment(replay.fulfillment),
      lot: replay.fulfillment.inventoryLot ? rowToInventoryLot(replay.fulfillment.inventoryLot) : undefined,
      purchase: rowToPurchase(replay.fulfillment.purchaseRecord),
    };
  }

  const runTransaction = () => db.$transaction(async (tx) => {
    const replayInTx = await tx.shoppingReceiveRequest.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { fulfillment: { include: { inventoryLot: true, purchaseRecord: true } } },
    });
    if (replayInTx) {
      if (replayInTx.householdId !== householdId) throw new Error("IDEMPOTENCY_CONFLICT");
      return {
        fulfillment: rowToFulfillment(replayInTx.fulfillment),
        lot: replayInTx.fulfillment.inventoryLot ? rowToInventoryLot(replayInTx.fulfillment.inventoryLot) : undefined,
        purchase: rowToPurchase(replayInTx.fulfillment.purchaseRecord),
      };
    }

    const existing = await tx.shoppingFulfillment.findUnique({
      where: {
        householdId_weekRef_commodityId_vendor: {
          householdId,
          weekRef: input.weekRef,
          commodityId: input.commodityId,
          vendor: input.vendor,
        },
      },
      include: { inventoryLot: true, purchaseRecord: true },
    });
    if (existing?.inventoryLot && !input.addToPantry) throw new Error("LOT_ALREADY_CREATED");

    const purchaseData = {
      householdId,
      date: new Date(input.boughtAt),
      lines: [{
        commodityId: input.commodityId,
        qty: input.actualQty,
        unit: input.unit,
        ...(input.pricePaid !== undefined && { pricePaid: input.pricePaid }),
      }] as never,
      note: `shopping:${input.weekRef}:${input.commodityId}|${input.vendor}`,
    };
    const purchase = existing
      ? await tx.purchaseRecord.update({
          where: { id: existing.purchaseRecordId },
          data: { date: purchaseData.date, lines: purchaseData.lines, note: purchaseData.note },
        })
      : await tx.purchaseRecord.create({ data: purchaseData });

    const fulfillmentData = {
      plannedQty: input.plannedQty,
      actualQty: input.actualQty,
      unit: input.unit,
      boughtAt: new Date(input.boughtAt),
      pricePaid: input.pricePaid ?? null,
    };
    const fulfillment = existing
      ? await tx.shoppingFulfillment.update({
          where: { id: existing.id },
          data: fulfillmentData,
        })
      : await tx.shoppingFulfillment.create({
          data: {
            householdId,
            weekRef: input.weekRef,
            commodityId: input.commodityId,
            vendor: input.vendor,
            purchaseRecordId: purchase.id,
            ...fulfillmentData,
          },
        });

    let lot = existing?.inventoryLot ?? null;
    if (input.addToPantry) {
      const lotData = {
        householdId,
        commodityId: input.commodityId,
        qty: input.actualQty,
        unit: input.unit,
        purchasedAt: new Date(input.boughtAt),
        storageLocation: input.storageLocation as StorageLocation,
        bestBefore: input.bestBefore ? new Date(input.bestBefore) : null,
        sourceWeekRef: input.weekRef,
        sourceShoppingKey: `${input.commodityId}|${input.vendor}`,
      };
      lot = lot
        ? await tx.inventoryLot.update({ where: { id: lot.id }, data: lotData })
        : await tx.inventoryLot.create({ data: { ...lotData, fulfillmentId: fulfillment.id } });
    }

    await tx.shoppingReceiveRequest.create({
      data: { idempotencyKey: input.idempotencyKey, householdId, fulfillmentId: fulfillment.id },
    });

    return {
      fulfillment: rowToFulfillment({ ...fulfillment, inventoryLot: lot }),
      lot: lot ? rowToInventoryLot(lot) : undefined,
      purchase: rowToPurchase(purchase),
    };
  }, { isolationLevel: "Serializable" });

  try {
    return await runTransaction();
  } catch (error) {
    // A concurrent identical request may win the unique insert. Resolve the
    // stored response instead of duplicating any purchase or lot.
    const wonByPeer = await db.shoppingReceiveRequest.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { fulfillment: { include: { inventoryLot: true, purchaseRecord: true } } },
    });
    if (wonByPeer?.householdId === householdId) {
      return {
        fulfillment: rowToFulfillment(wonByPeer.fulfillment),
        lot: wonByPeer.fulfillment.inventoryLot ? rowToInventoryLot(wonByPeer.fulfillment.inventoryLot) : undefined,
        purchase: rowToPurchase(wonByPeer.fulfillment.purchaseRecord),
      };
    }
    throw error;
  }
}

export async function createManualInventoryLotRecord(input: {
  commodityId: string;
  qty: number;
  unit: string;
  purchasedAt: string;
  storageLocation: StorageLocation;
  bestBefore?: string;
}): Promise<InventoryLot> {
  await requireUserId();
  if (isE2EMode()) {
    const lot: InventoryLot = {
      id: e2eId("lot"),
      commodityId: input.commodityId,
      qty: input.qty,
      unit: input.unit,
      purchasedAt: input.purchasedAt,
      storageLocation: input.storageLocation,
      bestBefore: input.bestBefore,
      expiry: input.bestBefore,
    };
    e2eState.pantry.push(lot);
    return structuredClone(lot);
  }
  const db = getDb();
  const householdId = await currentHouseholdId();
  const row = await db.inventoryLot.create({
    data: {
      householdId,
      commodityId: input.commodityId,
      qty: input.qty,
      unit: input.unit,
      purchasedAt: new Date(input.purchasedAt),
      storageLocation: input.storageLocation,
      bestBefore: input.bestBefore ? new Date(input.bestBefore) : null,
    },
  });
  return rowToInventoryLot(row);
}

export async function recordInventoryMovementRecord(
  input: RecordInventoryMovementInput,
): Promise<RecordInventoryMovementResult> {
  await requireUserId();
  if (input.lotId.startsWith("legacy:")) throw new Error("LEGACY_LOT_READ_ONLY");

  if (isE2EMode()) {
    const replay = e2eState.inventoryMovements.find(
      (movement) => movement.idempotencyKey === input.idempotencyKey,
    );
    if (replay) {
      const replayLot = e2eState.pantry.find((lot) => lot.id === replay.inventoryLotId);
      if (!replayLot || !replayLot.purchasedAt || !replayLot.storageLocation) {
        throw new Error("LOT_NOT_FOUND");
      }
      return {
        movement: structuredClone(replay),
        lot: structuredClone(replayLot as InventoryLot),
      };
    }

    const lotIndex = e2eState.pantry.findIndex((lot) => lot.id === input.lotId && !lot.legacy);
    const lot = lotIndex >= 0 ? e2eState.pantry[lotIndex] : undefined;
    if (!lot || !lot.purchasedAt || !lot.storageLocation) throw new Error("LOT_NOT_FOUND");
    if (input.qty > lot.qty + Number.EPSILON) throw new Error("INSUFFICIENT_STOCK");

    const qtyBefore = lot.qty;
    const updatedLot: InventoryLot = {
      ...lot,
      id: lot.id as string,
      purchasedAt: lot.purchasedAt,
      storageLocation: lot.storageLocation,
      qty: Math.max(0, qtyBefore - input.qty),
    };
    const movement: InventoryMovement = {
      id: e2eId("movement"),
      idempotencyKey: input.idempotencyKey,
      inventoryLotId: updatedLot.id,
      commodityId: updatedLot.commodityId,
      kind: input.kind,
      qty: input.qty,
      unit: updatedLot.unit,
      qtyBefore,
      qtyAfter: updatedLot.qty,
      occurredAt: input.occurredAt,
      note: input.note,
      createdAt: new Date().toISOString(),
    };
    e2eState.pantry[lotIndex] = updatedLot;
    e2eState.inventoryMovements.unshift(movement);
    return { movement: structuredClone(movement), lot: structuredClone(updatedLot) };
  }

  const db = getDb();
  const householdId = await currentHouseholdId();
  const includeMovement = { inventoryLot: { select: { commodityId: true } } } as const;

  const replay = await db.inventoryMovement.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: includeMovement,
  });
  if (replay) {
    if (replay.householdId !== householdId) throw new Error("IDEMPOTENCY_CONFLICT");
    const lot = await db.inventoryLot.findFirst({ where: { id: replay.inventoryLotId, householdId } });
    if (!lot) throw new Error("LOT_NOT_FOUND");
    return { movement: rowToInventoryMovement(replay), lot: rowToInventoryLot(lot) };
  }

  const runTransaction = () => db.$transaction(async (tx) => {
    const replayInTx = await tx.inventoryMovement.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: includeMovement,
    });
    if (replayInTx) {
      if (replayInTx.householdId !== householdId) throw new Error("IDEMPOTENCY_CONFLICT");
      const replayLot = await tx.inventoryLot.findFirst({
        where: { id: replayInTx.inventoryLotId, householdId },
      });
      if (!replayLot) throw new Error("LOT_NOT_FOUND");
      return {
        movement: rowToInventoryMovement(replayInTx),
        lot: rowToInventoryLot(replayLot),
      };
    }

    const lot = await tx.inventoryLot.findFirst({
      where: { id: input.lotId, householdId },
    });
    if (!lot) throw new Error("LOT_NOT_FOUND");
    if (input.qty > lot.qty + Number.EPSILON) throw new Error("INSUFFICIENT_STOCK");

    const decremented = await tx.inventoryLot.updateMany({
      where: { id: lot.id, householdId, qty: { gte: input.qty } },
      data: { qty: { decrement: input.qty } },
    });
    if (decremented.count !== 1) throw new Error("INSUFFICIENT_STOCK");

    const updatedLot = await tx.inventoryLot.findFirst({
      where: { id: lot.id, householdId },
    });
    if (!updatedLot) throw new Error("LOT_NOT_FOUND");
    const movement = await tx.inventoryMovement.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        householdId,
        inventoryLotId: lot.id,
        kind: input.kind,
        qty: input.qty,
        unit: lot.unit,
        qtyBefore: lot.qty,
        qtyAfter: updatedLot.qty,
        occurredAt: new Date(input.occurredAt),
        note: input.note ?? null,
      },
      include: includeMovement,
    });
    return {
      movement: rowToInventoryMovement(movement),
      lot: rowToInventoryLot(updatedLot),
    };
  }, { isolationLevel: "Serializable" });

  try {
    return await runTransaction();
  } catch (error) {
    const wonByPeer = await db.inventoryMovement.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: includeMovement,
    });
    if (wonByPeer?.householdId === householdId) {
      const lot = await db.inventoryLot.findFirst({
        where: { id: wonByPeer.inventoryLotId, householdId },
      });
      if (lot) return { movement: rowToInventoryMovement(wonByPeer), lot: rowToInventoryLot(lot) };
    }
    throw error;
  }
}

export async function createLeftoverLotRecord(
  input: CreateLeftoverLotInput & { dishLabelSnapshot: string },
): Promise<LeftoverLot> {
  const userId = await requireUserId();
  const cooling = evaluateCoolingWindow({
    preparedAt: input.preparedAt,
    chilledAt: input.chilledAt,
    hotWeatherConfirmed: input.hotWeatherConfirmed,
    now: new Date(),
  });
  if (!cooling.accepted) throw new Error(cooling.reasonCode);

  if (isE2EMode()) {
    const replay = e2eState.leftoverLots.find(
      (lot) => lot.idempotencyKey === input.idempotencyKey,
    );
    if (replay) return structuredClone(replay);
    const now = new Date().toISOString();
    const lot: LeftoverLot = {
      id: e2eId("leftover"),
      idempotencyKey: input.idempotencyKey,
      dishRef: input.dishRef,
      dishLabelSnapshot: input.dishLabelSnapshot,
      remainingServings: input.servings,
      preparedAt: input.preparedAt,
      chilledAt: input.chilledAt,
      storageLocation: input.storageLocation,
      hotWeatherConfirmed: input.hotWeatherConfirmed,
      policyVersion: LEFTOVER_POLICY_VERSION,
      sourceMealRunRef: input.sourceMealRunRef,
      mealCompletionId: input.mealCompletionId,
      note: input.note,
      createdAt: now,
      updatedAt: now,
    };
    e2eState.leftoverLots.push(lot);
    return structuredClone(lot);
  }

  const db = getDb();
  const householdId = await currentHouseholdId();
  const key = { householdId, idempotencyKey: input.idempotencyKey };
  const replay = await db.leftoverLot.findUnique({
    where: { householdId_idempotencyKey: key },
  });
  if (replay) return rowToLeftoverLot(replay);
  if (input.mealCompletionId) {
    const completion = await db.mealCompletion.findFirst({
      where: { id: input.mealCompletionId, householdId },
      select: { id: true },
    });
    if (!completion) throw new Error("MEAL_COMPLETION_NOT_FOUND");
  }

  try {
    const row = await db.$transaction(async (tx) => {
      const replayInTx = await tx.leftoverLot.findUnique({
        where: { householdId_idempotencyKey: key },
      });
      if (replayInTx) return replayInTx;
      return tx.leftoverLot.create({
        data: {
          idempotencyKey: input.idempotencyKey,
          householdId,
          dishRef: input.dishRef,
          dishLabelSnapshot: input.dishLabelSnapshot,
          remainingServings: input.servings,
          preparedAt: new Date(input.preparedAt),
          chilledAt: new Date(input.chilledAt),
          storageLocation: input.storageLocation,
          hotWeatherConfirmed: input.hotWeatherConfirmed,
          policyVersion: LEFTOVER_POLICY_VERSION,
          sourceMealRunRef: input.sourceMealRunRef ?? null,
          mealCompletionId: input.mealCompletionId ?? null,
          note: input.note ?? null,
          createdByUserId: userId,
        },
      });
    }, { isolationLevel: "Serializable" });
    return rowToLeftoverLot(row);
  } catch (error) {
    const wonByPeer = await db.leftoverLot.findUnique({
      where: { householdId_idempotencyKey: key },
    });
    if (wonByPeer) return rowToLeftoverLot(wonByPeer);
    throw error;
  }
}

export async function recordLeftoverMovementRecord(
  input: RecordLeftoverMovementInput,
): Promise<RecordLeftoverMovementResult> {
  const userId = await requireUserId();

  if (isE2EMode()) {
    const replay = e2eState.leftoverMovements.find(
      (movement) => movement.idempotencyKey === input.idempotencyKey,
    );
    if (replay) {
      const replayLot = e2eState.leftoverLots.find((lot) => lot.id === replay.leftoverLotId);
      if (!replayLot) throw new Error("LEFTOVER_NOT_FOUND");
      return { movement: structuredClone(replay), lot: structuredClone(replayLot) };
    }
    const lotIndex = e2eState.leftoverLots.findIndex((lot) => lot.id === input.lotId);
    const lot = lotIndex >= 0 ? e2eState.leftoverLots[lotIndex] : undefined;
    if (!lot) throw new Error("LEFTOVER_NOT_FOUND");
    const beforeServings = lot.remainingServings;
    const afterServings = input.kind === "corrected"
      ? input.servings
      : beforeServings - input.servings;
    if (afterServings < -Number.EPSILON) throw new Error("INSUFFICIENT_LEFTOVER");
    if (input.kind === "corrected" && Math.abs(afterServings - beforeServings) <= Number.EPSILON) {
      throw new Error("NO_LEFTOVER_CHANGE");
    }
    const updatedLot: LeftoverLot = {
      ...lot,
      remainingServings: Math.max(0, afterServings),
      updatedAt: new Date().toISOString(),
    };
    const movement: LeftoverMovement = {
      id: e2eId("leftover-movement"),
      idempotencyKey: input.idempotencyKey,
      leftoverLotId: lot.id,
      dishLabelSnapshot: lot.dishLabelSnapshot,
      kind: input.kind,
      servings: input.kind === "corrected"
        ? Math.abs(afterServings - beforeServings)
        : input.servings,
      beforeServings,
      afterServings: updatedLot.remainingServings,
      occurredAt: input.occurredAt,
      note: input.note,
      createdAt: new Date().toISOString(),
    };
    e2eState.leftoverLots[lotIndex] = updatedLot;
    e2eState.leftoverMovements.unshift(movement);
    return { movement: structuredClone(movement), lot: structuredClone(updatedLot) };
  }

  const db = getDb();
  const householdId = await currentHouseholdId();
  const key = { householdId, idempotencyKey: input.idempotencyKey };
  const includeMovement = {
    leftoverLot: { select: { dishLabelSnapshot: true } },
  } as const;
  const replay = await db.leftoverMovement.findUnique({
    where: { householdId_idempotencyKey: key },
    include: includeMovement,
  });
  if (replay) {
    const lot = await db.leftoverLot.findFirst({
      where: { id: replay.leftoverLotId, householdId },
    });
    if (!lot) throw new Error("LEFTOVER_NOT_FOUND");
    return { movement: rowToLeftoverMovement(replay), lot: rowToLeftoverLot(lot) };
  }

  const runTransaction = () => db.$transaction(async (tx) => {
    const replayInTx = await tx.leftoverMovement.findUnique({
      where: { householdId_idempotencyKey: key },
      include: includeMovement,
    });
    if (replayInTx) {
      const replayLot = await tx.leftoverLot.findFirst({
        where: { id: replayInTx.leftoverLotId, householdId },
      });
      if (!replayLot) throw new Error("LEFTOVER_NOT_FOUND");
      return {
        movement: rowToLeftoverMovement(replayInTx),
        lot: rowToLeftoverLot(replayLot),
      };
    }
    const lot = await tx.leftoverLot.findFirst({
      where: { id: input.lotId, householdId },
    });
    if (!lot) throw new Error("LEFTOVER_NOT_FOUND");
    const afterServings = input.kind === "corrected"
      ? input.servings
      : lot.remainingServings - input.servings;
    if (afterServings < -Number.EPSILON) throw new Error("INSUFFICIENT_LEFTOVER");
    if (input.kind === "corrected" && Math.abs(afterServings - lot.remainingServings) <= Number.EPSILON) {
      throw new Error("NO_LEFTOVER_CHANGE");
    }
    const normalizedAfter = Math.max(0, afterServings);
    const updated = await tx.leftoverLot.updateMany({
      where: {
        id: lot.id,
        householdId,
        remainingServings: lot.remainingServings,
      },
      data: { remainingServings: normalizedAfter },
    });
    if (updated.count !== 1) throw new Error("LEFTOVER_CONCURRENT_UPDATE");
    const movement = await tx.leftoverMovement.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        householdId,
        leftoverLotId: lot.id,
        kind: input.kind,
        servings: input.kind === "corrected"
          ? Math.abs(normalizedAfter - lot.remainingServings)
          : input.servings,
        beforeServings: lot.remainingServings,
        afterServings: normalizedAfter,
        occurredAt: new Date(input.occurredAt),
        note: input.note ?? null,
        createdByUserId: userId,
      },
      include: includeMovement,
    });
    const updatedLot = await tx.leftoverLot.findFirst({
      where: { id: lot.id, householdId },
    });
    if (!updatedLot) throw new Error("LEFTOVER_NOT_FOUND");
    return {
      movement: rowToLeftoverMovement(movement),
      lot: rowToLeftoverLot(updatedLot),
    };
  }, { isolationLevel: "Serializable" });

  try {
    return await runTransaction();
  } catch (error) {
    const wonByPeer = await db.leftoverMovement.findUnique({
      where: { householdId_idempotencyKey: key },
      include: includeMovement,
    });
    if (wonByPeer) {
      const lot = await db.leftoverLot.findFirst({
        where: { id: wonByPeer.leftoverLotId, householdId },
      });
      if (lot) return { movement: rowToLeftoverMovement(wonByPeer), lot: rowToLeftoverLot(lot) };
    }
    throw error;
  }
}

export async function deleteInventoryLotRecord(lotId: string): Promise<void> {
  await requireUserId();
  const householdId = await currentHouseholdId();
  if (lotId.startsWith("legacy:")) {
    const prefix = `legacy:${householdId}:`;
    if (!lotId.startsWith(prefix)) return;
    const legacyIndex = Number(lotId.slice(lotId.lastIndexOf(":") + 1));
    if (!Number.isInteger(legacyIndex) || legacyIndex < 0) return;
    if (isE2EMode()) {
      e2eState.pantry = e2eState.pantry.filter((_, index) => index !== legacyIndex);
      return;
    }
    const db = getDb();
    const row = await db.household.findUnique({ where: { id: householdId }, select: { pantry: true } });
    const pantry = (row?.pantry as unknown as PantryItem[] | undefined) ?? [];
    await db.household.update({
      where: { id: householdId },
      data: { pantry: pantry.filter((_, index) => index !== legacyIndex) as never },
    });
    return;
  }
  if (isE2EMode()) {
    e2eState.pantry = e2eState.pantry.filter((item) => item.id !== lotId);
    return;
  }
  await getDb().inventoryLot.deleteMany({ where: { id: lotId, householdId } });
}

// ── Phase 2 – Supplier & Order persistence (household-owned) ────────────────
type SupplierRow = {
  id: string; householdId: string; name: string; type: string;
  channels: unknown; hours: string | null; shipFee: string | null; shipArea: string | null; handles: string[];
  address: string | null; lat: number | null; lng: number | null; storeLocatorUrl: string | null;
  note: string | null; sources: string[]; needsVerify: boolean;
};
function rowToSupplier(r: SupplierRow): Supplier {
  return {
    id: r.id,
    householdId: r.householdId,
    name: r.name,
    type: r.type as SupplierType,
    channels: (r.channels as SupplierChannel[]) ?? [],
    hours: r.hours ?? undefined,
    shipFee: r.shipFee ?? undefined,
    shipArea: r.shipArea ?? undefined,
    handles: r.handles ?? [],
    address: r.address ?? undefined,
    location: r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : undefined,
    storeLocatorUrl: r.storeLocatorUrl ?? undefined,
    note: r.note ?? undefined,
    sources: r.sources?.length ? r.sources : undefined,
    needsVerify: r.needsVerify || undefined,
  };
}
type OrderRow = {
  id: string; supplierId: string; weekRef: string; lines: unknown;
  status: string; channelUsed: string | null; sentAt: Date | null; note: string | null;
};
function rowToOrder(r: OrderRow): Order {
  return {
    id: r.id,
    supplierId: r.supplierId,
    weekRef: r.weekRef,
    lines: (r.lines as OrderLine[]) ?? [],
    status: r.status as OrderStatus,
    channelUsed: (r.channelUsed as ChannelKind | null) ?? undefined,
    sentAt: r.sentAt?.toISOString(),
    note: r.note ?? undefined,
  };
}

/** Create or update a household supplier. Scoped to the current household so a
 *  user can only touch their own. Registry seeds are code, never written here. */
export async function saveSupplier(input: Omit<Supplier, "householdId" | "seed">): Promise<Supplier> {
  await requireUserId();
  if (isE2EMode()) {
    const saved: Supplier = {
      ...structuredClone(input),
      id: input.id || e2eId("supplier"),
      householdId: HH_ID,
    };
    const index = e2eState.suppliers.findIndex((supplier) => supplier.id === saved.id);
    if (index >= 0) e2eState.suppliers[index] = saved;
    else e2eState.suppliers.push(saved);
    return structuredClone(saved);
  }
  const db = getDb();
  const householdId = await currentHouseholdId();
  const data = {
    name: input.name,
    type: input.type,
    channels: (input.channels ?? []) as never,
    hours: input.hours ?? null,
    shipFee: input.shipFee ?? null,
    shipArea: input.shipArea ?? null,
    handles: input.handles ?? [],
    address: input.address ?? null,
    lat: input.location?.lat ?? null,
    lng: input.location?.lng ?? null,
    storeLocatorUrl: input.storeLocatorUrl ?? null,
    note: input.note ?? null,
    sources: input.sources ?? [],
    needsVerify: input.needsVerify ?? false,
  };
  // Guard update to this household; create attaches to it.
  const existing = input.id ? await db.supplier.findFirst({ where: { id: input.id, householdId }, select: { id: true } }) : null;
  const row = existing
    ? await db.supplier.update({ where: { id: existing.id }, data })
    : await db.supplier.create({ data: { ...data, householdId } });
  return rowToSupplier(row as SupplierRow);
}

export async function deleteSupplier(id: string): Promise<void> {
  await requireUserId();
  if (isE2EMode()) {
    e2eState.suppliers = e2eState.suppliers.filter((supplier) => supplier.id !== id);
    e2eState.orders = e2eState.orders.filter((order) => order.supplierId !== id);
    return;
  }
  const db = getDb();
  const householdId = await currentHouseholdId();
  await db.supplier.deleteMany({ where: { id, householdId } });
}

/** Upsert the order record for (supplier, week). Status transitions are the
 *  caller's job (the store enforces the honest ladder); this only persists. */
export async function saveOrder(order: Omit<Order, "id"> & { id?: string }): Promise<Order> {
  await requireUserId();
  if (isE2EMode()) {
    const saved: Order = { ...structuredClone(order), id: order.id || e2eId("order") };
    const index = e2eState.orders.findIndex(
      (item) => item.supplierId === saved.supplierId && item.weekRef === saved.weekRef,
    );
    if (index >= 0) e2eState.orders[index] = saved;
    else e2eState.orders.push(saved);
    return structuredClone(saved);
  }
  const db = getDb();
  const householdId = await currentHouseholdId();
  const supplier = await db.supplier.findFirst({ where: { id: order.supplierId, householdId }, select: { id: true } });
  if (!supplier) throw new Error("supplier not in household");
  const data = {
    weekRef: order.weekRef,
    lines: (order.lines ?? []) as never,
    status: order.status,
    channelUsed: order.channelUsed ?? null,
    sentAt: order.sentAt ? new Date(order.sentAt) : null,
    note: order.note ?? null,
  };
  const existing = await db.order.findFirst({
    where: { householdId, supplierId: order.supplierId, weekRef: order.weekRef },
    select: { id: true },
  });
  const row = existing
    ? await db.order.update({ where: { id: existing.id }, data })
    : await db.order.create({ data: { ...data, householdId, supplierId: order.supplierId } });
  return rowToOrder(row as OrderRow);
}

/** Persist any subset of the mutable household-row state. */
export type StatePatch = Partial<{
  size: number;
  marketMode: string;
  busyDays: string[];
  lactatingMember: boolean;
  restrictions: string[];
  favorites: string[];
  notes: { id: number; text: string }[];
  pantry: PantryItem[];
}>;

export async function saveHouseholdState(patch: StatePatch): Promise<void> {
  await requireUserId();
  if (isE2EMode()) {
    const householdPatch = {
      ...(patch.size !== undefined && { size: patch.size }),
      ...(patch.marketMode !== undefined && { marketMode: patch.marketMode as Household["marketMode"] }),
      ...(patch.busyDays !== undefined && { busyDays: patch.busyDays as DayName[] }),
      ...(patch.lactatingMember !== undefined && { lactatingMember: patch.lactatingMember }),
      ...(patch.restrictions !== undefined && { restrictions: patch.restrictions as DietRestriction[] }),
    };
    Object.assign(e2eState.household, structuredClone(householdPatch));
    if (patch.favorites) e2eState.favorites = structuredClone(patch.favorites);
    if (patch.notes) e2eState.notes = structuredClone(patch.notes);
    if (patch.pantry) e2eState.pantry = structuredClone(patch.pantry);
    return;
  }
  const db = getDb();
  const id = await currentHouseholdId();
  const data: Record<string, unknown> = {};
  for (const k of ["size", "marketMode", "busyDays", "lactatingMember", "restrictions", "favorites", "notes", "pantry"] as const) {
    if (patch[k] !== undefined) data[k] = patch[k];
  }
  if (Object.keys(data).length === 0) return;
  await db.household.update({ where: { id }, data: data as never });
}

/**
 * Complete the minimum household declaration in one transaction. A household
 * with members is already activated and is never overwritten by a retry.
 */
export async function completeHouseholdOnboarding(
  input: OnboardingInput,
): Promise<OnboardingResult> {
  await requireUserId();
  const memberCount = input.adults + input.children;

  if (isE2EMode()) {
    if (e2eState.household.members.length > 0) {
      return {
        status: "already-complete",
        memberCount: e2eState.household.members.length,
      };
    }
    const adults = Array.from({ length: input.adults }, (_, index) => ({
      id: e2eId(`adult_${index}`),
      role: "adult" as const,
      activity: "moderate" as const,
    }));
    const children = Array.from({ length: input.children }, (_, index) => ({
      id: e2eId(`child_${index}`),
      role: "child" as const,
      activity: "moderate" as const,
    }));
    e2eState.household = {
      ...e2eState.household,
      size: memberCount,
      members: [...adults, ...children],
      restrictions: [...input.restrictions],
      busyDays: [...input.busyDays],
      marketMode: input.marketMode,
    };
    return { status: "completed", memberCount };
  }

  const db = getDb();
  const householdId = await currentHouseholdId();
  return db.$transaction(async (tx) => {
    const household = await tx.household.findUniqueOrThrow({
      where: { id: householdId },
      select: { _count: { select: { members: true } } },
    });
    if (household._count.members > 0) {
      return {
        status: "already-complete" as const,
        memberCount: household._count.members,
      };
    }

    await tx.member.createMany({
      data: [
        ...Array.from({ length: input.adults }, () => ({
          householdId,
          role: "adult" as const,
          activity: "moderate" as const,
          allergies: [] as string[],
          habits: [] as string[],
          conditions: [] as string[],
          dislikes: [] as string[],
        })),
        ...Array.from({ length: input.children }, () => ({
          householdId,
          role: "child" as const,
          activity: "moderate" as const,
          allergies: [] as string[],
          habits: [] as string[],
          conditions: [] as string[],
          dislikes: [] as string[],
        })),
      ],
    });
    await tx.household.update({
      where: { id: householdId },
      data: {
        size: memberCount,
        restrictions: input.restrictions,
        busyDays: input.busyDays,
        marketMode: input.marketMode,
      },
    });
    await tx.productEvent.create({
      data: {
        householdId,
        name: "onboarding_completed",
        dedupeKey: `onboarding_completed:${input.requestId}`,
        properties: {
          adults: input.adults,
          children: input.children,
          hasRestrictions: input.restrictions.length > 0,
          busyDayCount: input.busyDays.length,
          marketMode: input.marketMode,
        },
      },
    });
    return { status: "completed" as const, memberCount };
  });
}

/** Persist a member's health profile (T1). Scoped to the current household so a
 *  user can't touch another household's member. */
export async function saveMemberHealthProfile(memberId: string, profile: HealthProfile | null): Promise<void> {
  await requireUserId();
  if (isE2EMode()) return;
  const db = getDb();
  const householdId = await currentHouseholdId();
  await db.member.updateMany({
    where: { id: memberId, householdId },
    data: { healthProfile: (profile ?? undefined) as never },
  });
}

/** Persist a member's allergen list. Scoped to the current household. */
export async function saveMemberAllergies(memberId: string, allergies: Allergen[]): Promise<void> {
  await requireUserId();
  if (isE2EMode()) return;
  const db = getDb();
  const householdId = await currentHouseholdId();
  await db.member.updateMany({ where: { id: memberId, householdId }, data: { allergies } });
}

// ─── "Không gian gia đình sống" – Member base-layer CRUD + dynamic states ───
type MemberBase = Pick<Member, "name" | "role" | "sex" | "ageBand" | "allergies" | "habits" | "conditions" | "dislikes">;

/** Create or update a member's BASE layer. Scoped to the current household. */
export async function saveMember(input: MemberBase & { id?: string }): Promise<string> {
  await requireUserId();
  if (isE2EMode()) return input.id || e2eId("member");
  const db = getDb();
  const householdId = await currentHouseholdId();
  const data = {
    name: input.name ?? null,
    role: input.role,
    sex: input.sex ?? null,
    ageBand: input.ageBand ?? null,
    allergies: input.allergies ?? [],
    habits: input.habits ?? [],
    conditions: input.conditions ?? [],
    dislikes: input.dislikes ?? [],
  };
  if (input.id) {
    await db.member.updateMany({ where: { id: input.id, householdId }, data });
    return input.id;
  }
  const created = await db.member.create({ data: { householdId, activity: "moderate", ...data } });
  return created.id;
}

/** Remove a member (and, via cascade, their states). Scoped to the household. */
export async function deleteMember(memberId: string): Promise<void> {
  await requireUserId();
  if (isE2EMode()) return;
  const db = getDb();
  const householdId = await currentHouseholdId();
  await db.member.deleteMany({ where: { id: memberId, householdId } });
}

/** Add a dynamic state to a member. `validUntil` (ISO) makes it self-expire; a
 *  day-scoped state simply stops mattering after. Ownership checked via the join. */
export async function addMemberState(memberId: string, state: Omit<MemberState, "id">): Promise<void> {
  await requireUserId();
  if (isE2EMode()) return;
  const db = getDb();
  const householdId = await currentHouseholdId();
  const owned = await db.member.findFirst({ where: { id: memberId, householdId }, select: { id: true } });
  if (!owned) return;
  await db.memberState.create({
    data: {
      memberId,
      kind: state.kind,
      value: state.value,
      validFrom: new Date(state.validFrom),
      validUntil: state.validUntil ? new Date(state.validUntil) : null,
    },
  });
}

/** Remove a dynamic state early (e.g. "khỏi rồi"). Scoped to the household. */
export async function deleteMemberState(stateId: string): Promise<void> {
  await requireUserId();
  if (isE2EMode()) return;
  const db = getDb();
  const householdId = await currentHouseholdId();
  await db.memberState.deleteMany({ where: { id: stateId, member: { householdId } } });
}
