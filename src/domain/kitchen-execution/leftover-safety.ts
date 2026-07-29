import type {
  LeftoverLot,
  LeftoverStorageLocation,
} from "@/domain/types";

export const LEFTOVER_POLICY_VERSION = "usda-fsis-2026-07-29";
export const LEFTOVER_POLICY_SOURCES = [
  "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety",
  "https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts",
] as const;

export type LeftoverPolicyErrorCode =
  | "INVALID_TIMESTAMP"
  | "CHILLED_BEFORE_PREPARED"
  | "TIMESTAMP_IN_FUTURE"
  | "COOLING_WINDOW_EXCEEDED";

export type LeftoverSafetySignal =
  | "within-guidance-window"
  | "review-guidance"
  | "past-guidance-window"
  | "freezer-quality-only";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const FUTURE_TOLERANCE_MS = 5 * MINUTE_MS;

const timestamp = (value: string | Date) => {
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : undefined;
};

export function evaluateCoolingWindow(input: {
  preparedAt: string | Date;
  chilledAt: string | Date;
  hotWeatherConfirmed: boolean;
  now: Date;
}): {
  accepted: boolean;
  limitMinutes: 60 | 120;
  elapsedMinutes: number;
  reasonCode?: LeftoverPolicyErrorCode;
} {
  const limitMinutes = input.hotWeatherConfirmed ? 60 : 120;
  const preparedMs = timestamp(input.preparedAt);
  const chilledMs = timestamp(input.chilledAt);
  const nowMs = timestamp(input.now);
  if (preparedMs === undefined || chilledMs === undefined || nowMs === undefined) {
    return { accepted: false, limitMinutes, elapsedMinutes: Number.NaN, reasonCode: "INVALID_TIMESTAMP" };
  }
  const elapsedMinutes = (chilledMs - preparedMs) / MINUTE_MS;
  if (chilledMs < preparedMs) {
    return { accepted: false, limitMinutes, elapsedMinutes, reasonCode: "CHILLED_BEFORE_PREPARED" };
  }
  if (preparedMs > nowMs + FUTURE_TOLERANCE_MS || chilledMs > nowMs + FUTURE_TOLERANCE_MS) {
    return { accepted: false, limitMinutes, elapsedMinutes, reasonCode: "TIMESTAMP_IN_FUTURE" };
  }
  if (elapsedMinutes > limitMinutes) {
    return { accepted: false, limitMinutes, elapsedMinutes, reasonCode: "COOLING_WINDOW_EXCEEDED" };
  }
  return { accepted: true, limitMinutes, elapsedMinutes };
}

export function evaluateLeftoverGuidance(input: {
  chilledAt: string | Date;
  storageLocation: LeftoverStorageLocation;
  now: Date;
}): {
  signal: LeftoverSafetySignal;
  ageHours: number;
  policyVersion: string;
} {
  const chilledMs = timestamp(input.chilledAt);
  const nowMs = timestamp(input.now);
  if (chilledMs === undefined || nowMs === undefined) throw new Error("INVALID_TIMESTAMP");
  if (chilledMs > nowMs + FUTURE_TOLERANCE_MS) throw new Error("TIMESTAMP_IN_FUTURE");
  const ageHours = Math.max(0, (nowMs - chilledMs) / HOUR_MS);
  if (input.storageLocation === "freezer") {
    return { signal: "freezer-quality-only", ageHours, policyVersion: LEFTOVER_POLICY_VERSION };
  }
  const signal =
    ageHours > 96
      ? "past-guidance-window"
      : ageHours >= 72
        ? "review-guidance"
        : "within-guidance-window";
  return { signal, ageHours, policyVersion: LEFTOVER_POLICY_VERSION };
}

const signalRank: Record<LeftoverSafetySignal, number> = {
  "past-guidance-window": 0,
  "review-guidance": 1,
  "within-guidance-window": 2,
  "freezer-quality-only": 3,
};

export function sortLeftoversForReview(lots: LeftoverLot[], now: Date): LeftoverLot[] {
  return [...lots]
    .filter((lot) => lot.remainingServings > 0)
    .sort((a, b) => {
      const aSignal = evaluateLeftoverGuidance({
        chilledAt: a.chilledAt,
        storageLocation: a.storageLocation,
        now,
      }).signal;
      const bSignal = evaluateLeftoverGuidance({
        chilledAt: b.chilledAt,
        storageLocation: b.storageLocation,
        now,
      }).signal;
      return signalRank[aSignal] - signalRank[bSignal]
        || new Date(a.chilledAt).getTime() - new Date(b.chilledAt).getTime()
        || a.id.localeCompare(b.id);
    });
}
