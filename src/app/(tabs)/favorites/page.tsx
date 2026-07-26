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

const dishName = (d: Dish, lang: Lang) => (lang === "en" && d.enLabel ? d.enLabel : d.vnName);

export default function FavoritesPage() {
  const { favoriteDishes, household, commodity } = useStore();
  const { t, lang } = useI18n();
  const [detailId, setDetailId] = useState<string | null>(null);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 border-b border-hairline bg-bg/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-semibold">{t("fav.title")}</h1>
      </header>

      {favoriteDishes.length === 0 ? (
        <div className="relative flex flex-col items-center px-4 py-20 text-center">
          <Blossom size={120} className="pointer-events-none absolute -top-2 text-brand/10" />
          <span className="relative mb-3 text-brand/50">
            <HeartIcon className="h-12 w-12" />
          </span>
          <p className="text-sm font-medium">{t("fav.empty")}</p>
          <p className="mt-1 text-xs text-muted">{t("fav.emptyHint")}</p>
        </div>
      ) : (
        <ul className="space-y-2 px-4 py-4">
          {favoriteDishes.map((d) => (
            <li key={d.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setDetailId(d.sourceRepertoireId ?? d.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setDetailId(d.sourceRepertoireId ?? d.id)}
                className="flex cursor-pointer items-center gap-3 rounded-[14px] border border-hairline bg-surface/40 p-3 transition-colors active:bg-surface"
              >
                <DishThumb dish={d} size={60} shape="rounded" />
                <div className="min-w-0 flex-1">
                  <h2 className="mb-1 truncate text-sm font-semibold">{dishName(d, lang)}</h2>
                  <ProvenanceChip display={dishDisplay(d, household, commodity)} field="kcal" unit="kcal" />
                </div>
                <HeartButton dishId={d.id} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <DishDetailSheet dishId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
