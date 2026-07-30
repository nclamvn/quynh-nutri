ALTER TABLE "Household"
ADD COLUMN "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "reminderTimeZone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
ADD COLUMN "reminderHour" INTEGER NOT NULL DEFAULT 7;

ALTER TABLE "Household"
ADD CONSTRAINT "Household_reminderHour_check"
CHECK ("reminderHour" BETWEEN 0 AND 23);

CREATE TABLE "PushSubscription" (
  "id" TEXT NOT NULL,
  "householdId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReminderDelivery" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "calendarDate" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'sending',
  "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  CONSTRAINT "ReminderDelivery_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ReminderDelivery"
ADD CONSTRAINT "ReminderDelivery_status_check"
CHECK ("status" IN ('sending', 'sent'));

CREATE UNIQUE INDEX "PushSubscription_endpoint_key"
ON "PushSubscription"("endpoint");

CREATE INDEX "PushSubscription_householdId_idx"
ON "PushSubscription"("householdId");

CREATE UNIQUE INDEX "ReminderDelivery_subscriptionId_taskId_key"
ON "ReminderDelivery"("subscriptionId", "taskId");

CREATE INDEX "ReminderDelivery_attemptedAt_idx"
ON "ReminderDelivery"("attemptedAt");

ALTER TABLE "PushSubscription"
ADD CONSTRAINT "PushSubscription_householdId_fkey"
FOREIGN KEY ("householdId") REFERENCES "Household"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReminderDelivery"
ADD CONSTRAINT "ReminderDelivery_subscriptionId_fkey"
FOREIGN KEY ("subscriptionId") REFERENCES "PushSubscription"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
