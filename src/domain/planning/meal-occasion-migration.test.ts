import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../../prisma/migrations/20260731010000_meal_occasions/migration.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("meal occasion migration", () => {
  it("backfills existing canonical facts as dinner", () => {
    expect(migration).toContain('UPDATE "DaySlot"');
    expect(migration).toContain('UPDATE "MealCompletion"');
    expect(migration.match(/SET "occasion" = 'dinner'/g)).toHaveLength(2);
  });

  it("replaces canonical uniqueness with occasion-aware keys", () => {
    expect(migration).toContain('"DaySlot_weekPlanId_day_occasion_slot_key"');
    expect(migration).toContain(
      '"MealCompletion_householdId_weekRef_day_occasion_sourceSessionCreatedAt_key"',
    );
    expect(migration).toContain(
      'DROP INDEX "DaySlot_weekPlanId_day_slot_key"',
    );
  });

  it("guards and migrates only recognized meal-run scopes", () => {
    expect(migration).toContain("Unrecognized legacy meal-run scopeKey");
    expect(migration).toContain(
      "Colliding legacy and occasion-aware meal-run scopeKey",
    );
    expect(migration).toContain('"scopeKey" || \':dinner\'');
    expect(migration).toContain('"kind" = \'meal-run\'');
  });
});
