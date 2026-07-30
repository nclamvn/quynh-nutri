"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { MealOccasion } from "@/domain/types";
import {
  MEAL_OCCASIONS,
  MEAL_OCCASION_LABELS,
} from "@/domain/planning/meal-occasion";
import { planDayForDate } from "@/domain/kitchen-execution/inventory";
import { getMealRunSession } from "@/app/actions";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";

type OccasionState = "not_planned" | "planned" | "in_kitchen" | "completed";

const STATE_LABELS: Record<
  OccasionState,
  { vn: string; en: string }
> = {
  not_planned: { vn: "Chưa lên", en: "Not planned" },
  planned: { vn: "Đã lên", en: "Planned" },
  in_kitchen: { vn: "Đang nấu", en: "In kitchen" },
  completed: { vn: "Đã xác nhận", en: "Confirmed" },
};

export function DailyMealRhythmCard() {
  const { plan, mealCompletions } = useStore();
  const { lang } = useI18n();
  const [active, setActive] = useState<Set<MealOccasion>>(new Set());
  const day = planDayForDate(
    plan.weekStart,
    new Date(),
    "Asia/Ho_Chi_Minh",
  ) ?? 0;

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      MEAL_OCCASIONS.map(async (occasion) => ({
        occasion,
        session: await getMealRunSession(plan.weekStart, day, occasion),
      })),
    )
      .then((rows) => {
        if (cancelled) return;
        setActive(new Set(
          rows.flatMap((row) => row.session ? [row.occasion] : []),
        ));
      })
      .catch(() => {
        if (!cancelled) setActive(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [day, plan.weekStart]);

  const states = useMemo(
    () => MEAL_OCCASIONS.map((occasion) => {
      const planned = plan.slots.some(
        (slot) => slot.day === day && slot.occasion === occasion,
      );
      const completed = mealCompletions.some(
        (item) =>
          item.weekRef === plan.weekStart
          && item.day === day
          && item.occasion === occasion,
      );
      const state: OccasionState = completed
        ? "completed"
        : active.has(occasion)
          ? "in_kitchen"
          : planned
            ? "planned"
            : "not_planned";
      return { occasion, state };
    }),
    [active, day, mealCompletions, plan.slots, plan.weekStart],
  );

  const locale = lang === "en" ? "en" : "vn";

  return (
    <section className="card mb-5 p-4" aria-labelledby="daily-rhythm-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
            {lang === "en" ? "Daily rhythm" : "Nhịp ăn hôm nay"}
          </p>
          <h2 id="daily-rhythm-title" className="mt-1 text-base font-semibold">
            {lang === "en"
              ? "Only confirmed household facts"
              : "Chỉ ghi nhận điều nhà mình đã làm"}
          </h2>
        </div>
        <Link
          href="/week"
          className="shrink-0 rounded-full border border-hairline px-3 py-2 text-xs font-semibold text-brand"
        >
          {lang === "en" ? "Open plan →" : "Mở thực đơn →"}
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {states.map(({ occasion, state }) => (
          <div
            key={occasion}
            className="min-w-0 rounded-[16px] border border-hairline bg-surface/55 px-3 py-3"
          >
            <p className="truncate text-sm font-semibold">
              {MEAL_OCCASION_LABELS[occasion][locale]}
            </p>
            <p
              className={`mt-1 whitespace-nowrap text-xs ${
                state === "completed"
                  ? "text-accent"
                  : state === "in_kitchen"
                    ? "text-brand"
                    : "text-muted"
              }`}
            >
              {STATE_LABELS[state][locale]}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        {lang === "en"
          ? "An empty occasion stays unplanned; the app does not call it skipped."
          : "Bữa còn trống vẫn là chưa lên; ứng dụng không tự gọi đó là bỏ bữa."}
      </p>
    </section>
  );
}
