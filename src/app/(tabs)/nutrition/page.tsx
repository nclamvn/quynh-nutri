"use client";

import { useState } from "react";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import { dayDishes, dayNutrition, memberDayAdequacy } from "@/ui/derive";
import { ProvenanceChip } from "@/ui/components/ProvenanceChip";
import { AdequacyStrip } from "@/ui/components/AdequacyStrip";
import { Donut } from "@/ui/components/Donut";
import { PageContainer } from "@/ui/components/PageContainer";
import { PageHeader } from "@/ui/components/PageHeader";
import { HealthDisclaimer } from "@/ui/components/HealthDisclaimer";
import { pct } from "@/ui/format";
import { lifeStageMicros } from "@/data/seed/lifestage";
import { pregnancyWarnings, hasPregnancyData } from "@/domain/dish/pregnancy";
import { isPregnant } from "@/domain/health";
import { COMMODITIES } from "@/data/seed/commodity";
import type { FoodGroup } from "@/domain/nutrition";

const MACRO_FIELDS: { field: "kcal" | "proteinG" | "carbG" | "fatG" | "fiberG"; label: string; unit: string }[] = [
  { field: "kcal", label: "Năng lượng", unit: "kcal" },
  { field: "proteinG", label: "Đạm", unit: "g" },
  { field: "carbG", label: "Tinh bột", unit: "g" },
  { field: "fatG", label: "Béo", unit: "g" },
  { field: "fiberG", label: "Xơ", unit: "g" },
];

const GROUP_COLORS: [FoodGroup, string][] = [
  ["đạm", "var(--chart-protein)"],
  ["tinh bột", "var(--chart-carb)"],
  ["xơ", "var(--chart-fiber)"],
  ["béo", "var(--chart-fat)"],
  ["trái cây", "var(--chart-fruit)"],
];

export default function NutritionPage() {
  const { plan, household, dish, commodity } = useStore();
  const { t } = useI18n();
  const [day, setDay] = useState(0);
  const [memberId, setMemberId] = useState<string>("household");

  const dishes = dayDishes(plan, day, dish);
  const nut = dayNutrition(dishes, household, commodity);
  const member = household.members.find((m) => m.id === memberId);
  const adequacy = member ? memberDayAdequacy(dishes, member, household, commodity) : nut.adequacy;

  const memberLabel = (id: string) => {
    if (id === "household") return t("nutrition.household");
    const m = household.members.find((x) => x.id === id)!;
    return m.role === "adult" ? (m.sex === "M" ? "Bố" : "Mẹ") : `Bé ${m.ageBand}`;
  };

  const presentCore = (["đạm", "tinh bột", "xơ", "béo"] as const).filter((g) => nut.groups.present.has(g)).length;
  const groupSegments = GROUP_COLORS.map(([g, color]) => ({ color, on: nut.groups.present.has(g) }));

  // T1 life-stage (wellness). Honest_null everywhere until sources are seeded.
  const lifeStage = member?.healthProfile?.lifeStage;
  const hasStage = !!lifeStage && lifeStage !== "none";
  const micros = member ? lifeStageMicros(member) : [];
  const pregnant = !!lifeStage && isPregnant(lifeStage);
  const warnings = pregnant && member
    ? dishes.flatMap((d) => pregnancyWarnings(d, member, commodity).map((w) => ({ ...w, dish: d.vnName })))
    : [];
  const hazardRegistrySeeded = hasPregnancyData(COMMODITIES);

  return (
    <PageContainer>
      <PageHeader title={t("nutrition.title")} subtitle={t("nutrition.perDay")} sticky>
        <div className="space-y-1.5">
          <div className="scroll-x-thin flex gap-1.5 overflow-x-auto pb-2.5 pt-0.5">
            {Array.from({ length: 7 }, (_, d) => (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs ${day === d ? "border border-brand bg-brand-weak text-brand" : "glass text-muted"}`}
              >
                {t(`day.${d}`)}
              </button>
            ))}
          </div>
          <div className="scroll-x-thin flex gap-1.5 overflow-x-auto pb-2.5 pt-0.5">
            {["household", ...household.members.map((m) => m.id)].map((id) => (
              <button
                key={id}
                onClick={() => setMemberId(id)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs ${memberId === id ? "border border-brand bg-brand-weak text-brand" : "glass text-muted"}`}
              >
                {memberLabel(id)}
              </button>
            ))}
          </div>
        </div>
      </PageHeader>

      {hasStage && <HealthDisclaimer className="mb-4" />}

      <div data-stagger className="grid gap-4 lg:grid-cols-2">
        <section style={{ "--i": 0 } as React.CSSProperties} className="card p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <span className="truncate">{memberLabel(memberId)}</span>
              {hasStage && (
                <span className="shrink-0 rounded-full bg-brand-weak px-2 py-0.5 text-[10px] font-normal text-brand-ink">{t(`health.stage.${lifeStage}`)}</span>
              )}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                nut.display.mode === "number" ? "bg-accent-weak text-accent" : "bg-amber-weak text-amber"
              }`}
            >
              {nut.display.mode === "number"
                ? `${t("nutrition.coverage")} ${pct(nut.display.coverage)}`
                : `${t("nutrition.estimate")} · ${pct(nut.display.coverage)}`}
            </span>
          </div>

          <div className="mb-4">
            <AdequacyStrip adequacy={adequacy} />
            {hasStage && (lifeStage === "lactating_0_6" || lifeStage?.startsWith("pregnant")) && (
              <p className="mt-1 text-[11px] text-tertiary">{t("health.needAdjusted")}</p>
            )}
          </div>

          <ul className="space-y-2.5">
            {MACRO_FIELDS.map(({ field, label, unit }) => (
              <li key={field} className="flex items-center justify-between border-t border-hairline pt-2.5 first:border-0 first:pt-0">
                <span className="text-sm text-muted">{label}</span>
                <ProvenanceChip display={nut.display} field={field} unit={unit} showCoverage={false} />
              </li>
            ))}
          </ul>

          {/* Key micronutrients for this stage — honest_null until a sourced RNI is seeded. */}
          {hasStage && micros.length > 0 && (
            <div className="mt-4 border-t border-hairline pt-3">
              <p className="mb-2 text-xs font-medium text-muted">{t("health.microTitle", { stage: t(`health.stage.${lifeStage}`) })}</p>
              <ul className="space-y-2">
                {micros.map((mi) => (
                  <li key={mi.nutrient} className="flex items-center justify-between text-sm">
                    <span className="text-muted">{t(`health.micro.${mi.nutrient}`)}</span>
                    {mi.need == null ? (
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted" /> {t("health.microNull")}
                      </span>
                    ) : (
                      <span className="tnum text-[13px]">{mi.need}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pregnancy avoid-list — soft, sourced (never excludes). */}
          {pregnant && (
            <div className="mt-4 border-t border-hairline pt-3">
              <p className="mb-2 text-xs font-medium text-muted">{t("health.avoidTitle")}</p>
              {!hazardRegistrySeeded ? (
                <p className="text-[12px] text-tertiary">{t("health.avoidPending")}</p>
              ) : warnings.length === 0 ? (
                <p className="text-[12px] text-accent">✓ {t("health.avoidNone")}</p>
              ) : (
                <ul className="space-y-1.5">
                  {warnings.map((w, i) => (
                    <li key={i} className="flex items-center gap-2 text-[12px]">
                      <span className="rounded-full bg-amber-weak px-2 py-0.5 text-amber">{t(`health.hazard.${w.hazard}`)}</span>
                      <span className="min-w-0 flex-1 truncate text-muted">{w.dish} · {commodity(w.commodityId)?.canonicalVn ?? w.commodityId}</span>
                      <span className="shrink-0 text-tertiary">{w.source}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        <section style={{ "--i": 1 } as React.CSSProperties} className="card flex flex-col items-center p-5">
          <Donut segments={groupSegments} label={`${presentCore}/4`} sublabel={t("ov.groupsMet")} size={132} />
          <h2 className="mt-4 text-sm font-semibold">
            {nut.groups.missingCore.length === 0 ? `✓ ${t("nutrition.groupsOk")}` : `${t("nutrition.missingGroups")}: ${nut.groups.missingCore.join(", ")}`}
          </h2>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {GROUP_COLORS.map(([g, color]) => {
              const present = nut.groups.present.has(g);
              return (
                <span
                  key={g}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${present ? "bg-surface text-ink" : "bg-surface text-muted line-through"}`}
                >
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: color, opacity: present ? 1 : 0.25 }} />
                  {g}
                </span>
              );
            })}
          </div>
          {nut.groups.hasFruit && <p className="mt-3 text-[11px] text-accent">🍊 {t("nutrition.fruit")}</p>}
        </section>
      </div>
    </PageContainer>
  );
}
