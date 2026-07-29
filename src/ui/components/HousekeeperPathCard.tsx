"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { useStore } from "@/ui/store";
import {
  BasketIcon,
  CalendarIcon,
  PantryIcon,
} from "@/ui/components/icons";
import { Blossom } from "@/ui/components/Blossom";

type PathStep = {
  key: "week" | "shopping" | "store";
  href: "/week" | "/shopping" | "/pantry";
  icon: typeof CalendarIcon;
  detail: string;
};

export function HousekeeperPathCard() {
  const {
    hydrated,
    plan,
    planSyncState,
    shopping,
    pantry,
    leftoverLots,
  } = useStore();
  const { t } = useI18n();

  const loading = !hydrated || planSyncState === "loading";
  const plannedDays = new Set(plan.slots.map((slot) => slot.day)).size;
  const remainingShopping = shopping.filter((item) => !item.checked).length;
  const availableLots = pantry.filter((lot) => lot.qty > 0).length;
  const activeLeftovers = leftoverLots.filter((lot) => lot.remainingServings > 0).length;

  const steps: PathStep[] = [
    {
      key: "week",
      href: "/week",
      icon: CalendarIcon,
      detail: loading
        ? t("housekeeper.loading")
        : plan.slots.length > 0
          ? t("housekeeper.week.ready", {
              days: plannedDays,
              items: plan.slots.length,
            })
          : t("housekeeper.week.empty"),
    },
    {
      key: "shopping",
      href: "/shopping",
      icon: BasketIcon,
      detail: loading
        ? t("housekeeper.loading")
        : shopping.length > 0
          ? t("housekeeper.shopping.ready", { remaining: remainingShopping })
          : t("housekeeper.shopping.empty"),
    },
    {
      key: "store",
      href: "/pantry",
      icon: PantryIcon,
      detail: loading
        ? t("housekeeper.loading")
        : availableLots > 0 || activeLeftovers > 0
          ? t("housekeeper.store.ready", {
              lots: availableLots,
              leftovers: activeLeftovers,
            })
          : t("housekeeper.store.empty"),
    },
  ];

  return (
    <section
      aria-labelledby="housekeeper-path-title"
      data-testid="housekeeper-path"
      className="grain relative mb-5 overflow-hidden rounded-[24px] border border-brand/20 bg-gradient-to-br from-brand-weak/70 via-bg to-accent-weak/45 shadow-[var(--shadow-sm)]"
    >
      <Blossom
        size={150}
        className="pointer-events-none absolute -right-10 -top-12 rotate-12 text-brand/10"
      />
      <div className="relative border-b border-brand/15 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
          {t("housekeeper.eyebrow")}
        </p>
        <h2 id="housekeeper-path-title" className="mt-1 text-lg font-semibold">
          {t("housekeeper.title")}
        </h2>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
          {t("housekeeper.intro")}
        </p>
      </div>

      <ol className="relative grid gap-0 p-4 md:grid-cols-3 md:p-5">
        {steps.map(({ key, href, icon: Icon, detail }, index) => (
          <li
            key={key}
            className="group relative grid grid-cols-[40px_minmax(0,1fr)] gap-3 border-l border-dashed border-brand/30 pb-5 pl-4 last:border-transparent last:pb-0 md:block md:border-l-0 md:border-t md:pb-0 md:pl-0 md:pr-5 md:pt-6 md:last:pr-0"
          >
            <span className="absolute -left-5 top-0 grid h-10 w-10 place-items-center rounded-full border border-brand/25 bg-bg text-brand shadow-[var(--shadow-sm)] md:-top-5 md:left-0">
              <Icon className="h-[19px] w-[19px]" />
            </span>
            <div className="col-start-2 min-w-0 md:col-start-auto">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-tertiary">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-0.5 text-sm font-semibold">
                {t(`housekeeper.${key}.title`)}
              </h3>
              <p className="mt-1 min-h-10 text-xs leading-relaxed text-muted">
                {detail}
              </p>
              <Link
                href={href}
                className="mt-3 inline-flex rounded-full border border-brand/25 bg-bg/80 px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand-weak focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {t(`housekeeper.${key}.action`)} →
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
