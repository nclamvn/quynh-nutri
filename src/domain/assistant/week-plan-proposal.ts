import type { PlannedSlot, Slot } from "@/domain/types";

export interface WeekPlanProposalChange {
  day: number;
  slot: Slot;
  beforeDishId: string | null;
  afterDishId: string | null;
}

export interface AssistantWeekPlanProposal {
  id: string;
  kind: "week-plan";
  weekStart: string;
  baseVersion: number;
  seed: number;
  createdAt: string;
  slots: PlannedSlot[];
  changes: WeekPlanProposalChange[];
  notes: string[];
}

export interface ConfirmAssistantWeekPlanProposalInput {
  proposalId: string;
  kind: "week-plan";
  weekStart: string;
  baseVersion: number;
  seed: number;
  slots: PlannedSlot[];
  confirmedByUser: true;
}

const keyFor = (slot: Pick<PlannedSlot, "day" | "slot">) =>
  `${slot.day}:${slot.slot}`;

export function weekPlanProposalChanges(
  before: readonly PlannedSlot[],
  after: readonly PlannedSlot[],
): WeekPlanProposalChange[] {
  const beforeByKey = new Map(before.map((item) => [keyFor(item), item]));
  const afterByKey = new Map(after.map((item) => [keyFor(item), item]));
  const keys = new Set([...beforeByKey.keys(), ...afterByKey.keys()]);

  return [...keys]
    .map((key) => {
      const previous = beforeByKey.get(key);
      const next = afterByKey.get(key);
      return {
        day: next?.day ?? previous!.day,
        slot: next?.slot ?? previous!.slot,
        beforeDishId: previous?.dishId ?? null,
        afterDishId: next?.dishId ?? null,
      };
    })
    .filter((change) => change.beforeDishId !== change.afterDishId)
    .sort((left, right) =>
      left.day - right.day || left.slot.localeCompare(right.slot)
    );
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("vi")
    .replaceAll("đ", "d")
    .replace(/\s+/g, " ")
    .trim();

export function isWeekPlanProposalRequest(value: string): boolean {
  const text = normalize(value);
  const hasPlanSubject =
    /\b(thuc don|menu)\b/.test(text)
    || /\b(ca tuan|tuan nay|tuan moi)\b/.test(text);
  const hasChangeIntent =
    /\b(len|tao|doi|lam moi|sap lai|toi uu|goi y)\b/.test(text);
  return hasPlanSubject && hasChangeIntent;
}
