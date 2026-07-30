import { describe, expect, it } from "vitest";
import type {
  KitchenAgenda,
  KitchenAgendaTask,
  KitchenAgendaTaskKind,
} from "./kitchen-agenda";
import {
  buildDailyHousekeeperBrief,
  DAILY_BRIEF_STATIONS,
} from "./daily-housekeeper-brief";

const kinds: KitchenAgendaTaskKind[] = [
  "review-leftover",
  "review-inventory-label",
  "prepare-frozen",
  "prep-ahead",
  "shop",
  "confirm-purchase",
  "cook",
  "coordinate-meal",
];

const task = (kind: KitchenAgendaTaskKind, index: number): KitchenAgendaTask => ({
  id: `${kind}:${index}`,
  kind,
  priority: index < 2 ? "now" : "today",
  titleKey: `title.${kind}`,
  reasonKey: `reason.${kind}`,
  sourceKey: `source.${kind}`,
  sourceRef: `source:${kind}`,
  actionHref: kind.includes("shop") || kind === "confirm-purchase"
    ? "/shopping"
    : kind.startsWith("review")
      ? "/pantry"
      : "/week",
  actionKey: `action.${kind}`,
  evidence: { index },
});

const agenda = (tasks: KitchenAgendaTask[]): KitchenAgenda => ({
  generatedAt: "2026-07-30T00:00:00.000Z",
  calendarDate: "2026-07-30",
  tasks,
  unsupported: [],
});

describe("daily housekeeper brief", () => {
  it("always returns the three stable kitchen stations", () => {
    const brief = buildDailyHousekeeperBrief(agenda([]));
    expect(brief.stations.map((station) => station.key)).toEqual(
      DAILY_BRIEF_STATIONS,
    );
    expect(brief.stations.every((station) => station.tasks.length === 0)).toBe(true);
  });

  it("maps every supported agenda kind exactly once", () => {
    const sourceTasks = kinds.map(task);
    const brief = buildDailyHousekeeperBrief(agenda(sourceTasks));
    expect(brief.stations.find((item) => item.key === "prepare")!.tasks.map((item) => item.kind))
      .toEqual(["prepare-frozen", "prep-ahead", "cook", "coordinate-meal"]);
    expect(brief.stations.find((item) => item.key === "shop")!.tasks.map((item) => item.kind))
      .toEqual(["shop", "confirm-purchase"]);
    expect(brief.stations.find((item) => item.key === "use-soon")!.tasks.map((item) => item.kind))
      .toEqual(["review-leftover", "review-inventory-label"]);
    expect(brief.stations.flatMap((station) => station.tasks)).toHaveLength(kinds.length);
  });

  it("preserves canonical order and never mutates agenda evidence", () => {
    const source = agenda([
      task("review-leftover", 0),
      task("cook", 1),
      task("shop", 2),
    ]);
    const before = structuredClone(source);
    const brief = buildDailyHousekeeperBrief(source);
    expect(brief.tasks.map((item) => item.id)).toEqual(source.tasks.map((item) => item.id));
    brief.tasks[0].evidence.index = 99;
    expect(source).toEqual(before);
  });
});

