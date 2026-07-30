import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import {
  claimReminderDelivery,
  releaseReminderClaim,
} from "./reminders";

describe("reminder delivery repository", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("claims a subscription/task pair once and permits retry after release", async () => {
    vi.stubEnv("E2E_BYPASS_AUTH", "1");
    const subscriptionId = `subscription_${crypto.randomUUID()}`;
    const taskId = `task_${crypto.randomUUID()}`;
    const input = {
      subscriptionId,
      taskId,
      calendarDate: "2026-07-30",
    };
    await expect(claimReminderDelivery(input)).resolves.toBe(true);
    await expect(claimReminderDelivery(input)).resolves.toBe(false);
    await releaseReminderClaim(subscriptionId, taskId);
    await expect(claimReminderDelivery(input)).resolves.toBe(true);
  });
});
