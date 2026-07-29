-- KE-009 preflight: abort instead of silently deleting duplicate aggregates.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "WeekPlan"
    GROUP BY "householdId", "weekStart"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'KE009_DUPLICATE_WEEK_PLAN';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "DaySlot"
    GROUP BY "weekPlanId", "day", "slot"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'KE009_DUPLICATE_DAY_SLOT';
  END IF;
END $$;

ALTER TABLE "WeekPlan"
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing rows via the temporary default above, then match Prisma's
-- `@updatedAt` contract: the application supplies this value on every write.
ALTER TABLE "WeekPlan"
ALTER COLUMN "updatedAt" DROP DEFAULT;

CREATE UNIQUE INDEX "WeekPlan_householdId_weekStart_key"
ON "WeekPlan"("householdId", "weekStart");

CREATE UNIQUE INDEX "DaySlot_weekPlanId_day_slot_key"
ON "DaySlot"("weekPlanId", "day", "slot");
