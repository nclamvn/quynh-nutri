CREATE TYPE "MealOccasion" AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

ALTER TABLE "DaySlot"
  ADD COLUMN "occasion" "MealOccasion";

ALTER TABLE "MealCompletion"
  ADD COLUMN "occasion" "MealOccasion";

UPDATE "DaySlot"
SET "occasion" = 'dinner'
WHERE "occasion" IS NULL;

UPDATE "MealCompletion"
SET "occasion" = 'dinner'
WHERE "occasion" IS NULL;

ALTER TABLE "DaySlot"
  ALTER COLUMN "occasion" SET DEFAULT 'dinner',
  ALTER COLUMN "occasion" SET NOT NULL;

ALTER TABLE "MealCompletion"
  ALTER COLUMN "occasion" SET DEFAULT 'dinner',
  ALTER COLUMN "occasion" SET NOT NULL;

DROP INDEX "DaySlot_weekPlanId_day_slot_key";
DROP INDEX "MealCompletion_householdId_weekRef_day_sourceSessionCreatedAt_key";
DROP INDEX "MealCompletion_householdId_weekRef_day_idx";

CREATE UNIQUE INDEX "DaySlot_weekPlanId_day_occasion_slot_key"
  ON "DaySlot"("weekPlanId", "day", "occasion", "slot");

CREATE UNIQUE INDEX "MealCompletion_householdId_weekRef_day_occasion_sourceSessionCreatedAt_key"
  ON "MealCompletion"("householdId", "weekRef", "day", "occasion", "sourceSessionCreatedAt");

CREATE INDEX "MealCompletion_householdId_weekRef_day_occasion_idx"
  ON "MealCompletion"("householdId", "weekRef", "day", "occasion");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "KitchenSession"
    WHERE "kind" = 'meal-run'
      AND "scopeKey" !~ '^\d{4}-\d{2}-\d{2}:[0-6]$'
      AND "scopeKey" !~ '^\d{4}-\d{2}-\d{2}:[0-6]:(breakfast|lunch|dinner|snack)$'
  ) THEN
    RAISE EXCEPTION 'Unrecognized legacy meal-run scopeKey';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "KitchenSession" legacy
    JOIN "KitchenSession" current
      ON current."householdId" = legacy."householdId"
     AND current."kind" = legacy."kind"
     AND current."scopeKey" = legacy."scopeKey" || ':dinner'
    WHERE legacy."kind" = 'meal-run'
      AND legacy."scopeKey" ~ '^\d{4}-\d{2}-\d{2}:[0-6]$'
  ) THEN
    RAISE EXCEPTION 'Colliding legacy and occasion-aware meal-run scopeKey';
  END IF;
END $$;

UPDATE "KitchenSession"
SET "scopeKey" = "scopeKey" || ':dinner'
WHERE "kind" = 'meal-run'
  AND "scopeKey" ~ '^\d{4}-\d{2}-\d{2}:[0-6]$';
