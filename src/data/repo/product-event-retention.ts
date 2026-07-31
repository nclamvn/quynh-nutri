import "server-only";

import { getDb } from "@/lib/db";

const RETENTION_DAYS = 365;
const BATCH_SIZE = 1_000;
const MAX_BATCHES = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ProductEventRetentionSummary = {
  cutoff: string;
  deletedCount: number;
  remainingEligible: boolean;
  durationMs: number;
};

export async function deleteExpiredProductEvents(
  now = new Date(),
): Promise<ProductEventRetentionSummary> {
  const startedAt = performance.now();
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * DAY_MS);
  const db = getDb();
  let deletedCount = 0;

  for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
    const rows = await db.productEvent.findMany({
      where: { occurredAt: { lt: cutoff } },
      orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
      select: { id: true },
      take: BATCH_SIZE,
    });
    if (rows.length === 0) break;
    const result = await db.productEvent.deleteMany({
      where: { id: { in: rows.map((row) => row.id) } },
    });
    deletedCount += result.count;
    if (rows.length < BATCH_SIZE) break;
  }

  const remainingEligible = Boolean(await db.productEvent.findFirst({
    where: { occurredAt: { lt: cutoff } },
    select: { id: true },
  }));
  return {
    cutoff: cutoff.toISOString(),
    deletedCount,
    remainingEligible,
    durationMs: Math.round((performance.now() - startedAt) * 10) / 10,
  };
}

export async function countExpiredProductEvents(
  now = new Date(),
): Promise<{ cutoff: string; eligibleCount: number }> {
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * DAY_MS);
  const eligibleCount = await getDb().productEvent.count({
    where: { occurredAt: { lt: cutoff } },
  });
  return { cutoff: cutoff.toISOString(), eligibleCount };
}
