"use client";

import { useMemo, useState, useEffect } from "react";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import { costReport, formatVnd } from "@/domain/cost";

const BUDGET_KEY = "qk-budget-weekly";
const GROUP_LABEL: Record<string, { vn: string; en: string }> = {
  "thịt": { vn: "Thịt", en: "Meat" }, "cá": { vn: "Cá", en: "Fish" },
  "hải sản": { vn: "Hải sản", en: "Seafood" }, "rau": { vn: "Rau", en: "Veg" },
  "trái cây": { vn: "Trái cây", en: "Fruit" }, "ngũ cốc": { vn: "Tinh bột", en: "Grains" },
  "trứng": { vn: "Trứng", en: "Egg" }, "đậu": { vn: "Đậu", en: "Soy" }, "khác": { vn: "Khác", en: "Other" },
};

export default function ReportsPage() {
  const { t, lang } = useI18n();
  const { shopping, commodity } = useStore();
  const [budget, setBudget] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const v = localStorage.getItem(BUDGET_KEY);
    if (v) setBudget(Number(v));
  }, []);

  const report = useMemo(
    () => costReport(shopping, commodity, budget ?? undefined),
    [shopping, commodity, budget],
  );

  const saveBudget = () => {
    const n = Math.round(Number(draft.replace(/\D/g, "")));
    if (n > 0) { localStorage.setItem(BUDGET_KEY, String(n)); setBudget(n); setDraft(""); }
  };
  const clearBudget = () => { localStorage.removeItem(BUDGET_KEY); setBudget(null); };

  const glabel = (g: string) => GROUP_LABEL[g]?.[lang === "en" ? "en" : "vn"] ?? g;
  const maxGroup = report.byGroup[0]?.vnd ?? 1;
  const empty = report.totalCount === 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col pb-10">
      <header className="sticky top-0 z-10 border-b border-hairline bg-bg/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-semibold">{t("reports.title")}</h1>
      </header>

      {empty ? (
        <p className="px-4 py-16 text-center text-sm text-muted">{t("reports.empty")}</p>
      ) : (
        <div className="space-y-4 px-4 py-4">
          {/* Hero — estimated weekly cost */}
          <section className="rounded-[18px] border border-hairline bg-surface/40 p-5">
            <p className="text-[11px] uppercase tracking-wide text-tertiary">{t("reports.costTitle")}</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[32px] font-semibold leading-none">~{formatVnd(report.totalVnd)}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted">{t("reports.estimate")}</p>

            {/* Price coverage — every % states its base */}
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full bg-brand-weak px-2 py-0.5 text-[11px] text-brand-ink">
                {t("reports.priceCoverage")} {report.coveragePct}%
              </span>
              <span className="text-[11px] text-muted">
                {t("reports.ofBasket", { n: report.pricedCount, m: report.totalCount })}
              </span>
            </div>
            {report.coveragePct < 100 && (
              <p className="mt-1.5 text-[11px] text-tertiary">
                {t("reports.lowerBound", { k: report.totalCount - report.pricedCount })}
              </p>
            )}
          </section>

          {/* Budget */}
          <section className="rounded-[18px] border border-hairline bg-surface/40 p-4">
            <p className="text-[11px] uppercase tracking-wide text-tertiary">{t("reports.budget")}</p>
            {budget == null ? (
              <div className="mt-2 flex items-center gap-2">
                <input
                  inputMode="numeric"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveBudget()}
                  placeholder={t("reports.setBudget")}
                  className="min-w-0 flex-1 rounded-full border border-hairline bg-bg px-3.5 py-1.5 text-sm outline-none focus:border-brand"
                />
                <button onClick={saveBudget} className="shrink-0 rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white active:bg-brand-hover">{t("reports.save")}</button>
              </div>
            ) : (
              <>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-sm">{formatVnd(budget)}</span>
                  {report.overBudget ? (
                    <span className="text-sm font-medium text-danger">{t("reports.over")} ~{formatVnd(report.totalVnd - budget)}</span>
                  ) : (
                    <span className="text-sm text-muted">{t("reports.remaining")} ~{formatVnd(report.remainingVnd ?? 0)}</span>
                  )}
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-hairline">
                  <div
                    className={`h-full rounded-full ${report.overBudget ? "bg-danger" : "bg-brand"}`}
                    style={{ width: `${Math.min(100, Math.round((report.totalVnd / budget) * 100))}%` }}
                  />
                </div>
                <button onClick={clearBudget} className="mt-2 text-[11px] text-tertiary active:text-danger">{t("reports.clear")}</button>
              </>
            )}
          </section>

          {/* By group */}
          <section>
            <h2 className="mb-2 px-1 text-xs font-medium text-muted">{t("reports.byGroup")}</h2>
            <div className="space-y-2 rounded-[18px] border border-hairline bg-surface/40 p-4">
              {report.byGroup.map((g) => (
                <div key={g.group}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span>{glabel(g.group)}</span>
                    <span className="text-muted">~{formatVnd(g.vnd)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-hairline">
                    <div className="h-full rounded-full bg-brand/70" style={{ width: `${Math.round((g.vnd / maxGroup) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* By trip */}
          <section>
            <h2 className="mb-2 px-1 text-xs font-medium text-muted">{t("reports.byTrip")}</h2>
            <div className="grid grid-cols-2 gap-2">
              {report.byTrip.map((tr) => (
                <div key={`${tr.trip}-${tr.kind}`} className="rounded-[14px] border border-hairline bg-surface/40 p-3">
                  <p className="text-[11px] text-tertiary">{tr.kind === "dry" ? t("reports.dryTrip") : t("reports.freshTrip", { n: tr.trip })}</p>
                  <p className="mt-0.5 text-sm font-medium">~{formatVnd(tr.vnd)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Priciest items */}
          <section>
            <h2 className="mb-2 px-1 text-xs font-medium text-muted">{t("reports.topItems")}</h2>
            <ul className="divide-y divide-hairline rounded-[18px] border border-hairline bg-surface/40 px-4">
              {report.top.map((l) => (
                <li key={l.commodityId} className="flex items-center justify-between py-2.5 text-[13px]">
                  <span className="min-w-0 truncate">{l.vnName} <span className="text-tertiary">· {Math.round(l.qtyTotal)}g</span></span>
                  <span className="shrink-0 text-muted">~{formatVnd(l.costVnd ?? 0)}</span>
                </li>
              ))}
            </ul>
          </section>

          <p className="px-1 text-[11px] leading-relaxed text-tertiary">{t("reports.footer")}</p>
        </div>
      )}
    </div>
  );
}
