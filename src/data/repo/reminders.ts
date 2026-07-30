import "server-only";

import { Prisma } from "@prisma/client";
import { getDb } from "@/lib/db";
import { isE2EMode, requireUserId } from "@/lib/auth";
import { currentHouseholdId } from "@/data/repo/household";

export interface ReminderSettings {
  enabled: boolean;
  timeZone: string;
  reminderHour: number;
  subscriptionCount: number;
}

export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  timeZone: string;
  reminderHour: number;
}

export interface ReminderTarget {
  householdId: string;
  timeZone: string;
  reminderHour: number;
  subscriptions: {
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }[];
}

const e2eSubscriptions = new Map<string, {
  id: string;
  householdId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}>();
const e2eDeliveries = new Set<string>();
let e2eSettings: ReminderSettings = {
  enabled: false,
  timeZone: "Asia/Ho_Chi_Minh",
  reminderHour: 7,
  subscriptionCount: 0,
};

export async function getReminderSettings(): Promise<ReminderSettings> {
  await requireUserId();
  if (isE2EMode()) return structuredClone(e2eSettings);
  const householdId = await currentHouseholdId();
  const row = await getDb().household.findUniqueOrThrow({
    where: { id: householdId },
    select: {
      reminderEnabled: true,
      reminderTimeZone: true,
      reminderHour: true,
      _count: { select: { pushSubscriptions: true } },
    },
  });
  return {
    enabled: row.reminderEnabled,
    timeZone: row.reminderTimeZone,
    reminderHour: row.reminderHour,
    subscriptionCount: row._count.pushSubscriptions,
  };
}

export async function enableReminderSubscription(
  input: PushSubscriptionInput,
): Promise<ReminderSettings> {
  await requireUserId();
  const householdId = await currentHouseholdId();
  if (isE2EMode()) {
    e2eSubscriptions.set(input.endpoint, {
      id: `push_${crypto.randomUUID()}`,
      householdId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    });
    e2eSettings = {
      enabled: true,
      timeZone: input.timeZone,
      reminderHour: input.reminderHour,
      subscriptionCount: e2eSubscriptions.size,
    };
    return structuredClone(e2eSettings);
  }
  const db = getDb();
  await db.$transaction([
    db.household.update({
      where: { id: householdId },
      data: {
        reminderEnabled: true,
        reminderTimeZone: input.timeZone,
        reminderHour: input.reminderHour,
      },
    }),
    db.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      update: {
        householdId,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent ?? null,
      },
      create: {
        householdId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent ?? null,
      },
    }),
  ]);
  return getReminderSettings();
}

export async function disableHouseholdReminders(): Promise<void> {
  await requireUserId();
  const householdId = await currentHouseholdId();
  if (isE2EMode()) {
    for (const [endpoint, subscription] of e2eSubscriptions) {
      if (subscription.householdId === householdId) {
        e2eSubscriptions.delete(endpoint);
      }
    }
    e2eSettings = { ...e2eSettings, enabled: false, subscriptionCount: 0 };
    return;
  }
  const db = getDb();
  await db.$transaction([
    db.household.update({
      where: { id: householdId },
      data: { reminderEnabled: false },
    }),
    db.pushSubscription.deleteMany({ where: { householdId } }),
  ]);
}

export async function listReminderTargets(): Promise<ReminderTarget[]> {
  if (isE2EMode()) {
    return e2eSettings.enabled
      ? [{
          householdId: "household_default",
          timeZone: e2eSettings.timeZone,
          reminderHour: e2eSettings.reminderHour,
          subscriptions: [...e2eSubscriptions.values()].map((item) => ({
            id: item.id,
            endpoint: item.endpoint,
            p256dh: item.p256dh,
            auth: item.auth,
          })),
        }]
      : [];
  }
  const rows = await getDb().household.findMany({
    where: {
      reminderEnabled: true,
      pushSubscriptions: { some: {} },
    },
    select: {
      id: true,
      reminderTimeZone: true,
      reminderHour: true,
      pushSubscriptions: {
        select: { id: true, endpoint: true, p256dh: true, auth: true },
      },
    },
  });
  return rows.map((row) => ({
    householdId: row.id,
    timeZone: row.reminderTimeZone,
    reminderHour: row.reminderHour,
    subscriptions: row.pushSubscriptions,
  }));
}

export async function claimReminderDelivery(input: {
  subscriptionId: string;
  taskId: string;
  calendarDate: string;
}): Promise<boolean> {
  const key = `${input.subscriptionId}:${input.taskId}`;
  if (isE2EMode()) {
    if (e2eDeliveries.has(key)) return false;
    e2eDeliveries.add(key);
    return true;
  }
  try {
    await getDb().reminderDelivery.create({
      data: {
        subscriptionId: input.subscriptionId,
        taskId: input.taskId,
        calendarDate: input.calendarDate,
      },
    });
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
      && error.code === "P2002"
    ) return false;
    throw error;
  }
}

export async function markReminderSent(
  subscriptionId: string,
  taskId: string,
  sentAt: Date,
): Promise<void> {
  if (isE2EMode()) return;
  await getDb().reminderDelivery.updateMany({
    where: { subscriptionId, taskId },
    data: { status: "sent", sentAt },
  });
}

export async function releaseReminderClaim(
  subscriptionId: string,
  taskId: string,
): Promise<void> {
  if (isE2EMode()) {
    e2eDeliveries.delete(`${subscriptionId}:${taskId}`);
    return;
  }
  await getDb().reminderDelivery.deleteMany({
    where: { subscriptionId, taskId, status: "sending" },
  });
}

export async function removePushSubscription(id: string): Promise<void> {
  if (isE2EMode()) {
    for (const [endpoint, subscription] of e2eSubscriptions) {
      if (subscription.id === id) e2eSubscriptions.delete(endpoint);
    }
    e2eSettings = {
      ...e2eSettings,
      subscriptionCount: e2eSubscriptions.size,
      enabled: e2eSubscriptions.size > 0,
    };
    return;
  }
  const db = getDb();
  await db.$transaction(async (tx) => {
    const subscription = await tx.pushSubscription.findUnique({
      where: { id },
      select: { householdId: true },
    });
    if (!subscription) return;
    await tx.pushSubscription.delete({ where: { id } });
    const remaining = await tx.pushSubscription.count({
      where: { householdId: subscription.householdId },
    });
    if (remaining === 0) {
      await tx.household.update({
        where: { id: subscription.householdId },
        data: { reminderEnabled: false },
      });
    }
  });
}
