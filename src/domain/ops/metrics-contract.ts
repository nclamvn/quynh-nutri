import {
  PRODUCT_EVENT_NAMES,
  parseProductEvent,
  type ProductEventName,
} from "@/domain/product-events";

export const OPS_METRICS_CONTRACT_VERSION = "ke031-v1" as const;
export const OPS_REPORTING_ZONE = "Asia/Ho_Chi_Minh" as const;
export const OPS_INTERACTIVE_WINDOWS = [7, 28, 90] as const;
export const OPS_PRIVACY_THRESHOLD = 5;

export type ReportingWindowDays = (typeof OPS_INTERACTIVE_WINDOWS)[number];
export type OpsHealthState =
  | "healthy"
  | "attention"
  | "insufficient_traffic"
  | "unavailable";

export type OpsEventRow = {
  householdId: string;
  name: string;
  schemaVersion: number;
  properties: unknown;
  occurredAt: Date;
};

export type OpsCohortStart = {
  householdId: string;
  occurredAt: Date;
};

export type OpsMetricInput = {
  events: OpsEventRow[];
  firstOnboardingStarts: OpsCohortStart[];
  canonicalCompletions: {
    current: number;
    previous: number;
  } | null;
  now: Date;
  windowDays: number;
  queryDurationMs: number;
};

export type MetricPeriod = {
  startUtc: string;
  endUtc: string;
  days: number;
};

export type SuppressedNumber = {
  state: "available" | "suppressed" | "unavailable";
  value: number | null;
  sampleSize: number;
  denominator: number | null;
  reason: string | null;
};

export type OpsMilestoneKey =
  | "started"
  | "setup_completed"
  | "plan_participated"
  | "shopping_received"
  | "kitchen_started"
  | "meal_completed"
  | "learning_loop";

export type OpsMilestoneMetric = {
  key: OpsMilestoneKey;
  households: number;
  denominator: number;
  conversionPct: number | null;
  previousHouseholds: number;
  previousDenominator: number;
  previousConversionPct: number | null;
  deltaPercentagePoints: number | null;
};

export type OpsMetricsDto = {
  contractVersion: typeof OPS_METRICS_CONTRACT_VERSION;
  reportingZone: typeof OPS_REPORTING_ZONE;
  generatedAt: string;
  period: MetricPeriod;
  previousPeriod: MetricPeriod;
  milestones: OpsMilestoneMetric[];
  journey: {
    strictCompletedHouseholds: number;
    directPathHouseholds: number;
    impossibleOrderingHouseholds: number;
  };
  timeToValue: {
    firstOperationalAction: {
      medianHours: SuppressedNumber;
      p75Hours: SuppressedNumber;
      matureHouseholds: number;
    };
    firstClosedMeal: {
      medianHours: SuppressedNumber;
      p75Hours: SuppressedNumber;
      matureHouseholds: number;
    };
  };
  returnBehavior: {
    activeHouseholds: number;
    twoDayHouseholds: number;
    twoWeekHouseholds: number;
    sevenDayReturnPct: SuppressedNumber;
  };
  occasions: Array<{
    occasion: "breakfast" | "lunch" | "dinner" | "snack";
    editedHouseholds: SuppressedNumber;
    startedHouseholds: SuppressedNumber;
    completedHouseholds: SuppressedNumber;
  }>;
  health: {
    state: OpsHealthState;
    latestEventAt: string | null;
    eventsLast24Hours: number;
    eventsPrevious24Hours: number;
    unknownEventNames: number;
    unsupportedSchemaVersions: number;
    malformedProperties: number;
    futureTimestamps: number;
    negativeDurations: number;
    impossibleOrderingHouseholds: number;
    canonicalCompletionCount: number | null;
    completionEventCount: number;
    completionCoveragePct: number | null;
    queryDurationMs: number;
    limitations: string[];
    guardrails: Array<{
      code: string;
      state: "attention";
      message: string;
    }>;
  };
};

type ValidEvent = OpsEventRow & {
  name: ProductEventName;
  properties: Record<string, unknown>;
};

type Bounds = {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
};

type HouseholdEvents = Map<string, ValidEvent[]>;

const DAY_MS = 24 * 60 * 60 * 1000;
const HCM_OFFSET_MS = 7 * 60 * 60 * 1000;
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
const EVENT_NAME_SET = new Set<string>(PRODUCT_EVENT_NAMES);

const MILESTONES: Array<{
  key: OpsMilestoneKey;
  matches: (event: ValidEvent) => boolean;
}> = [
  { key: "started", matches: (event) => event.name === "onboarding_started" },
  {
    key: "setup_completed",
    matches: (event) => event.name === "onboarding_completed",
  },
  {
    key: "plan_participated",
    matches: (event) =>
      event.name === "week_proposal_confirmed"
      || (
        event.name === "meal_occasion_edited"
        && (event.properties.action === "add" || event.properties.action === "replace")
      ),
  },
  {
    key: "shopping_received",
    matches: (event) => event.name === "shopping_item_received",
  },
  {
    key: "kitchen_started",
    matches: (event) =>
      event.name === "cooking_started" || event.name === "meal_run_started",
  },
  {
    key: "meal_completed",
    matches: (event) => event.name === "meal_completed",
  },
  {
    key: "learning_loop",
    matches: (event) =>
      event.name === "leftover_recorded" || event.name === "meal_feedback_saved",
  },
];

const MEANINGFUL_EVENTS = new Set<ProductEventName>([
  "week_proposal_confirmed",
  "meal_occasion_edited",
  "shopping_item_received",
  "cooking_started",
  "meal_run_started",
  "meal_completed",
  "leftover_recorded",
  "meal_feedback_saved",
  "meal_feedback_deleted",
  "memory_guided_proposal_created",
]);

const OPERATIONAL_ACTIONS = new Set<ProductEventName>([
  "week_proposal_confirmed",
  "meal_occasion_edited",
  "shopping_item_received",
  "cooking_started",
  "meal_run_started",
  "meal_completed",
]);

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function percent(value: number, denominator: number): number | null {
  return denominator > 0 ? roundOne((value / denominator) * 100) : null;
}

function startOfHcmDay(date: Date): Date {
  const shifted = date.getTime() + HCM_OFFSET_MS;
  return new Date(Math.floor(shifted / DAY_MS) * DAY_MS - HCM_OFFSET_MS);
}

function hcmDayIndex(date: Date): number {
  return Math.floor((date.getTime() + HCM_OFFSET_MS) / DAY_MS);
}

function hcmWeekIndex(date: Date): number {
  return Math.floor((hcmDayIndex(date) + 3) / 7);
}

export function buildReportingBounds(now: Date, windowDays: number): Bounds {
  if (!Number.isInteger(windowDays) || windowDays < 1 || windowDays > 365) {
    throw new Error("Reporting window must be an integer from 1 to 365 days.");
  }
  const currentEnd = new Date(startOfHcmDay(now).getTime() + DAY_MS);
  const currentStart = new Date(currentEnd.getTime() - windowDays * DAY_MS);
  return {
    currentStart,
    currentEnd,
    previousStart: new Date(currentStart.getTime() - windowDays * DAY_MS),
  };
}

function period(start: Date, end: Date, days: number): MetricPeriod {
  return {
    startUtc: start.toISOString(),
    endUtc: end.toISOString(),
    days,
  };
}

function normalizeEvents(input: OpsMetricInput): {
  valid: ValidEvent[];
  unknownEventNames: number;
  unsupportedSchemaVersions: number;
  malformedProperties: number;
  futureTimestamps: number;
} {
  const result: ValidEvent[] = [];
  let unknownEventNames = 0;
  let unsupportedSchemaVersions = 0;
  let malformedProperties = 0;
  let futureTimestamps = 0;

  for (const event of input.events) {
    if (event.occurredAt.getTime() > input.now.getTime() + FUTURE_TOLERANCE_MS) {
      futureTimestamps += 1;
      continue;
    }
    if (!EVENT_NAME_SET.has(event.name)) {
      unknownEventNames += 1;
      continue;
    }
    if (event.schemaVersion !== 1) {
      unsupportedSchemaVersions += 1;
      continue;
    }
    try {
      const parsed = parseProductEvent({
        name: event.name,
        dedupeKey: "ops-contract-validation",
        properties: event.properties,
      });
      result.push({
        ...event,
        name: parsed.name,
        properties: parsed.properties,
      });
    } catch {
      malformedProperties += 1;
    }
  }

  return {
    valid: result.sort(
      (left, right) => left.occurredAt.getTime() - right.occurredAt.getTime(),
    ),
    unknownEventNames,
    unsupportedSchemaVersions,
    malformedProperties,
    futureTimestamps,
  };
}

function groupEvents(events: ValidEvent[]): HouseholdEvents {
  const grouped: HouseholdEvents = new Map();
  for (const event of events) {
    const existing = grouped.get(event.householdId) ?? [];
    existing.push(event);
    grouped.set(event.householdId, existing);
  }
  return grouped;
}

function inPeriod(date: Date, start: Date, end: Date): boolean {
  return date >= start && date < end;
}

function firstMatch(
  events: ValidEvent[],
  matches: (event: ValidEvent) => boolean,
  notBefore: Date,
  before: Date,
): ValidEvent | null {
  return events.find(
    (event) =>
      event.occurredAt >= notBefore
      && event.occurredAt < before
      && matches(event),
  ) ?? null;
}

function cohortForPeriod(
  starts: OpsCohortStart[],
  start: Date,
  end: Date,
): OpsCohortStart[] {
  return starts.filter((entry) => inPeriod(entry.occurredAt, start, end));
}

function milestoneCount(
  cohort: OpsCohortStart[],
  households: HouseholdEvents,
  milestone: (typeof MILESTONES)[number],
  periodEnd: Date,
): number {
  return cohort.filter((entry) => {
    if (milestone.key === "started") return true;
    const events = households.get(entry.householdId) ?? [];
    return Boolean(firstMatch(events, milestone.matches, entry.occurredAt, periodEnd));
  }).length;
}

function buildMilestones(
  currentCohort: OpsCohortStart[],
  previousCohort: OpsCohortStart[],
  households: HouseholdEvents,
  bounds: Bounds,
): OpsMilestoneMetric[] {
  return MILESTONES.map((milestone) => {
    const current = milestoneCount(
      currentCohort,
      households,
      milestone,
      bounds.currentEnd,
    );
    const previous = milestoneCount(
      previousCohort,
      households,
      milestone,
      bounds.currentStart,
    );
    const currentPct = percent(current, currentCohort.length);
    const previousPct = percent(previous, previousCohort.length);
    return {
      key: milestone.key,
      households: current,
      denominator: currentCohort.length,
      conversionPct: currentPct,
      previousHouseholds: previous,
      previousDenominator: previousCohort.length,
      previousConversionPct: previousPct,
      deltaPercentagePoints:
        currentPct === null || previousPct === null
          ? null
          : roundOne(currentPct - previousPct),
    };
  });
}

function buildJourney(
  cohort: OpsCohortStart[],
  households: HouseholdEvents,
  periodEnd: Date,
): {
  strictCompletedHouseholds: number;
  directPathHouseholds: number;
  impossibleOrderingHouseholds: number;
} {
  let strictCompletedHouseholds = 0;
  let directPathHouseholds = 0;
  let impossibleOrderingHouseholds = 0;

  for (const entry of cohort) {
    const events = households.get(entry.householdId) ?? [];
    let cursor = entry.occurredAt;
    let strictCompletion = false;

    for (const milestone of MILESTONES.slice(1)) {
      const next = firstMatch(events, milestone.matches, cursor, periodEnd);
      if (!next) {
        break;
      }
      cursor = next.occurredAt;
      if (milestone.key === "meal_completed") strictCompletion = true;
    }
    if (strictCompletion) strictCompletedHouseholds += 1;

    const factualCompletion = firstMatch(
      events,
      (event) => event.name === "meal_completed",
      entry.occurredAt,
      periodEnd,
    );
    if (factualCompletion && !strictCompletion) {
      directPathHouseholds += 1;
    }

    const preStartOperational = events.some(
      (event) =>
        event.occurredAt < entry.occurredAt
        && (
          OPERATIONAL_ACTIONS.has(event.name)
          || event.name === "leftover_recorded"
          || event.name === "meal_feedback_saved"
        ),
    );
    if (preStartOperational) impossibleOrderingHouseholds += 1;
  }

  return {
    strictCompletedHouseholds,
    directPathHouseholds,
    impossibleOrderingHouseholds,
  };
}

function nearestRank(values: number[], percentile: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil(percentile * sorted.length) - 1);
  return sorted[index] ?? 0;
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
  }
  return sorted[middle] ?? 0;
}

function durationMetric(
  valuesMs: number[],
  matureHouseholds: number,
  kind: "median" | "p75",
): SuppressedNumber {
  if (valuesMs.length < OPS_PRIVACY_THRESHOLD) {
    return {
      state: "suppressed",
      value: null,
      sampleSize: valuesMs.length,
      denominator: matureHouseholds,
      reason: "Chưa đủ mẫu trưởng thành",
    };
  }
  const valueMs = kind === "median" ? median(valuesMs) : nearestRank(valuesMs, 0.75);
  return {
    state: "available",
    value: Math.round(valueMs / (60 * 60 * 1000)),
    sampleSize: valuesMs.length,
    denominator: matureHouseholds,
    reason: null,
  };
}

function collectTimeToValue(
  cohort: OpsCohortStart[],
  households: HouseholdEvents,
  now: Date,
  horizonDays: number,
  matches: (event: ValidEvent) => boolean,
): { values: number[]; matureHouseholds: number; negativeDurations: number } {
  const horizonMs = horizonDays * DAY_MS;
  const values: number[] = [];
  let matureHouseholds = 0;
  let negativeDurations = 0;

  for (const entry of cohort) {
    const events = households.get(entry.householdId) ?? [];
    const setup = firstMatch(
      events,
      (event) => event.name === "onboarding_completed",
      entry.occurredAt,
      new Date(now.getTime() + 1),
    );
    if (!setup || now.getTime() - setup.occurredAt.getTime() < horizonMs) continue;
    matureHouseholds += 1;
    if (
      events.some(
        (event) =>
          event.occurredAt >= entry.occurredAt
          && event.occurredAt < setup.occurredAt
          && matches(event),
      )
    ) {
      negativeDurations += 1;
    }
    const valueEvent = firstMatch(
      events,
      matches,
      setup.occurredAt,
      new Date(setup.occurredAt.getTime() + horizonMs + 1),
    );
    if (!valueEvent) continue;
    const duration = valueEvent.occurredAt.getTime() - setup.occurredAt.getTime();
    values.push(duration);
  }

  return { values, matureHouseholds, negativeDurations };
}

function suppressedCount(
  value: number,
  denominator: number,
): SuppressedNumber {
  if (value < OPS_PRIVACY_THRESHOLD) {
    return {
      state: "suppressed",
      value: null,
      sampleSize: value,
      denominator,
      reason: "Dưới ngưỡng riêng tư",
    };
  }
  return {
    state: "available",
    value,
    sampleSize: value,
    denominator,
    reason: null,
  };
}

function buildReturnBehavior(
  events: ValidEvent[],
  currentCohort: OpsCohortStart[],
  households: HouseholdEvents,
  bounds: Bounds,
  now: Date,
): OpsMetricsDto["returnBehavior"] {
  const meaningful = events.filter(
    (event) =>
      inPeriod(event.occurredAt, bounds.currentStart, bounds.currentEnd)
      && MEANINGFUL_EVENTS.has(event.name),
  );
  const byHousehold = groupEvents(meaningful);
  let twoDayHouseholds = 0;
  let twoWeekHouseholds = 0;
  for (const householdEvents of byHousehold.values()) {
    if (new Set(householdEvents.map((event) => hcmDayIndex(event.occurredAt))).size >= 2) {
      twoDayHouseholds += 1;
    }
    if (new Set(householdEvents.map((event) => hcmWeekIndex(event.occurredAt))).size >= 2) {
      twoWeekHouseholds += 1;
    }
  }

  const mature: Array<{ setup: ValidEvent; events: ValidEvent[] }> = [];
  for (const entry of currentCohort) {
    const householdEvents = households.get(entry.householdId) ?? [];
    const setup = firstMatch(
      householdEvents,
      (event) => event.name === "onboarding_completed",
      entry.occurredAt,
      bounds.currentEnd,
    );
    if (setup && now.getTime() - setup.occurredAt.getTime() >= 7 * DAY_MS) {
      mature.push({ setup, events: householdEvents });
    }
  }
  const returned = mature.filter(({ setup, events: householdEvents }) => {
    const setupDay = hcmDayIndex(setup.occurredAt);
    return householdEvents.some((event) => {
      const dayOffset = hcmDayIndex(event.occurredAt) - setupDay;
      return dayOffset >= 2 && dayOffset <= 7 && MEANINGFUL_EVENTS.has(event.name);
    });
  }).length;

  const sevenDayReturnPct: SuppressedNumber =
    mature.length < OPS_PRIVACY_THRESHOLD
      ? {
          state: "suppressed",
          value: null,
          sampleSize: mature.length,
          denominator: mature.length,
          reason: "Chưa đủ mẫu trưởng thành",
        }
      : {
          state: "available",
          value: percent(returned, mature.length),
          sampleSize: mature.length,
          denominator: mature.length,
          reason: null,
        };

  return {
    activeHouseholds: byHousehold.size,
    twoDayHouseholds,
    twoWeekHouseholds,
    sevenDayReturnPct,
  };
}

function buildOccasions(
  events: ValidEvent[],
  bounds: Bounds,
  activeHouseholds: number,
): OpsMetricsDto["occasions"] {
  const occasions = ["breakfast", "lunch", "dinner", "snack"] as const;
  return occasions.map((occasion) => {
    const unique = (matches: (event: ValidEvent) => boolean) =>
      new Set(
        events
          .filter(
            (event) =>
              inPeriod(event.occurredAt, bounds.currentStart, bounds.currentEnd)
              && event.properties.occasion === occasion
              && matches(event),
          )
          .map((event) => event.householdId),
      ).size;
    return {
      occasion,
      editedHouseholds: suppressedCount(
        unique((event) => event.name === "meal_occasion_edited"),
        activeHouseholds,
      ),
      startedHouseholds: suppressedCount(
        unique((event) => event.name === "meal_run_started"),
        activeHouseholds,
      ),
      completedHouseholds: suppressedCount(
        unique((event) => event.name === "meal_completed"),
        activeHouseholds,
      ),
    };
  });
}

function coverage(count: number, eventCount: number): number | null {
  if (count === 0) return eventCount === 0 ? 100 : null;
  return roundOne((eventCount / count) * 100);
}

export function buildOpsMetrics(input: OpsMetricInput): OpsMetricsDto {
  const bounds = buildReportingBounds(input.now, input.windowDays);
  const normalized = normalizeEvents(input);
  const households = groupEvents(normalized.valid);
  const currentCohort = cohortForPeriod(
    input.firstOnboardingStarts,
    bounds.currentStart,
    bounds.currentEnd,
  );
  const previousCohort = cohortForPeriod(
    input.firstOnboardingStarts,
    bounds.previousStart,
    bounds.currentStart,
  );
  const milestones = buildMilestones(
    currentCohort,
    previousCohort,
    households,
    bounds,
  );
  const journey = buildJourney(currentCohort, households, bounds.currentEnd);
  const firstAction = collectTimeToValue(
    currentCohort,
    households,
    input.now,
    7,
    (event) =>
      OPERATIONAL_ACTIONS.has(event.name)
      && !(
        event.name === "meal_occasion_edited"
        && event.properties.action === "remove"
      ),
  );
  const firstMeal = collectTimeToValue(
    currentCohort,
    households,
    input.now,
    14,
    (event) => event.name === "meal_completed",
  );
  const returnBehavior = buildReturnBehavior(
    normalized.valid,
    currentCohort,
    households,
    bounds,
    input.now,
  );
  const occasions = buildOccasions(
    normalized.valid,
    bounds,
    returnBehavior.activeHouseholds,
  );
  const currentEvents = normalized.valid.filter((event) =>
    inPeriod(event.occurredAt, bounds.currentStart, bounds.currentEnd)
  );
  const nowMs = input.now.getTime();
  const eventsLast24Hours = normalized.valid.filter(
    (event) =>
      event.occurredAt.getTime() <= nowMs
      && event.occurredAt.getTime() > nowMs - DAY_MS,
  ).length;
  const eventsPrevious24Hours = normalized.valid.filter(
    (event) =>
      event.occurredAt.getTime() <= nowMs - DAY_MS
      && event.occurredAt.getTime() > nowMs - 2 * DAY_MS,
  ).length;
  const latestEventAt = normalized.valid.reduce<Date | null>(
    (latest, event) =>
      !latest || event.occurredAt > latest ? event.occurredAt : latest,
    null,
  );
  const completionEventCount = currentEvents.filter(
    (event) => event.name === "meal_completed",
  ).length;
  const completionCoveragePct =
    input.canonicalCompletions === null
      ? null
      : coverage(input.canonicalCompletions.current, completionEventCount);
  const negativeDurations =
    firstAction.negativeDurations + firstMeal.negativeDurations;

  const guardrails: OpsMetricsDto["health"]["guardrails"] = [];
  if (
    (completionCoveragePct !== null
      && (completionCoveragePct < 99 || completionCoveragePct > 101))
    || (
      input.canonicalCompletions !== null
      && input.canonicalCompletions.current === 0
      && completionEventCount > 0
    )
  ) {
    guardrails.push({
      code: "completion_coverage",
      state: "attention",
      message: "Độ phủ sự kiện hoàn tất bữa dưới 99%.",
    });
  }
  if (
    normalized.unknownEventNames > 0
    || normalized.unsupportedSchemaVersions > 0
    || normalized.malformedProperties > 0
  ) {
    guardrails.push({
      code: "event_contract",
      state: "attention",
      message: "Có tên sự kiện hoặc phiên bản schema ngoài contract.",
    });
  }
  if (
    normalized.futureTimestamps > 0
    || negativeDurations > 0
    || journey.impossibleOrderingHouseholds > 0
  ) {
    guardrails.push({
      code: "temporal_integrity",
      state: "attention",
      message: "Có bằng chứng thời gian hoặc thứ tự cần kiểm tra.",
    });
  }
  const currentCompleted = milestones.find(
    (milestone) => milestone.key === "meal_completed",
  );
  if (
    currentCompleted
    && currentCompleted.denominator >= 20
    && currentCompleted.previousDenominator >= 20
    && currentCompleted.conversionPct !== null
    && currentCompleted.previousConversionPct !== null
    && currentCompleted.previousConversionPct - currentCompleted.conversionPct >= 10
    && currentCompleted.conversionPct
      <= currentCompleted.previousConversionPct * 0.7
  ) {
    guardrails.push({
      code: "activation_drop",
      state: "attention",
      message: "Tỷ lệ khép bữa giảm đủ ngưỡng so với kỳ trước.",
    });
  }

  const healthState: OpsHealthState =
    input.canonicalCompletions === null
      ? "unavailable"
      : guardrails.length > 0 || normalized.malformedProperties > 0
        ? "attention"
        : currentEvents.length === 0
          ? "insufficient_traffic"
          : "healthy";

  return {
    contractVersion: OPS_METRICS_CONTRACT_VERSION,
    reportingZone: OPS_REPORTING_ZONE,
    generatedAt: input.now.toISOString(),
    period: period(bounds.currentStart, bounds.currentEnd, input.windowDays),
    previousPeriod: period(
      bounds.previousStart,
      bounds.currentStart,
      input.windowDays,
    ),
    milestones,
    journey,
    timeToValue: {
      firstOperationalAction: {
        medianHours: durationMetric(
          firstAction.values,
          firstAction.matureHouseholds,
          "median",
        ),
        p75Hours: durationMetric(
          firstAction.values,
          firstAction.matureHouseholds,
          "p75",
        ),
        matureHouseholds: firstAction.matureHouseholds,
      },
      firstClosedMeal: {
        medianHours: durationMetric(
          firstMeal.values,
          firstMeal.matureHouseholds,
          "median",
        ),
        p75Hours: durationMetric(
          firstMeal.values,
          firstMeal.matureHouseholds,
          "p75",
        ),
        matureHouseholds: firstMeal.matureHouseholds,
      },
    },
    returnBehavior,
    occasions,
    health: {
      state: healthState,
      latestEventAt: latestEventAt?.toISOString() ?? null,
      eventsLast24Hours,
      eventsPrevious24Hours,
      unknownEventNames: normalized.unknownEventNames,
      unsupportedSchemaVersions: normalized.unsupportedSchemaVersions,
      malformedProperties: normalized.malformedProperties,
      futureTimestamps: normalized.futureTimestamps,
      negativeDurations,
      impossibleOrderingHouseholds: journey.impossibleOrderingHouseholds,
      canonicalCompletionCount: input.canonicalCompletions?.current ?? null,
      completionEventCount,
      completionCoveragePct,
      queryDurationMs: roundOne(input.queryDurationMs),
      limitations: [
        "Lỗi ghi sự kiện không được lưu thành metric.",
        "Lỗi runtime, độ trễ API và sự cố nhà cung cấp AI không được đo bởi nguồn này.",
        "Không có lưu lượng không đồng nghĩa ứng dụng ngừng hoạt động.",
      ],
      guardrails,
    },
  };
}

export function parseInteractiveWindow(value: string | string[] | undefined): ReportingWindowDays {
  const parsed = Number.parseInt(Array.isArray(value) ? value[0] ?? "" : value ?? "", 10);
  return OPS_INTERACTIVE_WINDOWS.includes(parsed as ReportingWindowDays)
    ? parsed as ReportingWindowDays
    : 28;
}

export function parseHistoricalWindow(value: string | undefined): number | null {
  if (!value || !/^\d{1,3}$/.test(value)) return null;
  const parsed = Number(value);
  return parsed >= 1 && parsed <= 365 ? parsed : null;
}
