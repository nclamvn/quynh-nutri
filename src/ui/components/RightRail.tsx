"use client";

import { usePathname } from "next/navigation";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import type { Lang } from "@/i18n/context";
import type { Dish } from "@/domain/types";
import { dayDishes, dayNutrition } from "@/ui/derive";
import { ProvenanceChip, ProvenanceDot } from "./ProvenanceChip";
import { AdequacyStrip } from "./AdequacyStrip";
import { DishThumb } from "./DishThumb";

const dishName = (d: Dish | undefined, lang: Lang) => (!d ? "—" : lang === "en" && d.enLabel ? d.enLabel : d.vnName);

/** Contextual right rail — one kind per page (Blueprint §5.3). Desktop only. */
export function RightRail() {
  const pathname = usePathname();
  let content: React.ReactNode = null;
  if (pathname.startsWith("/overview") || pathname.startsWith("/week")) content = <TodayRail />;
  else if (pathname.startsWith("/shopping")) content = <TaskRail />;
  else if (pathname.startsWith("/nutrition")) content = <InsightRail />;
  if (!content) return null;

  return (
    <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 overflow-y-auto border-l border-hairline bg-surface/30 px-4 py-5 xl:block">
      {content}
    </aside>
  );
}

function RailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card mb-4 p-4">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-tertiary">{title}</h3>
      {children}
    </section>
  );
}

function TodayRail() {
  const { plan, household, dish, commodity } = useStore();
  const { t, lang } = useI18n();
  const dishes = dayDishes(plan, 0, dish);
  const nut = dayNutrition(dishes, household, commodity);
  return (
    <>
      <RailCard title={t("ov.tonight")}>
        <div className="mb-3 space-y-2">
          <ProvenanceChip display={nut.display} field="kcal" unit="kcal" />
          <AdequacyStrip adequacy={nut.adequacy} />
        </div>
        <ul className="space-y-2">
          {dishes.map((d) => (
            <li key={d.id} className="flex items-center gap-2.5 text-sm">
              <DishThumb dish={d} size={32} />
              <div className="min-w-0 flex-1">
                <span className="block truncate">{dishName(d, lang)}</span>
                <span className="text-[10px] uppercase tracking-wide text-tertiary">{t(`slot.${d.slot}`)}</span>
              </div>
            </li>
          ))}
        </ul>
        <button className="mt-3 w-full rounded-full bg-brand py-2 text-sm font-medium text-white active:bg-brand-hover">
          {t("ov.startCooking")}
        </button>
      </RailCard>

      {/* Uống nước — SHELL: no water-tracking engine yet, so NO fake number (L-1) */}
      <RailCard title={t("ov.water")}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">{t("ov.noData")}</span>
          <span className="rounded-full bg-amber-weak px-2 py-0.5 text-[10px] text-amber">{t("ov.demo")}</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-surface" />
      </RailCard>

      {/* Ghi chú nhanh — honest empty state, not fabricated notes */}
      <RailCard title={t("ov.quickNotes")}>
        <p className="text-sm text-muted">—</p>
      </RailCard>
    </>
  );
}

function TaskRail() {
  const { shopping } = useStore();
  const { t } = useI18n();
  const done = shopping.filter((i) => i.checked).length;
  const total = shopping.length;
  const remaining = total - done;
  const pctDone = total ? Math.round((done / total) * 100) : 0;
  return (
    <RailCard title={t("rail.tasks")}>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="tnum text-2xl font-semibold text-brand">{remaining}</span>
        <span className="text-xs text-muted">{t("rail.remaining")}</span>
      </div>
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pctDone}%` }} />
      </div>
      <p className="tnum text-xs text-muted">
        {t("rail.bought")} {done}/{total}
      </p>
    </RailCard>
  );
}

function InsightRail() {
  const { t } = useI18n();
  const rows: [React.ReactNode, string][] = [
    [<ProvenanceDot key="a" tone="accent" />, t("rail.legendCorroborated")],
    [<ProvenanceDot key="b" tone="amber" />, t("rail.legendEstimated")],
    [<ProvenanceDot key="c" tone="muted" />, t("rail.legendNull")],
  ];
  return (
    <RailCard title={t("rail.provLegend")}>
      <ul className="space-y-2.5">
        {rows.map(([dot, label], i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm">
            {dot}
            <span className="text-muted">{label}</span>
          </li>
        ))}
      </ul>
    </RailCard>
  );
}
