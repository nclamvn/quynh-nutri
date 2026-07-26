"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Blossom } from "@/ui/components/Blossom";
import { PageContainer } from "@/ui/components/PageContainer";
import { SLOT_COLOR } from "@/ui/slotColor";

const SLOT_ORDER: Slot[] = ["COM", "MAN", "RAU", "CANH", "TRANGMIENG"];
const BUSY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

const dishName = (d: Dish | undefined, lang: Lang) => (!d ? "—" : lang === "en" && d.enLabel ? d.enLabel : d.vnName);

export default function WeekPage() {
  const { plan, household, notes, reroll, changeSlot, toggleLock, dish, commodity, optionsFor } = useStore();
  const { t, lang } = useI18n();
  const [sheet, setSheet] = useState<{ day: number; slot: Slot } | null>(null);

  const busyDayIdx = new Set(household.busyDays.map((d) => BUSY_INDEX[d]));
  const quickCount = plan.slots.filter((s) => dish(s.dishId)?.quick).length;

  return (
    <PageContainer>
      {/* Hero — descriptive, never evaluative (honesty: don't imply "optimized"). */}
      <section className="grain relative mb-5 overflow-hidden rounded-[24px] border border-hairline bg-gradient-to-br from-brand-weak/70 via-bg to-accent-weak/60 shadow-[var(--shadow-sm)]">
        <Blossom size={190} className="pointer-events-none absolute -bottom-14 -left-12 -rotate-12 text-brand/10" />
        <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold -tracking-[0.02em] lg:text-[28px]">{t("nav.week")}</h1>
            <p className="mt-1 text-sm text-muted">
              {t("week.meta", { days: 7, quick: quickCount, busy: household.busyDays.length })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button onClick={reroll} className="cta-primary inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium text-white">
              ↻ {t("common.reroll")}
            </button>
            <Link href="/shopping" className="text-sm font-medium text-brand">{t("week.export")} →</Link>
          </div>
        </div>
      </section>

      {notes.length > 0 && (
        <div className="mb-4 rounded-[14px] border border-amber/40 bg-amber-weak px-3 py-2 text-xs text-amber">
          {notes.map((n, i) => (
            <p key={i}>⚑ {n}</p>
          ))}
        </div>
      )}

      <div data-stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 7 }, (_, day) => {
          const dishes = dayDishes(plan, day, dish);
          const nut = dayNutrition(dishes, household, commodity);
          const busy = busyDayIdx.has(day);
          const daySlots = plan.slots.filter((s) => s.day === day).sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));

          return (
            <section key={day} style={{ "--i": day } as React.CSSProperties} className="card flex flex-col p-3.5">
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
                    <li
                      key={s.slot}
                      style={{ borderInlineStartColor: SLOT_COLOR[s.slot] }}
                      className="group flex items-center gap-2 rounded-[12px] border-l-[3px] bg-surface/50 px-2 py-1.5 transition-colors hover:bg-surface"
                    >
                      <DishThumb dish={d} size={52} shape="rounded" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-medium uppercase tracking-wide" style={{ color: SLOT_COLOR[s.slot] }}>{t(`slot.${s.slot}`)}</p>
                        <button className="block w-full truncate text-left text-sm" onClick={() => setSheet({ day, slot: s.slot })}>
                          {dishName(d, lang)}
                          {d?.quick && <span className="ml-1.5 text-[10px] text-brand-ink">⚡</span>}
                        </button>
                      </div>
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
    </PageContainer>
  );
}
