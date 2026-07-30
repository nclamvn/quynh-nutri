-- Active kitchen continuity across devices. A finished/cancelled session is
-- deleted, so this table cannot become a synthetic task-completion ledger.
CREATE TABLE "KitchenSession" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitchenSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KitchenSession_householdId_kind_scopeKey_key"
ON "KitchenSession"("householdId", "kind", "scopeKey");

CREATE INDEX "KitchenSession_householdId_updatedAt_idx"
ON "KitchenSession"("householdId", "updatedAt");

ALTER TABLE "KitchenSession"
ADD CONSTRAINT "KitchenSession_householdId_fkey"
FOREIGN KEY ("householdId") REFERENCES "Household"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
