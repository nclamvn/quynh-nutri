"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dish } from "@/domain/types";
import { cookingGuideFor } from "@/data/seed/cooking-guides";
import {
  buildMealTimeline,
  mealTaskStatus,
  type MealRunSession,
} from "@/domain/kitchen-execution/meal-coordination";
import { CookingMode } from "@/ui/components/CookingMode";
import { useI18n } from "@/i18n/context";

export function MealRunMode({
  session,
  dishes,
  onChange,
  onBack,
  onFinish,
  onCancel,
}: {
  session: MealRunSession;
  dishes: Dish[];
  onChange: (session: MealRunSession) => void;
  onBack: () => void;
  onFinish: () => void;
  onCancel: () => void;
}) {
  const { t, lang } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [guideDishId, setGuideDishId] = useState<string | null>(null);
  const dishById = useMemo(() => new Map(dishes.map((dish) => [dish.id, dish])), [dishes]);
  const timeline = useMemo(
    () =>
      buildMealTimeline(
        session.tasks.map((task) => task.dishId),
        Object.fromEntries(session.tasks.map((task) => [task.dishId, task.estimatedMin])),
        session.targetServeAt,
      ),
    [session],
  );
  const stateByDish = new Map(session.tasks.map((task) => [task.dishId, task]));
  const doneCount = session.tasks.filter((task) => task.completedAt).length;
  const allDone = doneCount === session.tasks.length;
  const [statusAt] = useState(() => new Date());

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    titleRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (guideDishId) return;
      if (event.key === "Escape") {
        onBack();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === titleRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [guideDishId, onBack]);

  const updateTask = (
    dishId: string,
    patch: { startedAt?: string; completedAt?: string },
  ) => {
    onChange({
      ...session,
      tasks: session.tasks.map((task) =>
        task.dishId === dishId ? { ...task, ...patch } : task,
      ),
    });
  };

  const formatTime = (iso: string) =>
    new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  const dishName = (dish: Dish) =>
    lang === "en" && dish.enLabel ? dish.enLabel : dish.vnName;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="meal-run-title"
      className="fixed inset-0 z-[65] overflow-y-auto bg-bg"
    >
      <header className="sticky top-0 z-10 border-b border-hairline bg-bg/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label={t("coord.back")}
            className="grid h-10 w-10 place-items-center rounded-full border border-hairline bg-surface"
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <h1 id="meal-run-title" ref={titleRef} tabIndex={-1} className="text-base font-semibold outline-none">
              {t("coord.runTitle")}
            </h1>
            <p className="text-xs text-muted">
              {t("coord.serve")} {formatTime(session.targetServeAt)} ·{" "}
              {t("coord.progress", { done: doneCount, total: session.tasks.length })}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5">
        <p className="mb-4 rounded-[16px] border border-amber-200 bg-amber-50/75 p-3 text-xs leading-relaxed text-amber-950">
          {t("coord.estimateDisclaimer")}
        </p>

        <ol className="relative space-y-3 before:absolute before:bottom-5 before:left-[19px] before:top-5 before:w-px before:bg-hairline">
          {timeline.tasks.map((timelineTask, index) => {
            const task = stateByDish.get(timelineTask.dishId)!;
            const dish = dishById.get(task.dishId)!;
            const status = task.completedAt
              ? "done"
              : task.startedAt
                ? "cooking"
                : mealTaskStatus({ ...timelineTask, completedAt: task.completedAt }, statusAt);
            return (
              <li key={task.dishId} className="relative pl-11">
                <span className={`absolute left-1.5 top-5 z-[1] grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                  status === "done" ? "bg-accent text-white" : "bg-brand-weak text-brand"
                }`}>
                  {status === "done" ? "✓" : index + 1}
                </span>
                <article className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-brand">
                        {formatTime(timelineTask.startAt)} · {task.estimatedMin} {t("coord.minutes")}
                      </p>
                      <h2 className="mt-1 text-sm font-semibold">{dishName(dish)}</h2>
                    </div>
                    <span className="rounded-full bg-surface px-2 py-1 text-[10px] text-muted">
                      {t(`coord.status.${status}`)}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {!task.startedAt ? (
                      <button
                        type="button"
                        onClick={() => updateTask(task.dishId, { startedAt: new Date().toISOString() })}
                        className="rounded-full bg-brand px-3 py-2 text-xs font-semibold text-white"
                      >
                        {t("coord.markStarted")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={Boolean(task.completedAt)}
                        onClick={() => updateTask(task.dishId, { completedAt: new Date().toISOString() })}
                        className="rounded-full bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        {task.completedAt ? t("coord.done") : t("coord.markDone")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setGuideDishId(task.dishId)}
                      className="rounded-full border border-hairline bg-surface px-3 py-2 text-xs font-medium"
                    >
                      {t("coord.openGuide")}
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          disabled={!allDone}
          onClick={onFinish}
          className="mt-5 w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {t("coord.finish")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="mt-2 w-full rounded-full px-4 py-2 text-xs text-muted underline underline-offset-2"
        >
          {t("coord.cancel")}
        </button>
      </main>

      {guideDishId && dishById.get(guideDishId) && cookingGuideFor(guideDishId) && (
        <CookingMode
          dish={dishById.get(guideDishId)!}
          resolved={cookingGuideFor(guideDishId)!}
          onClose={() => setGuideDishId(null)}
        />
      )}
    </div>
  );
}
