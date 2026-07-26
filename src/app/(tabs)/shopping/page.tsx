"use client";

import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import { groupByTrip, type ShoppingItem } from "@/domain/shopping";
import { fmt } from "@/ui/format";

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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 border-b border-hairline bg-bg/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-semibold">{t("shopping.title")}</h1>
      </header>

      {shopping.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted">{t("shopping.empty")}</p>
      ) : (
        <div className="space-y-4 px-4 py-4">
          {groups.map((g) => {
            const byVendor = groupVendors(g.items);
            const total = g.items.length;
            const done = g.items.filter((i) => i.checked).length;
            return (
              <section key={g.trip} className="rounded-[10px] border border-hairline bg-surface/40">
                <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
                  <h2 className="text-sm font-semibold">
                    {g.kind === "dry" ? "🧺" : "🥬"} {tripLabel(g.kind, g.trip, freshCount)}
                  </h2>
                  <span className="tnum text-xs text-muted">
                    {done}/{total}
                  </span>
                </div>
                {byVendor.map(([vendor, items]) => (
                  <div key={vendor}>
                    <p className="px-3 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted">{vendor}</p>
                    <ul>
                      {items.map((it) => (
                        <li key={`${it.commodityId}|${it.vendor}`}>
                          <button
                            onClick={() => toggleShopping(it.commodityId, it.vendor)}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-surface"
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                it.checked ? "border-brand bg-brand text-white" : "border-hairline"
                              }`}
                            >
                              {it.checked && "✓"}
                            </span>
                            <span className={`flex-1 text-sm ${it.checked ? "text-muted line-through" : ""}`}>{name(it.commodityId)}</span>
                            <span className="tnum text-xs text-muted">
                              {fmt(it.qtyTotal)} {it.unit}
                            </span>
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
    </div>
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
