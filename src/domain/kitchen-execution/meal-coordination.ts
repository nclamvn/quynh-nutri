export interface MealTimelineTask {
  dishId: string;
  estimatedMin: number;
  startAt: string;
  finishAt: string;
}

export interface MealTimeline {
  targetServeAt: string;
  tasks: MealTimelineTask[];
  unsupportedDishIds: string[];
}

export interface MealRunTaskState {
  dishId: string;
  estimatedMin: number;
  startedAt?: string;
  completedAt?: string;
}

export interface MealRunSession {
  day: number;
  targetServeAt: string;
  tasks: MealRunTaskState[];
  createdAt: string;
}

export type MealTaskStatus = "upcoming" | "due" | "late" | "done";

const validIso = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(new Date(value).getTime());

export function buildMealTimeline(
  dishIds: readonly string[],
  durationByDish: Readonly<Record<string, number>>,
  targetServeAt: string,
): MealTimeline {
  if (!validIso(targetServeAt)) throw new Error("INVALID_TARGET");
  const uniqueDishIds = [...new Set(dishIds)];
  const unsupportedDishIds: string[] = [];
  const tasks: MealTimelineTask[] = [];
  const finish = new Date(targetServeAt).getTime();

  for (const dishId of uniqueDishIds) {
    const duration = durationByDish[dishId];
    if (duration === undefined) {
      unsupportedDishIds.push(dishId);
      continue;
    }
    if (!Number.isInteger(duration) || duration < 5 || duration > 240) {
      throw new Error("INVALID_DURATION");
    }
    tasks.push({
      dishId,
      estimatedMin: duration,
      startAt: new Date(finish - duration * 60_000).toISOString(),
      finishAt: new Date(finish).toISOString(),
    });
  }

  tasks.sort(
    (a, b) =>
      new Date(a.startAt).getTime() - new Date(b.startAt).getTime() ||
      a.dishId.localeCompare(b.dishId),
  );
  return {
    targetServeAt: new Date(finish).toISOString(),
    tasks,
    unsupportedDishIds,
  };
}

export function mealTaskStatus(
  task: Pick<MealRunTaskState, "completedAt"> & Pick<MealTimelineTask, "startAt" | "finishAt">,
  now: Date = new Date(),
): MealTaskStatus {
  if (task.completedAt) return "done";
  const time = now.getTime();
  if (time < new Date(task.startAt).getTime()) return "upcoming";
  if (time <= new Date(task.finishAt).getTime()) return "due";
  return "late";
}

export function parseMealRunSession(
  raw: string | null,
  expectedDay: number,
  supportedDishIds: ReadonlySet<string>,
): MealRunSession | undefined {
  if (!raw) return undefined;
  try {
    const value = JSON.parse(raw) as Partial<MealRunSession>;
    if (
      value.day !== expectedDay ||
      !validIso(value.targetServeAt) ||
      !validIso(value.createdAt) ||
      !Array.isArray(value.tasks) ||
      value.tasks.length < 2
    ) {
      return undefined;
    }
    const seen = new Set<string>();
    for (const task of value.tasks) {
      if (
        !task ||
        typeof task.dishId !== "string" ||
        !supportedDishIds.has(task.dishId) ||
        seen.has(task.dishId) ||
        !Number.isInteger(task.estimatedMin) ||
        task.estimatedMin < 5 ||
        task.estimatedMin > 240 ||
        (task.startedAt !== undefined && !validIso(task.startedAt)) ||
        (task.completedAt !== undefined && !validIso(task.completedAt))
      ) {
        return undefined;
      }
      seen.add(task.dishId);
    }
    return value as MealRunSession;
  } catch {
    return undefined;
  }
}
