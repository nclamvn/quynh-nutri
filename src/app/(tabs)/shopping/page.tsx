"use client";

import Link from "next/link";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import { groupByTrip, type ShoppingItem } from "@/domain/shopping";
import { fmt } from "@/ui/format";
import { Blossom } from "@/ui/components/Blossom";
import { BasketIcon } from "@/ui/components/icons";
import { PageContainer } from "@/ui/components/PageContainer";
import { PageHeader } from "@/ui/components/PageHeader";

export default function ShoppingPage() {
  const { shopping, toggleShopping, commodity } = useStore();
  const { t, lang } = useI18n();
  const groups = groupByTrip(shopping);

  const name = (id: string) => {
    const c = commodity(id);
    if (!c) return id;
    return lang === "en" && c.labelEn ? c.labelEn : c.canonicalVn;
  };

  const tripLabel = (kind: string, trip: number, freshCount: number) =>
    kind === "dry" ? t("shopping.tripDry") : `${t("shopping.tripFresh")} ${freshCount > 1 ? trip : ""}`.trim();

  const freshCount = groups.filter((g) => g.kind === "fresh").length;
  const vendors = new Set(shopping.map((i) => i.vendor)).size;

  return (
    <PageContainer>
      <PageHeader
        title={t("shopping.title")}
        subtitle={shopping.length ? t("shopping.meta", { items: shopping.length, vendors }) : undefined}
        actions={
          <Link href="/pantry" className="rounded-full border border-hairline px-3 py-1.5 text-sm text-muted active:bg-surface">
            {t("pantry.title")} →
          </Link>
        }
      />

      {shopping.length === 0 ? (
        <div className="relative grid min-h-[45vh] place-content-center justify-items-center text-center">
          <Blossom size={110} className="pointer-events-none absolute -top-2 text-brand/10" />
          <span className="relative mb-3 text-brand/50"><BasketIcon className="h-12 w-12" /></span>
          <p className="relative text-sm font-medium">{t("shopping.empty")}</p>
          <Link href="/week" className="relative mt-2 text-sm font-medium text-brand">{t("week.title")} →</Link>
        </div>
      ) : (
        <div data-stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g, gi) => {
            const byVendor = groupVendors(g.items);
            const total = g.items.length;
            const done = g.items.filter((i) => i.checked).length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            const complete = done === total;
            return (
              <section key={g.trip} style={{ "--i": gi } as React.CSSProperties} className="card h-fit overflow-hidden">
                <div className="border-b border-hairline px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">
                      {g.kind === "dry" ? "🧺" : "🥬"} {tripLabel(g.kind, g.trip, freshCount)}
                    </h2>
                    <span className="tnum text-xs text-muted">{done}/{total}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-hairline">
                    <div className={`h-full rounded-full transition-all ${complete ? "bg-accent" : "bg-brand"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                {byVendor.map(([vendor, items]) => (
                  <div key={vendor}>
                    <p className="px-4 pt-2.5 text-[11px] font-medium uppercase tracking-wide text-muted">{vendor}</p>
                    <ul>
                      {items.map((it) => (
                        <li key={`${it.commodityId}|${it.vendor}`}>
                          <button
                            onClick={() => toggleShopping(it.commodityId, it.vendor)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface/60"
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-transform active:scale-90 ${
                                it.checked ? "border-brand bg-brand text-white" : "border-hairline"
                              }`}
                            >
                              {it.checked && "✓"}
                            </span>
                            <span className={`flex-1 text-sm ${it.checked ? "text-muted line-through" : ""}`}>{name(it.commodityId)}</span>
                            <span className="tnum text-xs text-muted">{fmt(it.qtyTotal)} {it.unit}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

function groupVendors(items: ShoppingItem[]): [string, ShoppingItem[]][] {
  const map = new Map<string, ShoppingItem[]>();
  for (const it of items) {
    const arr = map.get(it.vendor) ?? [];
    arr.push(it);
    map.set(it.vendor, arr);
  }
  return [...map.entries()];
}
