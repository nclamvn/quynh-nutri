"use client";

import Link from "next/link";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import type { Lang } from "@/i18n/context";
import type { Dish } from "@/domain/types";
import { dishDisplay } from "@/ui/derive";
import { DishThumb } from "@/ui/components/DishThumb";
import { HeartButton } from "@/ui/components/HeartButton";
import { ProvenanceChip } from "@/ui/components/ProvenanceChip";
import { HeartIcon } from "@/ui/components/icons";
import { Blossom } from "@/ui/components/Blossom";
import { PageContainer } from "@/ui/components/PageContainer";
import { PageHeader } from "@/ui/components/PageHeader";

const dishName = (d: Dish, lang: Lang) => (lang === "en" && d.enLabel ? d.enLabel : d.vnName);

export default function FavoritesPage() {
  const { favoriteDishes, household, commodity } = useStore();
  const { t, lang } = useI18n();

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
              <div className="group card card-interactive flex h-full items-center gap-3 p-3">
                <Link
                  href={`/dishes/${encodeURIComponent(d.id)}`}
                  aria-label={t("recipe.openNamed", { name: dishName(d, lang) })}
                  className="flex min-h-[72px] min-w-0 flex-1 items-center gap-3 rounded-[12px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <DishThumb dish={d} size={72} shape="rounded" />
                  <div className="min-w-0 flex-1">
                    <h2 className="mb-1 truncate text-sm font-semibold">{dishName(d, lang)}</h2>
                    <ProvenanceChip display={dishDisplay(d, household, commodity)} field="kcal" unit="kcal" />
                  </div>
                </Link>
                <HeartButton dishId={d.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
