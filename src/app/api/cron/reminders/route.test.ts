import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/reminders/dispatcher", () => ({
  dispatchHousekeeperReminders: vi.fn(async () => ({
    targets: 0,
    dueHouseholds: 0,
    sent: 0,
    deduplicated: 0,
    expired: 0,
    failed: 0,
  })),
}));

import { dispatchHousekeeperReminders } from "@/lib/reminders/dispatcher";
import { GET } from "./route";

const originalSecret = process.env.CRON_SECRET;

describe("reminder cron route", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it("rejects a missing or incorrect bearer secret", async () => {
    const missing = await GET(new Request("http://localhost/api/cron/reminders"));
    const wrong = await GET(new Request("http://localhost/api/cron/reminders", {
      headers: { authorization: "Bearer wrong" },
    }));
    expect(missing.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(dispatchHousekeeperReminders).not.toHaveBeenCalled();
  });

  it("dispatches with the configured bearer secret", async () => {
    const response = await GET(new Request("http://localhost/api/cron/reminders", {
      headers: { authorization: "Bearer test-cron-secret" },
    }));
    expect(response.status).toBe(200);
    expect(dispatchHousekeeperReminders).toHaveBeenCalledOnce();
  });
});
