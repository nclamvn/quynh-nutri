"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import type { Lang } from "@/i18n/context";
import type { Dish, Slot } from "@/domain/types";
import { dishDisplay } from "@/ui/derive";
import { ProvenanceChip } from "@/ui/components/ProvenanceChip";
import { AddDishSheet } from "@/ui/components/AddDishSheet";
import { DishThumb } from "@/ui/components/DishThumb";
import { HeartButton } from "@/ui/components/HeartButton";
import { DishDetailSheet } from "@/ui/components/DishDetailSheet";

const SLOTS: Slot[] = ["MAN", "RAU", "CANH", "TRANGMIENG", "COM"];
const dishName = (d: Dish, lang: Lang) => (lang === "en" && d.enLabel ? d.enLabel : d.vnName);

export default function DishesPage() {
  const { optionsFor, household, commodity, isForked } = useStore();
  const { t, lang } = useI18n();
  const [slotFilter, setSlotFilter] = useState<Slot | "ALL">("ALL");
  const [quickOnly, setQuickOnly] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const all = useMemo(() => SLOTS.flatMap((s) => optionsFor(s)), [optionsFor]);
  const list = all.filter((d) => (slotFilter === "ALL" || d.slot === slotFilter) && (!quickOnly || d.quick));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 border-b border-hairline bg-bg/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-semibold">{t("dishes.title")}</h1>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          <Chip active={slotFilter === "ALL"} onClick={() => setSlotFilter("ALL")}>
            {t("dishes.filterAll")}
          </Chip>
          {SLOTS.map((s) => (
            <Chip key={s} active={slotFilter === s} onClick={() => setSlotFilter(s)}>
              {t(`slot.${s}`)}
            </Chip>
          ))}
          <Chip active={quickOnly} onClick={() => setQuickOnly((q) => !q)}>
            ⚡ {t("common.quick")}
          </Chip>
        </div>
      </header>

      <ul className="space-y-2 px-4 py-4">
        {list.map((d) => (
          <li key={d.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setDetailId(d.id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setDetailId(d.id)}
              className="flex cursor-pointer items-center gap-3 rounded-[14px] border border-hairline bg-surface/40 p-3 transition-colors active:bg-surface"
            >
              <DishThumb dish={d} size={56} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h2 className="truncate text-sm font-semibold">{dishName(d, lang)}</h2>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${
                      isForked(d.id) ? "bg-brand-weak text-brand-ink" : "bg-surface text-muted"
                    }`}
                  >
                    {isForked(d.id) ? t("origin.b1") : t("dishes.sample")}
                  </span>
                </div>
                <p className="mb-1.5 text-[11px] text-muted">
                  {d.proteinType} · {d.method}
                  {d.cookTimeMin ? ` · ${d.cookTimeMin}′` : ""}
                  {d.quick ? ` · ${t("common.quick")}` : ""}
                </p>
                <ProvenanceChip display={dishDisplay(d, household, commodity)} field="kcal" unit="kcal" />
              </div>
              <HeartButton dishId={d.id} />
            </div>
          </li>
        ))}
      </ul>

      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-8 right-8 z-30 hidden rounded-full bg-brand px-5 py-3 text-sm font-medium text-white shadow-float active:bg-brand-hover lg:block"
      >
        + {t("dishes.add")}
      </button>

      <AddDishSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <DishDetailSheet dishId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
        active ? "border-brand bg-brand-weak text-brand" : "border-hairline text-muted"
      }`}
    >
      {children}
    </button>
  );
}
