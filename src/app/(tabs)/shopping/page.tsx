"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import type { Commodity } from "@/domain/types";
import { groupByTrip, type ShoppingItem } from "@/domain/shopping";
import { kitchenGuideFor } from "@/data/seed/kitchen-guides";
import { fmt } from "@/ui/format";
import { Blossom } from "@/ui/components/Blossom";
import { BasketIcon } from "@/ui/components/icons";
import { IngredientGuideSheet } from "@/ui/components/IngredientGuideSheet";
import { ReceiveShoppingItemSheet } from "@/ui/components/ReceiveShoppingItemSheet";
import { PageContainer } from "@/ui/components/PageContainer";
import { PageHeader } from "@/ui/components/PageHeader";
import { SupplierOrders } from "@/ui/components/SupplierOrders";

export default function ShoppingPage() {
  const { shopping, plan, receiveShoppingItem, commodity } = useStore();
  const { t, lang } = useI18n();
  const groups = groupByTrip(shopping);
  const [guideCommodity, setGuideCommodity] = useState<Commodity | undefined>();
  const [receivingItem, setReceivingItem] = useState<ShoppingItem | null>(null);

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
        <section
          aria-labelledby="shopping-empty-title"
          className="card relative grid min-h-[42vh] place-content-center justify-items-center overflow-hidden p-6 text-center"
        >
          <Blossom size={110} className="pointer-events-none absolute -top-2 text-brand/10" />
          <span className="relative mb-3 text-brand/50"><BasketIcon className="h-12 w-12" /></span>
          <h2 id="shopping-empty-title" className="relative text-base font-semibold">
            {t("shopping.emptyTitle")}
          </h2>
          <p className="relative mt-2 max-w-lg text-sm leading-relaxed text-muted">
            {t("shopping.emptyBody")}
          </p>
          <Link
            href="/week"
            className="cta-primary relative mt-5 rounded-full px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {t("shopping.emptyAction")} →
          </Link>
        </section>
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
                          <div className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface/60">
                            <button
                              type="button"
                              onClick={() => setReceivingItem(it)}
                              aria-label={`${it.checked ? t("receive.viewBought") : t("kitchen.markBought")}: ${name(it.commodityId)}`}
                              aria-pressed={it.checked}
                              className="shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                            >
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-transform active:scale-90 ${
                                  it.checked ? "border-brand bg-brand text-white" : "border-hairline"
                                }`}
                              >
                                {it.checked && "✓"}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setGuideCommodity(commodity(it.commodityId))}
                              className="min-w-0 flex-1 rounded text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                            >
                              <span className={`block truncate text-sm ${it.checked ? "text-muted line-through" : ""}`}>
                                {name(it.commodityId)}
                              </span>
                              {it.fulfillment && (
                                <span className="mt-0.5 block text-[10px] font-medium text-accent">
                                  {t("receive.actual")}: {fmt(it.fulfillment.actualQty)} {it.fulfillment.unit}
                                </span>
                              )}
                              {kitchenGuideFor(commodity(it.commodityId)) && (
                                <span className="mt-0.5 block text-[10px] font-medium text-brand">
                                  {t("kitchen.openGuide")} →
                                </span>
                              )}
                            </button>
                            <span className="tnum shrink-0 text-xs text-muted">{fmt(it.qtyTotal)} {it.unit}</span>
                          </div>
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

      {shopping.length > 0 && <SupplierOrders />}
      <IngredientGuideSheet commodity={guideCommodity} onClose={() => setGuideCommodity(undefined)} />
      {receivingItem && (
        <ReceiveShoppingItemSheet
          item={receivingItem}
          weekRef={plan.weekStart}
          commodity={commodity(receivingItem.commodityId)}
          onClose={() => setReceivingItem(null)}
          onReceive={receiveShoppingItem}
        />
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
