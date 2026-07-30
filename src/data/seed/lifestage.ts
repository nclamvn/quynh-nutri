import type { LifeStage, ProvenanceLevel, Member } from "@/domain/types";
import { isLactating } from "@/domain/health";

// Life-stage nutrition (T1). HONESTY RULE: a value appears here ONLY with a real
// source. Everything else stays UNSOURCED → the UI shows honest_null, never a
// fabricated number. The builder does not invent clinical/nutrition values; they
// arrive via sourced INTAKE (P2 Nhu cầu 2016 / P3 HD 776 / P6 WHO), human-approved.

/** Energy/protein uplift over base need, per life stage. Seeded ONLY where sourced.
 *
 * Pregnancy increments = Nhu cầu Dinh dưỡng Khuyến nghị VN 2016 (Viện Dinh dưỡng,
 * P2), corroborated across VN clinical sources (Vinmec, BV Mỹ Đức, BV Tâm Anh…);
 * the energy magnitudes also align with FAO/WHO/UNU 2004 (P6). Protein per-trimester
 * has some variance between sources – verify against the primary QĐ before any
 * clinical reliance. Displayed as an adequacy denominator only (kcal/protein are
 * the only macros the intake side tracks) with a disclaimer; not a prescription. */
export const LIFESTAGE_UPLIFT: Partial<Record<LifeStage, { kcal: number; proteinG: number; source: ProvenanceLevel }>> = {
  pregnant_t1: { kcal: 50, proteinG: 1, source: "P2" },
  pregnant_t2: { kcal: 250, proteinG: 10, source: "P2" },
  pregnant_t3: { kcal: 450, proteinG: 31, source: "P2" },
  // Lactation 0–6 months – HD 776 (P3), already in the codebase.
  lactating_0_6: { kcal: 505, proteinG: 19, source: "P3" },
  // lactating_7_12: kept UNSOURCED (honest_null) until the VN 7–12mo figure is verified.
};

/** Key micronutrients to track in pregnancy. Requirement values are null until a
 *  sourced RNI is seeded (honest_null), never guessed. */
export const PREGNANCY_MICRONUTRIENTS = ["iron", "folate", "calcium", "iodine"] as const;
export type Micronutrient = (typeof PREGNANCY_MICRONUTRIENTS)[number];

// Sourced RNI per stage – empty until INTAKE fills it from P2/P3. All null for now.
const MICRO_RNI: Partial<Record<LifeStage, Partial<Record<Micronutrient, { need: number; source: ProvenanceLevel }>>>> = {};

/** The member's effective life stage: per-member profile wins; legacy household
 *  `lactatingMember` flag is a coarse fallback (adult F → 0–6 months). */
export function effectiveLifeStage(member: Member, householdLactating = false): LifeStage {
  const ls = member.healthProfile?.lifeStage;
  if (ls && ls !== "none") return ls;
  if (householdLactating && member.role === "adult" && member.sex === "F") return "lactating_0_6";
  return "none";
}

/** Sourced uplift for a member, or null when the stage isn't sourced yet. */
export function lifeStageUplift(member: Member, householdLactating = false) {
  const ls = effectiveLifeStage(member, householdLactating);
  const u = LIFESTAGE_UPLIFT[ls];
  return { lifeStage: ls, applied: Boolean(u), kcal: u?.kcal ?? 0, proteinG: u?.proteinG ?? 0, source: u?.source ?? null };
}

/** Micronutrient rows for the UI – need is null (honest_null) until sourced. */
export function lifeStageMicros(member: Member): { nutrient: Micronutrient; need: number | null; source: ProvenanceLevel | null }[] {
  const ls = effectiveLifeStage(member);
  if (ls === "none") return [];
  const table = MICRO_RNI[ls] ?? {};
  return PREGNANCY_MICRONUTRIENTS.map((n) => ({ nutrient: n, need: table[n]?.need ?? null, source: table[n]?.source ?? null }));
}

export { isLactating };
