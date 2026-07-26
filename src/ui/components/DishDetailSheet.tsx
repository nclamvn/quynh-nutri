"use client";

import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import { BottomSheet } from "./BottomSheet";
import { DishThumb } from "./DishThumb";
import { HeartButton } from "./HeartButton";
import { ProvenanceChip } from "./ProvenanceChip";
import { dishDisplay } from "@/ui/derive";
import { fmt } from "@/ui/format";

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
  const d = dishId ? dish(dishId) : undefined;

  const name = d ? (lang === "en" && d.enLabel ? d.enLabel : d.vnName) : "";
  // Per-dish macros (absolute, with coverage) — NOT adequacy %, so the meal-vs-day
  // denominator never enters here. Fork copies lines verbatim → these are stable.
  const display = d ? dishDisplay(d, household, commodity) : null;
  const forked = dishId ? isForked(dishId) : false;

  return (
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
            <ul className="space-y-1">
              {d.lines.map((l) => {
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
  );
}
