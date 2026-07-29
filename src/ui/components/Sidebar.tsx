"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/context";
import { useStore } from "@/ui/store";
import { UserButton } from "@clerk/nextjs";
import { FlowerLogo } from "./FlowerLogo";
import { NAV_GROUPS as GROUPS } from "@/ui/nav";
import { useLocalStorageValue } from "@/ui/hooks/useLocalStorageValue";
import { useRuntime } from "@/ui/providers";

const COLLAPSE_KEY = "qk-sidebar-collapsed";

/** Chevrons pointing left (collapse) / right (expand). */
function ChevronsIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={dir === "right" ? "rotate-180" : ""}>
      <path d="m11 17-5-5 5-5" />
      <path d="m18 17-5-5 5-5" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { e2e } = useRuntime();
  const { household, hydrated } = useStore();
  const [collapsedValue, setCollapsedValue] = useLocalStorageValue(COLLAPSE_KEY, "0");
  const collapsed = collapsedValue === "1";
  const toggleCollapsed = () => setCollapsedValue(collapsed ? "0" : "1");

  return (
    <aside
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-hairline bg-raised/58 backdrop-blur-xl transition-[width] duration-200 lg:flex ${
        collapsed ? "w-20" : "w-[264px]"
      }`}
    >
      <header className={collapsed ? "px-3 pb-4 pt-5" : "px-5 pb-5 pt-6"}>
        <div className={`flex ${collapsed ? "flex-col items-center gap-3" : "items-center gap-3"}`}>
          <Link
            href="/"
            data-testid="sidebar-brand-home"
            aria-label={t("brand.home")}
            className={`group flex min-w-0 items-center text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand ${
              collapsed ? "justify-center" : "flex-1 gap-3"
            }`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center border-y border-brand/20">
              <FlowerLogo size={28} className="transition-transform group-hover:-rotate-6" />
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <span className="block truncate font-serif text-[17px] font-semibold leading-tight tracking-[-0.035em] text-ink">
                  {t("brand.name")}
                </span>
                <span className="mt-0.5 block truncate text-[9px] font-medium uppercase tracking-[0.16em] text-tertiary">
                  {t("sidebar.folio")}
                </span>
              </span>
            )}
          </Link>
          <button
            onClick={toggleCollapsed}
            title={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
            aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-transparent text-tertiary transition hover:border-hairline hover:bg-bg/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <ChevronsIcon dir={collapsed ? "right" : "left"} />
          </button>
        </div>
      </header>

      <nav
        aria-label={t("brand.name")}
        className={`folio-nav relative flex-1 overflow-y-auto pb-5 ${
          collapsed ? "px-3" : "px-4"
        }`}
      >
        {GROUPS.map(({ group, items }) => (
          <div key={group} className="mb-5 last:mb-0">
            {!collapsed && (
              <div className="mb-2 flex items-center gap-3 px-3">
                <p className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.18em] text-tertiary">
                  {t(group)}
                </p>
                <span aria-hidden className="h-px flex-1 bg-hairline/80" />
              </div>
            )}
            <ul className="space-y-1">
              {items.map((it) => {
                const active = pathname === it.href || pathname.startsWith(it.href + "/");
                return (
                  <li key={it.key}>
                    <Link
                      href={it.href}
                      title={collapsed ? t(it.key) : undefined}
                      aria-current={active ? "page" : undefined}
                      className={`folio-nav-link relative flex min-h-10 items-center text-sm transition-colors ${
                        collapsed ? "justify-center px-2" : "gap-2.5 px-3"
                      } ${
                        active
                          ? "folio-nav-active font-medium text-brand"
                          : "text-muted hover:bg-surface/55 hover:text-ink"
                      }`}
                    >
                      <span className={`grid h-7 w-7 shrink-0 place-items-center ${active ? "text-brand" : "text-tertiary"}`}>
                        <it.icon className="h-[18px] w-[18px]" />
                      </span>
                      {!collapsed && <span className="flex-1 truncate">{t(it.key)}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <footer className={`border-t border-hairline bg-bg/25 ${collapsed ? "p-3" : "px-5 py-4"}`}>
        {collapsed ? (
          <div className="flex justify-center">
            <AccountAvatar e2e={e2e} />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1.5">
              {household.members.slice(0, 4).map((m) => (
                <span
                  key={m.id}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-raised bg-brand-weak text-[9px] font-semibold text-brand-ink"
                >
                  {m.role === "adult" ? (m.sex === "M" ? "B" : "M") : "T"}
                </span>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{t("household.family", { n: household.size })}</p>
              <p className={`flex items-center gap-1 text-[10px] ${hydrated ? "text-accent" : "text-amber"}`}>
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${hydrated ? "bg-accent" : "animate-pulse bg-amber"}`} />
                {hydrated ? t("sync.online") : t("sync.syncing")}
              </p>
            </div>
            <AccountAvatar e2e={e2e} />
          </div>
        )}
      </footer>
    </aside>
  );
}

function AccountAvatar({ e2e }: { e2e: boolean }) {
  if (e2e) {
    return <span aria-label="Tài khoản kiểm thử" className="grid h-7 w-7 place-items-center rounded-full bg-brand-weak text-[10px] font-semibold text-brand">E2E</span>;
  }
  return <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />;
}
