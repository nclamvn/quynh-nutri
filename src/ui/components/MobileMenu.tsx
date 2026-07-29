"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/context";
import { BottomSheet } from "./BottomSheet";
import { NAV_GROUPS } from "@/ui/nav";

/**
 * Mobile "More" — reaches every area the 4-tab bottom nav can't (Dinh dưỡng,
 * Yêu thích, Ghi chú, Báo cáo, Kho, Cài đặt). Client-nav via <Link> preserves
 * React store state (no hard reload). Does NOT add a 5th tab.
 */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <BottomSheet open={open} onClose={onClose} title="Menu">
      <div className="space-y-4">
        {NAV_GROUPS.map(({ group, items }) => (
          <div key={group}>
            <div className="mb-2 flex items-center gap-3 px-1">
              <p className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.18em] text-tertiary">
                {t(group)}
              </p>
              <span aria-hidden className="h-px flex-1 bg-hairline" />
            </div>
            <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
              {items.map((it) => {
                const active = pathname === it.href || pathname.startsWith(it.href + "/");
                return (
                  <li key={it.key}>
                    <Link
                      href={it.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={`folio-nav-link relative flex min-h-11 items-center gap-2.5 px-3 py-2 text-sm ${
                        active
                          ? "folio-nav-active font-medium text-brand"
                          : "text-muted active:bg-surface"
                      }`}
                    >
                      <it.icon className="h-[18px] w-[18px] shrink-0" />
                      <span className="truncate">{t(it.key)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}
