import "server-only";

import { Prisma } from "@prisma/client";
import { getDb } from "@/lib/db";
import { isE2EMode, requireUserId } from "@/lib/auth";
import { loadHouseholdState } from "@/data/repo/household";
import { REPERTOIRE, REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import { COMMODITY_BY_ID } from "@/data/seed/commodity";
import { dietaryRepertoire, effectiveRepertoire } from "@/domain/dish";
import { generateWeek } from "@/domain/rotation";
import type { Dish, PlannedSlot } from "@/domain/types";
import {
  samePlannedSlots,
  sortPlannedSlots,
  validateWeekPlanSlots,
  WeekPlanValidationError,
  type PersistedWeekPlan,
  type SaveWeekPlanInput,
  type SaveWeekPlanResult,
} from "@/domain/planning/persisted-week-plan";
import { currentWeekStartIso } from "@/lib/week";

type HouseholdDishRow = {
  id: string;
  sourceRepertoireId: string | null;
  vnName: string;
  enLabel: string | null;
  proteinType: string;
  method: string;
  slot: string;
  quick: boolean;
  baseServings: number;
  vendor: string | null;
  isFavorite: boolean;
  cookTimeMin: number | null;
  tags: string[];
  lines: { commodityId: string; qtyBase: number; unit: string }[];
};

type WeekPlanRow = {
  id: string;
  householdId: string;
  weekStart: Date;
  version: number;
  updatedAt: Date;
  daySlots: {
    day: number;
    occasion: string;
    slot: string;
    repertoireDishId: string | null;
    householdDishId: string | null;
    locked: boolean;
  }[];
};

export interface WeekPlanEnvelope {
  plan: PersistedWeekPlan;
  householdDishes: Dish[];
}

const e2ePlans = new Map<string, PersistedWeekPlan>();
const e2eDishes = new Map<string, { householdId: string; dish: Dish }>();

const planKey = (householdId: string, weekStart: string) =>
  `${householdId}:${weekStart}`;

const toDish = (row: HouseholdDishRow): Dish => ({
  id: row.id,
  vnName: row.vnName,
  enLabel: row.enLabel ?? undefined,
  proteinType: row.proteinType as Dish["proteinType"],
  method: row.method as Dish["method"],
  slot: row.slot as Dish["slot"],
  quick: row.quick,
  baseServings: row.baseServings,
  cookTimeMin: row.cookTimeMin ?? undefined,
  tags: row.tags,
  lines: row.lines.map((line) => ({ ...line })),
  origin: "B1",
  sourceRepertoireId: row.sourceRepertoireId ?? undefined,
  vendor: row.vendor ?? undefined,
  isFavorite: row.isFavorite,
});

const toPlan = (row: WeekPlanRow): PersistedWeekPlan => ({
  id: row.id,
  householdId: row.householdId,
  weekStart: row.weekStart.toISOString().slice(0, 10),
  version: row.version,
  updatedAt: row.updatedAt.toISOString(),
  slots: sortPlannedSlots(row.daySlots.map((slot) => ({
    day: slot.day,
    occasion: slot.occasion as PlannedSlot["occasion"],
    slot: slot.slot as PlannedSlot["slot"],
    dishId: slot.householdDishId ?? slot.repertoireDishId ?? "",
    locked: slot.locked,
  }))),
});

function validateHouseholdDish(dish: Dish): Dish {
  if (
    dish.origin !== "B1"
    || !dish.id.trim()
    || dish.id.length > 128
    || !dish.vnName.trim()
    || dish.vnName.length > 120
    || dish.baseServings < 1
    || dish.baseServings > 30
    || dish.lines.length > 100
  ) {
    throw new WeekPlanValidationError("INVALID_HOUSEHOLD_DISH");
  }
  if (dish.sourceRepertoireId && !REPERTOIRE_BY_ID[dish.sourceRepertoireId]) {
    throw new WeekPlanValidationError("UNKNOWN_B1_SOURCE");
  }
  const seen = new Set<string>();
  for (const line of dish.lines) {
    if (
      !COMMODITY_BY_ID[line.commodityId]
      || !Number.isFinite(line.qtyBase)
      || line.qtyBase <= 0
      || line.qtyBase > 1_000_000
      || !line.unit.trim()
      || line.unit.length > 20
      || seen.has(line.commodityId)
    ) {
      throw new WeekPlanValidationError("INVALID_HOUSEHOLD_DISH_LINE");
    }
    seen.add(line.commodityId);
  }
  return structuredClone(dish);
}

async function loadProductionHouseholdDishes(
  householdId: string,
): Promise<Dish[]> {
  const rows = await getDb().householdDish.findMany({
    where: { householdId },
    include: { lines: true },
    orderBy: { id: "asc" },
  });
  return rows.map(toDish);
}

async function findProductionPlan(
  householdId: string,
  weekStart: string,
): Promise<PersistedWeekPlan | undefined> {
  const row = await getDb().weekPlan.findUnique({
    where: {
      householdId_weekStart: {
        householdId,
        weekStart: new Date(`${weekStart}T00:00:00.000Z`),
      },
    },
    include: { daySlots: true },
  });
  return row ? toPlan(row) : undefined;
}

export async function loadWeekPlan(
  weekStart: string,
): Promise<WeekPlanEnvelope | undefined> {
  await requireUserId();
  const state = await loadHouseholdState();
  const householdId = state.household.id;
  if (isE2EMode()) {
    const plan = e2ePlans.get(planKey(householdId, weekStart));
    return plan
      ? {
          plan: structuredClone(plan),
          householdDishes: [...e2eDishes.values()]
            .filter((entry) => entry.householdId === householdId)
            .map((entry) => structuredClone(entry.dish)),
        }
      : undefined;
  }
  const plan = await findProductionPlan(householdId, weekStart);
  if (!plan) return undefined;
  return {
    plan,
    householdDishes: await loadProductionHouseholdDishes(householdId),
  };
}

/** Read-only system projection used by the protected reminder dispatcher. */
export async function loadWeekPlanForSystem(
  householdId: string,
  weekStart: string,
): Promise<WeekPlanEnvelope | undefined> {
  if (isE2EMode()) {
    const plan = e2ePlans.get(planKey(householdId, weekStart));
    return plan
      ? {
          plan: structuredClone(plan),
          householdDishes: [...e2eDishes.values()]
            .filter((entry) => entry.householdId === householdId)
            .map((entry) => structuredClone(entry.dish)),
        }
      : undefined;
  }
  const plan = await findProductionPlan(householdId, weekStart);
  if (!plan) return undefined;
  return {
    plan,
    householdDishes: await loadProductionHouseholdDishes(householdId),
  };
}

export async function loadOrCreateWeekPlan(
  weekStart = currentWeekStartIso(),
): Promise<WeekPlanEnvelope> {
  await requireUserId();
  const state = await loadHouseholdState();
  const householdId = state.household.id;
  const existing = await loadWeekPlan(weekStart);
  if (existing) return existing;

  const householdDishes = isE2EMode()
    ? [...e2eDishes.values()]
        .filter((entry) => entry.householdId === householdId)
        .map((entry) => structuredClone(entry.dish))
    : await loadProductionHouseholdDishes(householdId);
  const repertoire = dietaryRepertoire(
    effectiveRepertoire(REPERTOIRE, householdDishes),
    state.household,
    (id) => COMMODITY_BY_ID[id],
  );
  const generated = generateWeek({
    household: state.household,
    repertoire,
    weekStart,
    seed: 1,
  }).plan;
  const slots = validateWeekPlanSlots({
    weekStart,
    expectedVersion: 1,
    slots: generated.slots,
    household: state.household,
    dish: (id) =>
      householdDishes.find((dish) => dish.id === id)
      ?? REPERTOIRE_BY_ID[id],
    commodity: (id) => COMMODITY_BY_ID[id],
  });

  if (isE2EMode()) {
    const key = planKey(householdId, weekStart);
    const raced = e2ePlans.get(key);
    if (raced) return { plan: structuredClone(raced), householdDishes };
    const plan: PersistedWeekPlan = {
      id: `week_${crypto.randomUUID()}`,
      householdId,
      weekStart,
      version: 1,
      updatedAt: new Date().toISOString(),
      slots,
    };
    e2ePlans.set(key, plan);
    return { plan: structuredClone(plan), householdDishes };
  }

  const db = getDb();
  const row = await db.weekPlan.upsert({
    where: {
      householdId_weekStart: {
        householdId,
        weekStart: new Date(`${weekStart}T00:00:00.000Z`),
      },
    },
    update: {},
    create: {
      householdId,
      weekStart: new Date(`${weekStart}T00:00:00.000Z`),
      daySlots: {
        create: slots.map((slot) => ({
          day: slot.day,
          occasion: slot.occasion,
          slot: slot.slot,
          repertoireDishId: slot.dishId,
          locked: slot.locked,
        })),
      },
    },
    include: { daySlots: true },
  });
  return { plan: toPlan(row), householdDishes };
}

const persistB1InTransaction = async (
  tx: Prisma.TransactionClient,
  householdId: string,
  dishes: readonly Dish[],
) => {
  for (const raw of dishes) {
    const dish = validateHouseholdDish(raw);
    const collision = await tx.householdDish.findUnique({
      where: { id: dish.id },
      select: { householdId: true },
    });
    if (collision && collision.householdId !== householdId) {
      throw new WeekPlanValidationError("B1_OWNERSHIP_MISMATCH");
    }
    await tx.householdDish.upsert({
      where: { id: dish.id },
      update: {
        sourceRepertoireId: dish.sourceRepertoireId,
        vnName: dish.vnName,
        enLabel: dish.enLabel,
        proteinType: dish.proteinType,
        method: dish.method,
        slot: dish.slot,
        quick: dish.quick,
        baseServings: dish.baseServings,
        vendor: dish.vendor,
        isFavorite: dish.isFavorite ?? false,
        cookTimeMin: dish.cookTimeMin,
        tags: dish.tags ?? [],
        lines: {
          deleteMany: {},
          create: dish.lines.map((line) => ({ ...line })),
        },
      },
      create: {
        id: dish.id,
        householdId,
        sourceRepertoireId: dish.sourceRepertoireId,
        vnName: dish.vnName,
        enLabel: dish.enLabel,
        proteinType: dish.proteinType,
        method: dish.method,
        slot: dish.slot,
        quick: dish.quick,
        baseServings: dish.baseServings,
        vendor: dish.vendor,
        isFavorite: dish.isFavorite ?? false,
        cookTimeMin: dish.cookTimeMin,
        tags: dish.tags ?? [],
        lines: { create: dish.lines.map((line) => ({ ...line })) },
      },
    });
  }
};

export async function loadHouseholdDishLibrary(): Promise<Dish[]> {
  await requireUserId();
  const state = await loadHouseholdState();
  if (isE2EMode()) {
    return [...e2eDishes.values()]
      .filter((entry) => entry.householdId === state.household.id)
      .map((entry) => structuredClone(entry.dish));
  }
  return loadProductionHouseholdDishes(state.household.id);
}

/**
 * Recover device-only dishes without allowing a stale device to overwrite the
 * canonical same-ID dish. Normal B1 creation is immutable in the current UI,
 * so create-missing is also the safe idempotent write path for new forks.
 */
export async function syncMissingHouseholdDishes(
  rawDishes: readonly Dish[],
): Promise<Dish[]> {
  await requireUserId();
  const state = await loadHouseholdState();
  const householdId = state.household.id;
  const dishes = rawDishes.map(validateHouseholdDish);
  if (isE2EMode()) {
    for (const dish of dishes) {
      const existing = e2eDishes.get(dish.id);
      if (existing && existing.householdId !== householdId) {
        throw new WeekPlanValidationError("B1_OWNERSHIP_MISMATCH");
      }
      if (!existing) {
        e2eDishes.set(dish.id, {
          householdId,
          dish: structuredClone(dish),
        });
      }
    }
    return loadHouseholdDishLibrary();
  }
  await getDb().$transaction(async (tx) => {
    const existingIds = new Set(
      (
        await tx.householdDish.findMany({
          where: { householdId, id: { in: dishes.map((dish) => dish.id) } },
          select: { id: true },
        })
      ).map((dish) => dish.id),
    );
    await persistB1InTransaction(
      tx,
      householdId,
      dishes.filter((dish) => !existingIds.has(dish.id)),
    );
  });
  return loadProductionHouseholdDishes(householdId);
}

export async function saveWeekPlan(
  input: SaveWeekPlanInput,
): Promise<SaveWeekPlanResult> {
  await requireUserId();
  const state = await loadHouseholdState();
  const householdId = state.household.id;
  const suppliedB1 = (input.householdDishes ?? []).map(validateHouseholdDish);
  const initial = await loadOrCreateWeekPlan(input.weekStart);

  if (isE2EMode()) {
    for (const dish of suppliedB1) {
      const existing = e2eDishes.get(dish.id);
      if (existing && existing.householdId !== householdId) {
        throw new WeekPlanValidationError("B1_OWNERSHIP_MISMATCH");
      }
      e2eDishes.set(dish.id, {
        householdId,
        dish: structuredClone(dish),
      });
    }
    const owned = [...e2eDishes.values()]
      .filter((entry) => entry.householdId === householdId)
      .map((entry) => entry.dish);
    const slots = validateWeekPlanSlots({
      ...input,
      household: state.household,
      dish: (id) => owned.find((dish) => dish.id === id) ?? REPERTOIRE_BY_ID[id],
      commodity: (id) => COMMODITY_BY_ID[id],
    });
    const current = e2ePlans.get(planKey(householdId, input.weekStart)) ?? initial.plan;
    if (samePlannedSlots(current.slots, slots)) {
      return { ok: true, plan: structuredClone(current) };
    }
    if (current.version !== input.expectedVersion) {
      return { ok: false, kind: "conflict", canonical: structuredClone(current) };
    }
    const saved: PersistedWeekPlan = {
      ...current,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
      slots,
    };
    e2ePlans.set(planKey(householdId, input.weekStart), saved);
    return { ok: true, plan: structuredClone(saved) };
  }

  const db = getDb();
  return db.$transaction(async (tx) => {
    await persistB1InTransaction(tx, householdId, suppliedB1);
    const ownedRows = await tx.householdDish.findMany({
      where: { householdId },
      include: { lines: true },
    });
    const owned = ownedRows.map(toDish);
    const slots = validateWeekPlanSlots({
      ...input,
      household: state.household,
      dish: (id) => owned.find((dish) => dish.id === id) ?? REPERTOIRE_BY_ID[id],
      commodity: (id) => COMMODITY_BY_ID[id],
    });
    const currentRow = await tx.weekPlan.findUniqueOrThrow({
      where: {
        householdId_weekStart: {
          householdId,
          weekStart: new Date(`${input.weekStart}T00:00:00.000Z`),
        },
      },
      include: { daySlots: true },
    });
    const current = toPlan(currentRow);
    if (samePlannedSlots(current.slots, slots)) return { ok: true, plan: current };
    if (current.version !== input.expectedVersion) {
      return { ok: false, kind: "conflict", canonical: current };
    }
    const updated = await tx.weekPlan.updateMany({
      where: { id: current.id, householdId, version: input.expectedVersion },
      data: { version: { increment: 1 } },
    });
    if (updated.count !== 1) {
      const canonical = await tx.weekPlan.findUniqueOrThrow({
        where: { id: current.id },
        include: { daySlots: true },
      });
      return { ok: false, kind: "conflict", canonical: toPlan(canonical) };
    }
    await tx.daySlot.deleteMany({ where: { weekPlanId: current.id } });
    await tx.daySlot.createMany({
      data: slots.map((slot) => {
        const isB1 = owned.some((dish) => dish.id === slot.dishId);
        return {
          weekPlanId: current.id,
          day: slot.day,
          occasion: slot.occasion,
          slot: slot.slot,
          repertoireDishId: isB1 ? null : slot.dishId,
          householdDishId: isB1 ? slot.dishId : null,
          locked: slot.locked,
        };
      }),
    });
    const saved = await tx.weekPlan.findUniqueOrThrow({
      where: { id: current.id },
      include: { daySlots: true },
    });
    return { ok: true, plan: toPlan(saved) };
  });
}

export async function loadOrCreateCurrentWeekPlan(): Promise<WeekPlanEnvelope> {
  return loadOrCreateWeekPlan(currentWeekStartIso());
}

export function resetE2EWeekPlansForTests(): void {
  e2ePlans.clear();
  e2eDishes.clear();
}
