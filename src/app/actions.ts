"use server";

import { loadHouseholdState, saveHouseholdState, saveMemberHealthProfile, saveMemberAllergies, saveSupplier, deleteSupplier, saveOrder, type StatePatch, type HouseholdState } from "@/data/repo/household";
import { semanticSearch } from "@/lib/search";
import type { HealthProfile, Allergen, Supplier, Order } from "@/domain/types";

// Server Action boundary — client store calls these to load/persist to Neon.
export async function getHouseholdState(): Promise<HouseholdState> {
  return loadHouseholdState();
}

export async function persistState(patch: StatePatch): Promise<void> {
  await saveHouseholdState(patch);
}

export async function persistMemberHealthProfile(memberId: string, profile: HealthProfile | null): Promise<void> {
  await saveMemberHealthProfile(memberId, profile);
}

export async function persistMemberAllergies(memberId: string, allergies: Allergen[]): Promise<void> {
  await saveMemberAllergies(memberId, allergies);
}

// ── Phase 2 — Supplier & Order (household-owned) ──
export async function persistSupplier(
  input: Omit<Supplier, "householdId" | "seed">,
): Promise<Supplier> {
  return saveSupplier(input);
}

export async function removeSupplier(id: string): Promise<void> {
  await deleteSupplier(id);
}

export async function persistOrder(order: Omit<Order, "id"> & { id?: string }): Promise<Order> {
  return saveOrder(order);
}

// Semantic dish search (Phase B) — returns ranked dish ids for the query.
export async function searchDishes(query: string): Promise<string[]> {
  const hits = await semanticSearch(query, 12);
  return hits.filter((h) => h.score > 0.4).map((h) => h.id);
}
