import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const {
  requireOperatorUserId,
  getDb,
  e2eMode,
  transaction,
  queryRaw,
  findMany,
  groupBy,
  completionCount,
} = vi.hoisted(() => {
  const e2eMode = { enabled: true };
  const queryRaw = vi.fn(async (query: { values?: unknown[] }) => {
    void query;
    return [{ set_config: "1500" }];
  });
  const findMany = vi.fn(async () => []);
  const groupBy = vi.fn(async () => []);
  const completionCount = vi.fn(async () => 0);
  const transaction = vi.fn(async (
    callback: (tx: unknown) => Promise<unknown>,
  ) => callback({
    $queryRaw: queryRaw,
    productEvent: { findMany, groupBy },
    mealCompletion: { count: completionCount },
  }));
  return {
    e2eMode,
    requireOperatorUserId: vi.fn(async () => "e2e-user"),
    queryRaw,
    findMany,
    groupBy,
    completionCount,
    transaction,
    getDb: vi.fn(() => ({ $transaction: transaction })),
  };
});
vi.mock("@/lib/operator-auth", () => ({ requireOperatorUserId }));
vi.mock("@/lib/auth", () => ({ isE2EMode: () => e2eMode.enabled }));
vi.mock("@/lib/db", () => ({ getDb }));

import { getOpsMetrics } from "./ops-metrics";

describe("operator metrics repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    e2eMode.enabled = true;
  });

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

  it("bounds every production read without retrying the transaction", async () => {
    e2eMode.enabled = false;

    const dto = await getOpsMetrics(90, new Date("2026-07-31T03:00:00.000Z"));

    expect(requireOperatorUserId).toHaveBeenCalledOnce();
    expect(getDb).toHaveBeenCalledOnce();
    expect(transaction).toHaveBeenCalledOnce();
    expect(transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { maxWait: 2_000, timeout: 10_000 },
    );
    expect(queryRaw).toHaveBeenCalledOnce();
    expect(queryRaw.mock.calls[0]?.[0]?.values).toEqual(["1500"]);
    expect(findMany).toHaveBeenCalledOnce();
    expect(groupBy).toHaveBeenCalledOnce();
    expect(completionCount).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(dto)).not.toContain("householdId");
    expect(dto.contractVersion).toBe("ke031-v1");
  });
});
