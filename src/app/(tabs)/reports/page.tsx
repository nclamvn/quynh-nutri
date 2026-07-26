"use client";

import { useI18n } from "@/i18n/context";
import { ShellNotice } from "@/ui/components/ShellNotice";
import { ReportIcon } from "@/ui/components/icons";

export default function ReportsPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 border-b border-hairline bg-bg/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-semibold">{t("reports.title")}</h1>
      </header>
      {/* SHELL: no price engine → no fabricated spending numbers (L-1). */}
      <ShellNotice icon={<ReportIcon className="h-12 w-12" />} title={t("reports.shellTitle")} hint={t("reports.shellHint")} />
    </div>
  );
}
