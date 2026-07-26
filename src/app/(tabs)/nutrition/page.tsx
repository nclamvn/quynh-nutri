"use client";

import { useState } from "react";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import { dayDishes, dayNutrition, memberDayAdequacy } from "@/ui/derive";
import { ProvenanceChip } from "@/ui/components/ProvenanceChip";
import { AdequacyStrip } from "@/ui/components/AdequacyStrip";
import { pct } from "@/ui/format";

const MACRO_FIELDS: { field: "kcal" | "proteinG" | "carbG" | "fatG" | "fiberG"; label: string; unit: string }[] = [
  { field: "kcal", label: "Năng lượng", unit: "kcal" },
  { field: "proteinG", label: "Đạm", unit: "g" },
  { field: "carbG", label: "Tinh bột", unit: "g" },
  { field: "fatG", label: "Béo", unit: "g" },
  { field: "fiberG", label: "Xơ", unit: "g" },
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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 border-b border-hairline bg-bg/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-semibold">{t("nutrition.title")}</h1>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {Array.from({ length: 7 }, (_, d) => (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
                day === d ? "border-brand bg-brand-weak text-brand" : "border-hairline text-muted"
              }`}
            >
              {t(`day.${d}`)}
            </button>
          ))}
        </div>
        <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-1">
          {["household", ...household.members.map((m) => m.id)].map((id) => (
            <button
              key={id}
              onClick={() => setMemberId(id)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
                memberId === id ? "border-brand bg-brand-weak text-brand" : "border-hairline text-muted"
              }`}
            >
              {memberLabel(id)}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-4 px-4 py-4">
        <section className="rounded-[10px] border border-hairline bg-surface/40 p-4">
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

          <ul className="space-y-2">
            {MACRO_FIELDS.map(({ field, label, unit }) => (
              <li key={field} className="flex items-center justify-between">
                <span className="text-sm text-muted">{label}</span>
                <ProvenanceChip display={nut.display} field={field} unit={unit} showCoverage={false} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[10px] border border-hairline bg-surface/40 p-4">
          <h2 className="mb-2 text-sm font-semibold">
            {nut.groups.missingCore.length === 0 ? `✓ ${t("nutrition.groupsOk")}` : t("nutrition.missingGroups")}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {(["đạm", "tinh bột", "xơ", "béo", "trái cây"] as const).map((g) => {
              const present = nut.groups.present.has(g);
              return (
                <span
                  key={g}
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    present ? "bg-accent-weak text-accent" : "bg-surface text-muted line-through"
                  }`}
                >
                  {g}
                </span>
              );
            })}
          </div>
          {nut.groups.hasFruit && <p className="mt-2 text-[11px] text-accent">🍊 {t("nutrition.fruit")}</p>}
        </section>
      </div>
    </div>
  );
}
