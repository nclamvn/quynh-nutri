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
import { Blossom } from "@/ui/components/Blossom";
import { PageContainer } from "@/ui/components/PageContainer";
import { PageHeader } from "@/ui/components/PageHeader";

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
    <PageContainer>
      <PageHeader
        title={t("dishes.title")}
        subtitle={t("dishes.count", { n: all.length })}
        sticky
        hideSubtitleOnMobile
        actions={
          <form
            onSubmit={(e) => { e.preventDefault(); runSearch(query); }}
            className="flex w-full min-w-0 items-center gap-2 rounded-full border border-hairline bg-surface/40 px-3.5 py-2 focus-within:border-brand sm:w-80"
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
        }
      >
        {!searchIds ? (
          <div className="flex flex-wrap gap-1.5 pb-1 pt-0.5 sm:flex-nowrap sm:overflow-x-auto sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden">
            <Chip active={slotFilter === "ALL"} onClick={() => setSlotFilter("ALL")}>{t("dishes.filterAll")}</Chip>
            {SLOTS.map((s) => (
              <Chip key={s} active={slotFilter === s} onClick={() => setSlotFilter(s)}>{t(`slot.${s}`)}</Chip>
            ))}
            <Chip active={quickOnly} onClick={() => setQuickOnly((q) => !q)}>⚡ {t("common.quick")}</Chip>
          </div>
        ) : (
          <p className="text-[11px] text-muted">{t("dishes.semanticHits", { n: list.length })}</p>
        )}
      </PageHeader>

      {list.length === 0 ? (
        <div className="grid min-h-[40vh] place-content-center justify-items-center text-center">
          <Blossom size={96} className="text-brand/25" />
          <p className="mt-3 text-sm text-muted">{t("dishes.noResults")}</p>
        </div>
      ) : (
        <ul data-stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {list.map((d, i) => (
            <li key={d.id} style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setDetailId(d.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setDetailId(d.id)}
                className="group card card-interactive flex h-full cursor-pointer items-center gap-3 p-3"
              >
                <DishThumb dish={d} size={72} shape="rounded" />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{dishName(d, lang)}</h2>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${isForked(d.id) ? "bg-brand-weak text-brand-ink" : "bg-surface text-muted"}`}>
                      {isForked(d.id) ? t("origin.b1") : t("dishes.sample")}
                    </span>
                  </div>
                  <p className="mb-1.5 truncate text-[11px] text-muted">
                    {d.proteinType} · {d.method}
                    {d.cookTimeMin ? ` · ${d.cookTimeMin}′` : ""}
                    {d.quick ? ` · ${t("common.quick")}` : ""}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <ProvenanceChip display={dishDisplay(d, household, commodity)} field="kcal" unit="kcal" />
                    <HeartButton dishId={d.id} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Desktop only — on mobile the TabBar center "+" already adds a dish. */}
      <button
        onClick={() => setAddOpen(true)}
        className="cta-primary fixed bottom-8 right-8 z-30 hidden rounded-full px-5 py-3 text-sm font-medium text-white lg:block"
      >
        + {t("dishes.add")}
      </button>

      <AddDishSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <DishDetailSheet dishId={detailId} onClose={() => setDetailId(null)} />
    </PageContainer>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1 text-xs ${
        active ? "border border-brand bg-brand-weak text-brand" : "glass text-muted"
      }`}
    >
      {children}
    </button>
  );
}
