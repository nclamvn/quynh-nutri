// Plain domain types — the shared vocabulary for seed data, domain services,
// and UI. Deliberately NOT Prisma types: domain stays pure & testable, and the
// repo layer maps Prisma rows → these when a real DB is wired.

export type ProvenanceLevel = "P1" | "P2" | "P3" | "P4" | "P5" | "P6";
export type Confidence = "corroborated" | "disputed" | "honest_null";
export type ProteinType =
  | "bo"
  | "ga"
  | "ca"
  | "tom"
  | "heo"
  | "cua"
  | "trung"
  | "dau"
  | "rau";
export type CookMethod = "kho" | "xao" | "luoc" | "hap" | "nuong" | "ran" | "song";
export type Slot = "COM" | "MAN" | "RAU" | "CANH" | "TRANGMIENG";
export type MemberRole = "adult" | "child";
export type Activity = "light" | "moderate" | "heavy";
export type DayName = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

/** Macro tuple, always per-100g at the commodity layer (A). */
export interface Macro {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number;
}

/** A — commodity ingredient. macro is per 100g. */
export interface Commodity extends Macro {
  id: string;
  canonicalVn: string;
  labelEn?: string;
  group: string;
  provenanceLevel: ProvenanceLevel;
  confidence: Confidence;
  sourceRefs: { source: string; value?: number }[];
  seasonMonths?: number[];
  storageNote?: string;
  substitutes?: string[];
  /**
   * Fraction of PURCHASED weight that is edible (1 = no waste). Bone, shell,
   * peel, trimming. Nutrition uses edible grams directly; the shopping list
   * grosses up by this to say what to actually buy. Default 1 when omitted.
   */
  edibleYield?: number;
  /** Allergen tags this ingredient carries (e.g. "shellfish", "fish", "egg"). */
  allergens?: Allergen[];
  /**
   * Reference retail price in VND per kg of PURCHASED weight (same basis as the
   * shopping list's grossed-up qty). Price is inherently a market estimate — it
   * varies by region/season/vendor — so it NEVER claims corroborated precision:
   * the UI always renders it as "~ · giá tham khảo". Omitted when we have no
   * reference, which lowers the basket's price coverage rather than being faked.
   */
  priceVndPerKg?: number;
  priceSource?: string;
}

export type Allergen = "shellfish" | "fish" | "egg" | "soy" | "dairy" | "gluten" | "peanut";
export type DietRestriction = "vegetarian" | "pescatarian" | "no_pork" | "no_beef";

/** One ingredient line inside a dish, qty for `baseServings`. */
export interface DishLine {
  commodityId: string;
  qtyBase: number;
  unit: string;
}

/** B0 / B1 dish share this shape; `origin` distinguishes the layer. */
export interface Dish {
  id: string;
  vnName: string;
  enLabel?: string;
  proteinType: ProteinType;
  method: CookMethod;
  slot: Slot;
  quick: boolean;
  baseServings: number;
  cookTimeMin?: number;
  prepAhead?: string[];
  tags?: string[];
  lines: DishLine[];
  origin: "B0" | "B1";
  /** B1 only: the B0 dish this was forked from (override lineage). */
  sourceRepertoireId?: string;
  vendor?: string;
  isFavorite?: boolean;
}

export interface Member {
  id: string;
  role: MemberRole;
  sex?: "M" | "F";
  ageBand?: string;
  activity: Activity;
  /** Allergens this member must avoid (dinner is shared → household-wide effect). */
  allergies?: Allergen[];
}

export interface Household {
  id: string;
  name: string;
  size: number;
  marketMode: "traditional" | "supermarket" | "mixed";
  cookTimeCapMin: number;
  busyDays: DayName[];
  lactatingMember: boolean;
  members: Member[];
  /** Household-wide diet restrictions (vegetarian, no pork, …). */
  restrictions?: DietRestriction[];
  /** Optional weekly grocery budget cap in VND (user-set → exact; spend is the estimate). */
  budgetWeeklyVnd?: number;
}

/** A planned dish in a slot on a given day. */
export interface PlannedSlot {
  day: number; // 0..6
  slot: Slot;
  dishId: string;
  locked: boolean;
}

/** What the household already has on hand (Phase A pantry). qty is PURCHASED
 *  grams (same basis as the shopping list), so it deducts directly. */
export interface PantryItem {
  commodityId: string;
  qty: number;
  unit: string;
  expiry?: string; // ISO date, optional
}

export interface WeekPlan {
  householdId: string;
  weekStart: string; // ISO date
  slots: PlannedSlot[];
}
