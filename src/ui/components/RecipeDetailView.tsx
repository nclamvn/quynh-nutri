"use client";

import Link from "next/link";
import { useState } from "react";
import { cookingGuideFor } from "@/data/seed/cooking-guides";
import { REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import { localize } from "@/domain/kitchen-execution";
import { scaleDishLines } from "@/domain/kitchen-execution/cooking";
import {
  detailedCookingGuide,
  resolveDishCooking,
} from "@/domain/kitchen-execution/recipe-detail";
import type { Dish } from "@/domain/types";
import { useI18n } from "@/i18n/context";
import { dishDisplay } from "@/ui/derive";
import { fmt } from "@/ui/format";
import { useStore } from "@/ui/store";
import { Blossom } from "./Blossom";
import { CookingMode } from "./CookingMode";
import { DishThumb } from "./DishThumb";
import { HeartButton } from "./HeartButton";
import { PageContainer } from "./PageContainer";
import { ProvenanceChip } from "./ProvenanceChip";

const MACROS: {
  field: "kcal" | "proteinG" | "carbG" | "fatG" | "fiberG";
  unit: string;
}[] = [
  { field: "kcal", unit: "kcal" },
  { field: "proteinG", unit: "g đạm" },
  { field: "carbG", unit: "g bột" },
  { field: "fatG", unit: "g béo" },
  { field: "fiberG", unit: "g xơ" },
];

const METHOD_LABEL: Record<Dish["method"], { vi: string; en: string }> = {
  kho: { vi: "Kho", en: "Braise" },
  xao: { vi: "Xào", en: "Stir-fry" },
  luoc: { vi: "Luộc / nấu nước", en: "Boil / simmer" },
  hap: { vi: "Hấp", en: "Steam" },
  nuong: { vi: "Nướng", en: "Grill / roast" },
  ran: { vi: "Chiên / rang", en: "Pan-fry" },
  song: { vi: "Chuẩn bị tươi", en: "Fresh preparation" },
};

export function RecipeDetailView({ dishId }: { dishId: string }) {
  const { t, lang } = useI18n();
  const {
    hydrated,
    dish: resolveDish,
    commodity,
    household,
    forkDish,
    isForked,
  } = useStore();
  const dish = resolveDish(dishId);
  const initialServings = Math.min(12, Math.max(1, household.size || dish?.baseServings || 4));
  const [servings, setServings] = useState(initialServings);
  const [cookingOpen, setCookingOpen] = useState(false);

  const sourceDish = dish?.sourceRepertoireId
    ? REPERTOIRE_BY_ID[dish.sourceRepertoireId]
    : undefined;
  const cooking = dish
    ? resolveDishCooking(dish, sourceDish, cookingGuideFor)
    : undefined;
  const detail = dish && cooking
    ? detailedCookingGuide(dish, cooking.resolved.guide)
    : undefined;
  const scaledLines = dish ? scaleDishLines(dish, servings) : [];
  const nutrition = dish
    ? dishDisplay(dish, household, commodity)
    : undefined;
  const forkBaseId = dish?.sourceRepertoireId
    ?? (dish?.origin === "B0" ? dish.id : undefined);
  const forked = forkBaseId ? isForked(forkBaseId) : false;

  if (!hydrated && !dish) {
    return (
      <PageContainer>
        <div className="grid min-h-[55vh] place-content-center text-sm text-muted">
          {t("recipe.loading")}
        </div>
      </PageContainer>
    );
  }

  if (!dish) {
    return (
      <PageContainer>
        <div className="relative grid min-h-[58vh] place-content-center justify-items-center px-5 text-center">
          <Blossom size={120} className="pointer-events-none absolute top-10 text-brand/10" />
          <p className="relative text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
            {t("recipe.notFoundEyebrow")}
          </p>
          <h1 className="relative mt-2 text-2xl font-semibold">{t("recipe.notFoundTitle")}</h1>
          <p className="relative mt-2 max-w-md text-sm leading-relaxed text-muted">
            {t("recipe.notFoundBody")}
          </p>
          <Link href="/dishes" className="relative mt-5 inline-flex min-h-11 items-center rounded-full border border-hairline px-5 text-sm font-medium text-brand">
            ← {t("recipe.backLibrary")}
          </Link>
        </div>
      </PageContainer>
    );
  }

  const name = lang === "en" && dish.enLabel ? dish.enLabel : dish.vnName;
  const method = METHOD_LABEL[dish.method][lang === "en" ? "en" : "vi"];
  const guide = cooking?.resolved.guide;

  return (
    <>
      <PageContainer className="max-w-[1320px]">
        <main data-recipe-detail>
          <div className="mb-5 flex items-center justify-between gap-3">
            <Link
              href="/dishes"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              <span aria-hidden>←</span> {t("recipe.backLibrary")}
            </Link>
            <HeartButton dishId={dish.id} size={24} />
          </div>

          <header className="grid items-center gap-6 border-b border-hairline pb-8 lg:grid-cols-[minmax(280px,0.76fr)_minmax(0,1.24fr)] lg:gap-12 lg:pb-12">
            <div className="relative mx-auto w-full max-w-[460px]">
              <div className="absolute -inset-4 -z-10 rounded-[36px] bg-gradient-to-br from-brand-weak via-transparent to-accent-weak opacity-70 blur-2xl" />
              <DishThumb
                dish={dish}
                size={460}
                shape="rounded"
                className="!block !h-auto !w-full aspect-[4/3] !rounded-[26px] shadow-[var(--shadow-md)]"
              />
              <p className="mt-2 text-[10px] leading-relaxed text-tertiary">
                {t("recipe.atmosphereImage")}
              </p>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-weak px-3 py-1 text-[11px] font-medium text-brand-ink">
                  {dish.origin === "B1" ? t("origin.b1") : t("dishes.sample")}
                </span>
                {cooking?.inheritedFromDishId && (
                  <span className="rounded-full border border-amber/30 bg-amber-weak px-3 py-1 text-[11px] font-medium text-amber">
                    {t("recipe.inheritedGuide")}
                  </span>
                )}
                {guide && (
                  <span className="rounded-full bg-accent-weak px-3 py-1 text-[11px] font-medium text-accent">
                    {t("recipe.reviewedOn", { date: guide.reviewedAt })}
                  </span>
                )}
              </div>
              <h1 className="mt-4 font-serif text-[38px] font-semibold leading-[1.05] -tracking-[0.035em] sm:text-[48px] lg:text-[58px]">
                {name}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted lg:text-[15px]">
                {detail ? localize(detail.summary, lang) : t("recipe.unsupportedBody")}
              </p>
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-hairline py-5 sm:grid-cols-3">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-tertiary">
                    {t("recipe.method")}
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{method}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-tertiary">
                    {t("recipe.totalTime")}
                  </dt>
                  <dd className="mt-1 text-sm font-medium">
                    {guide ? `~${guide.estimatedTotalMin} ${t("recipe.minutes")}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-tertiary">
                    {t("recipe.steps")}
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{guide?.steps.length ?? "—"}</dd>
                </div>
              </dl>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {cooking && (
                  <button
                    type="button"
                    onClick={() => setCookingOpen(true)}
                    className="hidden min-h-12 rounded-full bg-brand px-7 text-sm font-semibold text-white shadow-[var(--shadow-float)] transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand lg:inline-flex lg:items-center"
                  >
                    {t("recipe.startCooking")} →
                  </button>
                )}
                {forkBaseId && (
                  <button
                    type="button"
                    onClick={() => forkDish(forkBaseId)}
                    disabled={forked}
                    className={`inline-flex min-h-12 items-center rounded-full border px-6 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand ${
                      forked
                        ? "border-accent/20 bg-accent-weak text-accent"
                        : "border-hairline bg-surface/40 text-brand hover:border-brand/35 hover:bg-brand-weak"
                    }`}
                  >
                    {forked ? `✓ ${t("detail.forked")}` : t("detail.fork")}
                  </button>
                )}
              </div>
              {forkBaseId && (
                <p className="mt-2 max-w-xl text-[11px] leading-relaxed text-tertiary">
                  {t("detail.forkHint")}
                </p>
              )}
            </div>
          </header>

          <div className="grid gap-8 py-8 lg:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.22fr)] lg:gap-12 lg:py-12">
            <aside className="min-w-0 lg:sticky lg:top-8 lg:self-start">
              <section data-recipe-serving className="border-b border-hairline pb-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
                      {t("recipe.ingredients")}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">
                      {t("recipe.forPeople", { n: servings })}
                    </h2>
                  </div>
                  <div data-control className="flex h-11 items-center rounded-full border border-hairline bg-surface/45 p-1">
                    <button
                      type="button"
                      aria-label={t("recipe.decreaseServings")}
                      disabled={servings <= 1}
                      onClick={() => setServings((value) => Math.max(1, value - 1))}
                      className="grid size-9 place-items-center rounded-full text-lg disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-brand"
                    >
                      −
                    </button>
                    <span className="tnum min-w-9 text-center text-sm font-semibold">{servings}</span>
                    <button
                      type="button"
                      aria-label={t("recipe.increaseServings")}
                      disabled={servings >= 12}
                      onClick={() => setServings((value) => Math.min(12, value + 1))}
                      className="grid size-9 place-items-center rounded-full text-lg disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-brand"
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-tertiary">
                  {t("recipe.edibleAmounts")}
                </p>
                <ul className="mt-4 divide-y divide-hairline">
                  {scaledLines.map((line) => {
                    const item = commodity(line.commodityId);
                    const label = item
                      ? lang === "en" && item.labelEn
                        ? item.labelEn
                        : item.canonicalVn
                      : line.commodityId;
                    return (
                      <li key={line.commodityId} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                        <span className="min-w-0 flex-1">{label}</span>
                        <span className="tnum shrink-0 font-medium text-muted">
                          {fmt(line.qtyBase, 1)} {line.unit}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {detail && (
                <section className="border-b border-hairline py-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-tertiary">
                    {t("recipe.equipment")}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {detail.equipment.map((item, index) => (
                      <li key={index} className="flex gap-3 text-sm leading-relaxed">
                        <span className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-accent" />
                        {localize(item, lang)}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {guide && (
                <section className="py-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-tertiary">
                    {t("recipe.prepare")}
                  </p>
                  <ul className="mt-3 space-y-3">
                    {guide.miseEnPlace.map((item, index) => (
                      <li key={index} className="flex gap-3 text-sm leading-6 text-muted">
                        <span className="tnum mt-0.5 shrink-0 text-[10px] font-semibold text-brand">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {localize(item, lang)}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>

            <div className="min-w-0">
              {guide && detail ? (
                <section data-recipe-rhythm>
                  <div className="mb-7">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
                      {t("recipe.rhythmEyebrow")}
                    </p>
                    <h2 className="mt-1 font-serif text-3xl font-semibold tracking-tight">
                      {t("recipe.rhythmTitle")}
                    </h2>
                    <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted">
                      {t("recipe.rhythmHint")}
                    </p>
                  </div>
                  <ol className="relative border-l border-hairline pl-7 sm:pl-10">
                    {detail.steps.map((step, index) => (
                      <li
                        key={step.id}
                        data-recipe-step={step.id}
                        className="relative border-b border-hairline pb-9 pt-1 first:pt-0 last:border-b-0 last:pb-0"
                      >
                        <span className="absolute -left-[43px] top-0 grid size-8 place-items-center rounded-full border border-hairline bg-bg tnum text-[10px] font-semibold text-brand sm:-left-[57px]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="text-lg font-semibold">{localize(step.title, lang)}</h3>
                          <span className="rounded-full bg-amber-weak px-2.5 py-1 text-[10px] font-medium text-amber">
                            ~{step.estimatedMin} {t("recipe.minutes")}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-muted">
                          {localize(step.instruction, lang)}
                        </p>
                        <div className="mt-4 border-l-2 border-accent/40 pl-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
                            {t("recipe.lookFor")}
                          </p>
                          <p className="mt-1 text-xs leading-6 text-muted">
                            {localize(step.sensoryCue, lang)}
                          </p>
                        </div>
                        {step.safetyCheck && (
                          <div className="mt-4 rounded-[16px] border border-amber/30 bg-amber-weak p-4">
                            <p className="text-xs font-semibold text-amber">
                              {t("cooking.safetyCheck")}
                            </p>
                            <p className="mt-1 text-sm leading-6">
                              {localize(step.safetyCheck, lang)}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(step.sourceIds ?? []).map((sourceId) => {
                                const source = cooking.resolved.sources.find((item) => item.id === sourceId);
                                return source ? (
                                  <a
                                    key={source.id}
                                    href={source.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] font-medium text-amber underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                                  >
                                    {source.publisher}
                                  </a>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              ) : (
                <section className="rounded-[20px] border border-hairline bg-surface/45 p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber">
                    {t("recipe.unsupportedEyebrow")}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">{t("cooking.noGuideTitle")}</h2>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-muted">
                    {t("recipe.unsupportedBody")}
                  </p>
                </section>
              )}

              {nutrition && (
                <section className="mt-10 border-t border-hairline pt-7">
                  <h2 className="text-lg font-semibold">{t("recipe.nutritionTitle")}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {t("recipe.nutritionHint")}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {MACROS.map((macro) => (
                      <ProvenanceChip
                        key={macro.field}
                        display={nutrition}
                        field={macro.field}
                        unit={macro.unit}
                        showCoverage={macro.field === "kcal"}
                      />
                    ))}
                  </div>
                </section>
              )}

              {cooking && (
                <section className="mt-10 border-t border-hairline pt-7">
                  <h2 className="text-lg font-semibold">{t("recipe.sourcesTitle")}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {t("recipe.sourcesHint", { date: cooking.resolved.guide.reviewedAt })}
                  </p>
                  <ul className="mt-4 divide-y divide-hairline">
                    {cooking.resolved.sources.map((source) => (
                      <li key={source.id} className="py-3">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex min-h-11 items-center justify-between gap-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                        >
                          <span>
                            <span className="block font-medium group-hover:text-brand">
                              {localize(source.title, lang)}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-muted">
                              {source.publisher}
                            </span>
                          </span>
                          <span aria-hidden className="text-brand">↗</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </main>
      </PageContainer>

      {cooking && (
        <div className="fixed inset-x-0 bottom-[72px] z-30 border-t border-hairline bg-bg/92 px-5 py-3 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setCookingOpen(true)}
            className="mx-auto flex min-h-12 w-full max-w-md items-center justify-center rounded-full bg-brand px-6 text-sm font-semibold text-white shadow-[var(--shadow-float)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {t("recipe.startCooking")} · {servings} {t("recipe.people")}
          </button>
        </div>
      )}

      {cookingOpen && cooking && (
        <CookingMode
          dish={dish}
          resolved={cooking.resolved}
          targetServings={servings}
          onClose={() => setCookingOpen(false)}
        />
      )}
    </>
  );
}
