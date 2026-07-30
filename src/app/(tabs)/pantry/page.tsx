"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import type { Lang } from "@/i18n/context";
import type { InventoryLot, LeftoverLot } from "@/domain/types";
import { COMMODITIES } from "@/data/seed/commodity";
import { REPERTOIRE } from "@/data/seed/repertoire";
import { cookFromPantry } from "@/domain/pantry";
import {
  expirySignal,
  frozenLotsNeededForDay,
  planDayForDate,
  sortLotsFefo,
} from "@/domain/kitchen-execution/inventory";
import { DishThumb } from "@/ui/components/DishThumb";
import { Blossom } from "@/ui/components/Blossom";
import { BasketIcon } from "@/ui/components/icons";
import { PageContainer } from "@/ui/components/PageContainer";
import { PageHeader } from "@/ui/components/PageHeader";
import { InventoryLotSheet } from "@/ui/components/InventoryLotSheet";
import { LeftoverLotSheet } from "@/ui/components/LeftoverLotSheet";
import {
  evaluateLeftoverGuidance,
  sortLeftoversForReview,
} from "@/domain/kitchen-execution/leftover-safety";
import { pct } from "@/ui/format";

const cName = (id: string, lang: Lang) => {
  const c = COMMODITIES.find((x) => x.id === id);
  return c ? (lang === "en" && c.labelEn ? c.labelEn : c.canonicalVn) : id;
};

export default function PantryPage() {
  const {
    pantry,
    inventoryMovements,
    leftoverLots,
    leftoverMovements,
    addPantry,
    removePantry,
    recordInventoryMovement,
    recordLeftoverMovement,
    plan,
    dish,
  } = useStore();
  const { t, lang } = useI18n();
  const [sel, setSel] = useState("");
  const [qty, setQty] = useState(200);
  const [selectedLot, setSelectedLot] = useState<InventoryLot | null>(null);
  const [selectedLeftover, setSelectedLeftover] = useState<LeftoverLot | null>(null);
  const [guidanceAt] = useState(() => new Date());

  const availableLots = useMemo(() => sortLotsFefo(pantry), [pantry]);
  const matches = useMemo(
    () => (availableLots.length ? cookFromPantry(availableLots, REPERTOIRE).filter((m) => m.coverage >= 0.6).slice(0, 6) : []),
    [availableLots],
  );
  const thawLots = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const day = planDayForDate(plan.weekStart, tomorrow);
    return day === undefined ? [] : frozenLotsNeededForDay(availableLots, plan, day, dish);
  }, [availableLots, plan, dish]);
  const thawNames = [...new Set(thawLots.map((lot) => cName(lot.commodityId, lang)))].join(", ");
  const activeLeftovers = useMemo(
    () => sortLeftoversForReview(leftoverLots, guidanceAt),
    [guidanceAt, leftoverLots],
  );

  const signalClass = (signal: ReturnType<typeof expirySignal>) => {
    if (signal === "overdue" || signal === "today") return "bg-danger/10 text-danger";
    if (signal === "soon") return "bg-amber/15 text-amber-700";
    return "bg-surface text-muted";
  };

  return (
    <PageContainer>
      <PageHeader
        title={t("pantry.title")}
        subtitle={availableLots.length ? t("pantry.count", { n: availableLots.length }) : undefined}
        actions={
          <Link href="/shopping" className="rounded-full border border-hairline px-3 py-1.5 text-sm text-muted active:bg-surface">
            {t("shopping.title")} →
          </Link>
        }
      />

      {thawLots.length > 0 && (
        <section className="mb-4 rounded-[18px] border border-sky-200 bg-sky-50/75 p-4 text-sky-950">
          <h2 className="text-sm font-semibold">{t("inventory.thawTitle")}</h2>
          <p className="mt-1 text-xs leading-relaxed">
            {t("inventory.thawBody", { items: thawNames })}
          </p>
        </section>
      )}

      <section id="leftovers" className="mb-6 scroll-mt-6" aria-labelledby="leftovers-title">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <h2 id="leftovers-title" className="text-sm font-semibold">{t("leftover.listTitle")}</h2>
            <p className="mt-0.5 text-[11px] text-muted">{t("leftover.listHint")}</p>
          </div>
          {activeLeftovers.length > 0 && (
            <span className="tnum rounded-full bg-brand-weak px-2.5 py-1 text-xs font-semibold text-brand">
              {activeLeftovers.length}
            </span>
          )}
        </div>
        {activeLeftovers.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-hairline px-4 py-5 text-center text-xs text-muted">
            {t("leftover.empty")}
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2" data-testid="leftover-lots">
            {activeLeftovers.map((lot) => {
              const guidance = evaluateLeftoverGuidance({
                chilledAt: lot.chilledAt,
                storageLocation: lot.storageLocation,
                now: guidanceAt,
              });
              const attention = guidance.signal === "past-guidance-window"
                ? "bg-danger/10 text-danger"
                : guidance.signal === "review-guidance"
                  ? "bg-amber/15 text-amber-700"
                  : "bg-surface text-muted";
              return (
                <li key={lot.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedLeftover(lot)}
                    aria-label={`${t("leftover.open")}: ${lot.dishLabelSnapshot}`}
                    className="card flex w-full items-center gap-3 p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{lot.dishLabelSnapshot}</span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${attention}`}>
                          {t(`leftover.signal.${guidance.signal}`)}
                        </span>
                        <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted">
                          {t(`leftover.storage.${lot.storageLocation}`)}
                        </span>
                      </span>
                    </span>
                    <span className="tnum shrink-0 text-xs text-muted">
                      {lot.remainingServings} {t("leftover.servingUnit")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {leftoverMovements.length > 0 && (
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-muted">{t("leftover.recent")}</summary>
            <ul className="mt-2 space-y-1.5" data-testid="leftover-activity">
              {leftoverMovements.slice(0, 5).map((movement) => (
                <li key={movement.id} className="flex gap-2 rounded-[12px] bg-surface/45 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate">
                    {movement.dishLabelSnapshot} · {t(`leftover.kind.${movement.kind}`)}
                  </span>
                  <span className="tnum text-muted">
                    {movement.beforeServings} → {movement.afterServings}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <div
        data-pantry-workspace
        className={
          matches.length > 0
            ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_420px]"
            : "block"
        }
      >
        {/* Left – add form + inventory */}
        <div>
          <div className="card mb-4 flex gap-2 p-3">
            <select
              value={sel}
              onChange={(e) => setSel(e.target.value)}
              className="min-w-0 flex-1 rounded-full border border-hairline bg-surface/40 px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">{t("pantry.pick")}</option>
              {COMMODITIES.map((c) => (
                <option key={c.id} value={c.id}>{cName(c.id, lang)}</option>
              ))}
            </select>
            <input
              type="number"
              value={qty}
              min={10}
              step={10}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-20 rounded-full border border-hairline bg-surface/40 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button
              onClick={() => { addPantry(sel, qty, "g"); setSel(""); }}
              disabled={!sel}
              className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white active:bg-brand-hover disabled:opacity-40"
            >
              {t("notes.add")}
            </button>
          </div>

          {availableLots.length === 0 ? (
            <section
              aria-labelledby="pantry-empty-title"
              className="card relative grid min-h-[34vh] place-content-center justify-items-center overflow-hidden p-6 text-center"
            >
              <Blossom size={120} className="pointer-events-none absolute -top-2 text-brand/10" />
              <span className="relative mb-3 text-tertiary"><BasketIcon className="h-12 w-12" /></span>
              <h2 id="pantry-empty-title" className="relative text-base font-semibold">
                {t("pantry.emptyTitle")}
              </h2>
              <p className="relative mt-2 max-w-lg text-sm leading-relaxed text-muted">
                {t("pantry.emptyBody")}
              </p>
              <Link
                href="/shopping"
                className="cta-primary relative mt-5 rounded-full px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {t("pantry.emptyAction")} →
              </Link>
            </section>
          ) : (
            <>
              <div className="mb-2 flex items-end justify-between gap-3">
                <h2 className="text-sm font-semibold">{t("inventory.priority")}</h2>
                <p className="text-[10px] text-muted">{t("inventory.labelDisclaimer")}</p>
              </div>
              <ul data-stagger data-testid="pantry-lots" className="space-y-2">
              {availableLots.map((p, i) => {
                const signal = expirySignal(p);
                const relationLot =
                  !p.legacy && p.id && p.purchasedAt && p.storageLocation
                    ? p as InventoryLot
                    : undefined;
                return (
                <li
                  key={p.id ?? `${p.commodityId}-${i}`}
                  data-lot-id={p.id}
                  style={{ "--i": Math.min(i, 12) } as React.CSSProperties}
                  className="card flex items-center gap-2 p-2"
                >
                  <button
                    type="button"
                    disabled={!relationLot}
                    onClick={() => relationLot && setSelectedLot(relationLot)}
                    aria-label={`${t("inventory.open")}: ${cName(p.commodityId, lang)}`}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px] p-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-default"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{cName(p.commodityId, lang)}</span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${signalClass(signal)}`}>
                          {t(`inventory.signal.${signal}`)}
                        </span>
                        {p.legacy && (
                          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted">
                            {t("inventory.legacy")}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="tnum shrink-0 text-xs text-muted">{p.qty} {p.unit}</span>
                    {p.storageLocation && (
                      <span className="shrink-0 rounded-full bg-surface px-2 py-1 text-[10px] text-muted">
                        {t(`receive.storage.${p.storageLocation}`)}
                      </span>
                    )}
                  </button>
                  {p.legacy && (
                    <button
                      onClick={() => p.id && removePantry(p.id)}
                      disabled={!p.id}
                      aria-label={t("notes.delete")}
                      className="rounded p-1 text-tertiary active:text-danger disabled:opacity-30"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  )}
                </li>
                );
              })}
              </ul>
            </>
          )}

          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold">{t("inventory.recent")}</h2>
            {inventoryMovements.length === 0 ? (
              <p className="text-xs text-muted">{t("inventory.emptyRecent")}</p>
            ) : (
              <ul className="space-y-2" data-testid="inventory-activity">
                {inventoryMovements.slice(0, 8).map((movement) => (
                  <li key={movement.id} className="flex items-center gap-3 rounded-[14px] bg-surface/45 px-3 py-2 text-xs">
                    <span className="min-w-0 flex-1 truncate">
                      {cName(movement.commodityId, lang)} · {t(`inventory.kind.${movement.kind}`)}
                    </span>
                    <span className="tnum text-muted">−{movement.qty} {movement.unit}</span>
                    <span className="tnum font-medium">{movement.qtyAfter} {movement.unit}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right – cook from pantry */}
        {matches.length > 0 && (
          <aside className="h-fit lg:sticky lg:top-6">
            <h2 className="mb-2 text-sm font-semibold">{t("pantry.cookNow")}</h2>
            <ul data-stagger className="space-y-2">
              {matches.map((m, i) => (
                <li key={m.dish.id} style={{ "--i": i } as React.CSSProperties} className="group card card-interactive flex items-center gap-3 p-3">
                  <DishThumb dish={m.dish} size={56} shape="rounded" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{lang === "en" && m.dish.enLabel ? m.dish.enLabel : m.dish.vnName}</p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-hairline">
                      <div className={`h-full rounded-full ${m.coverage >= 0.99 ? "bg-accent" : "bg-amber"}`} style={{ width: `${Math.round(m.coverage * 100)}%` }} />
                    </div>
                    <p className="tnum mt-1 text-[11px] text-muted">
                      {t("pantry.have")} {pct(m.coverage)}
                      {m.missing.length > 0 && ` · ${t("pantry.miss")} ${m.missing.length}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-muted">{t("pantry.deductNote")}</p>
          </aside>
        )}
      </div>

      {selectedLot && (
        <InventoryLotSheet
          lot={selectedLot}
          name={cName(selectedLot.commodityId, lang)}
          onClose={() => setSelectedLot(null)}
          onRecord={recordInventoryMovement}
        />
      )}
      {selectedLeftover && (
        <LeftoverLotSheet
          lot={selectedLeftover}
          onClose={() => setSelectedLeftover(null)}
          onRecord={recordLeftoverMovement}
        />
      )}
    </PageContainer>
  );
}
