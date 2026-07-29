import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  "prisma/migrations/20260729170000_canonical_week_plan/migration.sql",
  "utf8",
);

describe("canonical week plan migration", () => {
  it("aborts on legacy duplicates before adding unique constraints", () => {
    expect(sql).toContain("KE009_DUPLICATE_WEEK_PLAN");
    expect(sql).toContain("KE009_DUPLICATE_DAY_SLOT");
    expect(sql.indexOf("KE009_DUPLICATE_WEEK_PLAN"))
      .toBeLessThan(sql.indexOf("CREATE UNIQUE INDEX"));
  });

  it("adds version/timestamps and both aggregate uniqueness constraints", () => {
    expect(sql).toContain('ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1');
    expect(sql).toContain('"WeekPlan_householdId_weekStart_key"');
    expect(sql).toContain('"DaySlot_weekPlanId_day_slot_key"');
  });

  it("contains no destructive data rewrite", () => {
    expect(sql).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(sql).not.toMatch(/\bDROP\s+(TABLE|COLUMN)\b/i);
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
  });
});
