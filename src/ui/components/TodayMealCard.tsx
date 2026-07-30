"use client";

import { useMemo, useState } from "react";
import { COOKING_GUIDES } from "@/data/seed/cooking-guides";
import { buildTodayMealReadiness } from "@/domain/kitchen-execution/meal-readiness";
import { MealCoordinatorSheet } from "@/ui/components/MealCoordinatorSheet";
import { useStore } from "@/ui/store";

const REVIEWED_DISH_IDS = new Set(COOKING_GUIDES.map((guide) => guide.dishId));
const TIME_ZONE = "Asia/Ho_Chi_Minh";

export function TodayMealCard() {
  const {
    hydrated,
    plan,
    planSyncState,
    pantry,
    mealCompletions,
    dish,
    commodity,
  } = useStore();
  const [coordinatorOpen, setCoordinatorOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const readiness = useMemo(
    () => buildTodayMealReadiness({
      now: new Date(),
      timeZone: TIME_ZONE,
      plan,
      pantry,
      completions: mealCompletions,
      dish,
      reviewedCookingDishIds: REVIEWED_DISH_IDS,
    }),
    [dish, mealCompletions, pantry, plan],
  );
  const pending = readiness.plannedDishes.filter((item) => !item.completed);
  const recorded = readiness.ingredientPresence.filter((item) => item.status === "recorded").length;
  const notRecorded = readiness.ingredientPresence.length - recorded;
  const loading = !hydrated || planSyncState === "loading";
  const stale = planSyncState === "saving" || planSyncState === "unsynced";
  const conflict = planSyncState === "conflict";

  if (!loading && readiness.plannedDishes.length === 0) return null;

  return (
    <>
      <section className="card mb-5 overflow-hidden" data-testid="today-meal-card">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
              Bữa nhà mình hôm nay
            </p>
            {loading ? (
              <p className="mt-2 text-sm text-muted">Đang đọc thực đơn và kho đã ghi nhận…</p>
            ) : (
              <p className="mt-2 whitespace-nowrap text-base font-semibold sm:text-lg">
                {readiness.plannedDishes.length} món trong thực đơn ·{" "}
                {readiness.supportedDishes.length} có hướng dẫn
              </p>
            )}
          </div>
          {!loading && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setDetailsOpen((open) => !open)}
                className="h-10 rounded-full border border-hairline px-4 text-sm font-semibold text-muted"
              >
                {detailsOpen ? "Thu gọn" : "Kiểm tra"}
              </button>
              <button
                type="button"
                disabled={
                  conflict
                  || stale
                  || readiness.day === undefined
                  || readiness.pendingDishIds.length === 0
                }
                onClick={() => setCoordinatorOpen(true)}
                className="h-10 rounded-full bg-brand px-4 text-sm font-semibold text-white disabled:opacity-40"
              >
                {readiness.pendingDishIds.length === 0 ? "Đã ghi nhận" : "Vào bếp"}
              </button>
            </div>
          )}
        </div>

        {!loading && (
          <div className="grid border-t border-hairline sm:grid-cols-3">
            <div className="border-b border-hairline px-4 py-3 sm:border-b-0 sm:border-r">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Món còn làm</p>
              <p className="tnum mt-1 text-lg font-semibold">{pending.length}</p>
            </div>
            <div className="border-b border-hairline px-4 py-3 sm:border-b-0 sm:border-r">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Có ghi trong kho</p>
              <p className="tnum mt-1 text-lg font-semibold text-accent">{recorded}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Chưa thấy trong kho</p>
              <p className="tnum mt-1 text-lg font-semibold text-amber-700">{notRecorded}</p>
            </div>
          </div>
        )}

        {detailsOpen && !loading && (
          <div className="border-t border-hairline p-4">
            <p className="text-xs leading-relaxed text-muted">
              “Có ghi” chỉ xác nhận ứng dụng thấy một lô dương trong kho, không khẳng định đủ dùng.
            </p>
            <ul className="mt-3 grid gap-1.5">
              {readiness.plannedDishes.map((item) => (
                <li key={item.dishId} className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate font-medium">{item.dish.vnName}</span>
                  <span className="shrink-0 text-muted">
                    {item.completed ? "đã ghi nhận" : item.reviewed ? "có hướng dẫn" : "chưa hỗ trợ"}
                  </span>
                </li>
              ))}
            </ul>
            <ul className="mt-3 flex flex-wrap gap-2">
              {readiness.ingredientPresence.map((item) => (
                <li
                  key={item.commodityId}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    item.status === "recorded"
                      ? "bg-accent-weak text-accent"
                      : "border border-hairline text-muted"
                  }`}
                >
                  {commodity(item.commodityId)?.canonicalVn ?? item.commodityId}
                  {" · "}
                  {item.status === "recorded" ? "có ghi" : "chưa thấy"}
                </li>
              ))}
            </ul>
            {readiness.unsupportedDishes.length > 0 && (
              <p className="mt-3 text-xs text-amber-700">
                Chưa có hướng dẫn đã rà soát:{" "}
                {readiness.unsupportedDishes.map((item) => item.dish.vnName).join(", ")}.
              </p>
            )}
            {(stale || conflict) && (
              <p className="mt-3 text-xs text-danger">
                {conflict
                  ? "Thực đơn đang có xung đột. Hãy chọn bản đúng trước khi vào bếp."
                  : "Thực đơn chưa đồng bộ xong. Hãy đợi lưu hoàn tất trước khi vào bếp."}
              </p>
            )}
          </div>
        )}
      </section>

      {coordinatorOpen && readiness.day !== undefined && (
        <MealCoordinatorSheet
          day={readiness.day}
          occasion="dinner"
          dishes={pending.map((item) => item.dish)}
          onClose={() => setCoordinatorOpen(false)}
        />
      )}
    </>
  );
}
