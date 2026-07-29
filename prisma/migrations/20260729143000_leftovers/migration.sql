-- KE-006: cooked-dish leftovers are deliberately separate from InventoryLot.
CREATE TYPE "LeftoverStorageLocation" AS ENUM ('fridge', 'freezer');
CREATE TYPE "LeftoverMovementKind" AS ENUM ('consumed', 'discarded', 'corrected');

CREATE TABLE "LeftoverLot" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "dishRef" TEXT NOT NULL,
    "dishLabelSnapshot" TEXT NOT NULL,
    "remainingServings" DOUBLE PRECISION NOT NULL,
    "preparedAt" TIMESTAMP(3) NOT NULL,
    "chilledAt" TIMESTAMP(3) NOT NULL,
    "storageLocation" "LeftoverStorageLocation" NOT NULL,
    "hotWeatherConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "policyVersion" TEXT NOT NULL,
    "sourceMealRunRef" TEXT,
    "note" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LeftoverLot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeftoverMovement" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "leftoverLotId" TEXT NOT NULL,
    "kind" "LeftoverMovementKind" NOT NULL,
    "servings" DOUBLE PRECISION NOT NULL,
    "beforeServings" DOUBLE PRECISION NOT NULL,
    "afterServings" DOUBLE PRECISION NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeftoverMovement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeftoverLot_householdId_idempotencyKey_key"
ON "LeftoverLot"("householdId", "idempotencyKey");
CREATE INDEX "LeftoverLot_householdId_chilledAt_idx"
ON "LeftoverLot"("householdId", "chilledAt");
CREATE UNIQUE INDEX "LeftoverMovement_householdId_idempotencyKey_key"
ON "LeftoverMovement"("householdId", "idempotencyKey");
CREATE INDEX "LeftoverMovement_householdId_leftoverLotId_occurredAt_idx"
ON "LeftoverMovement"("householdId", "leftoverLotId", "occurredAt");

ALTER TABLE "LeftoverLot"
ADD CONSTRAINT "LeftoverLot_householdId_fkey"
FOREIGN KEY ("householdId") REFERENCES "Household"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeftoverMovement"
ADD CONSTRAINT "LeftoverMovement_householdId_fkey"
FOREIGN KEY ("householdId") REFERENCES "Household"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeftoverMovement"
ADD CONSTRAINT "LeftoverMovement_leftoverLotId_fkey"
FOREIGN KEY ("leftoverLotId") REFERENCES "LeftoverLot"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
