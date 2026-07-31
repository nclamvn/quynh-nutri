import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { deleteExpiredProductEvents } = vi.hoisted(() => ({
  deleteExpiredProductEvents: vi.fn(async () => ({
    cutoff: "2025-07-31T00:00:00.000Z",
    deletedCount: 12,
    remainingEligible: false,
    durationMs: 8,
  })),
}));
vi.mock("@/data/repo/product-event-retention", () => ({
  deleteExpiredProductEvents,
}));

import { GET } from "./route";

const originalSecret = process.env.CRON_SECRET;

describe("product-event retention cron", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it("fails closed when the cron secret is not configured", async () => {
    delete process.env.CRON_SECRET;
    const response = await GET(new Request("http://localhost/api/cron/product-event-retention"));
    expect(response.status).toBe(503);
    expect(deleteExpiredProductEvents).not.toHaveBeenCalled();
  });

  it("rejects missing and incorrect bearer secrets without deleting", async () => {
    const missing = await GET(
      new Request("http://localhost/api/cron/product-event-retention"),
    );
    const wrong = await GET(
      new Request("http://localhost/api/cron/product-event-retention", {
        headers: { authorization: "Bearer wrong" },
      }),
    );
    expect(missing.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(deleteExpiredProductEvents).not.toHaveBeenCalled();
  });

  it("returns aggregate-only retention evidence for the valid secret", async () => {
    const response = await GET(
      new Request("http://localhost/api/cron/product-event-retention", {
        headers: { authorization: "Bearer test-cron-secret" },
      }),
    );
    expect(response.status).toBe(200);
    expect(deleteExpiredProductEvents).toHaveBeenCalledOnce();
    expect(await response.json()).toEqual({
      ok: true,
      summary: {
        cutoff: "2025-07-31T00:00:00.000Z",
        deletedCount: 12,
        remainingEligible: false,
        durationMs: 8,
      },
    });
  });
});
