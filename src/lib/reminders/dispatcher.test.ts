import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KitchenAgendaTask } from "@/domain/kitchen-execution/kitchen-agenda";

vi.mock("server-only", () => ({}));
vi.mock("@/data/repo/reminders", () => ({
  claimReminderDelivery: vi.fn(),
  listReminderTargets: vi.fn(),
  markReminderSent: vi.fn(),
  releaseReminderClaim: vi.fn(),
  removePushSubscription: vi.fn(),
}));
vi.mock("@/data/repo/household", () => ({
  loadHouseholdStateForSystem: vi.fn(),
}));
vi.mock("@/data/repo/week-plan", () => ({
  loadWeekPlanForSystem: vi.fn(),
}));
vi.mock("@/lib/assistant/kitchen-agenda", () => ({
  buildAssistantKitchenAgenda: vi.fn(),
}));

import {
  claimReminderDelivery,
  listReminderTargets,
  markReminderSent,
  releaseReminderClaim,
  removePushSubscription,
} from "@/data/repo/reminders";
import { loadHouseholdStateForSystem } from "@/data/repo/household";
import { loadWeekPlanForSystem } from "@/data/repo/week-plan";
import { buildAssistantKitchenAgenda } from "@/lib/assistant/kitchen-agenda";
import { dispatchHousekeeperReminders } from "./dispatcher";

const agendaTask: KitchenAgendaTask = {
  id: "shop:week:2026-07-30",
  kind: "shop",
  priority: "today",
  titleKey: "title",
  reasonKey: "reason",
  sourceKey: "source",
  sourceRef: "shopping:week",
  actionHref: "/shopping",
  actionKey: "open",
  evidence: {},
};

describe("reminder dispatcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listReminderTargets).mockResolvedValue([{
      householdId: "hh_1",
      timeZone: "Asia/Ho_Chi_Minh",
      reminderHour: 7,
      subscriptions: [{
        id: "sub_1",
        endpoint: "https://push.example/sub",
        p256dh: "key",
        auth: "auth",
      }],
    }]);
    vi.mocked(loadHouseholdStateForSystem).mockResolvedValue({} as never);
    vi.mocked(loadWeekPlanForSystem).mockResolvedValue({
      plan: { weekStart: "2026-07-27" },
      householdDishes: [],
    } as never);
    vi.mocked(buildAssistantKitchenAgenda).mockReturnValue({
      generatedAt: "2026-07-30T00:05:00.000Z",
      calendarDate: "2026-07-30",
      tasks: [agendaTask],
      unsupported: [],
    });
    vi.mocked(claimReminderDelivery).mockResolvedValue(true);
  });

  it("does no household work outside the local window", async () => {
    const summary = await dispatchHousekeeperReminders({
      now: new Date("2026-07-30T00:20:00.000Z"),
      send: vi.fn(),
    });
    expect(summary.sent).toBe(0);
    expect(loadHouseholdStateForSystem).not.toHaveBeenCalled();
  });

  it("claims before sending and records a successful delivery", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const summary = await dispatchHousekeeperReminders({
      now: new Date("2026-07-30T00:05:00.000Z"),
      send,
    });
    expect(claimReminderDelivery).toHaveBeenCalledWith({
      subscriptionId: "sub_1",
      taskId: agendaTask.id,
      calendarDate: "2026-07-30",
    });
    expect(send).toHaveBeenCalledOnce();
    expect(markReminderSent).toHaveBeenCalledOnce();
    expect(summary.sent).toBe(1);
  });

  it("does not resend an already claimed task", async () => {
    vi.mocked(claimReminderDelivery).mockResolvedValue(false);
    const send = vi.fn();
    const summary = await dispatchHousekeeperReminders({
      now: new Date("2026-07-30T00:05:00.000Z"),
      send,
    });
    expect(send).not.toHaveBeenCalled();
    expect(summary.deduplicated).toBe(1);
  });

  it("releases transient failures and removes expired subscriptions", async () => {
    const transient = await dispatchHousekeeperReminders({
      now: new Date("2026-07-30T00:05:00.000Z"),
      send: vi.fn().mockRejectedValue(new Error("temporary")),
    });
    expect(releaseReminderClaim).toHaveBeenCalledWith("sub_1", agendaTask.id);
    expect(transient.failed).toBe(1);

    vi.clearAllMocks();
    vi.mocked(listReminderTargets).mockResolvedValue([{
      householdId: "hh_1",
      timeZone: "Asia/Ho_Chi_Minh",
      reminderHour: 7,
      subscriptions: [{
        id: "sub_1",
        endpoint: "https://push.example/sub",
        p256dh: "key",
        auth: "auth",
      }],
    }]);
    vi.mocked(loadHouseholdStateForSystem).mockResolvedValue({} as never);
    vi.mocked(loadWeekPlanForSystem).mockResolvedValue({
      plan: { weekStart: "2026-07-27" },
      householdDishes: [],
    } as never);
    vi.mocked(buildAssistantKitchenAgenda).mockReturnValue({
      generatedAt: "2026-07-30T00:05:00.000Z",
      calendarDate: "2026-07-30",
      tasks: [agendaTask],
      unsupported: [],
    });
    vi.mocked(claimReminderDelivery).mockResolvedValue(true);
    const gone = Object.assign(new Error("gone"), { statusCode: 410 });
    const expired = await dispatchHousekeeperReminders({
      now: new Date("2026-07-30T00:05:00.000Z"),
      send: vi.fn().mockRejectedValue(gone),
    });
    expect(removePushSubscription).toHaveBeenCalledWith("sub_1");
    expect(expired.expired).toBe(1);
  });
});
