"use server";

import { loadHouseholdState, saveHouseholdState, type StatePatch, type HouseholdState } from "@/data/repo/household";

// Server Action boundary — client store calls these to load/persist to Neon.
export async function getHouseholdState(): Promise<HouseholdState> {
  return loadHouseholdState();
}

export async function persistState(patch: StatePatch): Promise<void> {
  await saveHouseholdState(patch);
}
