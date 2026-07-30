import "server-only";

import { Prisma } from "@prisma/client";
import { currentHouseholdId } from "@/data/repo/household";
import {
  parseProductEvent,
  type ProductEventInput,
} from "@/domain/product-events";
import { isE2EMode, requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";

const e2eDedupeKeys = new Set<string>();

export async function recordProductEvent(
  raw: ProductEventInput,
): Promise<{ recorded: boolean }> {
  await requireUserId();
  const input = parseProductEvent(raw);
  const householdId = await currentHouseholdId();
  const compositeKey = `${householdId}:${input.dedupeKey}`;

  if (isE2EMode()) {
    if (e2eDedupeKeys.has(compositeKey)) return { recorded: false };
    e2eDedupeKeys.add(compositeKey);
    return { recorded: true };
  }

  try {
    await getDb().productEvent.create({
      data: {
        householdId,
        name: input.name,
        dedupeKey: input.dedupeKey,
        properties: input.properties as Prisma.InputJsonValue,
      },
    });
    return { recorded: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
      && error.code === "P2002"
    ) {
      return { recorded: false };
    }
    throw error;
  }
}

/**
 * Product measurement must never turn a successful canonical mutation into a
 * visible product failure. Onboarding completion is intentionally excluded
 * because it records the event inside its own atomic transaction.
 */
export async function recordProductEventSafely(
  raw: ProductEventInput,
): Promise<void> {
  try {
    await recordProductEvent(raw);
  } catch (error) {
    console.error("PRODUCT_EVENT_RECORD_FAILED", {
      name: raw.name,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

export function resetE2EProductEventsForTests(): void {
  e2eDedupeKeys.clear();
}
