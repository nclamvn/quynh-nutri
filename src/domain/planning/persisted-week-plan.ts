import type { Dish, Household, PlannedSlot, Slot, WeekPlan } from "@/domain/types";
import type { CommoditySource } from "@/domain/nutrition/calculator";
import { dishAllowed } from "@/domain/dish";
import { dishSafety } from "@/domain/constraints";

export interface PersistedWeekPlan extends WeekPlan {
  id: string;
  version: number;
  updatedAt: string;
}

export interface SaveWeekPlanInput {
  weekStart: string;
  expectedVersion: number;
  slots: PlannedSlot[];
  householdDishes?: Dish[];
}

export type WeekPlanSyncState =
  | "loading"
  | "synced"
  | "saving"
  | "unsynced"
  | "conflict";

export type SaveWeekPlanResult =
  | { ok: true; plan: PersistedWeekPlan }
  | { ok: false; kind: "conflict"; canonical: PersistedWeekPlan };

export class WeekPlanValidationError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "WeekPlanValidationError";
  }
}

const SLOT_ORDER: Slot[] = ["COM", "MAN", "RAU", "CANH", "TRANGMIENG"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function assertMondayIsoDate(value: string): void {
  if (!ISO_DATE.test(value)) throw new WeekPlanValidationError("INVALID_WEEK_START");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new WeekPlanValidationError("INVALID_WEEK_START");
  }
  if (date.getUTCDay() !== 1) {
    throw new WeekPlanValidationError("WEEK_START_MUST_BE_MONDAY");
  }
}

export function sortPlannedSlots(slots: readonly PlannedSlot[]): PlannedSlot[] {
  return slots
    .map((slot) => ({ ...slot }))
    .sort((a, b) =>
      a.day - b.day
      || SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot)
      || a.dishId.localeCompare(b.dishId)
    );
}

export function samePlannedSlots(
  left: readonly PlannedSlot[],
  right: readonly PlannedSlot[],
): boolean {
  return JSON.stringify(sortPlannedSlots(left)) === JSON.stringify(sortPlannedSlots(right));
}

export function validateWeekPlanSlots(input: {
  weekStart: string;
  expectedVersion: number;
  slots: readonly PlannedSlot[];
  household: Household;
  dish: (id: string) => Dish | undefined;
  commodity: CommoditySource;
}): PlannedSlot[] {
  assertMondayIsoDate(input.weekStart);
  if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1) {
    throw new WeekPlanValidationError("INVALID_PLAN_VERSION");
  }
  if (input.slots.length > 35) throw new WeekPlanValidationError("TOO_MANY_SLOTS");

  const keys = new Set<string>();
  for (const slot of input.slots) {
    if (!Number.isInteger(slot.day) || slot.day < 0 || slot.day > 6) {
      throw new WeekPlanValidationError("INVALID_PLAN_DAY");
    }
    if (!SLOT_ORDER.includes(slot.slot)) {
      throw new WeekPlanValidationError("INVALID_PLAN_SLOT");
    }
    if (typeof slot.locked !== "boolean") {
      throw new WeekPlanValidationError("INVALID_LOCK_STATE");
    }
    const key = `${slot.day}:${slot.slot}`;
    if (keys.has(key)) throw new WeekPlanValidationError("DUPLICATE_DAY_SLOT");
    keys.add(key);

    const dish = input.dish(slot.dishId);
    if (!dish) throw new WeekPlanValidationError("UNKNOWN_OR_UNOWNED_DISH");
    if (dish.slot !== slot.slot) throw new WeekPlanValidationError("DISH_SLOT_MISMATCH");
    if (!dishSafety(dish, input.household, input.commodity).safe) {
      throw new WeekPlanValidationError("DISH_ALLERGY_UNSAFE");
    }
    if (!dishAllowed(dish, input.household, input.commodity)) {
      throw new WeekPlanValidationError("DISH_RESTRICTION_UNSAFE");
    }
  }
  return sortPlannedSlots(input.slots);
}
