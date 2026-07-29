import "server-only";

import {
  PREP_AHEAD_GUIDES,
  prepAheadGuideFor,
} from "@/data/seed/prep-ahead-guides";
import { REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import { planDayForDate } from "@/domain/kitchen-execution/inventory";
import { prepAheadForPlanDay } from "@/domain/kitchen-execution/prep-ahead";
import { loadOrCreateCurrentWeekPlan } from "@/data/repo/week-plan";

const timeZone = "Asia/Ho_Chi_Minh";

export async function getPrepAheadGuideSnapshot(dishId?: string) {
  if (dishId) {
    const dish = REPERTOIRE_BY_ID[dishId];
    const resolved = dish ? prepAheadGuideFor(dishId) : undefined;
    if (!dish || !resolved) return { supported: false, dishId };
    return {
      supported: true,
      dish: { id: dish.id, name: dish.vnName },
      guide: resolved.guide,
      sources: resolved.sources,
      readOnly: true,
    };
  }

  const now = new Date();
  const { plan, householdDishes } = await loadOrCreateCurrentWeekPlan();
  const today = planDayForDate(plan.weekStart, now, timeZone);
  if (today === undefined || today >= 6) {
    return { supported: false, reason: "no-next-day-in-current-week" };
  }
  const result = prepAheadForPlanDay(
    plan,
    today + 1,
    (id) => householdDishes.find((dish) => dish.id === id) ?? REPERTOIRE_BY_ID[id],
    PREP_AHEAD_GUIDES,
  );
  return {
    supported: result.supported.length > 0,
    day: result.day,
    guides: result.supported.map(({ dish, slot, guide }) => ({
      dish: { id: dish.id, name: dish.vnName },
      slot,
      guide,
    })),
    unsupported: result.unsupported.map(({ dish }) => ({
      id: dish.id,
      name: dish.vnName,
    })),
    readOnly: true,
  };
}
