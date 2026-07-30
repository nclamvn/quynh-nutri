-- KE-028: immutable meal execution evidence and explicit closeout provenance.
CREATE TABLE "MealCompletion" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "weekRef" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "dishRefs" TEXT[] NOT NULL,
    "sourceSessionCreatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealCompletion_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InventoryMovement"
ADD COLUMN "sourceMealCompletionId" TEXT;

ALTER TABLE "LeftoverLot"
ADD COLUMN "mealCompletionId" TEXT;

CREATE UNIQUE INDEX "MealCompletion_householdId_idempotencyKey_key"
ON "MealCompletion"("householdId", "idempotencyKey");

CREATE UNIQUE INDEX "MealCompletion_householdId_weekRef_day_sourceSessionCreatedAt_key"
ON "MealCompletion"("householdId", "weekRef", "day", "sourceSessionCreatedAt");

CREATE INDEX "MealCompletion_householdId_weekRef_day_idx"
ON "MealCompletion"("householdId", "weekRef", "day");

CREATE INDEX "MealCompletion_householdId_completedAt_idx"
ON "MealCompletion"("householdId", "completedAt");

CREATE INDEX "InventoryMovement_sourceMealCompletionId_idx"
ON "InventoryMovement"("sourceMealCompletionId");

CREATE INDEX "LeftoverLot_mealCompletionId_idx"
ON "LeftoverLot"("mealCompletionId");

ALTER TABLE "MealCompletion"
ADD CONSTRAINT "MealCompletion_householdId_fkey"
FOREIGN KEY ("householdId") REFERENCES "Household"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryMovement"
ADD CONSTRAINT "InventoryMovement_sourceMealCompletionId_fkey"
FOREIGN KEY ("sourceMealCompletionId") REFERENCES "MealCompletion"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LeftoverLot"
ADD CONSTRAINT "LeftoverLot_mealCompletionId_fkey"
FOREIGN KEY ("mealCompletionId") REFERENCES "MealCompletion"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
