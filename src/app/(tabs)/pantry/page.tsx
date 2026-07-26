"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import type { Lang } from "@/i18n/context";
import { COMMODITIES } from "@/data/seed/commodity";
import { REPERTOIRE } from "@/data/seed/repertoire";
import { cookFromPantry } from "@/domain/pantry";
import { DishThumb } from "@/ui/components/DishThumb";
import { Blossom } from "@/ui/components/Blossom";
import { BasketIcon } from "@/ui/components/icons";
import { PageContainer } from "@/ui/components/PageContainer";
import { PageHeader } from "@/ui/components/PageHeader";
import { pct } from "@/ui/format";

const cName = (id: string, lang: Lang) => {
  const c = COMMODITIES.find((x) => x.id === id);
  return c ? (lang === "en" && c.labelEn ? c.labelEn : c.canonicalVn) : id;
};

export default function PantryPage() {
  const { pantry, addPantry, removePantry, dish } = useStore();
  const { t, lang } = useI18n();
  const [sel, setSel] = useState("");
  const [qty, setQty] = useState(200);

  const matches = useMemo(
    () => (pantry.length ? cookFromPantry(pantry, REPERTOIRE).filter((m) => m.coverage >= 0.6).slice(0, 6) : []),
    [pantry],
  );

  return (
    <PageContainer>
      <PageHeader
        title={t("pantry.title")}
        subtitle={pantry.length ? t("pantry.count", { n: pantry.length }) : undefined}
        actions={
          <Link href="/shopping" className="rounded-full border border-hairline px-3 py-1.5 text-sm text-muted active:bg-surface">
            {t("shopping.title")} →
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Left — add form + inventory */}
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

          {pantry.length === 0 ? (
            <div className="relative grid min-h-[35vh] place-content-center justify-items-center text-center">
              <Blossom size={120} className="pointer-events-none absolute -top-2 text-brand/10" />
              <span className="relative mb-3 text-tertiary"><BasketIcon className="h-12 w-12" /></span>
              <p className="relative text-sm text-muted">{t("pantry.empty")}</p>
            </div>
          ) : (
            <ul data-stagger className="space-y-2">
              {pantry.map((p, i) => (
                <li key={p.commodityId} style={{ "--i": Math.min(i, 12) } as React.CSSProperties} className="card flex items-center gap-3 p-3">
                  <span className="flex-1 text-sm">{cName(p.commodityId, lang)}</span>
                  <span className="tnum text-xs text-muted">{p.qty} {p.unit}</span>
                  <button onClick={() => removePantry(p.commodityId)} aria-label={t("notes.delete")} className="rounded p-1 text-tertiary active:text-danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right — cook from pantry */}
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
    </PageContainer>
  );
}
