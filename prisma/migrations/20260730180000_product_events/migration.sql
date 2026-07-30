-- KE-025: privacy-minimal, append-only product lifecycle measurement.
-- This table is not a task ledger and does not hold canonical product state.
CREATE TABLE "ProductEvent" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "dedupeKey" TEXT NOT NULL,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductEvent_householdId_dedupeKey_key"
ON "ProductEvent"("householdId", "dedupeKey");

CREATE INDEX "ProductEvent_name_occurredAt_idx"
ON "ProductEvent"("name", "occurredAt");

CREATE INDEX "ProductEvent_householdId_occurredAt_idx"
ON "ProductEvent"("householdId", "occurredAt");

ALTER TABLE "ProductEvent"
ADD CONSTRAINT "ProductEvent_householdId_fkey"
FOREIGN KEY ("householdId") REFERENCES "Household"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

