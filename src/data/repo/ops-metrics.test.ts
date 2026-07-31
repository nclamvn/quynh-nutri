import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { requireOperatorUserId, getDb } = vi.hoisted(() => ({
  requireOperatorUserId: vi.fn(async () => "e2e-user"),
  getDb: vi.fn(() => {
    throw new Error("Operator E2E adapter must not access Neon.");
  }),
}));
vi.mock("@/lib/operator-auth", () => ({ requireOperatorUserId }));
vi.mock("@/lib/auth", () => ({ isE2EMode: () => true }));
vi.mock("@/lib/db", () => ({ getDb }));

import { getOpsMetrics } from "./ops-metrics";

describe("operator metrics repository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rechecks operator authorization and returns aggregate-only E2E data", async () => {
    const dto = await getOpsMetrics(28, new Date("2026-07-31T03:00:00.000Z"));
    expect(requireOperatorUserId).toHaveBeenCalledOnce();
    expect(getDb).not.toHaveBeenCalled();
    expect(dto.milestones.find((item) => item.key === "started")?.households).toBe(8);
    expect(JSON.stringify(dto)).not.toContain("e2e-household");
  });

  it("does not touch storage when authorization fails", async () => {
    requireOperatorUserId.mockRejectedValueOnce(new Error("denied"));
    await expect(getOpsMetrics(28)).rejects.toThrow("denied");
    expect(getDb).not.toHaveBeenCalled();
  });
});
