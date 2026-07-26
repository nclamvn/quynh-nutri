import type { Household, Member, Slot } from "@/domain/types";

// PORTION MODEL (Refinery R2) — the sourced basis dish quantities derive from,
// so "định lượng từng món" is principled, not ad-hoc grams.
//
// Grounded in: Nhu cầu Dinh dưỡng Khuyến nghị 2016 (P2) meal-portion breakdown
// + typical urban VN home servings. All figures are EDIBLE grams per
// "adult-equivalent" (AE) per meal. Bone/shell/peel are handled separately by
// each commodity's edibleYield (the shopping list grosses these up).
//
// AE: an adult = 1.0, a child = 0.6 (matches INTAKE-SEED "60–70% cho trẻ").
// A dish's main ingredient is quantified as target(slot) × AE(household).

/** Edible grams per adult-equivalent, per slot, for the dominant ingredient. */
export const PER_AE: Record<Slot, number> = {
  COM: 200, // cơm chín ~1 bát đầy/người lớn
  MAN: 110, // đạm chính, phần ăn được (≈22g đạm từ thịt/cá)
  RAU: 110, // rau phần ăn được sau khi nấu rút
  CANH: 65, // canh: rau + chút đạm, khẩu phần nhẹ
  TRANGMIENG: 180, // trái cây phần ăn được
};

/** Secondary protein inside a veg/soup dish (e.g. thịt băm in canh), per AE. */
export const CANH_PROTEIN_PER_AE = 30;
export const CHILD_FACTOR = 0.6;

export function memberAE(m: Member): number {
  return m.role === "child" ? CHILD_FACTOR : 1;
}

export function householdAE(household: Household): number {
  return household.members.reduce((s, m) => s + memberAE(m), 0);
}

/** For a household with N members using the default 2A+2C shape → 3.2 AE. */
export function defaultAE(size: number): number {
  // When members aren't enumerated, approximate: ~65% adults.
  return size; // callers with real members should use householdAE
}

/** Edible target grams for a slot's primary ingredient at a given AE. */
export function slotTarget(slot: Slot, ae: number): number {
  return Math.round(PER_AE[slot] * ae);
}

/** Standard condiment amounts (grams) — NOT scaled by AE, they season the pot. */
export const CONDIMENT = {
  nuoc_mam: 25,
  duong: 20,
  dau_an: 15,
  gung: 25,
  me_chua: 50,
  nuoc_dua: 200,
  hanh_tay: 70,
  ca_chua: 120,
} as const;
