"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dish, MealCompletion, MealOccasion } from "@/domain/types";
import {
  COOKING_GUIDES,
  cookingGuideFor,
} from "@/data/seed/cooking-guides";
import {
  buildMealTimeline,
  parseMealRunSession,
  type MealRunSession,
} from "@/domain/kitchen-execution/meal-coordination";
import { BottomSheet } from "@/ui/components/BottomSheet";
import { MealRunMode } from "@/ui/components/MealRunMode";
import { LeftoverCaptureSheet } from "@/ui/components/LeftoverCaptureSheet";
import { MealCloseoutSheet } from "@/ui/components/MealCloseoutSheet";
import { MealReflectionSheet } from "@/ui/components/MealReflectionSheet";
import { useI18n } from "@/i18n/context";
import { useStore } from "@/ui/store";
import {
  clearMealRunSession,
  getMealRunSession,
  persistMealRunSession,
} from "@/app/actions";
import { toast } from "@/ui/toast";

const toLocalDateTime = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export function MealCoordinatorSheet({
  day,
  occasion,
  dishes,
  onClose,
}: {
  day: number;
  occasion: MealOccasion;
  dishes: Dish[];
  onClose: () => void;
}) {
  const { household, plan } = useStore();
  const { t, lang } = useI18n();
  const supported = useMemo(
    () => dishes.flatMap((dish) => (cookingGuideFor(dish.id) ? [dish] : [])),
    [dishes],
  );
  const unsupported = useMemo(
    () => dishes.filter((dish) => !cookingGuideFor(dish.id)),
    [dishes],
  );
  const supportedIds = useMemo(() => new Set(supported.map((dish) => dish.id)), [supported]);
  const storageKey = `qk-meal-run:${household.id}:${plan.weekStart}:${day}:${occasion}`;
  const versionRef = useRef<number | null>(null);
  const sessionRef = useRef<MealRunSession | undefined>(undefined);
  const mutationRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const conflictEpochRef = useRef(0);
  const [target, setTarget] = useState(() => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 60);
    date.setSeconds(0, 0);
    return toLocalDateTime(date);
  });
  const [openedAt] = useState(() => Date.now());
  const [durations, setDurations] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      supported.map((dish) => [
        dish.id,
        cookingGuideFor(dish.id)?.guide.estimatedTotalMin ?? dish.cookTimeMin ?? 30,
      ]),
    ),
  );
  const [session, setSession] = useState<MealRunSession | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const raw = sessionStorage.getItem(storageKey);
    const parsed = parseMealRunSession(raw, day, supportedIds);
    if (raw && !parsed) sessionStorage.removeItem(storageKey);
    return parsed;
  });
  const [runOpen, setRunOpen] = useState(Boolean(session));
  const [finishedSession, setFinishedSession] = useState<MealRunSession>();
  const [closeoutVersion, setCloseoutVersion] = useState<number>();
  const [mealCompletion, setMealCompletion] = useState<MealCompletion>();
  const [postMealStep, setPostMealStep] = useState<"leftovers" | "reflection">("leftovers");
  const targetMs = target ? new Date(target).getTime() : Number.NaN;
  const validTarget = Number.isFinite(targetMs) && targetMs > openedAt;
  const validDurations = supported.every((dish) => {
    const duration = durations[dish.id];
    return Number.isInteger(duration) && duration >= 5 && duration <= 240;
  });
  const canStart = supported.length >= 1 && supported.length <= 5 && validTarget && validDurations;
  const name = (dish: Dish) =>
    lang === "en" && dish.enLabel ? dish.enLabel : dish.vnName;

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    mutationRef.current = (async () => {
      try {
        const canonical = await getMealRunSession(plan.weekStart, day, occasion);
        if (canonical) {
          versionRef.current = canonical.version;
          sessionRef.current = canonical.payload;
          setSession(canonical.payload);
          setRunOpen(true);
          sessionStorage.removeItem(storageKey);
          return true;
        }
        const legacy = sessionRef.current;
        if (!legacy) return true;
        const result = await persistMealRunSession(
          plan.weekStart,
          day,
          occasion,
          legacy,
          null,
        );
        if (!result.ok) {
          conflictEpochRef.current += 1;
          versionRef.current = result.canonical.version;
          sessionRef.current = result.canonical.payload;
          setSession(result.canonical.payload);
          setRunOpen(true);
          toast("Phiên bữa ăn đã được cập nhật trên thiết bị khác.", "info");
          return false;
        }
        versionRef.current = result.session.version;
        sessionStorage.removeItem(storageKey);
        return true;
      } catch {
        if (sessionRef.current) {
          sessionStorage.setItem(
            storageKey,
            JSON.stringify(sessionRef.current),
          );
        }
        toast("Phiên bữa ăn chưa đồng bộ; bản trên máy vẫn được giữ.", "error");
        return false;
      }
    })();
  }, [day, occasion, plan.weekStart, storageKey]);

  const queueSave = (next: MealRunSession) => {
    sessionStorage.setItem(storageKey, JSON.stringify(next));
    const conflictEpoch = conflictEpochRef.current;
    mutationRef.current = mutationRef.current.then(async () => {
      if (conflictEpoch !== conflictEpochRef.current) return false;
      try {
        const result = await persistMealRunSession(
          plan.weekStart,
          day,
          occasion,
          next,
          versionRef.current,
        );
        if (!result.ok) {
          conflictEpochRef.current += 1;
          versionRef.current = result.canonical.version;
          sessionRef.current = result.canonical.payload;
          setSession(result.canonical.payload);
          sessionStorage.removeItem(storageKey);
          toast("Phiên bữa ăn đã được cập nhật trên thiết bị khác.", "info");
          return false;
        }
        versionRef.current = result.session.version;
        sessionStorage.removeItem(storageKey);
        return true;
      } catch {
        toast("Phiên bữa ăn chưa đồng bộ; bản trên máy vẫn được giữ.", "error");
        return false;
      }
    });
  };

  const start = () => {
    if (!canStart) return;
    const targetIso = new Date(target).toISOString();
    const timeline = buildMealTimeline(
      dishes.map((dish) => dish.id),
      durations,
      targetIso,
    );
    const next: MealRunSession = {
      day,
      targetServeAt: timeline.targetServeAt,
      tasks: timeline.tasks.map((task) => ({
        dishId: task.dishId,
        estimatedMin: task.estimatedMin,
      })),
      createdAt: new Date().toISOString(),
    };
    sessionRef.current = next;
    setSession(next);
    setRunOpen(true);
    queueSave(next);
  };

  const updateSession = (next: MealRunSession) => {
    sessionRef.current = next;
    setSession(next);
    queueSave(next);
  };

  const deleteCanonicalSession = async () => {
    const conflictEpoch = conflictEpochRef.current;
    await mutationRef.current;
    if (conflictEpoch !== conflictEpochRef.current) return false;
    const version = versionRef.current;
    if (version === null) return true;
    try {
      const result = await clearMealRunSession(
        plan.weekStart,
        day,
        occasion,
        version,
      );
      if (!result.ok) {
        conflictEpochRef.current += 1;
        versionRef.current = result.canonical.version;
        sessionRef.current = result.canonical.payload;
        setSession(result.canonical.payload);
        setRunOpen(true);
        toast("Thiết bị khác vừa cập nhật; hãy kiểm tra trước khi kết thúc.", "info");
        return false;
      }
      versionRef.current = null;
      return true;
    } catch {
      toast("Chưa thể kết thúc phiên trên máy chủ. Hãy thử lại.", "error");
      return false;
    }
  };

  const clearSession = async () => {
    if (!(await deleteCanonicalSession())) return;
    sessionStorage.removeItem(storageKey);
    sessionRef.current = undefined;
    setSession(undefined);
    setRunOpen(false);
  };

  const finishSession = async () => {
    const completed = sessionRef.current;
    if (!completed) return;
    if (!(await mutationRef.current)) return;
    if (versionRef.current === null) {
      toast("Phiên bữa ăn chưa đồng bộ. Hãy thử lại.", "error");
      return;
    }
    setFinishedSession(completed);
    setCloseoutVersion(versionRef.current);
    setRunOpen(false);
  };

  const cancelCloseout = () => {
    setFinishedSession(undefined);
    setCloseoutVersion(undefined);
    setRunOpen(true);
  };

  const confirmedCloseout = (completion: MealCompletion) => {
    sessionStorage.removeItem(storageKey);
    versionRef.current = null;
    sessionRef.current = undefined;
    setSession(undefined);
    setMealCompletion(completion);
    setPostMealStep("leftovers");
    setCloseoutVersion(undefined);
  };

  return (
    <>
      <BottomSheet open onClose={onClose} title={t("coord.title")}>
        <div className="space-y-4">
          <p className="text-xs leading-relaxed text-muted">{t("coord.estimateDisclaimer")}</p>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t("coord.serveAt")}</span>
            <input
              type="datetime-local"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              className="w-full rounded-[12px] border border-hairline bg-surface/45 px-3 py-2.5 outline-none"
            />
          </label>
          {!validTarget && (
            <p role="alert" className="text-xs text-danger">{t("coord.futureTarget")}</p>
          )}

          <section>
            <h3 className="text-sm font-semibold">
              {t("coord.supported", { n: supported.length })}
            </h3>
            <ul className="mt-2 space-y-2">
              {supported.map((dish) => (
                <li key={dish.id} className="flex items-center gap-3 rounded-[14px] bg-surface/45 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm">{name(dish)}</span>
                  <label className="flex items-center gap-1 text-xs text-muted">
                    <span className="sr-only">{t("coord.durationFor", { name: name(dish) })}</span>
                    <input
                      aria-label={t("coord.durationFor", { name: name(dish) })}
                      type="number"
                      min={5}
                      max={240}
                      step={5}
                      value={durations[dish.id]}
                      onChange={(event) =>
                        setDurations((current) => ({
                          ...current,
                          [dish.id]: Number(event.target.value),
                        }))
                      }
                      className="tnum w-16 rounded-full border border-hairline bg-bg px-2 py-1 text-right outline-none"
                    />
                    {t("coord.minutes")}
                  </label>
                </li>
              ))}
            </ul>
          </section>

          {unsupported.length > 0 && (
            <section className="rounded-[16px] border border-amber-200 bg-amber-50/75 p-3 text-amber-950">
              <h3 className="text-xs font-semibold">{t("coord.unsupported")}</h3>
              <p className="mt-1 text-xs leading-relaxed">
                {unsupported.map(name).join(", ")}. {t("coord.unsupportedHint")}
              </p>
            </section>
          )}

          {session && (
            <button
              type="button"
              onClick={() => setRunOpen(true)}
              className="w-full rounded-full border border-brand bg-brand-weak px-4 py-3 text-sm font-semibold text-brand"
            >
              {t("coord.resume")}
            </button>
          )}
          <button
            type="button"
            disabled={!canStart}
            onClick={start}
            className="w-full rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {t("coord.start")}
          </button>
        </div>
      </BottomSheet>

      {runOpen && session && (
        <MealRunMode
          session={session}
          dishes={supported}
          onChange={updateSession}
          onBack={() => setRunOpen(false)}
          onFinish={finishSession}
          onCancel={clearSession}
        />
      )}
      {finishedSession && !mealCompletion && closeoutVersion !== undefined && (
        <MealCloseoutSheet
          day={day}
          occasion={occasion}
          session={finishedSession}
          dishes={supported}
          expectedSessionVersion={closeoutVersion}
          onCancel={cancelCloseout}
          onConfirmed={confirmedCloseout}
        />
      )}
      {finishedSession && mealCompletion && postMealStep === "leftovers" && (
        <LeftoverCaptureSheet
          session={finishedSession}
          dishes={supported}
          sourceMealRunRef={`${household.id}:${plan.weekStart}:${day}:${occasion}:${finishedSession.createdAt}`}
          mealCompletionId={mealCompletion.id}
          onClose={() => setPostMealStep("reflection")}
        />
      )}
      {finishedSession && mealCompletion && postMealStep === "reflection" && (
        <MealReflectionSheet
          completion={mealCompletion}
          dishes={supported}
          onClose={() => {
            setFinishedSession(undefined);
            setMealCompletion(undefined);
            onClose();
          }}
        />
      )}
    </>
  );
}

export const REVIEWED_COOKING_DISH_IDS = new Set(
  COOKING_GUIDES.map((guide) => guide.dishId),
);
