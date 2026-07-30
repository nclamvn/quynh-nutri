"use client";

import type { Adequacy } from "@/domain/nutrition";
import { useI18n } from "@/i18n/context";
import { pct } from "@/ui/format";

/**
 * A neutral CONTRIBUTION bar – how much of the family's DAILY need this planned
 * meal supplies. The base is stated explicitly ("nhu cầu ngày") per the
 * denominator precedent: the app plans dinner, so a dinner is ~a third of the
 * day – showing a "thiếu" verdict against a full-day need would be a false
 * mẫu-số error. No đủ/thiếu verdict here, no red; the 4/4 groups signal carries
 * "đủ chất". (L-2/L-3 at the semantic tier.)
 */
export function AdequacyStrip({ adequacy }: { adequacy: Adequacy }) {
  const { t } = useI18n();
  const ratio = adequacy.kcalRatio;
  const width = `${Math.min(100, Math.round(ratio * 100))}%`;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full bg-accent" style={{ width }} />
      </div>
      <span className="tnum whitespace-nowrap text-[11px] text-muted">
        ≈{pct(ratio)} {t("adequacy.ofDay")}
      </span>
    </div>
  );
}
