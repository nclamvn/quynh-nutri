import type {
  Dish,
  LeftoverLot,
  PantryItem,
  WeekPlan,
} from "@/domain/types";
import type { ShoppingItem } from "@/domain/shopping";
import {
  expirySignal,
  frozenLotsNeededForDay,
  planDayForDate,
} from "@/domain/kitchen-execution/inventory";
import { evaluateLeftoverGuidance } from "@/domain/kitchen-execution/leftover-safety";

export type KitchenAgendaTaskKind =
  | "review-leftover"
  | "review-inventory-label"
  | "prepare-frozen"
  | "prep-ahead"
  | "shop"
  | "confirm-purchase"
  | "cook"
  | "coordinate-meal";

export type KitchenAgendaPriority = "now" | "today" | "next";

export interface KitchenAgendaTask {
  id: string;
  kind: KitchenAgendaTaskKind;
  priority: KitchenAgendaPriority;
  titleKey: string;
  reasonKey: string;
  sourceKey: string;
  sourceRef: string;
  actionHref: string;
  actionKey: string;
  dueAt?: string;
  evidence: Record<string, string | number>;
}

export interface AgendaUnsupportedSignal {
  id: string;
  kind: "cooking-guide" | "invalid-source";
  sourceRef: string;
  reasonKey: string;
  evidence: Record<string, string | number>;
}

export interface KitchenAgenda {
  generatedAt: string;
  calendarDate: string;
  tasks: KitchenAgendaTask[];
  unsupported: AgendaUnsupportedSignal[];
}

export interface KitchenAgendaInput {
  now: Date;
  timeZone: string;
  plan: WeekPlan;
  shopping: readonly ShoppingItem[];
  pantry: readonly PantryItem[];
  leftovers: readonly LeftoverLot[];
  dish: (id: string) => Dish | undefined;
  reviewedCookingDishIds: ReadonlySet<string>;
  prepAheadDishIds: ReadonlySet<string>;
}

const priorityRank: Record<KitchenAgendaPriority, number> = {
  now: 0,
  today: 1,
  next: 2,
};

const kindRank: Record<KitchenAgendaTaskKind, number> = {
  "review-leftover": 0,
  "review-inventory-label": 1,
  "prepare-frozen": 2,
  "prep-ahead": 3,
  "confirm-purchase": 4,
  shop: 5,
  cook: 6,
  "coordinate-meal": 7,
};

export function calendarDateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

const stableId = (
  kind: KitchenAgendaTaskKind,
  sourceRef: string,
  calendarDate: string,
) => `${kind}:${sourceRef}:${calendarDate}`;

const addTask = (
  tasks: Map<string, KitchenAgendaTask>,
  task: Omit<KitchenAgendaTask, "id">,
  calendarDate: string,
) => {
  const id = stableId(task.kind, task.sourceRef, calendarDate);
  if (!tasks.has(id)) tasks.set(id, { ...task, id });
};

export function buildKitchenAgenda(input: KitchenAgendaInput): KitchenAgenda {
  const calendarDate = calendarDateInTimeZone(input.now, input.timeZone);
  const tasks = new Map<string, KitchenAgendaTask>();
  const unsupported = new Map<string, AgendaUnsupportedSignal>();
  const today = planDayForDate(input.plan.weekStart, input.now, input.timeZone);

  for (const lot of input.leftovers) {
    if (lot.remainingServings <= 0) continue;
    try {
      const guidance = evaluateLeftoverGuidance({
        chilledAt: lot.chilledAt,
        storageLocation: lot.storageLocation,
        now: input.now,
      });
      if (
        guidance.signal !== "past-guidance-window"
        && guidance.signal !== "review-guidance"
      ) continue;
      addTask(tasks, {
        kind: "review-leftover",
        priority: guidance.signal === "past-guidance-window" ? "now" : "today",
        titleKey: "agenda.task.reviewLeftover.title",
        reasonKey: guidance.signal === "past-guidance-window"
          ? "agenda.task.reviewLeftover.past"
          : "agenda.task.reviewLeftover.review",
        sourceKey: "agenda.source.leftover",
        sourceRef: `leftover:${lot.id}`,
        actionHref: "/pantry#leftovers",
        actionKey: "agenda.action.openLeftovers",
        dueAt: lot.chilledAt,
        evidence: {
          name: lot.dishLabelSnapshot,
          servings: lot.remainingServings,
          signal: guidance.signal,
        },
      }, calendarDate);
    } catch {
      const id = `invalid-source:leftover:${lot.id}`;
      unsupported.set(id, {
        id,
        kind: "invalid-source",
        sourceRef: `leftover:${lot.id}`,
        reasonKey: "agenda.unsupported.invalidLeftover",
        evidence: { name: lot.dishLabelSnapshot },
      });
    }
  }

  for (const lot of input.pantry) {
    if (lot.qty <= 0 || !lot.bestBefore) continue;
    const signal = expirySignal(lot, input.now, input.timeZone);
    if (signal !== "overdue" && signal !== "today" && signal !== "soon") continue;
    const sourceId = lot.id ?? `${lot.commodityId}:${lot.bestBefore}`;
    addTask(tasks, {
      kind: "review-inventory-label",
      priority: signal === "soon" ? "today" : "now",
      titleKey: "agenda.task.inventory.title",
      reasonKey: `agenda.task.inventory.${signal}`,
      sourceKey: "agenda.source.inventoryLabel",
      sourceRef: `inventory:${sourceId}`,
      actionHref: "/pantry",
      actionKey: "agenda.action.openPantry",
      dueAt: lot.bestBefore,
      evidence: {
        commodityId: lot.commodityId,
        qty: lot.qty,
        unit: lot.unit,
        signal,
      },
    }, calendarDate);
  }

  if (today !== undefined && today < 6) {
    const nextDay = today + 1;
    const frozen = frozenLotsNeededForDay(
      input.pantry,
      input.plan,
      nextDay,
      input.dish,
    );
    if (frozen.length > 0) {
      addTask(tasks, {
        kind: "prepare-frozen",
        priority: "today",
        titleKey: "agenda.task.frozen.title",
        reasonKey: "agenda.task.frozen.reason",
        sourceKey: "agenda.source.planAndInventory",
        sourceRef: `plan:${input.plan.weekStart}:day:${nextDay}:freezer`,
        actionHref: "/pantry",
        actionKey: "agenda.action.openPantry",
        evidence: {
          count: frozen.length,
          itemCount: new Set(frozen.map((lot) => lot.commodityId)).size,
        },
      }, calendarDate);
    }

    const plannedIds = [...new Set(
      input.plan.slots
        .filter((slot) => slot.day === nextDay)
        .map((slot) => slot.dishId),
    )];
    const supported = plannedIds.filter((dishId) =>
      input.dish(dishId) && input.prepAheadDishIds.has(dishId)
    );
    if (supported.length > 0) {
      addTask(tasks, {
        kind: "prep-ahead",
        priority: "today",
        titleKey: "agenda.task.prepAhead.title",
        reasonKey: "agenda.task.prepAhead.reason",
        sourceKey: "agenda.source.prepAhead",
        sourceRef: `plan:${input.plan.weekStart}:day:${nextDay}:prep-ahead`,
        actionHref: "/week",
        actionKey: "agenda.action.openWeek",
        evidence: {
          supported: supported.length,
          unsupported: plannedIds.length - supported.length,
        },
      }, calendarDate);
    }
  }

  const awaitingConfirmation = input.shopping.filter(
    (item) => item.checked && !item.fulfillment,
  );
  if (awaitingConfirmation.length > 0) {
    addTask(tasks, {
      kind: "confirm-purchase",
      priority: "today",
      titleKey: "agenda.task.confirmPurchase.title",
      reasonKey: "agenda.task.confirmPurchase.reason",
      sourceKey: "agenda.source.shopping",
      sourceRef: `shopping:${input.plan.weekStart}:confirm`,
      actionHref: "/shopping",
      actionKey: "agenda.action.openShopping",
      evidence: { count: awaitingConfirmation.length },
    }, calendarDate);
  }

  const toBuy = input.shopping.filter(
    (item) => !item.checked && !item.fulfillment,
  );
  if (toBuy.length > 0) {
    addTask(tasks, {
      kind: "shop",
      priority: "next",
      titleKey: "agenda.task.shop.title",
      reasonKey: "agenda.task.shop.reason",
      sourceKey: "agenda.source.shopping",
      sourceRef: `shopping:${input.plan.weekStart}:open`,
      actionHref: "/shopping",
      actionKey: "agenda.action.openShopping",
      evidence: {
        count: toBuy.length,
        vendorCount: new Set(toBuy.map((item) => item.vendor)).size,
      },
    }, calendarDate);
  }

  if (today !== undefined) {
    const plannedIds = [...new Set(
      input.plan.slots
        .filter((slot) => slot.day === today)
        .map((slot) => slot.dishId),
    )];
    const supportedIds: string[] = [];
    for (const dishId of plannedIds) {
      const dish = input.dish(dishId);
      if (!dish) continue;
      if (input.reviewedCookingDishIds.has(dishId)) {
        supportedIds.push(dishId);
      } else {
        const id = `cooking-guide:dish:${dishId}`;
        unsupported.set(id, {
          id,
          kind: "cooking-guide",
          sourceRef: `dish:${dishId}`,
          reasonKey: "agenda.unsupported.cookingGuide",
          evidence: { name: dish.vnName },
        });
      }
    }
    if (supportedIds.length === 1) {
      addTask(tasks, {
        kind: "cook",
        priority: "today",
        titleKey: "agenda.task.cook.title",
        reasonKey: "agenda.task.cook.reason",
        sourceKey: "agenda.source.weekPlan",
        sourceRef: `plan:${input.plan.weekStart}:day:${today}:cook`,
        actionHref: "/week",
        actionKey: "agenda.action.openWeek",
        evidence: {
          supported: 1,
          unsupported: plannedIds.length - 1,
        },
      }, calendarDate);
    } else if (supportedIds.length >= 2) {
      addTask(tasks, {
        kind: "coordinate-meal",
        priority: "today",
        titleKey: "agenda.task.coordinate.title",
        reasonKey: "agenda.task.coordinate.reason",
        sourceKey: "agenda.source.weekPlan",
        sourceRef: `plan:${input.plan.weekStart}:day:${today}:coordinate`,
        actionHref: "/week",
        actionKey: "agenda.action.openWeek",
        evidence: {
          supported: supportedIds.length,
          unsupported: plannedIds.length - supportedIds.length,
        },
      }, calendarDate);
    }
  }

  const sortedTasks = [...tasks.values()].sort((a, b) => {
    const priority = priorityRank[a.priority] - priorityRank[b.priority];
    if (priority) return priority;
    const due = (a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY)
      - (b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY);
    if (due) return due;
    return kindRank[a.kind] - kindRank[b.kind] || a.id.localeCompare(b.id);
  });

  return {
    generatedAt: input.now.toISOString(),
    calendarDate,
    tasks: sortedTasks,
    unsupported: [...unsupported.values()].sort((a, b) => a.id.localeCompare(b.id)),
  };
}
