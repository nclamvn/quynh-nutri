-- KE-029: explicit household feedback for one dish in one confirmed meal.
CREATE TABLE "MealFeedback" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "mealCompletionId" TEXT NOT NULL,
    "dishRef" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "repeatIntent" TEXT,
    "portionFit" TEXT,
    "effortFit" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdByUserId" TEXT NOT NULL,
    "updatedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealFeedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MealFeedback_repeatIntent_check"
      CHECK ("repeatIntent" IS NULL OR "repeatIntent" IN ('repeat', 'neutral', 'avoid')),
    CONSTRAINT "MealFeedback_portionFit_check"
      CHECK ("portionFit" IS NULL OR "portionFit" IN ('too_little', 'right', 'too_much')),
    CONSTRAINT "MealFeedback_effortFit_check"
      CHECK ("effortFit" IS NULL OR "effortFit" IN ('easy', 'manageable', 'too_much')),
    CONSTRAINT "MealFeedback_at_least_one_answer_check"
      CHECK ("repeatIntent" IS NOT NULL OR "portionFit" IS NOT NULL OR "effortFit" IS NOT NULL)
);

CREATE UNIQUE INDEX "MealFeedback_householdId_idempotencyKey_key"
ON "MealFeedback"("householdId", "idempotencyKey");

CREATE UNIQUE INDEX "MealFeedback_mealCompletionId_dishRef_key"
ON "MealFeedback"("mealCompletionId", "dishRef");

CREATE INDEX "MealFeedback_householdId_updatedAt_idx"
ON "MealFeedback"("householdId", "updatedAt");

CREATE INDEX "MealFeedback_householdId_dishRef_idx"
ON "MealFeedback"("householdId", "dishRef");

ALTER TABLE "MealFeedback"
ADD CONSTRAINT "MealFeedback_householdId_fkey"
FOREIGN KEY ("householdId") REFERENCES "Household"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MealFeedback"
ADD CONSTRAINT "MealFeedback_mealCompletionId_fkey"
FOREIGN KEY ("mealCompletionId") REFERENCES "MealCompletion"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
