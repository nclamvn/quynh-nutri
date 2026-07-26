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
  const groupsPct = Math.round((presentCore / 4) * 100);
  const vendors = new Set(shopping.map((i) => i.vendor)).size;

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
          <h1 className="text-2xl font-semibold tracking-tight">{t("ov.title")}</h1>
          <p className="text-sm text-muted">{t("greeting")} 👋 · {t("household.family", { n: household.size })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white active:bg-brand-hover">
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
                      <div key={d} className={`flex flex-col items-center gap-1 rounded-lg p-1.5 ${d === TODAY ? "bg-brand-weak" : ""}`}>
                        <DishThumb dish={dd} size={34} />
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
            <div className="card p-4">
              <h2 className="mb-3 text-sm font-semibold">{t("ov.nutritionToday")}</h2>
              <div className="flex items-center gap-4">
                <Donut value={groupsPct} label={`${presentCore}/4`} sublabel={t("ov.groupsMet")} tone={presentCore === 4 ? "accent" : "amber"} />
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
            <div className="flex flex-col card p-4">
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
            <div className="card p-4">
              <h2 className="mb-3 text-sm font-semibold">{t("ov.suggestion")}</h2>
              {suggestion && (
                <div className="flex items-center gap-3">
                  <DishThumb dish={suggestion} size={52} />
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

          {/* Headline suggestion card */}
          <section className="overflow-hidden rounded-[16px] border border-hairline bg-gradient-to-br from-brand-weak to-accent-weak">
            <div className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-between">
              <div className="max-w-md">
                <p className="mb-1.5 text-xs font-medium text-brand">✨ {t("ov.pantryHint")}</p>
                <h2 className="mb-3 text-lg font-semibold leading-snug">{t("ov.suggestHeadline")}</h2>
                <Link href="/week" className="inline-flex rounded-full bg-brand px-4 py-2 text-sm font-medium text-white active:bg-brand-hover">
                  {t("ov.addToMenu")}
                </Link>
              </div>
              <DishThumb dish={suggestion} size={120} className="!rounded-3xl" />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

