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
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-hairline bg-bg/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-semibold">{t("pantry.title")}</h1>
        <Link href="/shopping" className="rounded-full border border-hairline px-3 py-1 text-xs text-muted active:bg-surface">
          {t("shopping.title")} →
        </Link>
      </header>

      <div className="px-4 py-4">
        {/* Add form */}
        <div className="mb-4 flex gap-2">
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
          <div className="relative flex flex-col items-center py-16 text-center">
            <Blossom size={120} className="pointer-events-none absolute -top-2 text-brand/10" />
            <span className="relative mb-3 text-tertiary"><BasketIcon className="h-12 w-12" /></span>
            <p className="text-sm text-muted">{t("pantry.empty")}</p>
          </div>
        ) : (
          <>
            <ul className="mb-6 space-y-2">
              {pantry.map((p) => (
                <li key={p.commodityId} className="flex items-center gap-3 rounded-[14px] border border-hairline bg-surface/40 p-3">
                  <span className="flex-1 text-sm">{cName(p.commodityId, lang)}</span>
                  <span className="tnum text-xs text-muted">{p.qty} {p.unit}</span>
                  <button onClick={() => removePantry(p.commodityId)} aria-label={t("notes.delete")} className="rounded p-1 text-tertiary active:text-danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                </li>
              ))}
            </ul>

            {/* Cook from pantry */}
            {matches.length > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-semibold">{t("pantry.cookNow")}</h2>
                <ul className="space-y-2">
                  {matches.map((m) => (
                    <li key={m.dish.id} className="flex items-center gap-3 rounded-[14px] border border-hairline bg-surface/40 p-3">
                      <DishThumb dish={m.dish} size={48} shape="rounded" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{lang === "en" && m.dish.enLabel ? m.dish.enLabel : m.dish.vnName}</p>
                        <p className="tnum text-[11px] text-muted">
                          {t("pantry.have")} {pct(m.coverage)}
                          {m.missing.length > 0 && ` · ${t("pantry.miss")} ${m.missing.length}`}
                        </p>
                      </div>
                      <span className={`h-2 w-2 shrink-0 rounded-full ${m.coverage >= 0.99 ? "bg-accent" : "bg-amber"}`} />
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] text-muted">{t("pantry.deductNote")}</p>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
