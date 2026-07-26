import "server-only";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { DEFAULT_HOUSEHOLD } from "@/data/seed/household";
import type { Household, PantryItem, DietRestriction, Allergen, Activity, MemberRole, DayName, HealthProfile } from "@/domain/types";

const HH_ID = DEFAULT_HOUSEHOLD.id; // template / unauth fallback

// Resolve the signed-in user's household — creating one from the seed template
// on first sign-in (multi-tenant). Unauth (e.g. sign-in page) → the template id.
async function currentHouseholdId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) return HH_ID;
  const db = getDb();
  const existing = await db.household.findUnique({ where: { userId }, select: { id: true } });
  if (existing) return existing.id;
  const t = DEFAULT_HOUSEHOLD;
  const created = await db.household.create({
    data: {
      userId,
      name: t.name,
      size: t.size,
      marketMode: t.marketMode,
      cookTimeCapMin: t.cookTimeCapMin,
      busyDays: t.busyDays,
      lactatingMember: t.lactatingMember,
      restrictions: [],
      favorites: [],
      notes: [],
      pantry: [],
      members: { create: t.members.map((m) => ({ role: m.role, sex: m.sex ?? null, ageBand: m.ageBand ?? null, activity: m.activity, allergies: [] })) },
    },
    select: { id: true },
  });
  return created.id;
}

export interface HouseholdState {
  household: Household;
  favorites: string[];
  notes: { id: number; text: string }[];
  pantry: PantryItem[];
}

export async function loadHouseholdState(): Promise<HouseholdState> {
  const db = getDb();
  const id = await currentHouseholdId();
  const row = await db.household.findUnique({ where: { id }, include: { members: true } });
  if (!row) return { household: DEFAULT_HOUSEHOLD, favorites: [], notes: [], pantry: [] };

  const household: Household = {
    id: row.id,
    name: row.name,
    size: row.size,
    marketMode: row.marketMode as Household["marketMode"],
    cookTimeCapMin: row.cookTimeCapMin,
    busyDays: row.busyDays as DayName[],
    lactatingMember: row.lactatingMember,
    restrictions: (row.restrictions as DietRestriction[]) ?? [],
    members: row.members.map((m) => ({
      id: m.id,
      role: m.role as MemberRole,
      sex: (m.sex as "M" | "F" | null) ?? undefined,
      ageBand: m.ageBand ?? undefined,
      activity: m.activity as Activity,
      allergies: (m.allergies as Allergen[]) ?? [],
      healthProfile: (m.healthProfile as unknown as HealthProfile) ?? undefined,
    })),
  };
  return {
    household,
    favorites: row.favorites ?? [],
    notes: (row.notes as unknown as { id: number; text: string }[]) ?? [],
    pantry: (row.pantry as unknown as PantryItem[]) ?? [],
  };
}

/** Persist any subset of the mutable household-row state. */
export type StatePatch = Partial<{
  size: number;
  marketMode: string;
  busyDays: string[];
  lactatingMember: boolean;
  restrictions: string[];
  favorites: string[];
  notes: { id: number; text: string }[];
  pantry: PantryItem[];
}>;

export async function saveHouseholdState(patch: StatePatch): Promise<void> {
  const db = getDb();
  const id = await currentHouseholdId();
  const data: Record<string, unknown> = {};
  for (const k of ["size", "marketMode", "busyDays", "lactatingMember", "restrictions", "favorites", "notes", "pantry"] as const) {
    if (patch[k] !== undefined) data[k] = patch[k];
  }
  if (Object.keys(data).length === 0) return;
  await db.household.update({ where: { id }, data: data as never });
}

/** Persist a member's health profile (T1). Scoped to the current household so a
 *  user can't touch another household's member. */
export async function saveMemberHealthProfile(memberId: string, profile: HealthProfile | null): Promise<void> {
  const db = getDb();
  const householdId = await currentHouseholdId();
  await db.member.updateMany({
    where: { id: memberId, householdId },
    data: { healthProfile: (profile ?? undefined) as never },
  });
}
