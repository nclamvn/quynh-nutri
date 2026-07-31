import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { findMany, deleteMany, findFirst, count } = vi.hoisted(() => ({
  findMany: vi.fn(),
  deleteMany: vi.fn(),
  findFirst: vi.fn(),
  count: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    productEvent: { findMany, deleteMany, findFirst, count },
  }),
}));

import {
  countExpiredProductEvents,
  deleteExpiredProductEvents,
} from "./product-event-retention";

describe("bounded product-event retention", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes at most five fixed batches and reports aggregate evidence", async () => {
    const rows = Array.from({ length: 1_000 }, (_, index) => ({
      id: `event-${index}`,
    }));
    findMany.mockResolvedValue(rows);
    deleteMany.mockResolvedValue({ count: 1_000 });
    findFirst.mockResolvedValue({ id: "still-eligible" });

    const result = await deleteExpiredProductEvents(
      new Date("2026-07-31T00:00:00.000Z"),
    );

    expect(findMany).toHaveBeenCalledTimes(5);
    expect(deleteMany).toHaveBeenCalledTimes(5);
    expect(result).toMatchObject({
      cutoff: "2025-07-31T00:00:00.000Z",
      deletedCount: 5_000,
      remainingEligible: true,
    });
    expect(findMany.mock.calls[0]?.[0]).toMatchObject({
      where: { occurredAt: { lt: new Date("2025-07-31T00:00:00.000Z") } },
      take: 1_000,
    });
  });

  it("stops after a short batch and never accepts a caller cutoff", async () => {
    findMany.mockResolvedValueOnce([{ id: "old-event" }]);
    deleteMany.mockResolvedValueOnce({ count: 1 });
    findFirst.mockResolvedValueOnce(null);

    const result = await deleteExpiredProductEvents(
      new Date("2026-07-31T00:00:00.000Z"),
    );

    expect(findMany).toHaveBeenCalledOnce();
    expect(result.deletedCount).toBe(1);
    expect(result.remainingEligible).toBe(false);
  });

  it("provides a read-only aggregate dry run", async () => {
    count.mockResolvedValueOnce(14);
    await expect(
      countExpiredProductEvents(new Date("2026-07-31T00:00:00.000Z")),
    ).resolves.toEqual({
      cutoff: "2025-07-31T00:00:00.000Z",
      eligibleCount: 14,
    });
  });
});
