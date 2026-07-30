// TIP-B – tiered constraint engine. Sits ON TOP of the existing ingredient-level
// allergen check (domain/dish/dietary), formalising it into ranked constraints
// with provenance, and adding conflict/trade-off surfacing. It does NOT rewrite
// rotation – rotation still eats a pre-filtered repertoire; this module is the
// safety gate + the "why" + the "the app won't pretend it has a perfect answer".
//
// P0 SAFETY: allergy is HARD EXCLUDE. `dishSafety` FAILS CLOSED – an ingredient it
// cannot look up, while any allergen is in play, is treated as UNSAFE. A
// false-negative here (an allergen slipping onto a shared plate) is anaphylaxis,
// not a bad suggestion; asymmetric risk → bias hard toward exclusion.

import type { Allergen, Constraint, Dish, Household, Member } from "@/domain/types";
import type { CommoditySource } from "@/domain/nutrition/calculator";
import { activeStates } from "@/domain/family";

const ALLERGEN_VN: Record<string, string> = {
  shellfish: "hải sản", fish: "cá", egg: "trứng", soy: "đậu nành",
  dairy: "sữa", gluten: "gluten", peanut: "đậu phộng",
};
const nameOf = (m: Member) => m.name?.trim() || (m.role === "child" ? "bé" : m.sex === "M" ? "bố" : "mẹ");

/** Derive one member's constraints across the four tiers (data, not hardcoded). */
export function deriveConstraints(m: Member, now: Date | string): Constraint[] {
  const who = nameOf(m);
  const out: Constraint[] = [];
  for (const a of m.allergies ?? [])
    out.push({ memberId: m.id, memberName: who, tier: "hard_safety", rule: a, source: `dị ứng của ${who}` });
  for (const c of m.conditions ?? [])
    out.push({ memberId: m.id, memberName: who, tier: "medical", rule: c, source: `${who}: ${c}` });
  for (const d of m.dislikes ?? [])
    out.push({ memberId: m.id, memberName: who, tier: "preference", rule: d, source: `${who} không thích` });
  for (const s of activeStates(m.states, now))
    out.push({ memberId: m.id, memberName: who, tier: "state", rule: s.value, source: `hôm nay ${who}` });
  return out;
}

export function familyConstraints(members: Member[], now: Date | string): Constraint[] {
  return members.flatMap((m) => deriveConstraints(m, now));
}

export interface DishSafety {
  safe: boolean;
  /** Which member/allergen blocked it (for the reason line). */
  blockedBy: { memberName: string; allergen: Allergen }[];
  /** True when a line's commodity couldn't be resolved while allergens were active
   *  → excluded to be safe (fail-closed), surfaced honestly. */
  uncertain: boolean;
}

/** The HARD-SAFETY gate for one dish against the whole household. Fail-closed. */
export function dishSafety(dish: Dish, household: Household, source: CommoditySource): DishSafety {
  // Map each allergen to the members who must avoid it (for provenance).
  const avoiders = new Map<Allergen, string[]>();
  for (const m of household.members)
    for (const a of m.allergies ?? []) {
      const arr = avoiders.get(a) ?? [];
      arr.push(nameOf(m));
      avoiders.set(a, arr);
    }
  if (avoiders.size === 0) return { safe: true, blockedBy: [], uncertain: false };

  const blocked: { memberName: string; allergen: Allergen }[] = [];
  let uncertain = false;
  for (const line of dish.lines) {
    const c = source(line.commodityId);
    if (!c) { uncertain = true; continue; } // fail-closed: unknown ingredient
    for (const a of c.allergens ?? [])
      if (avoiders.has(a))
        for (const who of avoiders.get(a)!) blocked.push({ memberName: who, allergen: a });
  }
  return { safe: blocked.length === 0 && !uncertain, blockedBy: blocked, uncertain };
}

/** A human reason for why a dish is blocked ("tránh vì bé dị ứng hải sản"). */
export function safetyReason(s: DishSafety): string | null {
  if (s.safe) return null;
  if (s.blockedBy.length > 0) {
    const b = s.blockedBy[0];
    return `Tránh vì ${b.memberName} dị ứng ${ALLERGEN_VN[b.allergen] ?? b.allergen}`;
  }
  if (s.uncertain) return "Tránh vì có nguyên liệu chưa rõ, không chắc an toàn cho người dị ứng";
  return null;
}

// ─── Conflict / trade-off ───────────────────────────────────────────────────
// The app does NOT pretend to have a perfect answer. When an allergen removes an
// ingredient another member genuinely benefits from, surface the trade-off – the
// human decides. Only defensible, sourced benefits (no invented nutrition claims).
export interface Conflict {
  allergen: Allergen;
  avoidedBy: string[];
  wantedBy: string[];
  note: string;
}

const benefits = (m: Member): Allergen[] => {
  const ls = m.healthProfile?.lifeStage;
  // Pregnancy & lactation genuinely benefit from fish (omega-3) – sourced in the
  // pregnancy model. That's the only benefit we assert; nothing invented.
  if (ls && (ls.startsWith("pregnant") || ls.startsWith("lactating"))) return ["fish"];
  return [];
};

export function detectConflicts(members: Member[]): Conflict[] {
  const out: Conflict[] = [];
  const allergen: Allergen = "fish";
  const avoidedBy = members.filter((m) => (m.allergies ?? []).includes(allergen)).map(nameOf);
  const wantedBy = members.filter((m) => benefits(m).includes(allergen)).map(nameOf);
  if (avoidedBy.length && wantedBy.length) {
    out.push({
      allergen,
      avoidedBy,
      wantedBy,
      note: `Cá tốt cho ${wantedBy.join(", ")} (omega-3) nhưng ${avoidedBy.join(", ")} dị ứng – nấu riêng phần ${avoidedBy.join(", ")}?`,
    });
  }
  return out;
}
