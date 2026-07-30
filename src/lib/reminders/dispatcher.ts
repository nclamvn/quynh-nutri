import "server-only";

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
import { buildDailyHousekeeperBrief } from "@/domain/kitchen-execution/daily-housekeeper-brief";
import { weekStartIsoInTimeZone } from "@/lib/week";
import {
  isReminderWindow,
  reminderCopy,
  reminderTasks,
  safeReminderHref,
} from "@/domain/reminders/policy";
import {
  sendReminderPush,
  type ReminderPushPayload,
  type WebPushSubscription,
} from "@/lib/reminders/web-push";

export interface ReminderDispatchSummary {
  targets: number;
  dueHouseholds: number;
  sent: number;
  deduplicated: number;
  expired: number;
  failed: number;
}

type PushSender = (
  subscription: WebPushSubscription,
  payload: ReminderPushPayload,
) => Promise<void>;

const statusCodeOf = (error: unknown): number | undefined => {
  if (
    typeof error === "object"
    && error !== null
    && "statusCode" in error
    && typeof error.statusCode === "number"
  ) return error.statusCode;
  return undefined;
};

export async function dispatchHousekeeperReminders(input: {
  now?: Date;
  send?: PushSender;
} = {}): Promise<ReminderDispatchSummary> {
  const now = input.now ?? new Date();
  const send = input.send ?? sendReminderPush;
  const targets = await listReminderTargets();
  const summary: ReminderDispatchSummary = {
    targets: targets.length,
    dueHouseholds: 0,
    sent: 0,
    deduplicated: 0,
    expired: 0,
    failed: 0,
  };

  for (const target of targets) {
    let due = false;
    try {
      due = isReminderWindow(
        now,
        target.timeZone,
        target.reminderHour,
      );
    } catch {
      summary.failed += 1;
      continue;
    }
    if (!due) continue;
    summary.dueHouseholds += 1;

    const state = await loadHouseholdStateForSystem(target.householdId);
    if (!state) {
      summary.failed += 1;
      continue;
    }
    const weekStart = weekStartIsoInTimeZone(now, target.timeZone);
    const envelope = await loadWeekPlanForSystem(
      target.householdId,
      weekStart,
    );
    if (!envelope) continue;
    const agenda = buildAssistantKitchenAgenda({
      state,
      plan: envelope.plan,
      householdDishes: envelope.householdDishes,
      now,
      timeZone: target.timeZone,
    });
    const brief = buildDailyHousekeeperBrief(agenda);

    for (const subscription of target.subscriptions) {
      for (const task of reminderTasks(brief)) {
        const claimed = await claimReminderDelivery({
          subscriptionId: subscription.id,
          taskId: task.id,
          calendarDate: agenda.calendarDate,
        });
        if (!claimed) {
          summary.deduplicated += 1;
          continue;
        }
        const copy = reminderCopy(task);
        try {
          await send(subscription, {
            ...copy,
            href: safeReminderHref(task.actionHref),
            tag: task.id,
          });
          await markReminderSent(subscription.id, task.id, now);
          summary.sent += 1;
        } catch (error) {
          const statusCode = statusCodeOf(error);
          if (statusCode === 404 || statusCode === 410) {
            await removePushSubscription(subscription.id);
            summary.expired += 1;
            break;
          }
          await releaseReminderClaim(subscription.id, task.id);
          summary.failed += 1;
        }
      }
    }
  }

  return summary;
}
