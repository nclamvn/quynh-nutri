-- TIP-KE-002 — reviewable migration only.
-- Do not apply to production before creating a Neon branch and reviewing `prisma migrate diff`.

CREATE TYPE "StorageLocation" AS ENUM ('pantry', 'fridge', 'freezer');

CREATE TABLE "ShoppingFulfillment" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "weekRef" TEXT NOT NULL,
    "commodityId" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "plannedQty" DOUBLE PRECISION NOT NULL,
    "actualQty" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "boughtAt" TIMESTAMP(3) NOT NULL,
    "pricePaid" INTEGER,
    "purchaseRecordId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ShoppingFulfillment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryLot" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "commodityId" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL,
    "storageLocation" "StorageLocation" NOT NULL,
    "bestBefore" TIMESTAMP(3),
    "sourceWeekRef" TEXT,
    "sourceShoppingKey" TEXT,
    "fulfillmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InventoryLot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShoppingReceiveRequest" (
    "idempotencyKey" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "fulfillmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShoppingReceiveRequest_pkey" PRIMARY KEY ("idempotencyKey")
);

CREATE UNIQUE INDEX "ShoppingFulfillment_purchaseRecordId_key"
    ON "ShoppingFulfillment"("purchaseRecordId");
CREATE UNIQUE INDEX "ShoppingFulfillment_householdId_weekRef_commodityId_vendor_key"
    ON "ShoppingFulfillment"("householdId", "weekRef", "commodityId", "vendor");
CREATE INDEX "ShoppingFulfillment_householdId_weekRef_idx"
    ON "ShoppingFulfillment"("householdId", "weekRef");
CREATE UNIQUE INDEX "InventoryLot_fulfillmentId_key"
    ON "InventoryLot"("fulfillmentId");
CREATE INDEX "InventoryLot_householdId_commodityId_idx"
    ON "InventoryLot"("householdId", "commodityId");
CREATE INDEX "InventoryLot_householdId_sourceWeekRef_idx"
    ON "InventoryLot"("householdId", "sourceWeekRef");
CREATE INDEX "ShoppingReceiveRequest_householdId_fulfillmentId_idx"
    ON "ShoppingReceiveRequest"("householdId", "fulfillmentId");

ALTER TABLE "ShoppingFulfillment"
    ADD CONSTRAINT "ShoppingFulfillment_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "Household"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShoppingFulfillment"
    ADD CONSTRAINT "ShoppingFulfillment_purchaseRecordId_fkey"
    FOREIGN KEY ("purchaseRecordId") REFERENCES "PurchaseRecord"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryLot"
    ADD CONSTRAINT "InventoryLot_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "Household"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryLot"
    ADD CONSTRAINT "InventoryLot_fulfillmentId_fkey"
    FOREIGN KEY ("fulfillmentId") REFERENCES "ShoppingFulfillment"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShoppingReceiveRequest"
    ADD CONSTRAINT "ShoppingReceiveRequest_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "Household"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShoppingReceiveRequest"
    ADD CONSTRAINT "ShoppingReceiveRequest_fulfillmentId_fkey"
    FOREIGN KEY ("fulfillmentId") REFERENCES "ShoppingFulfillment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
