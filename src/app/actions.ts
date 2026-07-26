"use server";

import { loadHouseholdState, saveHouseholdState, type StatePatch, type HouseholdState } from "@/data/repo/household";
import { semanticSearch } from "@/lib/search";

// Server Action boundary — client store calls these to load/persist to Neon.
export async function getHouseholdState(): Promise<HouseholdState> {
  return loadHouseholdState();
}

export async function persistState(patch: StatePatch): Promise<void> {
  await saveHouseholdState(patch);
}

// Semantic dish search (Phase B) — returns ranked dish ids for the query.
export async function searchDishes(query: string): Promise<string[]> {
  const hits = await semanticSearch(query, 12);
  return hits.filter((h) => h.score > 0.4).map((h) => h.id);
}
