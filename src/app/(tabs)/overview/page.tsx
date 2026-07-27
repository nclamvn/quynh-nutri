"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/ui/store";
import { MoodSheet } from "@/ui/components/MoodSheet";
import { useI18n } from "@/i18n/context";
import type { Lang } from "@/i18n/context";
import type { Dish, Slot } from "@/domain/types";
import { dayDishes, dayNutrition } from "@/ui/derive";
import { Donut } from "@/ui/components/Donut";
import { DishThumb } from "@/ui/components/DishThumb";
import { ProvenanceChip } from "@/ui/components/ProvenanceChip";
import { Blossom } from "@/ui/components/Blossom";
import { PageContainer } from "@/ui/components/PageContainer";
import { SLOT_COLOR } from "@/ui/slotColor";
import { useCountUp } from "@/ui/hooks/useCountUp";
import type { FoodGroup } from "@/domain/nutrition";

const GROUP_COLORS: [FoodGroup, string][] = [
  ["đạm", "var(--chart-protein)"],
  ["tinh bột", "var(--chart-carb)"],
  ["xơ", "var(--chart-fiber)"],
  ["béo", "var(--chart-fat)"],
  ["trái cây", "var(--chart-fruit)"],
];

const GRID_SLOTS: { slot: Slot; key: string }[] = [
  { slot: "MAN", key: "grid.man" },
  { slot: "RAU", key: "grid.rau" },
  { slot: "CANH", key: "grid.canh" },
  { slot: "COM", key: "grid.com" },
  { slot: "TRANGMIENG", key: "grid.tm" },
];
const dishName = (d: Dish | undefined, lang: Lang) => (!d ? "—" : lang === "en" && d.enLabel ? d.enLabel : d.vnName);
const dayShort = (d: number) => (d === 6 ? "CN" : `T${d + 2}`);
const TODAY = 0; // representative "today" = first day of the plan

export default function OverviewPage() {
  const { plan, household, dish, commodity, shopping, reroll, optionsFor } = useStore();
  const { t, lang } = useI18n();
  const [moodOpen, setMoodOpen] = useState(false);

  const today = dayDishes(plan, TODAY, dish);
  const nut = dayNutrition(today, household, commodity);
  const core = ["đạm", "tinh bột", "xơ", "béo"] as const;
  const presentCore = core.filter((g) => nut.groups.present.has(g)).length;
  const vendors = new Set(shopping.map((i) => i.vendor)).size;
  const groupSegments = GROUP_COLORS.map(([g, color]) => ({ color, on: nut.groups.present.has(g) }));

  const suggestion = useMemo(() => {
    const todayIds = new Set(today.map((d) => d.id));
    return optionsFor("MAN").find((d) => d.quick && !todayIds.has(d.id)) ?? optionsFor("MAN")[0];
  }, [optionsFor, today]);

  const slotDish = (day: number, slot: Slot) => dish(plan.slots.find((s) => s.day === day && s.slot === slot)?.dishId ?? "");
  const needCount = Math.round(useCountUp(shopping.length)); // count-up flourish

  return (
    <PageContainer>
      <header className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold -tracking-[0.02em] lg:text-[28px]">{t("ov.title")}</h1>
            <p className="mt-0.5 truncate text-sm text-muted">{t("greeting")} 👋 · {t("household.family", { n: household.size })}</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button
              onClick={() => window.dispatchEvent(new Event("open-assistant"))}
              className="cta-primary flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-white sm:flex-none"
            >
              ✨ {t("ov.aiSuggest")}
            </button>
            <button onClick={() => setMoodOpen(true)} className="flex shrink-0 items-center gap-1.5 rounded-full border border-hairline px-4 py-2.5 text-sm text-muted active:bg-surface">
              Hôm nay bạn cần gì?
            </button>
            <button onClick={reroll} className="flex shrink-0 items-center gap-1.5 rounded-full border border-hairline px-4 py-2.5 text-sm text-muted active:bg-surface">
              ↻ {t("common.reroll")}
            </button>
          </div>
        </div>
      </header>

      {plan.slots.length === 0 ? (
        <div className="card grid min-h-[40vh] place-content-center p-10 text-center">
          <p className="mb-3 text-sm text-muted">{t("ov.emptyWeek")}</p>
          <button onClick={reroll} className="mx-auto rounded-full bg-brand px-4 py-2 text-sm font-medium text-white">{t("ov.createWeek")}</button>
        </div>
      ) : (
        <>
          {/* Week matrix 5 slot × 7 days */}
          <section className="card scroll-x-thin mb-5 overflow-x-auto p-3">
            <div className="min-w-[640px]">
              <div className="mb-2 grid grid-cols-[64px_repeat(7,1fr)] gap-1.5">
                <div />
                {Array.from({ length: 7 }, (_, d) => (
                  <div
                    key={d}
                    className={`rounded-lg py-1 text-center text-xs font-medium ${d === TODAY ? "bg-brand text-white" : "text-muted"}`}
                  >
                    {dayShort(d)}
                  </div>
                ))}
              </div>
              {GRID_SLOTS.map(({ slot, key }) => (
                <div key={slot} className="mb-1.5 grid grid-cols-[64px_repeat(7,1fr)] items-center gap-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: SLOT_COLOR[slot] }}>{t(key)}</div>
                  {Array.from({ length: 7 }, (_, d) => {
                    const dd = slotDish(d, slot);
                    return (
                      <div
                        key={d}
                        className={`flex flex-col items-center gap-1 rounded-xl p-1.5 transition-colors duration-150 hover:bg-surface ${d === TODAY ? "bg-brand-weak/70" : ""}`}
                      >
                        <DishThumb dish={dd} size={42} />
                        <span className="line-clamp-2 text-center text-[9px] leading-tight text-muted">{dishName(dd, lang)}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>

          {/* Metric row */}
          <section data-stagger className="mb-5 grid gap-4 md:grid-cols-3">
            {/* Nutrition today */}
            <div style={{ "--i": 0 } as React.CSSProperties} className="card card-interactive p-4">
              <h2 className="mb-3 text-sm font-semibold">{t("ov.nutritionToday")}</h2>
              <div className="flex items-center gap-4">
                <Donut segments={groupSegments} label={`${presentCore}/4`} sublabel={t("ov.groupsMet")} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {(["đạm", "tinh bột", "xơ", "béo", "trái cây"] as const).map((g) => {
                      const on = nut.groups.present.has(g);
                      return (
                        <span key={g} className={`rounded-full px-2 py-0.5 text-[10px] ${on ? "bg-accent-weak text-accent" : "bg-surface text-muted"}`}>
                          {on ? "✓" : "–"} {g}
                        </span>
                      );
                    })}
                  </div>
                  {/* Real day macros with provenance — no misleading meal-vs-day % */}
                  <div className="flex flex-wrap gap-1.5">
                    <ProvenanceChip display={nut.display} field="kcal" unit="kcal" showCoverage={false} />
                    <ProvenanceChip display={nut.display} field="proteinG" unit="g đạm" showCoverage={false} />
                  </div>
                </div>
              </div>
            </div>

            {/* Need to buy today */}
            <div style={{ "--i": 1 } as React.CSSProperties} className="card card-interactive flex flex-col p-4">
              <h2 className="mb-2 text-sm font-semibold">{t("ov.needToday")}</h2>
              <div className="flex items-baseline gap-2">
                <span className="tnum text-4xl font-semibold text-brand">{needCount}</span>
                <span className="text-sm text-muted">{t("ov.items")}</span>
              </div>
              <p className="tnum mt-1 text-xs text-muted">· {vendors} {t("ov.vendors")}</p>
              <Link href="/shopping" className="mt-auto inline-flex w-fit rounded-full bg-brand-weak px-3 py-1.5 text-xs font-medium text-brand">
                {t("ov.viewList")} →
              </Link>
            </div>

            {/* Suggestion */}
            <div style={{ "--i": 2 } as React.CSSProperties} className="group card card-interactive p-4">
              <h2 className="mb-3 text-sm font-semibold">{t("ov.suggestion")}</h2>
              {suggestion && (
                <div className="flex items-center gap-3">
                  <DishThumb dish={suggestion} size={56} shape="rounded" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{dishName(suggestion, lang)}</p>
                    {suggestion.cookTimeMin && <p className="tnum text-xs text-muted">{suggestion.cookTimeMin} phút</p>}
                    <Link href="/dishes" className="mt-1 inline-block text-xs font-medium text-brand">
                      {t("ov.viewDish")} →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Headline suggestion card — hero: gradient + blossom motif (§2.3 zone) */}
          <section className="grain group relative overflow-hidden rounded-[24px] border border-hairline bg-gradient-to-br from-brand-weak/70 via-bg to-accent-weak/60 shadow-[var(--shadow-sm)]">
            {/* Soft blossom accent, tucked bottom-left so it never sits under the dish. */}
            <Blossom size={190} className="pointer-events-none absolute -bottom-14 -left-12 -rotate-12 text-brand/10" />
            <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8">
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-weak px-3 py-1 text-[11px] font-medium text-brand-ink">
                  ✨ {t("ov.pantryHint")}
                </span>
                <h2 className="mt-3 text-[22px] font-semibold leading-snug -tracking-[0.01em] sm:text-2xl">
                  {t("ov.suggestHeadline")}
                </h2>
                <p className="mt-1.5 truncate text-sm text-muted">
                  {dishName(suggestion, lang)}
                  {suggestion.cookTimeMin ? ` · ${suggestion.cookTimeMin} ${t("ov.min")}` : ""}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Link href="/week" className="cta-primary inline-flex rounded-full px-5 py-2.5 text-sm font-medium text-white">
                    {t("ov.addToMenu")}
                  </Link>
                  <Link href="/dishes" className="text-sm font-medium text-brand">
                    {t("ov.viewDish")} →
                  </Link>
                </div>
              </div>
              <div className="shrink-0 self-center">
                <DishThumb
                  dish={suggestion}
                  size={140}
                  shape="rounded"
                  className="!rounded-[20px] shadow-[var(--shadow-md)] ring-1 ring-black/5"
                />
              </div>
            </div>
          </section>
        </>
      )}

      <MoodSheet open={moodOpen} onClose={() => setMoodOpen(false)} />
    </PageContainer>
  );
}

