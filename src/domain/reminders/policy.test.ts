import { describe, expect, it } from "vitest";
import {
  clockInTimeZone,
  isReminderWindow,
  isValidTimeZone,
  reminderTasks,
  safeReminderHref,
} from "./policy";
import type { KitchenAgendaTask } from "@/domain/kitchen-execution/kitchen-agenda";

const task = (
  id: string,
  priority: KitchenAgendaTask["priority"],
): KitchenAgendaTask => ({
  id,
  kind: "shop",
  priority,
  titleKey: "title",
  reasonKey: "reason",
  sourceKey: "source",
  sourceRef: id,
  actionHref: "/shopping",
  actionKey: "open",
  evidence: {},
});

describe("reminder policy", () => {
  it("uses the household wall clock and local calendar date", () => {
    expect(clockInTimeZone(
      new Date("2026-07-29T17:05:00.000Z"),
      "Asia/Ho_Chi_Minh",
    )).toEqual({ calendarDate: "2026-07-30", hour: 0, minute: 5 });
  });

  it("opens only the first 15 minutes of the configured local hour", () => {
    expect(isReminderWindow(
      new Date("2026-07-30T00:14:00.000Z"),
      "Asia/Ho_Chi_Minh",
      7,
    )).toBe(true);
    expect(isReminderWindow(
      new Date("2026-07-30T00:15:00.000Z"),
      "Asia/Ho_Chi_Minh",
      7,
    )).toBe(false);
  });

  it("rejects invalid zones and hours", () => {
    expect(isValidTimeZone("Asia/Ho_Chi_Minh")).toBe(true);
    expect(isValidTimeZone("not/a-zone")).toBe(false);
    expect(isReminderWindow(new Date(), "UTC", 24)).toBe(false);
  });

  it("keeps only urgent/today tasks and caps notification volume", () => {
    expect(reminderTasks([
      task("a", "now"),
      task("b", "today"),
      task("c", "next"),
      task("d", "today"),
      task("e", "today"),
    ]).map((item) => item.id)).toEqual(["a", "b", "d"]);
  });

  it("allows only known same-origin source routes", () => {
    expect(safeReminderHref("/pantry#leftovers")).toBe("/pantry#leftovers");
    expect(safeReminderHref("https://evil.example/week")).toBe("/overview");
    expect(safeReminderHref("/api/cron/reminders")).toBe("/overview");
  });
});
