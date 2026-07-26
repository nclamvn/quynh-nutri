"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/context";
import { useStore } from "@/ui/store";
import { useTheme } from "@/ui/theme";
import {
  CalendarIcon, BasketIcon, BowlIcon, ChartIcon, GearIcon,
  OverviewIcon, ReportIcon, HeartIcon, NoteIcon, SunIcon, MoonIcon,
} from "./icons";
import { FlowerLogo } from "./FlowerLogo";

type Item = { href?: string; key: string; icon: (p: { className?: string }) => React.ReactElement; soon?: boolean };

const GROUPS: { group: string; items: Item[] }[] = [
  {
    group: "group.main",
    items: [
      { href: "/overview", key: "nav.overview", icon: OverviewIcon },
      { href: "/week", key: "nav.week", icon: CalendarIcon },
      { href: "/shopping", key: "nav.shopping", icon: BasketIcon },
      { href: "/dishes", key: "nav.dishes", icon: BowlIcon },
      { href: "/nutrition", key: "nav.nutrition", icon: ChartIcon },
    ],
  },
  {
    group: "group.track",
    items: [
      { href: "/reports", key: "nav.reports", icon: ReportIcon },
      { href: "/favorites", key: "nav.favorites", icon: HeartIcon },
      { href: "/notes", key: "nav.notes", icon: NoteIcon },
    ],
  },
  { group: "group.system", items: [{ href: "/settings", key: "nav.settings", icon: GearIcon }] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { household } = useStore();
  const { theme, toggle } = useTheme();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-hairline bg-surface/40 lg:flex">
      {/* Brand */}
      <div className="px-5 pb-3 pt-5">
        <div className="flex items-center gap-2.5">
          <span className="text-brand">
            <FlowerLogo size={28} />
          </span>
          <div className="leading-tight">
            <p className="font-semibold tracking-tight">{t("brand.name")}</p>
            <p className="text-[10px] text-tertiary">{t("brand.tagline")}</p>
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-ink">{t("greeting")} 👋</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {GROUPS.map(({ group, items }) => (
          <div key={group} className="mb-4">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-tertiary">{t(group)}</p>
            <ul className="space-y-0.5">
              {items.map((it) => {
                const active = it.href && (pathname === it.href || pathname.startsWith(it.href + "/"));
                const cls = `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-brand-weak font-medium text-brand" : it.soon ? "text-tertiary" : "text-muted hover:bg-surface hover:text-ink"
                }`;
                const inner = (
                  <>
                    <it.icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="flex-1 truncate">{t(it.key)}</span>
                    {it.soon && <span className="rounded-full bg-surface px-1.5 py-0.5 text-[9px] text-tertiary">{t("sidebar.soon")}</span>}
                  </>
                );
                return (
                  <li key={it.key}>
                    {it.href ? (
                      <Link href={it.href} className={cls}>{inner}</Link>
                    ) : (
                      <span className={`${cls} cursor-default`} aria-disabled>{inner}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: household + sync + theme */}
      <div className="border-t border-hairline p-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <div className="flex -space-x-1.5">
            {household.members.slice(0, 4).map((m) => (
              <span
                key={m.id}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-bg bg-brand-weak text-[10px] font-medium text-brand-ink"
              >
                {m.role === "adult" ? (m.sex === "M" ? "B" : "M") : "T"}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{t("household.family", { n: household.size })}</p>
            <p className="flex items-center gap-1 text-[10px] text-accent">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              {t("sync.online")}
            </p>
          </div>
        </div>
        <button
          onClick={toggle}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface hover:text-ink"
        >
          {theme === "dark" ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}
          {theme === "dark" ? t("settings.themeLight") : t("settings.themeDark")}
        </button>
      </div>
    </aside>
  );
}
