"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/context";
import { CalendarIcon, BasketIcon, BowlIcon, OverviewIcon } from "./icons";
import { AddDishSheet } from "./AddDishSheet";

const LEFT = [
  { href: "/overview", key: "tab.overview", icon: OverviewIcon },
  { href: "/week", key: "tab.week", icon: CalendarIcon },
];
const RIGHT = [
  { href: "/shopping", key: "tab.shopping", icon: BasketIcon },
  { href: "/dishes", key: "tab.dishes", icon: BowlIcon },
];

export function TabBar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [addOpen, setAddOpen] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const item = ({ href, key, icon: Icon }: (typeof LEFT)[number]) => (
    <li key={href} className="flex-1">
      <Link
        href={href}
        className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] ${
          isActive(href) ? "text-brand" : "text-muted"
        }`}
      >
        <Icon className="h-[22px] w-[22px]" />
        <span>{t(key)}</span>
      </Link>
    </li>
  );

  return (
    <>
      <nav className="sticky bottom-0 z-20 border-t border-hairline bg-bg/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="mx-auto flex max-w-md items-center">
          {LEFT.map(item)}
          <li className="flex-1">
            <div className="flex justify-center">
              <button
                onClick={() => setAddOpen(true)}
                aria-label={t("dishes.add")}
                className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_10px_28px_rgba(239,87,117,0.4)] active:bg-brand-hover"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          </li>
          {RIGHT.map(item)}
        </ul>
      </nav>
      <AddDishSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
