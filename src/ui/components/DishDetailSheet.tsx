"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import { BottomSheet } from "./BottomSheet";
import { DishThumb } from "./DishThumb";
import { HeartButton } from "./HeartButton";
import { ProvenanceChip } from "./ProvenanceChip";
import { dishDisplay } from "@/ui/derive";
import { fmt } from "@/ui/format";
import { cookingGuideFor } from "@/data/seed/cooking-guides";
import { localize } from "@/domain/kitchen-execution";
import { scaleDishLines } from "@/domain/kitchen-execution/cooking";
import { CookingMode } from "./CookingMode";

const MACROS: { field: "kcal" | "proteinG" | "carbG" | "fatG" | "fiberG"; unit: string }[] = [
  { field: "kcal", unit: "kcal" },
  { field: "proteinG", unit: "g đạm" },
  { field: "carbG", unit: "g bột" },
  { field: "fatG", unit: "g béo" },
  { field: "fiberG", unit: "g xơ" },
];

export function DishDetailSheet({ dishId, onClose }: { dishId: string | null; onClose: () => void }) {
  const { dish, commodity, household, forkDish, isForked } = useStore();
  const { t, lang } = useI18n();
  const [cookingOpen, setCookingOpen] = useState(false);
  const d = dishId ? dish(dishId) : undefined;

  const name = d ? (lang === "en" && d.enLabel ? d.enLabel : d.vnName) : "";
  // Per-dish macros (absolute, with coverage) — NOT adequacy %, so the meal-vs-day
  // denominator never enters here. Fork copies lines verbatim → these are stable.
  const display = d ? dishDisplay(d, household, commodity) : null;
  const forked = dishId ? isForked(dishId) : false;
  const cooking = d ? cookingGuideFor(d.id) : undefined;
  const scaledLines = d ? scaleDishLines(d, household.size) : [];

  return (
    <>
    <BottomSheet open={!!d} onClose={onClose} title={undefined}>
      {d && display && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <DishThumb dish={d} size={60} shape="rounded" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold">{name}</h2>
              <p className="text-xs text-muted">
                {d.proteinType} · {d.method}
                {d.cookTimeMin ? ` · ${d.cookTimeMin}′` : ""}
                {d.quick ? ` · ${t("common.quick")}` : ""}
              </p>
            </div>
            <HeartButton dishId={dishId!} size={22} />
          </div>

          {/* Per-macro provenance chips */}
          <div className="flex flex-wrap gap-1.5">
            {MACROS.map((m) => (
              <ProvenanceChip key={m.field} display={display} field={m.field} unit={m.unit} showCoverage={m.field === "kcal"} />
            ))}
          </div>

          {/* Ingredients (edible grams for baseServings) */}
          <div>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-tertiary">{t("detail.ingredients")}</h3>
            <p className="mb-2 text-[11px] text-muted">
              {t("cooking.ingredientsFor", { n: household.size > 0 ? household.size : d.baseServings })}
            </p>
            <ul className="space-y-1">
              {scaledLines.map((l) => {
                const c = commodity(l.commodityId);
                const tone = c?.confidence === "corroborated" ? "bg-accent" : c?.confidence === "disputed" ? "bg-amber" : "bg-muted";
                return (
                  <li key={l.commodityId} className="flex items-center gap-2 text-sm">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone}`} />
                    <span className="flex-1 truncate">{c ? (lang === "en" && c.labelEn ? c.labelEn : c.canonicalVn) : l.commodityId}</span>
                    <span className="tnum text-xs text-muted">
                      {fmt(l.qtyBase)} {l.unit}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {cooking ? (
            <section className="rounded-[18px] border border-hairline bg-surface/45 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{t("cooking.reviewedRecipe")}</h3>
                  <p className="mt-1 text-[11px] text-muted">
                    {t("cooking.stepCount", { n: cooking.guide.steps.length })} ·{" "}
                    {t("kitchen.reviewed")} {cooking.guide.reviewedAt}
                  </p>
                </div>
                <span className="rounded-full bg-accent-weak px-2 py-1 text-[10px] font-medium text-accent">
                  {t("cooking.dishSpecific")}
                </span>
              </div>
              <h4 className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-tertiary">
                {t("cooking.prepare")}
              </h4>
              <ul className="mt-1 space-y-1 text-xs leading-relaxed text-muted">
                {cooking.guide.miseEnPlace.map((item, index) => (
                  <li key={index}>• {localize(item, lang)}</li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                {cooking.sources.map((source) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-medium text-brand underline underline-offset-2"
                  >
                    {source.publisher}
                  </a>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setCookingOpen(true)}
                className="mt-3 w-full rounded-full bg-brand py-3 text-sm font-semibold text-white active:bg-brand-hover"
              >
                {t("cooking.start")}
              </button>
              <Link
                href={`/dishes/${encodeURIComponent(d.id)}`}
                onClick={onClose}
                className="mt-2 flex min-h-11 w-full items-center justify-center rounded-full border border-hairline text-sm font-medium text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {t("recipe.viewFull")} →
              </Link>
            </section>
          ) : (
            <section className="rounded-[18px] border border-hairline bg-surface/45 p-3">
              <h3 className="text-sm font-semibold">{t("cooking.noGuideTitle")}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {t("cooking.noGuideBody")}
              </p>
            </section>
          )}

          {/* Fork to B1 */}
          <div>
            <button
              onClick={() => dishId && forkDish(dishId)}
              disabled={forked}
              className={`w-full rounded-full py-2.5 text-sm font-medium ${
                forked ? "bg-accent-weak text-accent" : "bg-brand text-white active:bg-brand-hover"
              }`}
            >
              {forked ? `✓ ${t("detail.forked")}` : t("detail.fork")}
            </button>
            <p className="mt-1.5 text-[11px] text-muted">{t("detail.forkHint")}</p>
          </div>
        </div>
      )}
    </BottomSheet>
    {cookingOpen && d && cooking && (
      <CookingMode dish={d} resolved={cooking} onClose={() => setCookingOpen(false)} />
    )}
    </>
  );
}
