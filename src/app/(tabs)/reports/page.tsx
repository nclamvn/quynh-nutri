"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { formatVnd } from "@/domain/cost";
import { weeklyFeedback, type CoverageAmount } from "@/domain/feedback";
import { useI18n } from "@/i18n/context";
import { Blossom } from "@/ui/components/Blossom";
import { PageContainer } from "@/ui/components/PageContainer";
import { PageHeader } from "@/ui/components/PageHeader";
import { useCountUp } from "@/ui/hooks/useCountUp";
import { useLocalStorageValue } from "@/ui/hooks/useLocalStorageValue";
import { useStore } from "@/ui/store";

const BUDGET_KEY = "qk-budget-weekly";
const GROUP_LABEL: Record<string, { vn: string; en: string }> = {
  "thịt": { vn: "Thịt", en: "Meat" },
  "cá": { vn: "Cá", en: "Fish" },
  "hải sản": { vn: "Hải sản", en: "Seafood" },
  "rau": { vn: "Rau", en: "Veg" },
  "trái cây": { vn: "Trái cây", en: "Fruit" },
  "ngũ cốc": { vn: "Tinh bột", en: "Grains" },
  "trứng": { vn: "Trứng", en: "Egg" },
  "đậu": { vn: "Đậu", en: "Soy" },
  "khác": { vn: "Khác", en: "Other" },
};
const GROUP_COLOR: Record<string, string> = {
  "thịt": "var(--chart-carb)",
  "cá": "var(--chart-protein)",
  "hải sản": "var(--chart-protein)",
  "rau": "var(--chart-fiber)",
  "trái cây": "var(--chart-fruit)",
  "ngũ cốc": "var(--chart-fat)",
  "trứng": "var(--chart-fat)",
  "đậu": "var(--chart-fiber)",
  "khác": "var(--muted)",
};

function Coverage({
  amount,
  label,
}: {
  amount: CoverageAmount;
  label: string;
}) {
  if (amount.totalCount === 0) return null;
  return (
    <span className="text-[11px] leading-relaxed text-tertiary">
      {label} {amount.pricedCount}/{amount.totalCount} · {amount.coveragePct}%
    </span>
  );
}

function StageCard({
  index,
  title,
  active,
  children,
}: {
  index: string;
  title: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <section
      data-feedback-stage={index}
      className={`relative min-w-0 border-t px-4 pb-4 pt-5 first:border-t-0 md:border-l md:border-t-0 md:first:border-l-0 ${
        active ? "border-brand/25" : "border-hairline"
      }`}
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-full border text-[11px] font-semibold tnum ${
            active
              ? "border-brand/35 bg-brand-weak text-brand-ink"
              : "border-hairline bg-surface text-tertiary"
          }`}
        >
          {index}
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StageEmpty({ children, href, action }: {
  children: ReactNode;
  href: string;
  action: string;
}) {
  return (
    <div className="space-y-3">
      <p className="min-h-10 text-[13px] leading-relaxed text-muted">{children}</p>
      <Link href={href} className="inline-flex min-h-9 items-center text-xs font-medium text-brand">
        {action} <span aria-hidden className="ml-1">→</span>
      </Link>
    </div>
  );
}

export default function ReportsPage() {
  const { t, lang } = useI18n();
  const {
    shopping,
    commodity,
    household,
    plan,
    fulfillments,
    inventoryMovements,
    leftoverLots,
    leftoverMovements,
    purchases,
    dish,
  } = useStore();
  const [storedBudget, setStoredBudget] = useLocalStorageValue(`${BUDGET_KEY}:${household.id}`);
  const budget = storedBudget ? Number(storedBudget) : null;
  const [draft, setDraft] = useState("");

  const feedback = useMemo(
    () => weeklyFeedback({
      weekRef: plan.weekStart,
      hasPlan: plan.slots.length > 0,
      shopping,
      fulfillments,
      inventoryMovements,
      leftoverLots,
      leftoverMovements,
      purchases,
      commodity,
      dish,
      budgetWeeklyVnd: budget ?? undefined,
    }),
    [
      budget,
      commodity,
      dish,
      fulfillments,
      inventoryMovements,
      leftoverLots,
      leftoverMovements,
      plan.slots.length,
      plan.weekStart,
      purchases,
      shopping,
    ],
  );

  const saveBudget = () => {
    const value = Math.round(Number(draft.replace(/\D/g, "")));
    if (value > 0) {
      setStoredBudget(String(value));
      setDraft("");
    }
  };
  const clearBudget = () => setStoredBudget(null);
  const groupLabel = (group: string) =>
    GROUP_LABEL[group]?.[lang === "en" ? "en" : "vn"] ?? group;
  const planned = feedback.planned;
  const maxGroup = planned.byGroup[0]?.vnd ?? 1;
  const animatedPlanned = Math.round(useCountUp(planned.totalVnd));
  const hasAnyStage = Object.values(feedback.stages).some(Boolean);
  const actualLabel = feedback.actualSpend.lowerBound
    ? t("reports.atLeast")
    : t("reports.confirmed");

  return (
    <PageContainer>
      <PageHeader
        title={t("reports.title")}
        subtitle={t("reports.feedbackSubtitle", { week: feedback.weekRef })}
      />

      {!hasAnyStage ? (
        <div className="grid min-h-[42vh] place-content-center px-5 text-center">
          <Blossom size={80} className="mx-auto mb-5 text-brand/20" />
          <p className="text-sm font-medium">{t("reports.empty")}</p>
          <Link href="/week" className="mt-3 text-xs font-medium text-brand">
            {t("reports.openWeek")} →
          </Link>
        </div>
      ) : (
        <div data-stagger className="grid gap-4">
          <section
            style={{ "--i": 0 } as React.CSSProperties}
            className="grain card relative overflow-hidden"
          >
            <Blossom
              size={150}
              className="pointer-events-none absolute -right-8 -top-10 -rotate-6 text-brand/[0.07]"
            />
            <div className="relative border-b border-hairline px-5 py-5 lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end lg:gap-8">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
                  {t("reports.feedbackEyebrow")}
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  {t("reports.feedbackTitle")}
                </h2>
              </div>
              <p className="mt-2 text-pretty text-xs leading-relaxed text-muted lg:mt-0 lg:text-right xl:whitespace-nowrap">
                {t("reports.feedbackHonesty")}
              </p>
            </div>

            <div className="relative grid md:grid-cols-2 xl:grid-cols-4">
              <StageCard index="01" title={t("reports.stagePlan")} active={feedback.stages.planned}>
                {feedback.stages.planned ? (
                  <div>
                    {planned.totalCount > 0 ? (
                      <>
                        <p className="tnum text-2xl font-semibold">~{formatVnd(animatedPlanned)}</p>
                        <p className="mt-1 text-[11px] text-muted">{t("reports.referenceEstimate")}</p>
                        <div className="mt-3">
                          <Coverage
                            amount={{
                              valueVnd: planned.totalVnd,
                              pricedCount: planned.pricedCount,
                              totalCount: planned.totalCount,
                              coveragePct: planned.coveragePct,
                              lowerBound: planned.pricedCount < planned.totalCount,
                            }}
                            label={t("reports.priceCoverage")}
                          />
                        </div>
                      </>
                    ) : (
                      <p className="text-[13px] leading-relaxed text-muted">
                        {t("reports.noPurchaseNeeded")}
                      </p>
                    )}
                  </div>
                ) : (
                  <StageEmpty href="/week" action={t("reports.openWeek")}>
                    {t("reports.stagePlanEmpty")}
                  </StageEmpty>
                )}
              </StageCard>

              <StageCard index="02" title={t("reports.stageBought")} active={feedback.stages.bought}>
                {feedback.stages.bought ? (
                  <div>
                    <p className="text-[11px] text-muted">{actualLabel}</p>
                    <p className="mt-1 tnum text-2xl font-semibold">
                      {formatVnd(feedback.actualSpend.valueVnd)}
                    </p>
                    <div className="mt-3">
                      <Coverage amount={feedback.actualSpend} label={t("reports.loggedPrice")} />
                    </div>
                    {feedback.actualSpend.lowerBound && (
                      <p className="mt-2 text-[11px] leading-relaxed text-tertiary">
                        {t("reports.actualLowerBound")}
                      </p>
                    )}
                  </div>
                ) : (
                  <StageEmpty href="/shopping" action={t("reports.openShopping")}>
                    {t("reports.stageBoughtEmpty")}
                  </StageEmpty>
                )}
              </StageCard>

              <StageCard index="03" title={t("reports.stageUsed")} active={feedback.stages.used}>
                {feedback.stages.used ? (
                  <div className="space-y-3">
                    <div>
                      <p className="tnum text-2xl font-semibold">
                        {feedback.inventory.consumed.totalCount}
                      </p>
                      <p className="text-[11px] text-muted">{t("reports.pantryUseEvents")}</p>
                    </div>
                    {feedback.leftovers.consumedServings > 0 && (
                      <div>
                        <p className="tnum text-sm font-semibold">
                          {feedback.leftovers.consumedServings.toLocaleString(lang === "en" ? "en-US" : "vi-VN")} {t("reports.servings")}
                        </p>
                        <p className="text-[11px] text-muted">
                          {t("reports.leftoverReused")} · ~{formatVnd(feedback.leftovers.reusedEstimated.valueVnd)}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <StageEmpty href="/pantry" action={t("reports.openPantry")}>
                    {t("reports.stageUsedEmpty")}
                  </StageEmpty>
                )}
              </StageCard>

              <StageCard index="04" title={t("reports.stageDiscarded")} active={feedback.stages.discarded}>
                {feedback.stages.discarded ? (
                  <div className="space-y-3">
                    {feedback.inventory.discarded.totalCount > 0 && (
                      <div>
                        <p className="text-[11px] text-muted">{t("reports.paidIngredientWaste")}</p>
                        <p className="mt-1 tnum text-lg font-semibold">
                          {feedback.inventory.discarded.lowerBound ? "≥" : ""}
                          {formatVnd(feedback.inventory.discarded.valueVnd)}
                        </p>
                      </div>
                    )}
                    {feedback.leftovers.discardedServings > 0 && (
                      <div>
                        <p className="text-[11px] text-muted">{t("reports.leftoverWasteEstimate")}</p>
                        <p className="mt-1 tnum text-lg font-semibold">
                          ~{formatVnd(feedback.leftovers.discardedEstimated.valueVnd)}
                        </p>
                      </div>
                    )}
                    <p className="text-[11px] leading-relaxed text-tertiary">
                      {t("reports.wasteSeparate")}
                    </p>
                  </div>
                ) : (
                  <StageEmpty href="/pantry" action={t("reports.openPantry")}>
                    {t("reports.stageDiscardedEmpty")}
                  </StageEmpty>
                )}
              </StageCard>
            </div>
          </section>

          {feedback.quantityVariance.totalCount > 0 && (
            <section
              data-feedback-variance
              style={{ "--i": 1 } as React.CSSProperties}
              className="card grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
                  {t("reports.quantityVariance")}
                </p>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
                  {t("reports.quantityVarianceHint")}
                </p>
              </div>
              <div className="min-w-32 rounded-[16px] border border-hairline bg-surface/50 p-3">
                <p className="text-[11px] text-muted">{t("reports.avoidedAtPaidRate")}</p>
                <p className="mt-1 tnum text-lg font-semibold text-success">
                  {formatVnd(feedback.quantityVariance.avoidedSpendVnd)}
                </p>
              </div>
              <div className="min-w-32 rounded-[16px] border border-hairline bg-surface/50 p-3">
                <p className="text-[11px] text-muted">{t("reports.extraAtPaidRate")}</p>
                <p className="mt-1 tnum text-lg font-semibold text-danger">
                  {formatVnd(feedback.quantityVariance.extraSpendVnd)}
                </p>
              </div>
              <p className="text-[11px] text-tertiary md:col-span-3">
                {t("reports.comparableCoverage", {
                  n: feedback.quantityVariance.comparableCount,
                  m: feedback.quantityVariance.totalCount,
                })}
              </p>
            </section>
          )}

          {(feedback.inventory.lines.length > 0 || feedback.leftovers.lines.length > 0) && (
            <section
              data-feedback-evidence
              style={{ "--i": 2 } as React.CSSProperties}
              className="card overflow-hidden"
            >
              <div className="border-b border-hairline px-5 py-4">
                <h2 className="text-sm font-semibold">{t("reports.evidenceTitle")}</h2>
                <p className="mt-1 text-[11px] text-muted">{t("reports.evidenceHint")}</p>
              </div>
              <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-hairline">
                <div className="p-5">
                  <h3 className="text-xs font-medium text-muted">{t("reports.inventoryEvidence")}</h3>
                  {feedback.inventory.lines.length > 0 ? (
                    <ul className="mt-2 divide-y divide-hairline">
                      {feedback.inventory.lines.map((line) => (
                        <li key={line.movementId} className="flex items-center justify-between gap-4 py-3 text-[13px]">
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{line.label}</span>
                            <span className="text-[11px] text-muted">
                              {line.kind === "consumed" ? t("reports.used") : t("reports.discarded")} · {line.qty.toLocaleString(lang === "en" ? "en-US" : "vi-VN")} {line.unit}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs text-muted">
                            {line.valueVnd == null ? t("reports.noLinkedPrice") : formatVnd(line.valueVnd)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-tertiary">{t("reports.noInventoryEvidence")}</p>
                  )}
                </div>
                <div className="border-t border-hairline p-5 lg:border-t-0">
                  <h3 className="text-xs font-medium text-muted">{t("reports.leftoverEvidence")}</h3>
                  {feedback.leftovers.lines.length > 0 ? (
                    <ul className="mt-2 divide-y divide-hairline">
                      {feedback.leftovers.lines.map((line) => (
                        <li key={line.movementId} className="flex items-center justify-between gap-4 py-3 text-[13px]">
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{line.dishLabel}</span>
                            <span className="text-[11px] text-muted">
                              {line.kind === "consumed" ? t("reports.reused") : t("reports.discarded")} · {line.servings.toLocaleString(lang === "en" ? "en-US" : "vi-VN")} {t("reports.servings")}
                            </span>
                          </span>
                          <span className="shrink-0 text-right text-xs text-muted">
                            ~{formatVnd(line.estimatedValueVnd)}
                            <span className="block text-[10px] text-tertiary">
                              {line.pricedIngredientCount}/{line.ingredientCount} {t("reports.ingredientsPriced")}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-tertiary">{t("reports.noLeftoverEvidence")}</p>
                  )}
                  {feedback.leftovers.correctionCount > 0 && (
                    <p className="mt-3 text-[11px] leading-relaxed text-tertiary">
                      {t("reports.correctionsExcluded", { n: feedback.leftovers.correctionCount })}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          <div className="grid gap-4 lg:grid-cols-12">
            <section
              style={{ "--i": 3, borderInlineStartColor: "var(--chart-fruit)" } as React.CSSProperties}
              className="card col-span-full border-l-[3px] p-4 lg:col-span-5"
            >
              <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--chart-fruit)" }}>
                {t("reports.budget")}
              </p>
              {budget == null ? (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    inputMode="numeric"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && saveBudget()}
                    placeholder={t("reports.setBudget")}
                    className="min-h-10 min-w-0 flex-1 rounded-full border border-hairline bg-bg px-3.5 text-sm outline-none focus:border-brand"
                  />
                  <button
                    onClick={saveBudget}
                    className="min-h-10 shrink-0 rounded-full bg-brand px-4 text-sm font-medium text-white active:bg-brand-hover"
                  >
                    {t("reports.save")}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-2 flex items-baseline justify-between gap-3">
                    <span className="text-sm">{formatVnd(budget)}</span>
                    {planned.overBudget ? (
                      <span className="text-right text-sm font-medium text-danger">
                        {t("reports.over")} ~{formatVnd(planned.totalVnd - budget)}
                      </span>
                    ) : (
                      <span className="text-right text-sm text-muted">
                        {t("reports.remaining")} ~{formatVnd(planned.remainingVnd ?? 0)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-hairline">
                    <div
                      className={`h-full rounded-full ${planned.overBudget ? "bg-danger" : "bg-brand"}`}
                      style={{ width: `${Math.min(100, Math.round((planned.totalVnd / budget) * 100))}%` }}
                    />
                  </div>
                  <button onClick={clearBudget} className="mt-2 min-h-8 text-[11px] text-tertiary active:text-danger">
                    {t("reports.clear")}
                  </button>
                </>
              )}
              <p className="mt-2 text-[10px] leading-relaxed text-tertiary">{t("reports.budgetScope")}</p>
            </section>

            <section style={{ "--i": 4 } as React.CSSProperties} className="card col-span-full p-5 lg:col-span-7">
              <h2 className="mb-3 text-xs font-medium text-muted">{t("reports.byGroup")}</h2>
              {planned.byGroup.length > 0 ? (
                <div className="space-y-2.5">
                  {planned.byGroup.map((group) => (
                    <div key={group.group}>
                      <div className="mb-1 flex justify-between text-[13px]">
                        <span>{groupLabel(group.group)}</span>
                        <span className="text-muted">~{formatVnd(group.vnd)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-hairline">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round((group.vnd / maxGroup) * 100)}%`,
                            background: GROUP_COLOR[group.group] ?? "var(--brand)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-tertiary">{t("reports.noCostBreakdown")}</p>
              )}
            </section>

            {planned.byTrip.length > 0 && (
              <section style={{ "--i": 5 } as React.CSSProperties} className="card col-span-full p-5 lg:col-span-5">
                <h2 className="mb-3 text-xs font-medium text-muted">{t("reports.byTrip")}</h2>
                <div className="grid grid-cols-2 gap-2">
                  {planned.byTrip.map((trip) => (
                    <div key={`${trip.trip}-${trip.kind}`} className="rounded-[14px] border border-hairline bg-surface/40 p-3">
                      <p className="text-[11px] text-tertiary">
                        {trip.kind === "dry" ? t("reports.dryTrip") : t("reports.freshTrip", { n: trip.trip })}
                      </p>
                      <p className="mt-0.5 text-sm font-medium">~{formatVnd(trip.vnd)}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {planned.top.length > 0 && (
              <section style={{ "--i": 6 } as React.CSSProperties} className="card col-span-full p-5 lg:col-span-7">
                <h2 className="mb-2 text-xs font-medium text-muted">{t("reports.topItems")}</h2>
                <ul className="divide-y divide-hairline">
                  {planned.top.map((line) => (
                    <li key={line.commodityId} className="flex items-center justify-between gap-4 py-2.5 text-[13px]">
                      <span className="min-w-0 truncate">
                        {line.vnName} <span className="text-tertiary">· {Math.round(line.qtyTotal)}g</span>
                      </span>
                      <span className="shrink-0 text-muted">~{formatVnd(line.costVnd ?? 0)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <p className="text-[11px] leading-relaxed text-tertiary">{t("reports.footer")}</p>
        </div>
      )}
    </PageContainer>
  );
}
