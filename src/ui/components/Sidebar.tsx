"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/context";
import { useStore } from "@/ui/store";
import { UserButton } from "@clerk/nextjs";
import { FlowerLogo } from "./FlowerLogo";
import { NAV_GROUPS as GROUPS } from "@/ui/nav";

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
  const { household } = useStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); } catch {}
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0"); } catch {}
      return next;
    });
  };

  return (
    <aside className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-hairline bg-surface/40 lg:flex ${collapsed ? "w-16" : "w-60"}`}>
      {/* Brand */}
      <div className={`pb-3 pt-5 ${collapsed ? "px-0" : "px-5"}`}>
        <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
          <span className="text-brand">
            <FlowerLogo size={28} />
          </span>
          {!collapsed && <p className="font-semibold leading-tight tracking-tight">{t("brand.name")}</p>}
        </div>
        {!collapsed && <p className="mt-4 text-sm font-medium text-ink">{t("greeting")} 👋</p>}
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto py-2 ${collapsed ? "px-2" : "px-3"}`}>
        {GROUPS.map(({ group, items }) => (
          <div key={group} className="mb-4">
            {!collapsed && <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-tertiary">{t(group)}</p>}
            <ul className="space-y-0.5">
              {items.map((it) => {
                const active = pathname === it.href || pathname.startsWith(it.href + "/");
                return (
                  <li key={it.key}>
                    <Link
                      href={it.href}
                      title={collapsed ? t(it.key) : undefined}
                      className={`flex items-center rounded-lg text-sm ${collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2"} ${
                        active ? "bg-brand-weak font-medium text-brand" : "text-muted hover:bg-surface hover:text-ink"
                      }`}
                    >
                      <it.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="flex-1 truncate">{t(it.key)}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: household + collapse toggle */}
      <div className={`border-t border-hairline ${collapsed ? "p-2" : "p-3"}`}>
        {collapsed ? (
          <div className="mb-1 flex justify-center py-1.5">
            <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
          </div>
        ) : (
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
            <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
          aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
          className={`flex w-full items-center rounded-lg text-sm text-muted hover:bg-surface hover:text-ink ${collapsed ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2"}`}
        >
          <ChevronsIcon dir={collapsed ? "right" : "left"} />
          {!collapsed && <span>{t("sidebar.collapse")}</span>}
        </button>
      </div>
    </aside>
  );
}
