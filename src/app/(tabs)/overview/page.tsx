"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import type { Lang } from "@/i18n/context";
import type { Dish, Slot } from "@/domain/types";
import { dayDishes, dayNutrition } from "@/ui/derive";
import { Donut } from "@/ui/components/Donut";
import { DishThumb } from "@/ui/components/DishThumb";
import { ProvenanceChip } from "@/ui/components/ProvenanceChip";
import { Blossom } from "@/ui/components/Blossom";
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

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 lg:px-8">
      {/* Header (page owns it — no duplicate topbar) */}
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold -tracking-[0.02em] lg:text-[30px]">{t("ov.title")}</h1>
          <p className="text-sm text-muted">{t("greeting")} 👋 · {t("household.family", { n: household.size })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new Event("open-assistant"))}
            className="cta-primary flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-white"
          >
            ✨ {t("ov.aiSuggest")}
          </button>
          <button onClick={reroll} className="rounded-full border border-hairline px-3 py-2 text-sm text-muted active:bg-surface">
            ↻ {t("common.reroll")}
          </button>
        </div>
      </header>

      {plan.slots.length === 0 ? (
        <div className="rounded-[16px] border border-hairline bg-surface/40 p-10 text-center">
          <p className="mb-3 text-sm text-muted">{t("ov.emptyWeek")}</p>
          <button onClick={reroll} className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white">{t("ov.createWeek")}</button>
        </div>
      ) : (
        <>
          {/* Week matrix 5 slot × 7 days */}
          <section className="card mb-5 overflow-x-auto p-3">
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
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-tertiary">{t(key)}</div>
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
          <section className="mb-5 grid gap-4 md:grid-cols-3">
            {/* Nutrition today */}
            <div className="card card-interactive p-4">
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
            <div className="card card-interactive flex flex-col p-4">
              <h2 className="mb-2 text-sm font-semibold">{t("ov.needToday")}</h2>
              <div className="flex items-baseline gap-2">
                <span className="tnum text-4xl font-semibold text-brand">{shopping.length}</span>
                <span className="text-sm text-muted">{t("ov.items")}</span>
              </div>
              <p className="tnum mt-1 text-xs text-muted">· {vendors} {t("ov.vendors")}</p>
              <Link href="/shopping" className="mt-auto inline-flex w-fit rounded-full bg-brand-weak px-3 py-1.5 text-xs font-medium text-brand">
                {t("ov.viewList")} →
              </Link>
            </div>

            {/* Suggestion */}
            <div className="card card-interactive p-4">
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
          <section className="relative overflow-hidden rounded-[20px] border border-hairline bg-gradient-to-br from-brand-weak via-bg to-accent-weak shadow-[var(--shadow-sm)]">
            <Blossom size={150} className="pointer-events-none absolute -right-6 -top-8 text-brand/15" />
            <div className="relative flex flex-col items-center gap-5 p-6 sm:flex-row sm:justify-between">
              <div className="max-w-md">
                <p className="mb-1.5 text-xs font-medium text-brand">✨ {t("ov.pantryHint")}</p>
                <h2 className="mb-4 text-xl font-semibold leading-snug -tracking-[0.01em]">{t("ov.suggestHeadline")}</h2>
                <Link href="/week" className="cta-primary inline-flex rounded-full px-5 py-2.5 text-sm font-medium text-white">
                  {t("ov.addToMenu")}
                </Link>
              </div>
              <DishThumb dish={suggestion} size={128} shape="rounded" className="!rounded-[20px] shadow-[var(--shadow-md)]" />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

