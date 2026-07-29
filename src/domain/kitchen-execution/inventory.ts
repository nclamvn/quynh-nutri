import type { Dish, InventoryLot, PantryItem, WeekPlan } from "@/domain/types";

export type ExpirySignal = "unknown" | "overdue" | "today" | "soon" | "later";

const dayKey = (value: Date | string, timeZone: string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value);
  return Date.UTC(part("year"), part("month") - 1, part("day"));
};

export function expirySignal(
  lot: Pick<PantryItem, "bestBefore">,
  now: Date = new Date(),
  timeZone = "UTC",
): ExpirySignal {
  if (!lot.bestBefore) return "unknown";
  const days = Math.round(
    (dayKey(lot.bestBefore, timeZone) - dayKey(now, timeZone)) / 86_400_000,
  );
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 2) return "soon";
  return "later";
}

export function sortLotsFefo<T extends PantryItem>(lots: readonly T[]): T[] {
  return lots
    .filter((lot) => lot.qty > 0)
    .slice()
    .sort((a, b) => {
      if (a.bestBefore && b.bestBefore) {
        const byExpiry = new Date(a.bestBefore).getTime() - new Date(b.bestBefore).getTime();
        if (byExpiry) return byExpiry;
      } else if (a.bestBefore) {
        return -1;
      } else if (b.bestBefore) {
        return 1;
      }
      const byPurchase =
        new Date(a.purchasedAt ?? 0).getTime() - new Date(b.purchasedAt ?? 0).getTime();
      return byPurchase || (a.id ?? "").localeCompare(b.id ?? "");
    });
}

export function frozenLotsNeededForDay(
  lots: readonly PantryItem[],
  plan: WeekPlan,
  day: number,
  dish: (id: string) => Dish | undefined,
): PantryItem[] {
  const needed = new Set<string>();
  for (const slot of plan.slots) {
    if (slot.day !== day) continue;
    for (const line of dish(slot.dishId)?.lines ?? []) needed.add(line.commodityId);
  }
  return sortLotsFefo(
    lots.filter(
      (lot): lot is InventoryLot =>
        lot.qty > 0 &&
        lot.storageLocation === "freezer" &&
        needed.has(lot.commodityId),
    ),
  );
}

export function planDayForDate(
  weekStart: string,
  date: Date,
  timeZone = "UTC",
): number | undefined {
  const start = dayKey(`${weekStart}T12:00:00.000Z`, "UTC");
  const target = dayKey(date, timeZone);
  const day = Math.round((target - start) / 86_400_000);
  return day >= 0 && day <= 6 ? day : undefined;
}
