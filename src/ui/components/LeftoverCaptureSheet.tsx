"use client";

import { useMemo, useState } from "react";
import type { Dish } from "@/domain/types";
import type { MealRunSession } from "@/domain/kitchen-execution/meal-coordination";
import {
  evaluateCoolingWindow,
  LEFTOVER_POLICY_SOURCES,
} from "@/domain/kitchen-execution/leftover-safety";
import { useI18n } from "@/i18n/context";
import { useStore } from "@/ui/store";
import { BottomSheet } from "@/ui/components/BottomSheet";

const toLocalDateTime = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export function LeftoverCaptureSheet({
  session,
  dishes,
  sourceMealRunRef,
  onClose,
}: {
  session: MealRunSession;
  dishes: Dish[];
  sourceMealRunRef: string;
  onClose: () => void;
}) {
  const { createLeftoverLot } = useStore();
  const { t, lang } = useI18n();
  const completed = useMemo(
    () => session.tasks.flatMap((task) => {
      const dish = dishes.find((item) => item.id === task.dishId);
      return task.completedAt && dish ? [{ dish, completedAt: task.completedAt }] : [];
    }),
    [dishes, session.tasks],
  );
  const [remainingIds, setRemainingIds] = useState(() => completed.map(({ dish }) => dish.id));
  const [dishId, setDishId] = useState(() => completed[0]?.dish.id ?? "");
  const selected = completed.find(({ dish }) => dish.id === dishId);
  const [servings, setServings] = useState("1");
  const [preparedAt, setPreparedAt] = useState(() =>
    toLocalDateTime(completed[0]?.completedAt ?? new Date()),
  );
  const [chilledAt, setChilledAt] = useState(() => toLocalDateTime(new Date()));
  const [storageLocation, setStorageLocation] = useState<"fridge" | "freezer">("fridge");
  const [hotWeatherConfirmed, setHotWeatherConfirmed] = useState(false);
  const [note, setNote] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [savedCount, setSavedCount] = useState(0);
  const now = new Date();
  const cooling = evaluateCoolingWindow({
    preparedAt: preparedAt ? new Date(preparedAt) : "invalid",
    chilledAt: chilledAt ? new Date(chilledAt) : "invalid",
    hotWeatherConfirmed,
    now,
  });
  const servingsNumber = Number(servings);
  const valid = Boolean(
    selected
    && Number.isFinite(servingsNumber)
    && servingsNumber > 0
    && servingsNumber <= 100
    && cooling.accepted
    && !submitting,
  );
  const dishName = (dish: Dish) =>
    lang === "en" && dish.enLabel ? dish.enLabel : dish.vnName;

  const chooseDish = (nextDishId: string) => {
    setDishId(nextDishId);
    const task = completed.find(({ dish }) => dish.id === nextDishId);
    setPreparedAt(toLocalDateTime(task?.completedAt ?? new Date()));
    setIdempotencyKey(crypto.randomUUID());
    setError("");
  };

  const submit = async () => {
    if (!valid || !selected) return;
    setSubmitting(true);
    setError("");
    try {
      await createLeftoverLot({
        idempotencyKey,
        dishRef: selected.dish.id,
        servings: servingsNumber,
        preparedAt: new Date(preparedAt).toISOString(),
        chilledAt: new Date(chilledAt).toISOString(),
        storageLocation,
        hotWeatherConfirmed,
        sourceMealRunRef,
        note: note.trim() || undefined,
      });
      const nextIds = remainingIds.filter((id) => id !== selected.dish.id);
      setRemainingIds(nextIds);
      setSavedCount((count) => count + 1);
      setServings("1");
      setNote("");
      setIdempotencyKey(crypto.randomUUID());
      if (nextIds[0]) chooseDish(nextIds[0]);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(
        message.includes("COOLING_WINDOW_EXCEEDED")
          ? t("leftover.errorCooling")
          : t("leftover.errorSave"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet open onClose={onClose} title={t("leftover.captureTitle")}>
      <div className="space-y-4" data-testid="leftover-capture">
        <p className="text-xs leading-relaxed text-muted">{t("leftover.captureIntro")}</p>

        {remainingIds.length === 0 ? (
          <div className="rounded-[16px] bg-brand-weak/55 p-4 text-center">
            <p className="text-sm font-semibold">{t("leftover.savedCount", { n: savedCount })}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white"
            >
              {t("leftover.done")}
            </button>
          </div>
        ) : (
          <>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t("leftover.dish")}</span>
              <select
                value={dishId}
                onChange={(event) => chooseDish(event.target.value)}
                className="w-full rounded-[12px] border border-hairline bg-surface/45 px-3 py-2.5 outline-none"
              >
                {completed
                  .filter(({ dish }) => remainingIds.includes(dish.id))
                  .map(({ dish }) => (
                    <option key={dish.id} value={dish.id}>{dishName(dish)}</option>
                  ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium">{t("leftover.servings")}</span>
                <input
                  autoFocus
                  type="number"
                  min="0.25"
                  max="100"
                  step="0.25"
                  value={servings}
                  onChange={(event) => setServings(event.target.value)}
                  className="w-full rounded-[12px] border border-hairline bg-surface/45 px-3 py-2.5 outline-none"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">{t("leftover.storage")}</span>
                <select
                  value={storageLocation}
                  onChange={(event) => setStorageLocation(event.target.value as "fridge" | "freezer")}
                  className="w-full rounded-[12px] border border-hairline bg-surface/45 px-3 py-2.5 outline-none"
                >
                  <option value="fridge">{t("leftover.storage.fridge")}</option>
                  <option value="freezer">{t("leftover.storage.freezer")}</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">{t("leftover.preparedAt")}</span>
                <input
                  type="datetime-local"
                  value={preparedAt}
                  onChange={(event) => setPreparedAt(event.target.value)}
                  className="w-full rounded-[12px] border border-hairline bg-surface/45 px-3 py-2.5 outline-none"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">{t("leftover.chilledAt")}</span>
                <input
                  type="datetime-local"
                  value={chilledAt}
                  onChange={(event) => setChilledAt(event.target.value)}
                  className="w-full rounded-[12px] border border-hairline bg-surface/45 px-3 py-2.5 outline-none"
                />
              </label>
            </div>

            <label className="flex items-start gap-3 rounded-[14px] border border-hairline p-3 text-sm">
              <input
                type="checkbox"
                checked={hotWeatherConfirmed}
                onChange={(event) => setHotWeatherConfirmed(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="block font-medium">{t("leftover.hotWeather")}</span>
                <span className="mt-0.5 block text-xs text-muted">{t("leftover.hotWeatherHint")}</span>
              </span>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium">
                {t("leftover.note")} · {t("leftover.optional")}
              </span>
              <textarea
                value={note}
                maxLength={500}
                rows={2}
                onChange={(event) => setNote(event.target.value)}
                className="w-full resize-none rounded-[12px] border border-hairline bg-surface/45 px-3 py-2.5 outline-none"
              />
            </label>

            {!cooling.accepted && (
              <p role="alert" className="rounded-[14px] border border-danger/20 bg-danger/5 p-3 text-xs leading-relaxed text-danger">
                {cooling.reasonCode === "COOLING_WINDOW_EXCEEDED"
                  ? t("leftover.errorCooling")
                  : t(`leftover.error.${cooling.reasonCode ?? "INVALID_TIMESTAMP"}`)}
              </p>
            )}
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}

            <button
              type="button"
              disabled={!valid}
              onClick={submit}
              className="w-full rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white disabled:opacity-45"
            >
              {submitting ? t("leftover.saving") : t("leftover.save")}
            </button>
          </>
        )}

        <p className="text-[11px] leading-relaxed text-muted">
          {t("leftover.coolingGuidance")}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
          {LEFTOVER_POLICY_SOURCES.map((source, index) => (
            <a
              key={source}
              href={source}
              target="_blank"
              rel="noreferrer"
              className="text-brand underline underline-offset-2"
            >
              {t("leftover.source", { n: index + 1 })}
            </a>
          ))}
        </div>
        {remainingIds.length > 0 && (
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full px-4 py-2 text-xs text-muted underline underline-offset-2"
          >
            {t("leftover.later")}
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
