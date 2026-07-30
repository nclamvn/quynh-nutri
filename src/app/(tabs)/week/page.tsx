"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import type { Lang } from "@/i18n/context";
import type { Dish, MealOccasion, Slot } from "@/domain/types";
import { dayNutrition, dishDisplay, occasionDishes } from "@/ui/derive";
import { AdequacyStrip } from "@/ui/components/AdequacyStrip";
import { BottomSheet } from "@/ui/components/BottomSheet";
import { ProvenanceChip } from "@/ui/components/ProvenanceChip";
import { DishThumb } from "@/ui/components/DishThumb";
import { HeartButton } from "@/ui/components/HeartButton";
import { PageContainer } from "@/ui/components/PageContainer";
import { PageHeader } from "@/ui/components/PageHeader";
import { SLOT_COLOR } from "@/ui/slotColor";
import { pregnancyWarnings } from "@/domain/dish/pregnancy";
import { isPregnant } from "@/domain/health";
import {
  MealCoordinatorSheet,
  REVIEWED_COOKING_DISH_IDS,
} from "@/ui/components/MealCoordinatorSheet";
import { planDayForDate } from "@/domain/kitchen-execution/inventory";
import { prepAheadForPlanDay } from "@/domain/kitchen-execution/prep-ahead";
import { PREP_AHEAD_GUIDES } from "@/data/seed/prep-ahead-guides";
import { PrepAheadSheet } from "@/ui/components/PrepAheadSheet";
import {
  MEAL_OCCASIONS,
  MEAL_OCCASION_LABELS,
} from "@/domain/planning/meal-occasion";

const SLOT_ORDER: Slot[] = ["COM", "MAN", "RAU", "CANH", "TRANGMIENG"];
const BUSY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

const dishName = (d: Dish | undefined, lang: Lang) => (!d ? "–" : lang === "en" && d.enLabel ? d.enLabel : d.vnName);

export default function WeekPage() {
  const {
    plan,
    planSyncState,
    planConflict,
    retryPlanSync,
    acceptCanonicalPlan,
    household,
    notes,
    changeSlot,
    removeSlot,
    toggleLock,
    dish,
    commodity,
    optionsFor,
  } = useStore();
  const { t, lang } = useI18n();
  const [occasion, setOccasion] = useState<MealOccasion>("dinner");
  const [sheet, setSheet] = useState<{
    day: number;
    occasion: MealOccasion;
    slot: Slot;
  } | null>(null);
  const [pendingChange, setPendingChange] = useState<{
    day: number;
    occasion: MealOccasion;
    slot: Slot;
    beforeDishId: string | null;
    afterDishId: string | null;
  } | null>(null);
  const [coord, setCoord] = useState<{
    day: number;
    occasion: MealOccasion;
  } | null>(null);
  const [prepOpen, setPrepOpen] = useState(false);
  const today = planDayForDate(plan.weekStart, new Date(), "Asia/Ho_Chi_Minh");
  const tomorrow = today !== undefined && today < 6 ? today + 1 : undefined;
  const tomorrowPrep = tomorrow === undefined
    ? undefined
    : prepAheadForPlanDay(plan, tomorrow, dish, PREP_AHEAD_GUIDES);

  const busyDayIdx = new Set(household.busyDays.map((d) => BUSY_INDEX[d]));
  const quickCount = plan.slots.filter((s) => dish(s.dishId)?.quick).length;
  // Soft pregnancy warning on the mâm (dormant until hazard tags are sourced).
  const pregnantMember = household.members.find((m) => m.healthProfile && isPregnant(m.healthProfile.lifeStage));
  const warned = (d: ReturnType<typeof dish>) => !!(pregnantMember && d && pregnancyWarnings(d, pregnantMember, commodity).length > 0);
  const planEditable = planSyncState === "synced";
  const openWeekProposal = () => window.dispatchEvent(
    new CustomEvent("open-assistant", {
      detail: { prompt: "Đổi cả tuần" },
    }),
  );

  if (planSyncState === "loading") {
    return (
      <PageContainer>
        <section
          aria-live="polite"
          className="card p-6"
          data-testid="week-plan-loading"
        >
          <div className="h-5 w-40 animate-pulse rounded bg-hairline" />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-[18px] bg-surface" />
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">{t("weekPlanSync.loading")}</p>
        </section>
      </PageContainer>
    );
  }

  if (!plan.id) {
    return (
      <PageContainer>
        <section className="card p-6" role="alert">
          <h1 className="text-lg font-semibold">{t("weekPlanSync.loadFailed")}</h1>
          <p className="mt-2 text-sm text-muted">{t("weekPlanSync.unsyncedBody")}</p>
          <button
            type="button"
            onClick={retryPlanSync}
            className="mt-4 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            {t("weekPlanSync.retry")}
          </button>
        </section>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("nav.week")}
        subtitle={t("week.meta", {
          days: 7,
          quick: quickCount,
          busy: household.busyDays.length,
        })}
        actions={
          <>
            <span
              data-testid="week-plan-sync-state"
              data-control
              aria-live="polite"
              className={`rounded-full px-2.5 py-1.5 text-xs font-medium ${
                planSyncState === "synced"
                  ? "bg-accent-weak text-accent"
                  : planSyncState === "saving"
                    ? "bg-brand-weak text-brand"
                    : "bg-amber-weak text-amber"
              }`}
            >
              {t(`weekPlanSync.${planSyncState}`)}
            </span>
            {planSyncState === "unsynced" && (
              <button
                type="button"
                onClick={retryPlanSync}
                className="rounded-full border border-amber px-3 py-1.5 text-xs font-semibold text-amber"
              >
                {t("weekPlanSync.retry")}
              </button>
            )}
            {tomorrowPrep && (
              <button
                type="button"
                aria-label={`${t("prepAhead.open")}${
                  tomorrowPrep.supported.length > 0
                    ? ` · ${tomorrowPrep.supported.length}`
                    : ""
                }`}
                onClick={() => setPrepOpen(true)}
                className={`rounded-full border px-3 py-2 text-xs font-semibold sm:px-4 sm:py-2.5 sm:text-sm ${
                  tomorrowPrep.supported.length > 0
                    ? "border-accent bg-accent-weak text-accent"
                    : "border-hairline bg-surface/60 text-muted"
                }`}
              >
                <span className="sm:hidden">
                  Chuẩn bị
                  {tomorrowPrep.supported.length > 0
                    ? ` · ${tomorrowPrep.supported.length}`
                    : ""}
                </span>
                <span className="hidden sm:inline">
                  {t("prepAhead.open")}
                  {tomorrowPrep.supported.length > 0
                    ? ` · ${tomorrowPrep.supported.length}`
                    : ""}
                </span>
              </button>
            )}
            <button
              disabled={!planEditable}
              aria-label={t("common.reroll")}
              onClick={openWeekProposal}
              className="cta-primary inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-white disabled:opacity-45 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              ↻ <span className="sm:hidden">Đổi tuần</span>
              <span className="hidden sm:inline">{t("common.reroll")}</span>
            </button>
            <Link
              href="/shopping"
              aria-label={t("week.export")}
              className="rounded-full border border-hairline px-3 py-2 text-xs font-medium text-brand sm:px-4 sm:text-sm"
            >
              <span className="sm:hidden">Đi chợ →</span>
              <span className="hidden sm:inline">{t("week.export")} →</span>
            </Link>
          </>
        }
      />

      {planSyncState === "conflict" && planConflict && (
        <section
          role="alert"
          className="mb-4 rounded-[16px] border border-amber bg-amber-weak p-4"
        >
          <h2 className="text-sm font-semibold text-amber">{t("weekPlanSync.conflictTitle")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {t("weekPlanSync.conflictBody", { version: planConflict.version })}
          </p>
          <button
            type="button"
            onClick={acceptCanonicalPlan}
            className="mt-3 rounded-full bg-amber px-3 py-2 text-xs font-semibold text-white"
          >
            {t("weekPlanSync.loadCanonical")}
          </button>
        </section>
      )}

      {planSyncState === "unsynced" && (
        <p className="mb-4 rounded-[14px] border border-amber/40 bg-amber-weak px-3 py-2 text-xs text-amber">
          {t("weekPlanSync.unsyncedBody")}
        </p>
      )}

      {notes.length > 0 && (
        <div className="mb-4 rounded-[14px] border border-amber/40 bg-amber-weak px-3 py-2 text-xs text-amber">
          {notes.map((n, i) => (
            <p key={i}>⚑ {n}</p>
          ))}
        </div>
      )}

      <div
        className="mb-4 overflow-x-auto [scrollbar-width:none]"
        aria-label={lang === "en" ? "Meal occasion" : "Nhịp ăn trong ngày"}
      >
        <div className="flex min-w-max gap-2">
          {MEAL_OCCASIONS.map((item) => {
            const count = plan.slots.filter(
              (slot) => slot.occasion === item,
            ).length;
            const active = occasion === item;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={active}
                onClick={() => setOccasion(item)}
                className={`h-10 rounded-full border px-4 text-sm font-semibold transition-colors ${
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-hairline bg-surface/60 text-muted"
                }`}
              >
                {MEAL_OCCASION_LABELS[item][lang === "en" ? "en" : "vn"]}
                <span className="ml-1.5 text-xs opacity-75">· {count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div data-stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 7 }, (_, day) => {
          const dishes = occasionDishes(plan, day, occasion, dish);
          const nut = dayNutrition(dishes, household, commodity);
          const busy = busyDayIdx.has(day);
          const reviewedCount = dishes.filter((item) => REVIEWED_COOKING_DISH_IDS.has(item.id)).length;
          const daySlots = plan.slots.filter(
            (item) => item.day === day && item.occasion === occasion,
          );

          return (
            <section key={day} style={{ "--i": day } as React.CSSProperties} className="card flex flex-col p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{t(`day.${day}`)}</h2>
                {busy && <span className="rounded-full bg-amber-weak px-2 py-0.5 text-[10px] text-amber">{t("day.busy")}</span>}
              </div>

              <div className="mb-3 space-y-1.5">
                <ProvenanceChip display={nut.display} field="kcal" unit="kcal" compact />
                <AdequacyStrip adequacy={nut.adequacy} />
                {nut.groups.missingCore.length > 0 ? (
                  <p className="text-[11px] text-amber">
                    {t("nutrition.missingGroups")}: {nut.groups.missingCore.join(", ")}
                  </p>
                ) : (
                  <p className="text-[11px] text-accent">✓ {t("nutrition.groupsOk")}</p>
                )}
              </div>

              <ul className="space-y-1">
                {SLOT_ORDER.map((slot) => {
                  const s = daySlots.find((item) => item.slot === slot);
                  if (!s) {
                    return (
                      <li
                        key={slot}
                        style={{ borderInlineStartColor: SLOT_COLOR[slot] }}
                        className="flex min-h-12 items-center gap-2 rounded-[12px] border-l-[3px] border-dashed bg-surface/30 px-2 py-1.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-[9px] font-medium uppercase tracking-wide"
                            style={{ color: SLOT_COLOR[slot] }}
                          >
                            {t(`slot.${slot}`)}
                          </p>
                          <button
                            type="button"
                            disabled={!planEditable}
                            onClick={() => setSheet({ day, occasion, slot })}
                            className="mt-0.5 text-left text-xs font-semibold text-brand disabled:opacity-50"
                          >
                            + {lang === "en" ? "Add dish" : "Thêm món"}
                          </button>
                        </div>
                      </li>
                    );
                  }
                  const d = dish(s.dishId);
                  return (
                    <li
                      key={slot}
                      style={{ borderInlineStartColor: SLOT_COLOR[s.slot] }}
                      className="group flex items-center gap-2 rounded-[12px] border-l-[3px] bg-surface/50 px-2 py-1.5 transition-colors hover:bg-surface"
                    >
                      <DishThumb dish={d} size={52} shape="rounded" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-medium uppercase tracking-wide" style={{ color: SLOT_COLOR[s.slot] }}>{t(`slot.${s.slot}`)}</p>
                        <button disabled={!planEditable} className="block w-full truncate text-left text-sm disabled:opacity-50" onClick={() => setSheet({ day, occasion, slot: s.slot })}>
                          {dishName(d, lang)}
                          {d?.quick && <span className="ml-1.5 text-[10px] text-brand-ink">⚡</span>}
                          {warned(d) && <span className="ml-1.5 text-[10px] text-amber" title={t("health.warnBadge")}>⚠</span>}
                        </button>
                      </div>
                      {d && <HeartButton dishId={d.id} size={17} />}
                      <button
                        aria-label="lock"
                        disabled={!planEditable}
                        onClick={() => toggleLock(day, occasion, s.slot)}
                        className={`shrink-0 rounded p-1 text-xs ${s.locked ? "text-brand" : "text-muted/50"}`}
                      >
                        {s.locked ? "🔒" : "🔓"}
                      </button>
                      {!s.locked && (
                        <button
                          type="button"
                          aria-label={lang === "en" ? "Remove dish" : "Bỏ món"}
                          disabled={!planEditable}
                          onClick={() => setPendingChange({
                            day,
                            occasion,
                            slot: s.slot,
                            beforeDishId: s.dishId,
                            afterDishId: null,
                          })}
                          className="shrink-0 rounded p-1 text-xs text-muted/70"
                        >
                          ×
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 border-t border-hairline pt-3">
                <button
                  disabled={!planEditable || reviewedCount < 1}
                  type="button"
                  onClick={() => setCoord({ day, occasion })}
                  aria-describedby={reviewedCount < 1 ? `coord-reason-${day}` : undefined}
                  className="w-full rounded-full border border-brand bg-brand-weak px-3 py-2 text-xs font-semibold text-brand disabled:cursor-not-allowed disabled:border-hairline disabled:bg-surface/60 disabled:text-muted disabled:opacity-75"
                >
                  {t("coord.open")}
                  {reviewedCount >= 1 ? ` · ${reviewedCount}` : ""}
                </button>
                {reviewedCount < 1 && (
                  <p
                    id={`coord-reason-${day}`}
                    className="mt-1.5 text-center text-[10px] leading-relaxed text-muted"
                  >
                    {t("coord.needsReviewed")}
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <BottomSheet open={!!sheet} onClose={() => setSheet(null)} title={sheet ? t(`slot.${sheet.slot}`) : undefined}>
        {sheet && (
          <ul className="space-y-1.5">
            {optionsFor(sheet.slot).map((opt) => (
              <li key={opt.id}>
                <button
                  onClick={() => {
                    const before = plan.slots.find(
                      (item) =>
                        item.day === sheet.day
                        && item.occasion === sheet.occasion
                        && item.slot === sheet.slot,
                    );
                    setPendingChange({
                      day: sheet.day,
                      occasion: sheet.occasion,
                      slot: sheet.slot,
                      beforeDishId: before?.dishId ?? null,
                      afterDishId: opt.id,
                    });
                    setSheet(null);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-hairline px-3 py-2.5 text-left active:bg-surface"
                >
                  <span className="text-sm">
                    {dishName(opt, lang)}
                    {opt.quick && <span className="ml-1.5 text-[10px] text-brand-ink">⚡ {t("common.quick")}</span>}
                  </span>
                  <ProvenanceChip display={dishDisplay(opt, household, commodity)} field="kcal" unit="kcal" showCoverage={false} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </BottomSheet>
      <BottomSheet
        open={Boolean(pendingChange)}
        onClose={() => setPendingChange(null)}
        title={lang === "en" ? "Confirm plan change" : "Xác nhận đổi thực đơn"}
      >
        {pendingChange && (
          <div className="space-y-4" data-testid="occasion-plan-diff">
            <div className="rounded-[16px] border border-hairline bg-surface/55 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
                {t(`day.${pendingChange.day}`)} · {MEAL_OCCASION_LABELS[pendingChange.occasion][lang === "en" ? "en" : "vn"]} · {t(`slot.${pendingChange.slot}`)}
              </p>
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-sm">
                <span className="min-w-0 truncate rounded-[12px] border border-hairline px-3 py-2 text-muted">
                  {pendingChange.beforeDishId
                    ? dishName(dish(pendingChange.beforeDishId), lang)
                    : lang === "en" ? "Empty" : "Đang trống"}
                </span>
                <span aria-hidden className="text-brand">→</span>
                <span className="min-w-0 truncate rounded-[12px] border border-brand/30 bg-brand-weak/40 px-3 py-2 font-semibold text-brand-ink">
                  {pendingChange.afterDishId
                    ? dishName(dish(pendingChange.afterDishId), lang)
                    : lang === "en" ? "Remove" : "Bỏ món"}
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted">
              {lang === "en"
                ? "Nothing changes until you confirm this exact difference."
                : "Thực đơn chỉ thay đổi sau khi bạn xác nhận đúng phần chênh lệch này."}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPendingChange(null)}
                className="h-11 rounded-full border border-hairline text-sm font-semibold text-muted"
              >
                {lang === "en" ? "Cancel" : "Huỷ"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pendingChange.afterDishId) {
                    changeSlot(
                      pendingChange.day,
                      pendingChange.occasion,
                      pendingChange.slot,
                      pendingChange.afterDishId,
                    );
                  } else {
                    removeSlot(
                      pendingChange.day,
                      pendingChange.occasion,
                      pendingChange.slot,
                    );
                  }
                  setPendingChange(null);
                }}
                className="h-11 rounded-full bg-brand text-sm font-semibold text-white"
              >
                {lang === "en" ? "Confirm" : "Xác nhận"}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
      {coord && (
        <MealCoordinatorSheet
          day={coord.day}
          occasion={coord.occasion}
          dishes={occasionDishes(plan, coord.day, coord.occasion, dish)}
          onClose={() => setCoord(null)}
        />
      )}
      {tomorrowPrep && (
        <PrepAheadSheet
          result={tomorrowPrep}
          open={prepOpen}
          onClose={() => setPrepOpen(false)}
        />
      )}
    </PageContainer>
  );
}
