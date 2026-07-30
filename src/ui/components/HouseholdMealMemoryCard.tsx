"use client";

import { useMemo, useState } from "react";
import type { MealCompletion, MealFeedback } from "@/domain/types";
import {
  buildHouseholdMealMemory,
  type DishMealMemory,
} from "@/domain/feedback/meal-memory";
import { useI18n } from "@/i18n/context";
import { Blossom } from "@/ui/components/Blossom";
import { MealReflectionSheet } from "@/ui/components/MealReflectionSheet";
import { useStore } from "@/ui/store";

type ReflectionTarget = {
  completion: MealCompletion;
  dishRef: string;
};

export function HouseholdMealMemoryCard() {
  const { lang } = useI18n();
  const {
    dish,
    mealCompletions,
    mealFeedback,
    deleteMealFeedback,
  } = useStore();
  const [reflection, setReflection] = useState<ReflectionTarget>();
  const [deleteCandidate, setDeleteCandidate] = useState<MealFeedback>();
  const [deleting, setDeleting] = useState(false);
  const vn = lang !== "en";
  const memory = useMemo(
    () => buildHouseholdMealMemory({
      completions: mealCompletions,
      feedback: mealFeedback,
    }),
    [mealCompletions, mealFeedback],
  );
  const unanswered = useMemo(
    () => [...mealCompletions]
      .sort((left, right) => right.completedAt.localeCompare(left.completedAt))
      .flatMap((completion) =>
        completion.dishRefs.flatMap((dishRef) =>
          mealFeedback.some(
            (item) =>
              item.mealCompletionId === completion.id
              && item.dishRef === dishRef,
          )
            ? []
            : [{ completion, dishRef }],
        ),
      )
      .filter((item) => Boolean(dish(item.dishRef)))
      .slice(0, 4),
    [dish, mealCompletions, mealFeedback],
  );

  if (mealCompletions.length === 0) return null;

  const openExisting = (item: DishMealMemory) => {
    const feedback = [...mealFeedback]
      .filter((row) => row.dishRef === item.dishId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
    const completion = mealCompletions.find(
      (row) => row.id === feedback?.mealCompletionId,
    );
    if (completion) setReflection({ completion, dishRef: item.dishId });
  };

  const requestDelete = (item: DishMealMemory) => {
    const feedback = [...mealFeedback]
      .filter((row) => row.dishRef === item.dishId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
    if (feedback) setDeleteCandidate(feedback);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate || deleting) return;
    setDeleting(true);
    try {
      const result = await deleteMealFeedback({
        feedbackId: deleteCandidate.id,
        expectedVersion: deleteCandidate.version,
      });
      if (result.ok) setDeleteCandidate(undefined);
      else setDeleteCandidate(result.canonical);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <section className="grain card relative mt-4 overflow-hidden" data-meal-memory>
        <Blossom
          size={120}
          className="pointer-events-none absolute -right-6 -top-8 text-brand/[0.06]"
        />
        <div className="relative border-b border-hairline px-5 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
            {vn ? "Trí nhớ bữa cơm" : "Meal memory"}
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            {vn ? "Nhà mình đã nói gì sau bữa ăn" : "What your household said after meals"}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {vn
              ? "Chỉ tổng hợp lựa chọn được gia đình xác nhận, không suy đoán từ lượt xem hay món thừa."
              : "Built only from household-confirmed choices, never inferred from views or leftovers."}
          </p>
        </div>

        {unanswered.length > 0 && (
          <div className="relative border-b border-hairline px-5 py-4">
            <p className="text-[11px] font-medium text-muted">
              {vn ? "Bữa gần đây chưa ghi cảm nhận" : "Recent dishes awaiting reflection"}
            </p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {unanswered.map((item) => {
                const resolved = dish(item.dishRef)!;
                const name = lang === "en" && resolved.enLabel
                  ? resolved.enLabel
                  : resolved.vnName;
                return (
                  <button
                    key={`${item.completion.id}:${item.dishRef}`}
                    type="button"
                    onClick={() => setReflection(item)}
                    className="min-h-9 shrink-0 rounded-full border border-brand/25 bg-brand-weak/40 px-3 text-xs font-medium text-brand-ink"
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {memory.dishes.length === 0 ? (
          <div className="relative px-5 py-6 text-sm text-muted">
            {vn
              ? "Chưa có phản hồi nào. Phiếu nếm sẽ xuất hiện sau khi gia đình hoàn tất một bữa."
              : "No reflections yet. The meal card appears after a household meal is completed."}
          </div>
        ) : (
          <ul className="relative divide-y divide-hairline">
            {memory.dishes.map((item) => {
              const resolved = dish(item.dishId);
              const name = lang === "en" && resolved?.enLabel
                ? resolved.enLabel
                : resolved?.vnName ?? item.dishId;
              return (
                <li
                  key={item.dishId}
                  className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(10rem,1fr)_minmax(0,2fr)_auto] lg:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{name}</p>
                    <p className="mt-0.5 text-[10px] text-tertiary">
                      {evidenceLabel(item.evidenceState, item.feedbackCount, vn)}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <CountPill
                      title={vn ? "Ăn lại" : "Repeat"}
                      value={`${item.repeatCount}/${item.feedbackCount}`}
                    />
                    <CountPill
                      title={vn ? "Vừa lượng" : "Right portion"}
                      value={`${item.rightPortionCount}/${item.feedbackCount}`}
                    />
                    <CountPill
                      title={vn ? "Vừa sức" : "Manageable"}
                      value={`${item.easyCount + item.manageableCount}/${item.feedbackCount}`}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openExisting(item)}
                      className="min-h-9 rounded-full px-3 text-xs font-medium text-brand"
                    >
                      {vn ? "Sửa" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => requestDelete(item)}
                      className="min-h-9 rounded-full px-3 text-xs text-tertiary hover:text-danger"
                    >
                      {vn ? "Xoá" : "Delete"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {reflection && (
        <MealReflectionSheet
          completion={reflection.completion}
          dishes={reflection.completion.dishRefs.flatMap((dishRef) => {
            const resolved = dish(dishRef);
            return resolved ? [resolved] : [];
          })}
          initialDishRef={reflection.dishRef}
          onClose={() => setReflection(undefined)}
        />
      )}

      {deleteCandidate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-5 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            className="glass-modal w-full max-w-sm rounded-[22px] p-5"
          >
            <h3 className="text-base font-semibold">
              {vn ? "Xoá phản hồi này?" : "Delete this reflection?"}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {vn
                ? "Trí nhớ của món sẽ được tính lại từ những phản hồi còn lại."
                : "This dish memory will be recalculated from the remaining feedback."}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(undefined)}
                className="min-h-11 rounded-full border border-hairline text-sm"
              >
                {vn ? "Giữ lại" : "Keep"}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="min-h-11 rounded-full bg-danger px-4 text-sm font-semibold text-white disabled:opacity-45"
              >
                {deleting
                  ? vn ? "Đang xoá…" : "Deleting…"
                  : vn ? "Xác nhận xoá" : "Confirm delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CountPill({ title, value }: { title: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[12px] bg-surface/55 px-2.5 py-2">
      <span className="block truncate text-tertiary">{title}</span>
      <span className="mt-0.5 block font-semibold tnum">{value}</span>
    </div>
  );
}

function evidenceLabel(
  state: DishMealMemory["evidenceState"],
  count: number,
  vn: boolean,
) {
  const label = {
    single: vn ? "một lần ghi nhận" : "single record",
    emerging: vn ? "xu hướng đang hình thành" : "emerging pattern",
    established: vn ? "xu hướng đã rõ" : "established pattern",
    mixed: vn ? "ý kiến còn khác nhau" : "mixed feedback",
  }[state];
  return vn ? `${count} phản hồi · ${label}` : `${count} feedback · ${label}`;
}
