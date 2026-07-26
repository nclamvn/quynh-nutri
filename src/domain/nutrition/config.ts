// D3 gate thresholds (INTAKE-SEED §6, refined to 3 tiers per Human decision).
// Config, not hardcoded — tunable with real data via env.
//
//   coverage ≥ NUMBER            → show a point number
//   RANGE ≤ coverage < NUMBER    → show a number anchored inside a range
//   coverage < RANGE             → show a range only (+ "ước lượng" badge)

function envNum(key: string, fallback: number): number {
  const v = typeof process !== "undefined" ? process.env?.[key] : undefined;
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const D3_CONFIG = {
  /** ≥ this coverage → confident point number. Default 0.85. */
  number: envNum("D3_NUMBER", 0.85),
  /** ≥ this (and < number) → number anchored in a range. Default 0.60. */
  range: envNum("D3_RANGE", 0.6),
  /** The "gate" mid-mark from the original single-threshold spec (0.70). */
  gate: envNum("D3_GATE", 0.7),
} as const;

/** Adequacy: intake ≥ this fraction of need → "đủ". Default 0.90. */
export const ADEQUACY_MIN = envNum("ADEQUACY_MIN", 0.9);
