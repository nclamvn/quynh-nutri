import type { Confidence } from "@/domain/types";

/** Round for display; numbers are data, keep them clean. */
export function fmt(n: number, digits = 0): string {
  return n.toLocaleString("vi-VN", { maximumFractionDigits: digits });
}

export function fmtRange(low: number, high: number, digits = 0): string {
  return `${fmt(low, digits)}–${fmt(high, digits)}`;
}

export function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

/** Confidence → semantic token name (Blueprint §5.1). */
export type ProvTone = "accent" | "amber" | "muted";

export function coverageTone(coverage: number, gateNumber = 0.85, gateRange = 0.6): ProvTone {
  if (coverage >= gateNumber) return "accent";
  if (coverage >= gateRange) return "amber";
  return "muted";
}

export function confidenceTone(c: Confidence): ProvTone {
  if (c === "corroborated") return "accent";
  if (c === "disputed") return "amber";
  return "muted"; // honest_null — missing data is not an error, so never red
}
