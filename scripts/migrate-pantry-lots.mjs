import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const apply = process.argv.includes("--apply");
const storageArg = process.argv.find((arg) => arg.startsWith("--default-storage="));
const defaultStorage = storageArg?.split("=")[1];
const validStorage = new Set(["pantry", "fridge", "freezer"]);

if (defaultStorage && !validStorage.has(defaultStorage)) {
  throw new Error("--default-storage must be pantry, fridge, or freezer");
}

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL;
if (!connectionString) throw new Error("Missing direct database connection string");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  const households = await db.household.findMany({ select: { id: true, pantry: true } });
  let eligible = 0;
  let blocked = 0;
  let migrated = 0;

  for (const household of households) {
    const pantry = Array.isArray(household.pantry) ? household.pantry : [];
    if (pantry.length === 0) continue;
    const normalized = pantry.map((item, index) => ({
      ...item,
      storageLocation: item.storageLocation ?? defaultStorage,
      sourceShoppingKey: `legacy:${household.id}:${item.commodityId}:${index}`,
    }));
    const invalid = normalized.filter(
      (item) =>
        !item.commodityId ||
        !(Number(item.qty) > 0) ||
        !item.unit ||
        !item.purchasedAt ||
        !validStorage.has(item.storageLocation),
    );
    if (invalid.length > 0) {
      blocked += invalid.length;
      continue; // never clear a partially migrated household
    }
    eligible += normalized.length;
    if (!apply) continue;

    await db.$transaction(async (tx) => {
      for (const item of normalized) {
        const exists = await tx.inventoryLot.findFirst({
          where: {
            householdId: household.id,
            sourceShoppingKey: item.sourceShoppingKey,
          },
          select: { id: true },
        });
        if (exists) continue;
        await tx.inventoryLot.create({
          data: {
            householdId: household.id,
            commodityId: item.commodityId,
            qty: Number(item.qty),
            unit: item.unit,
            purchasedAt: new Date(item.purchasedAt),
            storageLocation: item.storageLocation,
            bestBefore: item.bestBefore || item.expiry
              ? new Date(item.bestBefore ?? item.expiry)
              : null,
            sourceShoppingKey: item.sourceShoppingKey,
          },
        });
        migrated += 1;
      }
      await tx.household.update({ where: { id: household.id }, data: { pantry: [] } });
    });
  }

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    eligible,
    blockedMissingRequiredData: blocked,
    migrated,
    clearedLegacyJson: apply && blocked === 0,
    note: blocked
      ? "Complete purchasedAt and storageLocation in legacy data; an explicit --default-storage may supply only storage after household review."
      : "No legacy item was assigned a storage location implicitly.",
  }, null, 2));
} finally {
  await db.$disconnect();
}
