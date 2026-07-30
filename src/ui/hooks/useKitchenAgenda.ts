"use client";

import { useEffect, useMemo, useState } from "react";
import { COOKING_GUIDES } from "@/data/seed/cooking-guides";
import { PREP_AHEAD_DISH_IDS } from "@/data/seed/prep-ahead-guides";
import { buildKitchenAgenda } from "@/domain/kitchen-execution/kitchen-agenda";
import { buildDailyHousekeeperBrief } from "@/domain/kitchen-execution/daily-housekeeper-brief";
import { useStore } from "@/ui/store";

export const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";
const REVIEWED_DISH_IDS = new Set(COOKING_GUIDES.map((guide) => guide.dishId));

export type DailyBriefViewStatus = "loading" | "ready" | "stale" | "conflict";

export function useDailyHousekeeperBrief() {
  const {
    hydrated,
    plan,
    planSyncState,
    shopping,
    pantry,
    leftoverLots,
    dish,
  } = useStore();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => setNow(new Date());
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const agenda = useMemo(
    () => buildKitchenAgenda({
      now,
      timeZone: APP_TIME_ZONE,
      plan,
      shopping,
      pantry,
      leftovers: leftoverLots,
      dish,
      reviewedCookingDishIds: REVIEWED_DISH_IDS,
      prepAheadDishIds: PREP_AHEAD_DISH_IDS,
    }),
    [dish, leftoverLots, now, pantry, plan, shopping],
  );
  const status: DailyBriefViewStatus =
    !hydrated || planSyncState === "loading"
      ? "loading"
      : planSyncState === "conflict"
        ? "conflict"
        : planSyncState === "unsynced" || planSyncState === "saving"
          ? "stale"
          : "ready";
  return useMemo(
    () => ({
      agenda,
      brief: buildDailyHousekeeperBrief(agenda),
      status,
    }),
    [agenda, status],
  );
}
