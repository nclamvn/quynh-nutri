import { describe, expect, it } from "vitest";
import type {
  Dish,
  InventoryLot,
  LeftoverLot,
  WeekPlan,
} from "@/domain/types";
import type { ShoppingItem } from "@/domain/shopping";
import {
  buildKitchenAgenda,
  calendarDateInTimeZone,
  type KitchenAgendaInput,
} from "./kitchen-agenda";
import { LEFTOVER_POLICY_VERSION } from "./leftover-safety";

const now = new Date("2026-07-29T05:00:00.000Z"); // Wednesday noon in Vietnam.
const dish = (id: string, commodityId = "fish"): Dish => ({
  id,
  vnName: `Món ${id}`,
  proteinType: "ca",
  method: "kho",
  slot: "MAN",
  quick: false,
  baseServings: 4,
  origin: "B0",
  lines: [{ commodityId, qtyBase: 200, unit: "g" }],
});
const dishes = new Map(["one", "two", "unsupported"].map((id) => [id, dish(id)]));
const plan = (slots: WeekPlan["slots"] = []): WeekPlan => ({
  householdId: "household",
  weekStart: "2026-07-27",
  slots,
});
const lot = (overrides: Partial<InventoryLot> = {}): InventoryLot => ({
  id: "lot",
  commodityId: "fish",
  qty: 200,
  unit: "g",
  purchasedAt: "2026-07-28T02:00:00.000Z",
  storageLocation: "fridge",
  ...overrides,
});
const leftover = (hoursOld: number, overrides: Partial<LeftoverLot> = {}): LeftoverLot => ({
  id: "leftover",
  idempotencyKey: "key",
  dishRef: "one",
  dishLabelSnapshot: "Món một",
  remainingServings: 2,
  preparedAt: new Date(now.getTime() - (hoursOld + 1) * 3_600_000).toISOString(),
  chilledAt: new Date(now.getTime() - hoursOld * 3_600_000).toISOString(),
  storageLocation: "fridge",
  hotWeatherConfirmed: false,
  policyVersion: LEFTOVER_POLICY_VERSION,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
  ...overrides,
});
const shopping = (overrides: Partial<ShoppingItem> = {}): ShoppingItem => ({
  commodityId: "fish",
  qtyTotal: 200,
  unit: "g",
  vendor: "Chợ",
  trip: 1,
  kind: "fresh",
  checked: false,
  ...overrides,
});
const input = (overrides: Partial<KitchenAgendaInput> = {}): KitchenAgendaInput => ({
  now,
  timeZone: "Asia/Ho_Chi_Minh",
  plan: plan(),
  shopping: [],
  pantry: [],
  leftovers: [],
  dish: (id) => dishes.get(id),
  reviewedCookingDishIds: new Set(["one", "two"]),
  prepAheadDishIds: new Set(["one", "two"]),
  ...overrides,
});

describe("kitchen agenda", () => {
  it("returns an honest empty projection", () => {
    expect(buildKitchenAgenda(input())).toEqual({
      generatedAt: now.toISOString(),
      calendarDate: "2026-07-29",
      tasks: [],
      unsupported: [],
    });
  });

  it("uses the supplied timezone at the calendar boundary", () => {
    const boundary = new Date("2026-07-28T17:30:00.000Z");
    expect(calendarDateInTimeZone(boundary, "Asia/Ho_Chi_Minh")).toBe("2026-07-29");
    expect(calendarDateInTimeZone(boundary, "UTC")).toBe("2026-07-28");
  });

  it("reuses leftover guidance and prioritizes past then review signals", () => {
    const agenda = buildKitchenAgenda(input({
      leftovers: [
        leftover(80, { id: "review" }),
        leftover(100, { id: "past" }),
        leftover(5, { id: "fresh" }),
        leftover(200, { id: "frozen", storageLocation: "freezer" }),
        leftover(100, { id: "empty", remainingServings: 0 }),
      ],
    }));
    expect(agenda.tasks.map((task) => [task.sourceRef, task.priority])).toEqual([
      ["leftover:past", "now"],
      ["leftover:review", "today"],
    ]);
  });

  it("uses label semantics with Vietnam timezone, including a local-midnight label", () => {
    const agenda = buildKitchenAgenda(input({
      pantry: [
        lot({
          id: "today-label",
          bestBefore: "2026-07-28T17:00:00.000Z",
        }),
        lot({ id: "unknown", bestBefore: undefined }),
      ],
    }));
    expect(agenda.tasks).toHaveLength(1);
    expect(agenda.tasks[0]).toMatchObject({
      kind: "review-inventory-label",
      priority: "now",
      evidence: { signal: "today" },
    });
  });

  it("derives a preparation task only from freezer lots needed tomorrow", () => {
    const agenda = buildKitchenAgenda(input({
      plan: plan([{ day: 3, slot: "MAN", dishId: "one", locked: false }]),
      pantry: [
        lot({ id: "frozen", storageLocation: "freezer" }),
        lot({ id: "cold", storageLocation: "fridge" }),
      ],
    }));
    expect(agenda.tasks).toMatchObject([
      { kind: "prepare-frozen", evidence: { count: 1, itemCount: 1 } },
      { kind: "prep-ahead", evidence: { supported: 1, unsupported: 0 } },
    ]);
    expect(agenda.tasks[0].reasonKey).toBe("agenda.task.frozen.reason");
  });

  it("creates one grouped prep-ahead task for supported dishes tomorrow", () => {
    const agenda = buildKitchenAgenda(input({
      plan: plan([
        { day: 3, slot: "MAN", dishId: "one", locked: false },
        { day: 3, slot: "RAU", dishId: "two", locked: false },
        { day: 3, slot: "CANH", dishId: "unsupported", locked: false },
      ]),
    }));
    expect(agenda.tasks).toMatchObject([{
      kind: "prep-ahead",
      priority: "today",
      actionHref: "/week",
      evidence: { supported: 2, unsupported: 1 },
    }]);
    expect(agenda.tasks.filter((task) => task.kind === "prep-ahead")).toHaveLength(1);
  });

  it("does not create tomorrow preparation on Sunday or without a supported guide", () => {
    const sunday = new Date("2026-08-02T05:00:00.000Z");
    expect(buildKitchenAgenda(input({
      now: sunday,
      plan: plan([{ day: 6, slot: "MAN", dishId: "one", locked: false }]),
    })).tasks.some((task) => task.kind === "prep-ahead")).toBe(false);
    expect(buildKitchenAgenda(input({
      plan: plan([{ day: 3, slot: "MAN", dishId: "unsupported", locked: false }]),
    })).tasks.some((task) => task.kind === "prep-ahead")).toBe(false);
  });

  it("separates open shopping from checked lines awaiting confirmation", () => {
    const agenda = buildKitchenAgenda(input({
      shopping: [
        shopping({ commodityId: "fish" }),
        shopping({ commodityId: "veg", checked: true }),
        shopping({
          commodityId: "rice",
          checked: true,
          fulfillment: {
            id: "f",
            weekRef: "2026-07-27",
            commodityId: "rice",
            vendor: "Chợ",
            plannedQty: 200,
            actualQty: 200,
            unit: "g",
            boughtAt: now.toISOString(),
          },
        }),
      ],
    }));
    expect(agenda.tasks.map((task) => [task.kind, task.evidence.count])).toEqual([
      ["confirm-purchase", 1],
      ["shop", 1],
    ]);
  });

  it("creates cook for one guide, coordinate for two, and reports unsupported dishes", () => {
    const one = buildKitchenAgenda(input({
      plan: plan([
        { day: 2, slot: "MAN", dishId: "one", locked: false },
        { day: 2, slot: "RAU", dishId: "unsupported", locked: false },
      ]),
    }));
    expect(one.tasks).toMatchObject([{ kind: "cook", evidence: { supported: 1, unsupported: 1 } }]);
    expect(one.unsupported).toMatchObject([{ kind: "cooking-guide", evidence: { name: "Món unsupported" } }]);

    const two = buildKitchenAgenda(input({
      plan: plan([
        { day: 2, slot: "MAN", dishId: "one", locked: false },
        { day: 2, slot: "RAU", dishId: "two", locked: false },
      ]),
    }));
    expect(two.tasks.map((task) => task.kind)).toEqual(["coordinate-meal"]);
  });

  it("deduplicates stable IDs, sorts deterministically and never mutates inputs", () => {
    const source = input({
      plan: plan([
        { day: 2, slot: "MAN", dishId: "one", locked: false },
        { day: 2, slot: "RAU", dishId: "one", locked: false },
      ]),
      shopping: [shopping(), shopping()],
      leftovers: [leftover(100), leftover(100)],
    });
    const before = JSON.stringify({
      plan: source.plan,
      shopping: source.shopping,
      leftovers: source.leftovers,
    });
    const first = buildKitchenAgenda(source);
    const second = buildKitchenAgenda(source);
    expect(first).toEqual(second);
    expect(new Set(first.tasks.map((task) => task.id)).size).toBe(first.tasks.length);
    expect(first.tasks.map((task) => task.kind)).toEqual([
      "review-leftover",
      "cook",
      "shop",
    ]);
    expect(JSON.stringify({
      plan: source.plan,
      shopping: source.shopping,
      leftovers: source.leftovers,
    })).toBe(before);
  });
});
