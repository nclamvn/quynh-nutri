"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dish } from "@/domain/types";
import type {
  CookingSession,
  ResolvedCookingGuide,
} from "@/domain/kitchen-execution/cooking";
import {
  nextIncompleteStep,
  parseCookingSession,
  scaleDishLines,
} from "@/domain/kitchen-execution/cooking";
import { localize } from "@/domain/kitchen-execution";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import { fmt } from "@/ui/format";
import {
  clearCookingSession,
  getCookingSession,
  persistCookingSession,
} from "@/app/actions";
import { toast } from "@/ui/toast";

export function CookingMode({
  dish,
  resolved,
  onClose,
}: {
  dish: Dish;
  resolved: ResolvedCookingGuide;
  onClose: () => void;
}) {
  const { household, commodity } = useStore();
  const { t, lang } = useI18n();
  const guide = resolved.guide;
  const storageKey = `qk-cooking:${household.id}:${dish.id}`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const versionRef = useRef<number | null>(null);
  const sessionRef = useRef<CookingSession | null>(null);
  const mutationRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const conflictEpochRef = useRef(0);
  const stepTouchedRef = useRef(false);
  const [session, setSession] = useState<CookingSession>(() => {
    const restored =
      typeof window === "undefined"
        ? undefined
        : parseCookingSession(sessionStorage.getItem(storageKey), guide);
    return restored ?? {
      dishId: dish.id,
      guideId: guide.id,
      completedStepIds: [],
      startedAt: new Date().toISOString(),
    };
  });
  const initialStep = nextIncompleteStep(guide, session.completedStepIds);
  const [stepIndex, setStepIndex] = useState(() =>
    Math.max(0, initialStep ? guide.steps.findIndex((step) => step.id === initialStep.id) : guide.steps.length - 1),
  );
  const adoptSession = useCallback((next: CookingSession, resetStep = true) => {
    sessionRef.current = next;
    setSession(next);
    if (!resetStep) return;
    const incomplete = nextIncompleteStep(guide, next.completedStepIds);
    setStepIndex(Math.max(
      0,
      incomplete
        ? guide.steps.findIndex((step) => step.id === incomplete.id)
        : guide.steps.length - 1,
    ));
  }, [guide]);
  const completed = new Set(session.completedStepIds);
  const current = guide.steps[stepIndex];
  const allDone = session.completedStepIds.length === guide.steps.length;
  const scaledLines = useMemo(
    () => scaleDishLines(dish, household.size),
    [dish, household.size],
  );

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    mutationRef.current = (async () => {
      try {
        const canonical = await getCookingSession(dish.id);
        if (canonical) {
          versionRef.current = canonical.version;
          adoptSession(canonical.payload, !stepTouchedRef.current);
          sessionStorage.removeItem(storageKey);
          return true;
        }
        const initial = sessionRef.current!;
        const result = await persistCookingSession(initial, null);
        if (!result.ok) {
          conflictEpochRef.current += 1;
          versionRef.current = result.canonical.version;
          adoptSession(result.canonical.payload);
          toast("Phiên nấu đã được cập nhật trên thiết bị khác.", "info");
          return false;
        }
        versionRef.current = result.session.version;
        sessionStorage.removeItem(storageKey);
        return true;
      } catch {
        sessionStorage.setItem(storageKey, JSON.stringify(sessionRef.current));
        toast("Tiến độ nấu đang giữ trên máy; chưa đồng bộ sang thiết bị khác.", "error");
        return false;
      }
    })();
  }, [adoptSession, dish.id, storageKey]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    titleRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
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
  }, [onClose]);

  const queueSave = (next: CookingSession) => {
    sessionStorage.setItem(storageKey, JSON.stringify(next));
    const conflictEpoch = conflictEpochRef.current;
    mutationRef.current = mutationRef.current.then(async () => {
      if (conflictEpoch !== conflictEpochRef.current) return false;
      try {
        const result = await persistCookingSession(next, versionRef.current);
        if (!result.ok) {
          conflictEpochRef.current += 1;
          versionRef.current = result.canonical.version;
          adoptSession(result.canonical.payload);
          sessionStorage.removeItem(storageKey);
          toast("Phiên nấu đã được cập nhật trên thiết bị khác.", "info");
          return false;
        }
        versionRef.current = result.session.version;
        sessionStorage.removeItem(storageKey);
        return true;
      } catch {
        toast("Tiến độ nấu đang giữ trên máy; chưa đồng bộ sang thiết bị khác.", "error");
        return false;
      }
    });
  };

  const toggleCurrent = () => {
    const previous = sessionRef.current!;
    const has = previous.completedStepIds.includes(current.id);
    const next = {
      ...previous,
      completedStepIds: has
        ? previous.completedStepIds.filter((id) => id !== current.id)
        : [...previous.completedStepIds, current.id],
    };
    sessionRef.current = next;
    setSession(next);
    queueSave(next);
  };

  const clearAndClose = async () => {
    const conflictEpoch = conflictEpochRef.current;
    await mutationRef.current;
    if (conflictEpoch !== conflictEpochRef.current) return;
    const version = versionRef.current;
    if (version !== null) {
      try {
        const result = await clearCookingSession(dish.id, version);
        if (!result.ok) {
          conflictEpochRef.current += 1;
          versionRef.current = result.canonical.version;
          adoptSession(result.canonical.payload);
          toast("Thiết bị khác vừa cập nhật; hãy kiểm tra trước khi kết thúc.", "info");
          return;
        }
      } catch {
        toast("Chưa thể kết thúc phiên trên máy chủ. Hãy thử lại.", "error");
        return;
      }
    }
    sessionStorage.removeItem(storageKey);
    onClose();
  };

  const name = lang === "en" && dish.enLabel ? dish.enLabel : dish.vnName;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cooking-mode-title"
      className="fixed inset-0 z-[70] overflow-y-auto bg-bg"
    >
      <header className="sticky top-0 z-10 border-b border-hairline bg-bg/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("cooking.close")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-hairline bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <h1
              id="cooking-mode-title"
              ref={titleRef}
              tabIndex={-1}
              className="truncate text-base font-semibold outline-none"
            >
              {name}
            </h1>
            <p className="text-xs text-muted">
              {t("cooking.progress", {
                done: session.completedStepIds.length,
                total: guide.steps.length,
              })}
            </p>
          </div>
          <div className="h-2 w-20 overflow-hidden rounded-full bg-hairline">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${Math.round((session.completedStepIds.length / guide.steps.length) * 100)}%` }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-3xl gap-4 px-4 py-5 md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-[18px] border border-hairline bg-surface/55 p-4">
            <h2 className="text-sm font-semibold">
              {t("cooking.ingredientsFor", {
                n: household.size > 0 ? household.size : dish.baseServings,
              })}
            </h2>
            <ul className="mt-2 space-y-1.5">
              {scaledLines.map((line) => {
                const item = commodity(line.commodityId);
                return (
                  <li key={line.commodityId} className="flex gap-2 text-xs">
                    <span className="min-w-0 flex-1 truncate">
                      {item
                        ? lang === "en" && item.labelEn
                          ? item.labelEn
                          : item.canonicalVn
                        : line.commodityId}
                    </span>
                    <span className="tnum text-muted">{fmt(line.qtyBase)} {line.unit}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-[18px] border border-amber-200 bg-amber-50/80 p-4 text-amber-950">
            <h2 className="text-sm font-semibold">{t("cooking.prepare")}</h2>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed">
              {guide.miseEnPlace.map((item, index) => (
                <li key={index}>• {localize(item, lang)}</li>
              ))}
            </ul>
            <p className="mt-2 text-[11px]">{t("cooking.cleanSeparate")}</p>
          </section>
        </aside>

        <section className="min-w-0">
          <ol className="mb-4 flex gap-1.5 overflow-x-auto pb-2">
            {guide.steps.map((recipeStep, index) => (
              <li key={recipeStep.id}>
                <button
                  type="button"
                  onClick={() => {
                    stepTouchedRef.current = true;
                    setStepIndex(index);
                  }}
                  aria-label={t("cooking.goStep", { n: index + 1 })}
                  aria-current={stepIndex === index ? "step" : undefined}
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-xs font-semibold ${
                    completed.has(recipeStep.id)
                      ? "border-accent bg-accent text-white"
                      : stepIndex === index
                        ? "border-brand bg-brand-weak text-brand"
                        : "border-hairline bg-surface text-muted"
                  }`}
                >
                  {completed.has(recipeStep.id) ? "✓" : index + 1}
                </button>
              </li>
            ))}
          </ol>

          <article className="card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-tertiary">
              {t("cooking.step", { n: stepIndex + 1, total: guide.steps.length })}
            </p>
            <h2 className="mt-2 text-xl font-semibold">{localize(current.title, lang)}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              {localize(current.instruction, lang)}
            </p>

            {current.safetyCheck && (
              <div className="mt-4 rounded-[16px] border border-amber-200 bg-amber-50/80 p-3 text-amber-950">
                <p className="text-xs font-semibold">{t("cooking.safetyCheck")}</p>
                <p className="mt-1 text-sm leading-relaxed">
                  {localize(current.safetyCheck, lang)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(current.sourceIds ?? []).map((sourceId) => {
                    const source = resolved.sources.find((item) => item.id === sourceId);
                    return source ? (
                      <a
                        key={source.id}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-medium underline underline-offset-2"
                      >
                        {source.publisher}
                      </a>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={toggleCurrent}
              aria-pressed={completed.has(current.id)}
              className={`mt-5 w-full rounded-full py-3 text-sm font-semibold ${
                completed.has(current.id)
                  ? "bg-accent-weak text-accent"
                  : "bg-brand text-white"
              }`}
            >
              {completed.has(current.id)
                ? `✓ ${t("cooking.completed")}`
                : t("cooking.markComplete")}
            </button>
          </article>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={stepIndex === 0}
              onClick={() => {
                stepTouchedRef.current = true;
                setStepIndex((index) => Math.max(0, index - 1));
              }}
              className="rounded-full border border-hairline bg-surface px-4 py-2.5 text-sm disabled:opacity-35"
            >
              ← {t("cooking.previous")}
            </button>
            <button
              type="button"
              disabled={stepIndex === guide.steps.length - 1}
              onClick={() => {
                stepTouchedRef.current = true;
                setStepIndex((index) => Math.min(guide.steps.length - 1, index + 1));
              }}
              className="rounded-full border border-hairline bg-surface px-4 py-2.5 text-sm disabled:opacity-35"
            >
              {t("cooking.next")} →
            </button>
          </div>

          <button
            type="button"
            disabled={!allDone}
            onClick={clearAndClose}
            className="mt-3 w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-35"
          >
            {t("cooking.finish")}
          </button>
          <button
            type="button"
            onClick={clearAndClose}
            className="mt-2 w-full rounded-full px-4 py-2 text-xs text-muted underline underline-offset-2"
          >
            {t("cooking.cancelSession")}
          </button>
        </section>
      </main>
    </div>
  );
}
