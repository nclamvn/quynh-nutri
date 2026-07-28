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
  /** Pregnancy hazard tags — only set with a sourceRef (soft warnings, T1). */
  pregnancyHazards?: { hazard: PregnancyHazard; source: ProvenanceLevel }[];
  /** Micronutrients per 100g edible (iron/calcium/zinc mg, folate µg). Sourced from
   *  the VN Food Composition Table (P1); absent nutrients stay honest_null. */
  micros?: Partial<Record<Micronutrient, number>>;
  microSource?: ProvenanceLevel;
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

// ─── Special diets (T1) — see design/VISION-special-diets.md ───
// App EXECUTES, does not PRESCRIBE. Clinical constraints (T2/T3) are modelled but
// ship dormant (no UI); T1 uses `wellness` only.
export type LifeStage =
  | "none"
  | "pregnant_t1" | "pregnant_t2" | "pregnant_t3"
  | "lactating_0_6" | "lactating_7_12";

/** Pregnancy hazard tags on a commodity — soft, sourced warnings (never a hard
 *  exclusion for T1). Only set when a sourceRef backs it. */
export type PregnancyHazard =
  | "high_mercury" | "raw_undercooked" | "unpasteurized" | "liver_vit_a" | "alcohol" | "high_caffeine";

/** Micronutrients tracked from the VN Food Composition Table (per 100g edible).
 *  vitA = retinol activity equivalent (µg RAE), vitC = ascorbic acid (mg). */
export type Micronutrient = "iron" | "folate" | "calcium" | "zinc" | "iodine" | "vitA" | "vitC";

export interface HealthProfile {
  lifeStage: LifeStage;
  mode: "wellness" | "clinical";
  // ── T2/T3 seam — dormant, no UI in T1. clinical mode is only valid with expertSet. ──
  constraints?: unknown[];
  expertSet?: { by: string; at: string; ref: string };
}

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

// ─── "Không gian gia đình sống" (Phase: family space) ───
// A member has TWO layers: a static BASE (declared once, edited rarely) and a
// dynamic STATE layer that OVERRIDES the base while in effect and SELF-EXPIRES —
// "hôm nay ốm" carries a valid_until and simply stops mattering after, so no
// transient mood ever becomes a permanent label stuck on a person.
export type MemberStateKind = "illness" | "mood" | "context";

// Tiered constraint (TIP-B). Derived from a Member — never hardcoded — so the
// engine solves by rank: hard_safety (allergy) is absolute; the rest are softer.
export type ConstraintTier = "hard_safety" | "medical" | "preference" | "state";
export interface Constraint {
  memberId: string;
  memberName: string;
  tier: ConstraintTier;
  /** The concrete rule value: an allergen / condition / disliked term / state. */
  rule: string;
  /** Provenance — a human reason ("dị ứng của bé Na"). Shown on a suggestion. */
  source: string;
}

export interface MemberState {
  id: string;
  kind: MemberStateKind;
  /** Free value within the kind, e.g. "sốt" / "mệt" / "thi cử". App-internal;
   *  the UI shows warm phrasing, never the raw enum. */
  value: string;
  /** ISO dates. valid_until omitted = open-ended (rare; most states are a day). */
  validFrom: string;
  validUntil?: string;
}

export interface Member {
  id: string;
  /** Warm display name ("Bố", "Bé Na"). */
  name?: string;
  role: MemberRole;
  sex?: "M" | "F";
  ageBand?: string;
  activity: Activity;
  // ── BASE layer (static) ──
  /** Allergens this member must avoid — the HARD-SAFETY tier (dinner is shared →
   *  household-wide effect). Never soft-penalised; see domain/family. */
  allergies?: Allergen[];
  /** Everyday eating habits ("ăn chay thứ 2", "ít cay"). Free tags. */
  habits?: string[];
  /** Standing conditions ("tiểu đường") — the MEDICAL tier (execute-not-prescribe). */
  conditions?: string[];
  /** Dishes/ingredients disliked — the PREFERENCE tier (soft-avoid, never banned). */
  dislikes?: string[];
  /** Life-stage / health profile (T1: pregnancy & postpartum, wellness mode). */
  healthProfile?: HealthProfile;
  // ── STATE layer (dynamic, self-expiring) ──
  states?: MemberState[];
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

// ─── Phase 2 — Supplier & Order (see BLUEPRINT §3 amend + dataset) ───
// The 5 channel kinds are NOT equal in capability: the app can only push its own
// order TEXT into the first three; `their_*` only opens the chain's own channel
// (their cart) — the app never claims to have sent an order there.
export type ChannelKind = "zalo_chat" | "hotline" | "phone_sms" | "their_zalo_oa" | "their_app_web";
export type SupplierType = "cho" | "sieu_thi" | "tiem" | "online";
/** app auto-advances ONLY to `sent` ("channel opened"); confirmed/delivered are human-set. */
export type OrderStatus = "draft" | "sent" | "confirmed" | "delivered";

export interface SupplierChannel {
  kind: ChannelKind;
  value: string; // phone / zalo id / url, by kind
  label?: string;
}
/** A map pin — real coordinates. Only household-added local shops carry one (the
 *  household sets it themselves, so it's ground truth). Multi-branch chains never
 *  get a fabricated pin — they use `storeLocatorUrl` instead. */
export interface GeoPoint {
  lat: number;
  lng: number;
}
export interface Supplier {
  id: string;
  householdId?: string; // B1-style, household-owned; null = registry seed (chain)
  name: string;
  type: SupplierType;
  channels: SupplierChannel[];
  hours?: string;
  shipFee?: string;
  shipArea?: string;
  handles?: string[]; // commodity ids / groups they sell
  /** Freeform address (household shop). Chains omit it — they span many branches. */
  address?: string;
  /** Map pin (household shop only). Set by the user via pin-drop; never invented. */
  location?: GeoPoint;
  /** Chain branch-finder URL — the honest stand-in for a single address on a
   *  multi-branch chain (the app can't claim one specific branch). */
  storeLocatorUrl?: string;
  note?: string;
  seed?: boolean; // from the chain registry (not household-added)
  needsVerify?: boolean; // dataset confidence: source may be stale → show "cần xác minh"
  sources?: string[];
}
export interface OrderLine {
  commodityId: string;
  qtyGross: number; // PURCHASED grams (gross-up edibleYield), not edible grams
  unit: string;
}
export interface Order {
  id: string;
  supplierId: string;
  weekRef: string;
  lines: OrderLine[];
  status: OrderStatus;
  channelUsed?: ChannelKind;
  sentAt?: string;
  note?: string;
}

// ─── Purchase log (Lane 2 — the real-data catch-bucket) ───
// The household's record of an actual purchase. `pricePaid` is the REAL price paid
// = B1 ground truth (overrides the B0 reference price in cost). Missing price =
// honest-null (never fabricated). `onTime` is the household's SUBJECTIVE observation,
// not an objective rating. This TIP only CAPTURES — analytics/optimization is Lane 3.
export type OnTime = "on_time" | "late" | "no_show";
export interface PurchaseLine {
  commodityId: string;
  qty: number;
  unit: string;
  pricePaid?: number; // VND actually paid for this line's qty; optional → honest-null
}
export interface PurchaseRecord {
  id: string;
  date: string; // ISO
  orderRef?: string; // links an Order (Phase 2) if logged from one
  supplierId?: string;
  lines: PurchaseLine[];
  onTime?: OnTime; // subjective household observation
  note?: string;
}
