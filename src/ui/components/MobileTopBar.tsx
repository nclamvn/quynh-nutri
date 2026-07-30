"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { useTheme } from "@/ui/theme";
import { FlowerLogo } from "./FlowerLogo";
import { SunIcon, MoonIcon } from "./icons";
import { MobileMenu } from "./MobileMenu";

/**
 * Mobile-only top bar (lg:hidden). Hamburger opens the "More" menu (every area),
 * plus brand + theme toggle. In normal flow (not sticky) so each page's own
 * sticky header takes over on scroll – no stacked sticky bars.
 */
export function MobileTopBar() {
  const { t } = useI18n();
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-hairline bg-raised/55 px-3 py-2.5 backdrop-blur-xl lg:hidden">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink active:bg-surface"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <Link
          href="/"
          data-testid="mobile-brand-home"
          aria-label={t("brand.home")}
          className="group flex items-center gap-2 text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <FlowerLogo size={21} className="transition-transform group-hover:-rotate-6" />
          <span className="font-serif text-[15px] font-semibold tracking-[-0.025em] text-ink">
            {t("brand.name")}
          </span>
        </Link>
        <button
          onClick={toggle}
          aria-label={theme === "dark" ? t("settings.themeLight") : t("settings.themeDark")}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted active:bg-surface"
        >
          {theme === "dark" ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}
        </button>
      </div>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
