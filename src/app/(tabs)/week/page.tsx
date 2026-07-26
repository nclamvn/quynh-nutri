"use client";

import { useState } from "react";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import type { Lang } from "@/i18n/context";
import type { Dish, Slot } from "@/domain/types";
import { dayDishes, dayNutrition, dishDisplay } from "@/ui/derive";
import { AdequacyStrip } from "@/ui/components/AdequacyStrip";
import { BottomSheet } from "@/ui/components/BottomSheet";
import { ProvenanceChip } from "@/ui/components/ProvenanceChip";
import { DishThumb } from "@/ui/components/DishThumb";
import { HeartButton } from "@/ui/components/HeartButton";

const SLOT_ORDER: Slot[] = ["COM", "MAN", "RAU", "CANH", "TRANGMIENG"];
const BUSY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

const dishName = (d: Dish | undefined, lang: Lang) => (!d ? "—" : lang === "en" && d.enLabel ? d.enLabel : d.vnName);

export default function WeekPage() {
  const { plan, household, notes, reroll, changeSlot, toggleLock, dish, commodity, optionsFor } = useStore();
  const { t, lang } = useI18n();
  const [sheet, setSheet] = useState<{ day: number; slot: Slot } | null>(null);

  const busyDayIdx = new Set(household.busyDays.map((d) => BUSY_INDEX[d]));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-hairline bg-bg/95 px-4 py-3 backdrop-blur">
        <div>
          <h1 className="text-lg font-semibold">{t("nav.week")}</h1>
          <p className="text-xs text-muted">{t("app.title")}</p>
        </div>
        <button
          onClick={reroll}
          className="rounded-lg border border-brand px-3 py-1.5 text-sm font-medium text-brand active:bg-brand-weak"
        >
          ↻ {t("common.reroll")}
        </button>
      </header>

      {notes.length > 0 && (
        <div className="mx-4 mt-3 rounded-lg border border-amber/40 bg-amber-weak px-3 py-2 text-xs text-amber">
          {notes.map((n, i) => (
            <p key={i}>⚑ {n}</p>
          ))}
        </div>
      )}

      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 py-4">
        {Array.from({ length: 7 }, (_, day) => {
          const dishes = dayDishes(plan, day, dish);
          const nut = dayNutrition(dishes, household, commodity);
          const busy = busyDayIdx.has(day);
          const daySlots = plan.slots.filter((s) => s.day === day).sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));

          return (
            <section
              key={day}
              className="w-[86%] shrink-0 snap-center rounded-[10px] border border-hairline bg-surface/40 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{t(`day.${day}`)}</h2>
                {busy && <span className="rounded-full bg-amber-weak px-2 py-0.5 text-[10px] text-amber">{t("day.busy")}</span>}
              </div>

              <div className="mb-3 space-y-1.5">
                <ProvenanceChip display={nut.display} field="kcal" unit="kcal" />
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
                {daySlots.map((s) => {
                  const d = dish(s.dishId);
                  return (
                    <li key={s.slot} className="flex items-center gap-2 rounded-lg bg-bg px-2 py-1.5">
                      <DishThumb dish={d} size={40} shape="rounded" />
                      <span className="w-9 shrink-0 text-[9px] font-medium uppercase tracking-wide text-tertiary">
                        {t(`slot.${s.slot}`)}
                      </span>
                      <button className="flex-1 truncate text-left text-sm" onClick={() => setSheet({ day, slot: s.slot })}>
                        {dishName(d, lang)}
                        {d?.quick && <span className="ml-1.5 text-[10px] text-brand-ink">⚡ {t("common.quick")}</span>}
                      </button>
                      {d && <HeartButton dishId={d.id} size={17} />}
                      <button
                        aria-label="lock"
                        onClick={() => toggleLock(day, s.slot)}
                        className={`shrink-0 rounded p-1 text-xs ${s.locked ? "text-brand" : "text-muted/50"}`}
                      >
                        {s.locked ? "🔒" : "🔓"}
                      </button>
                    </li>
                  );
                })}
              </ul>
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
                    changeSlot(sheet.day, sheet.slot, opt.id);
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
    </div>
  );
}
