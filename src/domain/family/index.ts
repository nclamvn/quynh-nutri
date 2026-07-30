// "Không gian gia đình sống" – pure aggregation over the two-layer Member model.
// No server-only: TIP-B (constraint engine) and the UI both consume this, and it
// stays unit-testable. `now` is always passed in (never read from the clock here)
// so expiry is deterministic and testable.

import type { Allergen, Member, MemberState } from "@/domain/types";

const iso = (d: Date | string): string =>
  typeof d === "string" ? d : d.toISOString();

/** The states currently in effect at `now`: started (validFrom ≤ now) and not yet
 *  expired (no validUntil, or validUntil ≥ now). This is the self-expiry rule –
 *  a past "hôm nay ốm" simply drops out; nothing stays stuck on a person. */
export function activeStates(states: MemberState[] | undefined, now: Date | string): MemberState[] {
  if (!states || states.length === 0) return [];
  const t = iso(now);
  return states.filter((s) => s.validFrom <= t && (s.validUntil == null || s.validUntil >= t));
}

/** True if the member has any state in effect right now. */
export function hasActiveState(member: Member, now: Date | string): boolean {
  return activeStates(member.states, now).length > 0;
}

/** One member's needs, flattened for the cook's single frame. */
export interface FamilyNeed {
  memberId: string;
  name: string;
  role: Member["role"];
  allergies: Allergen[];
  conditions: string[];
  dislikes: string[];
  /** Only the states in effect at `now` (expired ones already filtered out). */
  activeStates: MemberState[];
}

/** The whole family in ONE frame – what the person cooking sees, not four separate
 *  profiles. `allergens` is the household-wide hard-safety union (the set TIP-B
 *  must NEVER let onto a shared plate). */
export interface FamilySpace {
  allergens: Allergen[];
  needs: FamilyNeed[];
  anyActiveState: boolean;
}

export function familySpace(members: Member[], now: Date | string): FamilySpace {
  const allergenSet = new Set<Allergen>();
  const needs: FamilyNeed[] = members.map((m) => {
    (m.allergies ?? []).forEach((a) => allergenSet.add(a));
    return {
      memberId: m.id,
      name: m.name?.trim() || (m.role === "child" ? "Bé" : "Thành viên"),
      role: m.role,
      allergies: m.allergies ?? [],
      conditions: m.conditions ?? [],
      dislikes: m.dislikes ?? [],
      activeStates: activeStates(m.states, now),
    };
  });
  return {
    allergens: [...allergenSet],
    needs,
    anyActiveState: needs.some((n) => n.activeStates.length > 0),
  };
}
