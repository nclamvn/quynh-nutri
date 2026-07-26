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
  const [query, setQuery] = useState("");
  const [searchIds, setSearchIds] = useState<string[] | null>(null);
  const [searching, setSearching] = useState(false);

  const all = useMemo(() => SLOTS.flatMap((s) => optionsFor(s)), [optionsFor]);
  const byId = useMemo(() => new Map(all.map((d) => [d.id, d])), [all]);
  // Semantic search results (ranked) override the filtered list when active.
  const list = searchIds
    ? searchIds.map((id) => byId.get(id)).filter((d): d is Dish => Boolean(d))
    : all.filter((d) => (slotFilter === "ALL" || d.slot === slotFilter) && (!quickOnly || d.quick));

  const runSearch = async (q: string) => {
    const t = q.trim();
    if (!t) { setSearchIds(null); return; }
    setSearching(true);
    try {
      const { searchDishes } = await import("@/app/actions");
      setSearchIds(await searchDishes(t));
    } catch { setSearchIds([]); }
    finally { setSearching(false); }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 border-b border-hairline bg-bg/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-semibold">{t("dishes.title")}</h1>
        <form
          onSubmit={(e) => { e.preventDefault(); runSearch(query); }}
          className="mt-2 flex items-center gap-2 rounded-full border border-hairline bg-surface/40 px-3.5 py-1.5 focus-within:border-brand"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-tertiary"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); if (!e.target.value.trim()) setSearchIds(null); }}
            placeholder={t("dishes.search")}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {searching && <span className="text-[10px] text-muted">…</span>}
          {searchIds && !searching && (
            <button type="button" onClick={() => { setQuery(""); setSearchIds(null); }} aria-label="clear" className="text-tertiary active:text-danger">✕</button>
          )}
        </form>
        {!searchIds && (
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            <Chip active={slotFilter === "ALL"} onClick={() => setSlotFilter("ALL")}>{t("dishes.filterAll")}</Chip>
            {SLOTS.map((s) => (
              <Chip key={s} active={slotFilter === s} onClick={() => setSlotFilter(s)}>{t(`slot.${s}`)}</Chip>
            ))}
            <Chip active={quickOnly} onClick={() => setQuickOnly((q) => !q)}>⚡ {t("common.quick")}</Chip>
          </div>
        )}
        {searchIds && <p className="mt-2 text-[11px] text-muted">Tìm theo ngữ nghĩa · {list.length} món khớp</p>}
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
              <DishThumb dish={d} size={60} shape="rounded" />
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
        className="fixed bottom-24 right-5 z-30 rounded-full bg-brand px-5 py-3 text-sm font-medium text-white shadow-float active:bg-brand-hover lg:bottom-8 lg:right-8"
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
