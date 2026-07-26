import type { Dish, Member, Household, Micronutrient, ProvenanceLevel } from "@/domain/types";
import type { CommoditySource } from "./calculator";
import { dailyNeed } from "@/data/seed/needs";
import { householdNeed } from "./adequacy";

// Micronutrient intake from real food-composition data (P1). Micronutrient content
// varies a lot in nature, so the result is presented as an ESTIMATE with a COVERAGE
// (% of the day's food mass that actually has data for that nutrient) — same honesty
// discipline as the macro D3 gate. iodine is excluded: the FCT lacks reliable food
// iodine, so it stays honest_null rather than being guessed.
export const PREG_MICROS = ["iron", "folate", "calcium", "zinc"] as const;
export type PregMicro = (typeof PREG_MICROS)[number];

/** Pregnancy Recommended Nutrient Intake / day. DRI/WHO reference values, which the
 *  VN Nhu cầu 2016 broadly matches — a professional should confirm against the
 *  primary source. Displayed with a disclaimer; never a prescription. */
export const MICRO_RNI: Record<PregMicro, { need: number; unit: string }> = {
  iron: { need: 27, unit: "mg" },
  folate: { need: 600, unit: "µg" },
  calcium: { need: 1000, unit: "mg" },
  zinc: { need: 11, unit: "mg" },
};
export const MICRO_RNI_SOURCE: ProvenanceLevel = "P6"; // WHO/DRI (VN Nhu cầu 2016 similar)

/** Day totals (scaled to `servings`) + the food mass that carries data per nutrient. */
export function dayMicros(dishes: Dish[], source: CommoditySource, servings: number) {
  const totals: Partial<Record<Micronutrient, number>> = {};
  const massWith: Partial<Record<Micronutrient, number>> = {};
  let totalMass = 0;
  for (const dish of dishes) {
    const factor = dish.baseServings > 0 ? servings / dish.baseServings : 1;
    for (const line of dish.lines) {
      const c = source(line.commodityId);
      const mass = line.qtyBase * factor;
      totalMass += mass;
      for (const m of PREG_MICROS) {
        const v = c?.micros?.[m];
        if (v != null) {
          totals[m] = (totals[m] ?? 0) + (v * mass) / 100;
          massWith[m] = (massWith[m] ?? 0) + mass;
        }
      }
    }
  }
  return { totals, massWith, totalMass };
}

export interface MicroAdequacy {
  nutrient: PregMicro;
  intake: number;
  need: number;
  unit: string;
  ratioPct: number;
  coveragePct: number; // confidence: % of day mass with data for this nutrient
}

/** A pregnant member's estimated micronutrient adequacy for the day. The member's
 *  share of the household intake is proportional to energy need (same model as
 *  memberAdequacy). */
export function pregnancyMicroAdequacy(
  dishes: Dish[],
  member: Member,
  household: Household,
  source: CommoditySource,
): MicroAdequacy[] {
  const { totals, massWith, totalMass } = dayMicros(dishes, source, household.size);
  const need = dailyNeed(member);
  const hh = householdNeed(household);
  const share = hh.kcal > 0 ? need.kcal / hh.kcal : 0;
  return PREG_MICROS.map((m) => {
    const rni = MICRO_RNI[m];
    const intake = (totals[m] ?? 0) * share;
    const coveragePct = totalMass > 0 ? Math.round(((massWith[m] ?? 0) / totalMass) * 100) : 0;
    return {
      nutrient: m,
      intake: Math.round(intake * 10) / 10,
      need: rni.need,
      unit: rni.unit,
      ratioPct: Math.round((intake / rni.need) * 100),
      coveragePct,
    };
  });
}
