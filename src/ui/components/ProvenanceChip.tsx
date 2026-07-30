"use client";

import type { MacroDisplay } from "@/domain/nutrition";
import { fmt, fmtRange, pct, coverageTone, type ProvTone } from "@/ui/format";

const DOT: Record<ProvTone, string> = {
  accent: "bg-accent",
  amber: "bg-amber",
  muted: "bg-muted",
};
const TEXT: Record<ProvTone, string> = {
  accent: "text-accent",
  amber: "text-amber",
  muted: "text-muted",
};

/** The tiny confidence dot – same semantics everywhere a number appears. */
export function ProvenanceDot({ tone }: { tone: ProvTone }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${DOT[tone]}`} aria-hidden />;
}

/**
 * Signature element (Blueprint §5.3): every nutrition number self-declares how
 * sure it is. Colour = confidence, % = mass coverage. Below the gate it shows a
 * range, never false precision.
 */
export function ProvenanceChip({
  display,
  unit = "kcal",
  field = "kcal",
  showCoverage = true,
  compact = false,
  className = "",
}: {
  display: MacroDisplay;
  unit?: string;
  field?: keyof MacroDisplay["point"];
  showCoverage?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const tone = coverageTone(display.coverage);
  const point = display.point[field];
  const lo = display.range?.low[field];
  const hi = display.range?.high[field];

  let fullValue: string;
  if (display.mode === "number") fullValue = `${fmt(point)}`;
  else if (display.mode === "anchored") fullValue = `≈${fmt(point)} (${fmtRange(lo!, hi!)})`;
  else fullValue = fmtRange(lo!, hi!);
  const value = compact && display.mode === "anchored" ? `≈${fmt(point)}` : fullValue;
  const coverage = showCoverage ? pct(display.coverage) : "";
  const description = `${fullValue} ${unit}${showCoverage ? ` · ${coverage} khối lượng đã đối chiếu` : ""}`;

  return (
    <span
      className={`glass inline-flex max-w-full shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] ${className}`}
      title={description}
      aria-label={description}
    >
      <ProvenanceDot tone={tone} />
      <span className={`tnum shrink-0 font-medium ${TEXT[tone]}`}>{value}</span>
      <span className="shrink-0 text-muted">{unit}</span>
      {showCoverage && <span className="tnum shrink-0 text-muted">· {coverage}</span>}
    </span>
  );
}
