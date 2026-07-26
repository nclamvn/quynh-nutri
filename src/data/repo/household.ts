import "server-only";
import { getDb } from "@/lib/db";
import { DEFAULT_HOUSEHOLD } from "@/data/seed/household";
import type { Household, PantryItem, DietRestriction, Allergen, Activity, MemberRole, DayName } from "@/domain/types";

// Single household until auth lands (Phase A). Mutable user state lives on the
// Household row (favorites/notes/pantry) + Member.allergies.
const HH_ID = DEFAULT_HOUSEHOLD.id;

export interface HouseholdState {
  household: Household;
  favorites: string[];
  notes: { id: number; text: string }[];
  pantry: PantryItem[];
}

export async function loadHouseholdState(id = HH_ID): Promise<HouseholdState> {
  const db = getDb();
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

export async function saveHouseholdState(patch: StatePatch, id = HH_ID): Promise<void> {
  const db = getDb();
  const data: Record<string, unknown> = {};
  for (const k of ["size", "marketMode", "busyDays", "lactatingMember", "restrictions", "favorites", "notes", "pantry"] as const) {
    if (patch[k] !== undefined) data[k] = patch[k];
  }
  if (Object.keys(data).length === 0) return;
  await db.household.update({ where: { id }, data: data as never });
}
