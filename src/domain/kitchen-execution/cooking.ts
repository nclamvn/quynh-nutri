import type { Dish, DishLine } from "@/domain/types";
import type { KitchenGuideSource, LocalizedText } from "./index";

export interface CookingStep {
  id: string;
  title: LocalizedText;
  instruction: LocalizedText;
  safetyCheck?: LocalizedText;
  sourceIds?: string[];
}

export interface CookingGuide {
  id: string;
  dishId: string;
  specificity: "dish";
  reviewedAt: string;
  servings: number;
  estimatedTotalMin: number;
  miseEnPlace: LocalizedText[];
  steps: CookingStep[];
  sourceIds: string[];
}

export interface ResolvedCookingGuide {
  guide: CookingGuide;
  sources: KitchenGuideSource[];
}

export interface CookingSession {
  dishId: string;
  guideId: string;
  completedStepIds: string[];
  startedAt: string;
  /** Page-selected serving count. Optional keeps pre-KE-023 sessions valid. */
  targetServings?: number;
}

export function resolveCookingGuide(
  dishId: string,
  guides: readonly CookingGuide[],
  sourceById: Readonly<Record<string, KitchenGuideSource>>,
): ResolvedCookingGuide | undefined {
  const guide = guides.find((candidate) => candidate.dishId === dishId);
  if (!guide) return undefined;
  return {
    guide,
    sources: guide.sourceIds.flatMap((id) => {
      const source = sourceById[id];
      return source ? [source] : [];
    }),
  };
}

export function scaleDishLines(dish: Dish, servingCount: number): DishLine[] {
  const targetServings = servingCount > 0 ? servingCount : dish.baseServings;
  const scale = dish.baseServings > 0 ? targetServings / dish.baseServings : 1;
  return dish.lines.map((line) => ({
    ...line,
    qtyBase: Math.round(line.qtyBase * scale * 10) / 10,
  }));
}

export function parseCookingSession(
  raw: string | null,
  guide: Pick<CookingGuide, "id" | "dishId" | "steps">,
): CookingSession | undefined {
  if (!raw) return undefined;
  try {
    const value = JSON.parse(raw) as Partial<CookingSession>;
    if (
      value.dishId !== guide.dishId ||
      value.guideId !== guide.id ||
      typeof value.startedAt !== "string" ||
      !Array.isArray(value.completedStepIds) ||
      (
        value.targetServings !== undefined &&
        (
          !Number.isInteger(value.targetServings) ||
          value.targetServings < 1 ||
          value.targetServings > 12
        )
      )
    ) {
      return undefined;
    }
    const validIds = new Set(guide.steps.map((step) => step.id));
    if (
      value.completedStepIds.some(
        (id) => typeof id !== "string" || !validIds.has(id),
      )
    ) {
      return undefined;
    }
    return {
      dishId: value.dishId,
      guideId: value.guideId,
      completedStepIds: [...new Set(value.completedStepIds)],
      startedAt: value.startedAt,
      targetServings: value.targetServings,
    };
  } catch {
    return undefined;
  }
}

export function nextIncompleteStep(
  guide: Pick<CookingGuide, "steps">,
  completedStepIds: readonly string[],
): CookingStep | undefined {
  const completed = new Set(completedStepIds);
  return guide.steps.find((step) => !completed.has(step.id));
}
