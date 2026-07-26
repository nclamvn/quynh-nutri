import type { Macro } from "@/domain/types";
import { D3_CONFIG } from "./config";

export type DisplayMode = "number" | "anchored" | "range";

export interface MacroDisplay {
  /** Best-estimate point value (always present as the anchor). */
  point: Macro;
  /** How honest the UI must be about this number. */
  mode: DisplayMode;
  /** coverage in [0,1] that produced the mode. */
  coverage: number;
  /** Present for anchored/range modes: inclusive [low, high] per field. */
  range?: { low: Macro; high: Macro };
}

/** 3-tier gate: coverage decides how much certainty the UI may claim. */
export function displayModeFor(coverage: number): DisplayMode {
  if (coverage >= D3_CONFIG.number) return "number";
  if (coverage >= D3_CONFIG.range) return "anchored";
  return "range";
}

/**
 * Range margin widens as coverage falls. Clamped so a fully-uncovered dish
 * doesn't produce an absurd ±100% band, and a near-covered one still shows
 * a meaningful spread. Margin ratio ∈ [0.05, 0.30].
 */
export function marginRatio(coverage: number): number {
  return Math.min(0.3, Math.max(0.05, (1 - coverage) * 0.6));
}

function band(point: Macro, ratio: number): { low: Macro; high: Macro } {
  const f = (v: number, dir: number) => Math.max(0, v * (1 + dir * ratio));
  return {
    low: { kcal: f(point.kcal, -1), proteinG: f(point.proteinG, -1), carbG: f(point.carbG, -1), fatG: f(point.fatG, -1), fiberG: f(point.fiberG, -1) },
    high: { kcal: f(point.kcal, 1), proteinG: f(point.proteinG, 1), carbG: f(point.carbG, 1), fatG: f(point.fatG, 1), fiberG: f(point.fiberG, 1) },
  };
}

/**
 * Build the honest display for a computed macro at a given coverage.
 * `number` → point only. `anchored`/`range` → point + widening band.
 * Never fabricates false precision below the gate.
 */
export function toDisplay(point: Macro, coverage: number): MacroDisplay {
  const mode = displayModeFor(coverage);
  if (mode === "number") return { point, mode, coverage };
  return { point, mode, coverage, range: band(point, marginRatio(coverage)) };
}
