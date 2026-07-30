import "server-only";

import webPush from "web-push";
import { isE2EMode } from "@/lib/auth";

export interface WebPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface ReminderPushPayload {
  title: string;
  body: string;
  href: string;
  tag: string;
}

const E2E_PUBLIC_KEY =
  "BEl62iUYgUivxIkv69yViEuiBIa40HI5Ob3r0RDStNO0ZxyJ9o1eTh-v5uDfnWQeRbMi3U7zUc4nt_9SBIcJRhk";

export function vapidPublicKey(): string {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (key) return key;
  if (isE2EMode()) return E2E_PUBLIC_KEY;
  return "";
}

export async function sendReminderPush(
  subscription: WebPushSubscription,
  payload: ReminderPushPayload,
): Promise<void> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hello@anngon.io";
  if (!publicKey || !privateKey) throw new Error("VAPID_NOT_CONFIGURED");

  webPush.setVapidDetails(subject, publicKey, privateKey);
  await webPush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    },
    JSON.stringify(payload),
    { TTL: 60 * 60, urgency: "normal" },
  );
}
