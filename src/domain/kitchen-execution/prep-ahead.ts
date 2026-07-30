import type { Dish, MealOccasion, Slot, WeekPlan } from "@/domain/types";
import type { KitchenGuideSource, LocalizedText } from "./index";

export type PrepAheadKind =
  | "gather"
  | "measure"
  | "produce"
  | "marinate-refrigerated"
  | "separate"
  | "defer-until-cooking";

export interface PrepAheadStep {
  id: string;
  kind: PrepAheadKind;
  title: LocalizedText;
  instruction: LocalizedText;
  storageInstruction?: LocalizedText;
  sourceIds: string[];
}

export interface PrepAheadGuide {
  id: string;
  dishId: string;
  reviewedAt: string;
  scope: "previous-evening";
  steps: PrepAheadStep[];
  sourceIds: string[];
}

export interface ResolvedPrepAheadGuide {
  guide: PrepAheadGuide;
  sources: KitchenGuideSource[];
}

export interface PrepAheadDish {
  dish: Dish;
  occasion: MealOccasion;
  slot: Slot;
  guide: PrepAheadGuide;
}

export interface UnsupportedPrepAheadDish {
  dish: Dish;
  occasion: MealOccasion;
  slot: Slot;
}

export interface PrepAheadPlanDay {
  day: number;
  supported: PrepAheadDish[];
  unsupported: UnsupportedPrepAheadDish[];
}

const SLOT_ORDER: Slot[] = ["COM", "MAN", "RAU", "CANH", "TRANGMIENG"];

export function prepAheadGuideFor(
  dishId: string,
  guides: readonly PrepAheadGuide[],
  sourceById: Readonly<Record<string, KitchenGuideSource>>,
): ResolvedPrepAheadGuide | undefined {
  const guide = guides.find((candidate) => candidate.dishId === dishId);
  if (!guide) return undefined;
  return {
    guide,
    sources: guide.sourceIds.flatMap((sourceId) => {
      const source = sourceById[sourceId];
      return source ? [source] : [];
    }),
  };
}

export function prepAheadForPlanDay(
  plan: WeekPlan,
  day: number,
  dishResolver: (dishId: string) => Dish | undefined,
  guides: readonly PrepAheadGuide[],
): PrepAheadPlanDay {
  const seen = new Set<string>();
  const supported: PrepAheadDish[] = [];
  const unsupported: UnsupportedPrepAheadDish[] = [];
  const slots = plan.slots
    .filter((slot) => slot.day === day)
    .slice()
    .sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));

  for (const slot of slots) {
    if (seen.has(slot.dishId)) continue;
    seen.add(slot.dishId);
    const dish = dishResolver(slot.dishId);
    if (!dish) continue;
    const guide = guides.find((candidate) => candidate.dishId === slot.dishId);
    if (guide) {
      supported.push({
        dish,
        occasion: slot.occasion,
        slot: slot.slot,
        guide,
      });
    } else {
      unsupported.push({
        dish,
        occasion: slot.occasion,
        slot: slot.slot,
      });
    }
  }

  return { day, supported, unsupported };
}
