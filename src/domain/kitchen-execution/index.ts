import type { Commodity } from "@/domain/types";

export type LocalizedText = {
  vi: string;
  en: string;
};

export type KitchenGuideSpecificity = "ingredient" | "category";

export interface KitchenGuideSource {
  id: string;
  publisher: string;
  title: LocalizedText;
  url: string;
  reviewedAt: string;
}

export interface IngredientHandlingGuide {
  id: string;
  specificity: KitchenGuideSpecificity;
  commodityIds?: string[];
  groups?: string[];
  selection: LocalizedText[];
  avoid: LocalizedText[];
  transport: LocalizedText[];
  storage: LocalizedText[];
  preparation: LocalizedText[];
  sourceIds: string[];
}

export interface ResolvedIngredientGuide {
  guide: IngredientHandlingGuide;
  sources: KitchenGuideSource[];
}

/**
 * Ingredient-specific guidance wins. Category guidance is an honest fallback:
 * callers must surface `specificity` instead of presenting it as item-specific.
 */
export function resolveIngredientGuide(
  commodity: Commodity | undefined,
  guides: IngredientHandlingGuide[],
  sourceById: Record<string, KitchenGuideSource>,
): ResolvedIngredientGuide | undefined {
  if (!commodity) return undefined;

  const guide =
    guides.find((candidate) => candidate.commodityIds?.includes(commodity.id)) ??
    guides.find((candidate) => candidate.groups?.includes(commodity.group));

  if (!guide) return undefined;
  const sources = guide.sourceIds.flatMap((id) => {
    const source = sourceById[id];
    return source ? [source] : [];
  });
  return { guide, sources };
}

export function localize(text: LocalizedText, lang: "vi" | "en"): string {
  return text[lang];
}
