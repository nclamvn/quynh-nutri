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

/** The tiny confidence dot — same semantics everywhere a number appears. */
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
  className = "",
}: {
  display: MacroDisplay;
  unit?: string;
  field?: keyof MacroDisplay["point"];
  showCoverage?: boolean;
  className?: string;
}) {
  const tone = coverageTone(display.coverage);
  const point = display.point[field];
  const lo = display.range?.low[field];
  const hi = display.range?.high[field];

  let value: string;
  if (display.mode === "number") value = `${fmt(point)}`;
  else if (display.mode === "anchored") value = `≈${fmt(point)} (${fmtRange(lo!, hi!)})`;
  else value = fmtRange(lo!, hi!);

  return (
    <span
      className={`glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] ${className}`}
      title={`${pct(display.coverage)} khối lượng đã đối chiếu`}
    >
      <ProvenanceDot tone={tone} />
      <span className={`tnum font-medium ${TEXT[tone]}`}>{value}</span>
      <span className="text-muted">{unit}</span>
      {showCoverage && <span className="tnum text-muted">· {pct(display.coverage)}</span>}
    </span>
  );
}
