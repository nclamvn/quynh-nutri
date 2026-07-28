"use server";

import { loadHouseholdState, saveHouseholdState, saveMemberHealthProfile, saveMemberAllergies, saveMember, deleteMember, addMemberState, deleteMemberState, saveSupplier, deleteSupplier, saveOrder, savePurchase, type StatePatch, type HouseholdState } from "@/data/repo/household";
import { semanticSearch } from "@/lib/search";
import type { HealthProfile, Allergen, Member, MemberState, Supplier, Order, PurchaseRecord } from "@/domain/types";

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

// ── "Không gian gia đình sống" — member base CRUD + dynamic states ──
export async function persistMember(
  input: Pick<Member, "name" | "role" | "sex" | "ageBand" | "allergies" | "habits" | "conditions" | "dislikes"> & { id?: string },
): Promise<string> {
  return saveMember(input);
}
export async function removeMember(memberId: string): Promise<void> {
  await deleteMember(memberId);
}
export async function persistMemberState(memberId: string, state: Omit<MemberState, "id">): Promise<void> {
  await addMemberState(memberId, state);
}
export async function removeMemberState(stateId: string): Promise<void> {
  await deleteMemberState(stateId);
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

export async function persistPurchase(record: Omit<PurchaseRecord, "id">): Promise<PurchaseRecord> {
  return savePurchase(record);
}

// Semantic dish search (Phase B) — returns ranked dish ids for the query.
export async function searchDishes(query: string): Promise<string[]> {
  const hits = await semanticSearch(query, 12);
  return hits.filter((h) => h.score > 0.4).map((h) => h.id);
}
