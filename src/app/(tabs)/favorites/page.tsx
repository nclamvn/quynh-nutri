"use client";

import { useState } from "react";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import type { Lang } from "@/i18n/context";
import type { Dish } from "@/domain/types";
import { dishDisplay } from "@/ui/derive";
import { DishThumb } from "@/ui/components/DishThumb";
import { HeartButton } from "@/ui/components/HeartButton";
import { ProvenanceChip } from "@/ui/components/ProvenanceChip";
import { DishDetailSheet } from "@/ui/components/DishDetailSheet";
import { HeartIcon } from "@/ui/components/icons";
import { Blossom } from "@/ui/components/Blossom";
import { PageContainer } from "@/ui/components/PageContainer";
import { PageHeader } from "@/ui/components/PageHeader";

const dishName = (d: Dish, lang: Lang) => (lang === "en" && d.enLabel ? d.enLabel : d.vnName);

export default function FavoritesPage() {
  const { favoriteDishes, household, commodity } = useStore();
  const { t, lang } = useI18n();
  const [detailId, setDetailId] = useState<string | null>(null);

  return (
    <PageContainer>
      <PageHeader
        title={t("fav.title")}
        subtitle={favoriteDishes.length ? t("dishes.count", { n: favoriteDishes.length }) : undefined}
      />

      {favoriteDishes.length === 0 ? (
        <div className="relative grid min-h-[45vh] place-content-center justify-items-center text-center">
          <Blossom size={120} className="pointer-events-none absolute -top-2 text-brand/10" />
          <span className="relative mb-3 text-brand/50">
            <HeartIcon className="h-12 w-12" />
          </span>
          <p className="text-sm font-medium">{t("fav.empty")}</p>
          <p className="mt-1 text-xs text-muted">{t("fav.emptyHint")}</p>
        </div>
      ) : (
        <ul data-stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {favoriteDishes.map((d, i) => (
            <li key={d.id} style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setDetailId(d.sourceRepertoireId ?? d.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setDetailId(d.sourceRepertoireId ?? d.id)}
                className="group card card-interactive flex h-full cursor-pointer items-center gap-3 p-3"
              >
                <DishThumb dish={d} size={72} shape="rounded" />
                <div className="min-w-0 flex-1">
                  <h2 className="mb-1 truncate text-sm font-semibold">{dishName(d, lang)}</h2>
                  <div className="flex items-center justify-between gap-2">
                    <ProvenanceChip display={dishDisplay(d, household, commodity)} field="kcal" unit="kcal" />
                    <HeartButton dishId={d.id} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <DishDetailSheet dishId={detailId} onClose={() => setDetailId(null)} />
    </PageContainer>
  );
}
