import { describe, expect, it } from "vitest";
import {
  buildMealTimeline,
  mealTaskStatus,
  parseMealRunSession,
} from "./meal-coordination";

describe("meal coordination", () => {
  it("schedules backward from the serving target", () => {
    const timeline = buildMealTimeline(
      ["fish"],
      { fish: 40 },
      "2026-07-29T18:30:00.000Z",
    );
    expect(timeline.tasks[0]).toMatchObject({
      dishId: "fish",
      startAt: "2026-07-29T17:50:00.000Z",
      finishAt: "2026-07-29T18:30:00.000Z",
    });
  });

  it("deduplicates, sorts by start then id, and reports unsupported dishes", () => {
    const timeline = buildMealTimeline(
      ["quick", "unsupported", "long", "quick", "alpha"],
      { quick: 10, long: 40, alpha: 10 },
      "2026-07-29T18:30:00.000Z",
    );
    expect(timeline.tasks.map((task) => task.dishId)).toEqual(["long", "alpha", "quick"]);
    expect(timeline.unsupportedDishIds).toEqual(["unsupported"]);
  });

  it("rejects malformed targets and durations", () => {
    expect(() => buildMealTimeline(["dish"], { dish: 4 }, "2026-07-29T18:30:00.000Z")).toThrow("INVALID_DURATION");
    expect(() => buildMealTimeline(["dish"], { dish: 241 }, "2026-07-29T18:30:00.000Z")).toThrow("INVALID_DURATION");
    expect(() => buildMealTimeline(["dish"], { dish: 20 }, "bad")).toThrow("INVALID_TARGET");
  });

  it("derives status without automatically mutating task state", () => {
    const task = {
      startAt: "2026-07-29T17:50:00.000Z",
      finishAt: "2026-07-29T18:30:00.000Z",
    };
    expect(mealTaskStatus(task, new Date("2026-07-29T17:00:00.000Z"))).toBe("upcoming");
    expect(mealTaskStatus(task, new Date("2026-07-29T18:00:00.000Z"))).toBe("due");
    expect(mealTaskStatus(task, new Date("2026-07-29T19:00:00.000Z"))).toBe("late");
    expect(mealTaskStatus({ ...task, completedAt: "2026-07-29T18:20:00.000Z" })).toBe("done");
  });

  it("restores a valid session and rejects stale or malformed tasks", () => {
    const valid = {
      day: 0,
      targetServeAt: "2026-07-29T18:30:00.000Z",
      createdAt: "2026-07-29T17:00:00.000Z",
      tasks: [
        { dishId: "rice", estimatedMin: 30 },
        { dishId: "fish", estimatedMin: 40, startedAt: "2026-07-29T17:50:00.000Z" },
      ],
    };
    const supported = new Set(["rice", "fish"]);
    expect(parseMealRunSession(JSON.stringify(valid), 0, supported)).toEqual(valid);
    expect(parseMealRunSession("{", 0, supported)).toBeUndefined();
    expect(parseMealRunSession(JSON.stringify({ ...valid, day: 1 }), 0, supported)).toBeUndefined();
    expect(
      parseMealRunSession(
        JSON.stringify({ ...valid, tasks: [...valid.tasks, { dishId: "stale", estimatedMin: 20 }] }),
        0,
        supported,
      ),
    ).toBeUndefined();
  });
});
