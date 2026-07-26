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
import { pct } from "@/ui/format";
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

  return (
    <PageContainer>
      <PageHeader title={t("nutrition.title")} subtitle={t("nutrition.perDay")} sticky>
        <div className="space-y-1.5">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {Array.from({ length: 7 }, (_, d) => (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs ${day === d ? "border-brand bg-brand-weak text-brand" : "border-hairline text-muted"}`}
              >
                {t(`day.${d}`)}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {["household", ...household.members.map((m) => m.id)].map((id) => (
              <button
                key={id}
                onClick={() => setMemberId(id)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs ${memberId === id ? "border-brand bg-brand-weak text-brand" : "border-hairline text-muted"}`}
              >
                {memberLabel(id)}
              </button>
            ))}
          </div>
        </div>
      </PageHeader>

      <div data-stagger className="grid gap-4 lg:grid-cols-2">
        <section style={{ "--i": 0 } as React.CSSProperties} className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">{memberLabel(memberId)}</span>
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
          </div>

          <ul className="space-y-2.5">
            {MACRO_FIELDS.map(({ field, label, unit }) => (
              <li key={field} className="flex items-center justify-between border-t border-hairline pt-2.5 first:border-0 first:pt-0">
                <span className="text-sm text-muted">{label}</span>
                <ProvenanceChip display={nut.display} field={field} unit={unit} showCoverage={false} />
              </li>
            ))}
          </ul>
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
