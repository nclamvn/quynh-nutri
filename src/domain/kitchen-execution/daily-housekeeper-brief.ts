import type {
  AgendaUnsupportedSignal,
  KitchenAgenda,
  KitchenAgendaTask,
  KitchenAgendaTaskKind,
} from "./kitchen-agenda";

export const DAILY_BRIEF_STATIONS = [
  "prepare",
  "shop",
  "use-soon",
] as const;

export type DailyBriefStationKey = (typeof DAILY_BRIEF_STATIONS)[number];

export interface DailyBriefStation {
  key: DailyBriefStationKey;
  tasks: KitchenAgendaTask[];
}

export interface DailyHousekeeperBrief {
  generatedAt: string;
  calendarDate: string;
  tasks: KitchenAgendaTask[];
  stations: DailyBriefStation[];
  unsupported: AgendaUnsupportedSignal[];
}

const stationByKind = {
  "prepare-frozen": "prepare",
  "prep-ahead": "prepare",
  cook: "prepare",
  "coordinate-meal": "prepare",
  shop: "shop",
  "confirm-purchase": "shop",
  "review-leftover": "use-soon",
  "review-inventory-label": "use-soon",
} satisfies Record<KitchenAgendaTaskKind, DailyBriefStationKey>;

/**
 * A presentation projection over canonical agenda evidence. It preserves the
 * engine's stable task order, source references and actions without adding
 * state, completion or inferred work.
 */
export function buildDailyHousekeeperBrief(
  agenda: KitchenAgenda,
): DailyHousekeeperBrief {
  const stationTasks = new Map<DailyBriefStationKey, KitchenAgendaTask[]>(
    DAILY_BRIEF_STATIONS.map((key) => [key, []]),
  );
  const tasks = agenda.tasks.map((task) => ({
    ...task,
    evidence: { ...task.evidence },
  }));
  for (const task of tasks) {
    stationTasks.get(stationByKind[task.kind])!.push(task);
  }
  return {
    generatedAt: agenda.generatedAt,
    calendarDate: agenda.calendarDate,
    tasks,
    stations: DAILY_BRIEF_STATIONS.map((key) => ({
      key,
      tasks: stationTasks.get(key)!,
    })),
    unsupported: agenda.unsupported.map((signal) => ({
      ...signal,
      evidence: { ...signal.evidence },
    })),
  };
}

