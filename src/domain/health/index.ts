import type { Household, LifeStage, HealthProfile } from "@/domain/types";

// Special-diets domain (T1). The clinical guard is a dormant backstop for T2/T3:
// a clinical-mode profile is only valid when a professional has set its
// constraints – otherwise the engine must REFUSE to generate (app executes, does
// not prescribe). T1 never uses clinical mode, but the guard ships now so T2/T3 is
// config, not a rewrite. See design/VISION-special-diets.md.

export function isPregnant(ls: LifeStage): boolean {
  return ls === "pregnant_t1" || ls === "pregnant_t2" || ls === "pregnant_t3";
}
export function isLactating(ls: LifeStage): boolean {
  return ls === "lactating_0_6" || ls === "lactating_7_12";
}

/**
 * May the app generate a plan/menu for this profile? Wellness (or no profile) is
 * always fine. Clinical mode is ONLY valid when a professional set it (expertSet);
 * otherwise refuse – never fabricate a clinical diet.
 */
export function canGenerate(p?: HealthProfile): boolean {
  if (!p || p.mode === "wellness") return true;
  return Boolean(p.expertSet); // clinical requires an expert-set record
}

/** Members with an active (non-"none") life stage. */
export function activeLifeStages(household: Household): { memberId: string; lifeStage: LifeStage }[] {
  return household.members
    .filter((m) => m.healthProfile && m.healthProfile.lifeStage !== "none")
    .map((m) => ({ memberId: m.id, lifeStage: m.healthProfile!.lifeStage }));
}

/** Whether a member is eligible to set pregnancy/lactation stages (respect data,
 *  don't infer). Only adult females. */
export function canSetMaternalStage(member: { role: string; sex?: string }): boolean {
  return member.role === "adult" && member.sex === "F";
}
