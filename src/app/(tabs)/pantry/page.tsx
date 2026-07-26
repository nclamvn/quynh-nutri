"use client";

import { useI18n } from "@/i18n/context";
import { ShellNotice } from "@/ui/components/ShellNotice";
import { BasketIcon } from "@/ui/components/icons";

export default function PantryPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 border-b border-hairline bg-bg/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-semibold">{t("pantry.title")}</h1>
      </header>
      {/* SHELL: needs a Pantry entity (Vision) → demo only, no auto-deduct (L-6). */}
      <ShellNotice icon={<BasketIcon className="h-12 w-12" />} title={t("pantry.title")} hint={t("pantry.shellHint")} />
    </div>
  );
}
