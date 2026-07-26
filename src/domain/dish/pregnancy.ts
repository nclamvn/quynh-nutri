import type { Dish, Member, Commodity, PregnancyHazard, ProvenanceLevel } from "@/domain/types";
import type { CommoditySource } from "@/domain/nutrition/calculator";
import { isPregnant } from "@/domain/health";

// Pregnancy avoid-list = SOFT, SOURCED warnings (decision: TIP). Unlike allergens
// (a hard exclusion via dishAllowed), a hazard NEVER removes a dish — the app warns
// with a source, the person/doctor decides. A hazard is only surfaced when the
// commodity carries a sourced tag; an untagged ingredient yields NO warning and is
// NOT claimed "safe" (fail-safe: absence of a warning ≠ a safety assertion).

export interface PregnancyWarning {
  hazard: PregnancyHazard;
  commodityId: string;
  source: ProvenanceLevel;
}

/** Sourced hazard warnings for a dish, for a pregnant member. Empty otherwise. */
export function pregnancyWarnings(dish: Dish, member: Member, source: CommoditySource): PregnancyWarning[] {
  const ls = member.healthProfile?.lifeStage;
  if (!ls || !isPregnant(ls)) return [];
  const out: PregnancyWarning[] = [];
  const seen = new Set<string>();
  for (const line of dish.lines) {
    const c = source(line.commodityId);
    for (const h of c?.pregnancyHazards ?? []) {
      const key = `${line.commodityId}:${h.hazard}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ hazard: h.hazard, commodityId: line.commodityId, source: h.source });
    }
  }
  return out;
}

/** Any pregnant member in the household? (UI: whether to surface the avoid-list.) */
export function householdHasPregnancy(members: Member[]): boolean {
  return members.some((m) => m.healthProfile && isPregnant(m.healthProfile.lifeStage));
}

/** Has the hazard registry been seeded at all? If false, the UI shows
 *  "đang đối chiếu nguồn" instead of implying the basket is hazard-free. */
export function hasPregnancyData(commodities: Iterable<Commodity>): boolean {
  for (const c of commodities) if (c.pregnancyHazards && c.pregnancyHazards.length) return true;
  return false;
}
