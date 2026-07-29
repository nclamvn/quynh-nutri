-- TIP-KE-003: auditable inventory consumption/discard movements.
-- Review-only artifact. Do not apply to production without an approved backup
-- and a successful staging/branch migration.

CREATE TYPE "InventoryMovementKind" AS ENUM ('consumed', 'discarded');

CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "inventoryLotId" TEXT NOT NULL,
    "kind" "InventoryMovementKind" NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "qtyBefore" DOUBLE PRECISION NOT NULL,
    "qtyAfter" DOUBLE PRECISION NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InventoryMovement_idempotencyKey_key"
ON "InventoryMovement"("idempotencyKey");

CREATE INDEX "InventoryMovement_householdId_occurredAt_idx"
ON "InventoryMovement"("householdId", "occurredAt");

CREATE INDEX "InventoryMovement_inventoryLotId_occurredAt_idx"
ON "InventoryMovement"("inventoryLotId", "occurredAt");

ALTER TABLE "InventoryMovement"
ADD CONSTRAINT "InventoryMovement_householdId_fkey"
FOREIGN KEY ("householdId") REFERENCES "Household"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryMovement"
ADD CONSTRAINT "InventoryMovement_inventoryLotId_fkey"
FOREIGN KEY ("inventoryLotId") REFERENCES "InventoryLot"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
