"use client";

import { useMemo, useState } from "react";
import type { PrepAheadPlanDay } from "@/domain/kitchen-execution/prep-ahead";
import { localize } from "@/domain/kitchen-execution";
import { scaleDishLines } from "@/domain/kitchen-execution/cooking";
import { PREP_AHEAD_SOURCE_BY_ID } from "@/data/seed/prep-ahead-guides";
import { useI18n } from "@/i18n/context";
import { useStore } from "@/ui/store";
import { fmt } from "@/ui/format";
import { BottomSheet } from "./BottomSheet";

export function PrepAheadSheet({
  result,
  open,
  onClose,
}: {
  result: PrepAheadPlanDay;
  open: boolean;
  onClose: () => void;
}) {
  const { household, commodity } = useStore();
  const { t, lang } = useI18n();
  const initialServings = Math.max(1, household.size || 4);
  const [servings, setServings] = useState(initialServings);
  const sourceIds = useMemo(
    () => [...new Set(result.supported.flatMap(({ guide }) => guide.sourceIds))],
    [result.supported],
  );

  return (
    <BottomSheet open={open} onClose={onClose} title={t("prepAhead.title")}>
      <div className="space-y-5" data-testid="prep-ahead-sheet">
        <div className="rounded-[16px] border border-accent/25 bg-accent-weak/45 p-3">
          <p className="text-xs font-semibold text-accent">{t("prepAhead.reviewed")}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{t("prepAhead.intro")}</p>
        </div>

        <label className="flex items-center justify-between gap-3 rounded-[14px] border border-hairline p-3">
          <span>
            <span className="block text-sm font-semibold">{t("prepAhead.servings")}</span>
            <span className="block text-[11px] text-muted">{t("prepAhead.servingsHint")}</span>
          </span>
          <input
            type="number"
            min={1}
            max={12}
            value={servings}
            onChange={(event) => {
              const next = Number(event.currentTarget.value);
              if (Number.isInteger(next) && next >= 1 && next <= 12) setServings(next);
            }}
            aria-label={t("prepAhead.servings")}
            className="h-10 w-16 rounded-lg border border-hairline bg-bg px-2 text-center text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          />
        </label>

        {result.supported.map(({ dish, slot, guide }) => {
          const lines = scaleDishLines(dish, servings);
          const name = lang === "en" && dish.enLabel ? dish.enLabel : dish.vnName;
          return (
            <section
              key={guide.id}
              aria-labelledby={`prep-${guide.id}`}
              className="rounded-[18px] border border-hairline bg-surface/35 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-brand">
                    {t(`slot.${slot}`)}
                  </p>
                  <h3 id={`prep-${guide.id}`} className="text-base font-semibold">{name}</h3>
                </div>
                <span className="rounded-full bg-accent-weak px-2 py-1 text-[10px] text-accent">
                  {guide.reviewedAt}
                </span>
              </div>

              <details className="mt-3 rounded-[12px] bg-bg/70 p-3">
                <summary className="cursor-pointer text-xs font-semibold">
                  {t("prepAhead.recipeAmounts", { n: servings })}
                </summary>
                <p className="mt-1 text-[10px] leading-relaxed text-muted">
                  {t("prepAhead.noQuantityInference")}
                </p>
                <ul className="mt-2 space-y-1">
                  {lines.map((line) => {
                    const item = commodity(line.commodityId);
                    return (
                      <li key={line.commodityId} className="flex gap-2 text-xs">
                        <span className="min-w-0 flex-1 truncate">
                          {item
                            ? lang === "en" && item.labelEn
                              ? item.labelEn
                              : item.canonicalVn
                            : line.commodityId}
                        </span>
                        <span className="tnum text-muted">{fmt(line.qtyBase)} {line.unit}</span>
                      </li>
                    );
                  })}
                </ul>
              </details>

              <ol className="mt-3 space-y-3">
                {guide.steps.map((item, index) => (
                  <li key={item.id} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2">
                    <span
                      aria-hidden="true"
                      className="grid h-6 w-6 place-items-center rounded-full bg-brand-weak text-[10px] font-semibold text-brand"
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{localize(item.title, lang)}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">
                        {localize(item.instruction, lang)}
                      </p>
                      {item.storageInstruction && (
                        <p className="mt-1 rounded-lg bg-accent-weak/60 px-2 py-1.5 text-[11px] leading-relaxed text-accent">
                          {t("prepAhead.storage")}: {localize(item.storageInstruction, lang)}
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap gap-2">
                        {item.sourceIds.map((sourceId) => {
                          const source = PREP_AHEAD_SOURCE_BY_ID[sourceId];
                          return source ? (
                            <a
                              key={source.id}
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-medium text-brand underline underline-offset-2"
                            >
                              {source.publisher}
                            </a>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}

        {result.unsupported.length > 0 && (
          <section className="rounded-[16px] border border-dashed border-hairline p-3">
            <h3 className="text-xs font-semibold">
              {t("prepAhead.unsupported", { n: result.unsupported.length })}
            </h3>
            <ul className="mt-1 text-xs text-muted">
              {result.unsupported.map(({ dish }) => (
                <li key={dish.id}>
                  {lang === "en" && dish.enLabel ? dish.enLabel : dish.vnName}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-wrap gap-2">
          {sourceIds.map((sourceId) => {
            const source = PREP_AHEAD_SOURCE_BY_ID[sourceId];
            return source ? (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-hairline px-3 py-1.5 text-[11px] font-semibold text-brand"
              >
                {localize(source.title, lang)}
              </a>
            ) : null;
          })}
        </div>
        <p className="text-[10px] leading-relaxed text-muted">{t("prepAhead.readOnly")}</p>
      </div>
    </BottomSheet>
  );
}
