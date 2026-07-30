import { useI18n } from "@/i18n/context";

/** Real disclaimer for the T1 special-diets surfaces – neutral tone (never red).
 *  App executes public guidance; it does not replace a doctor. */
export function HealthDisclaimer({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <p className={`flex items-start gap-2 rounded-[12px] border border-hairline bg-surface/50 px-3 py-2 text-[11px] leading-relaxed text-muted ${className}`}>
      <span aria-hidden className="mt-px shrink-0">ⓘ</span>
      <span>{t("health.disclaimer")}</span>
    </p>
  );
}
