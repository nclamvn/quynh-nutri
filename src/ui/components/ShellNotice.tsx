"use client";

import { useI18n } from "@/i18n/context";

/**
 * Honest SHELL placeholder (L-6). A screen whose engine isn't wired yet shows
 * this instead of faking data — clear "sắp có" badge, states what's missing.
 */
export function ShellNotice({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center">
      <span className="mb-3 text-tertiary">{icon}</span>
      <div className="mb-2 flex items-center gap-2">
        <p className="text-sm font-medium">{title}</p>
        <span className="rounded-full bg-amber-weak px-2 py-0.5 text-[10px] text-amber">{t("shell.badge")}</span>
      </div>
      <p className="max-w-xs text-xs text-muted">{hint}</p>
    </div>
  );
}
