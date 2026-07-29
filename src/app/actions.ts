"use server";

import { loadHouseholdState, saveHouseholdState, saveMemberHealthProfile, saveMemberAllergies, saveMember, deleteMember, addMemberState, deleteMemberState, saveSupplier, deleteSupplier, saveOrder, savePurchase, receiveShoppingItemRecord, createManualInventoryLotRecord, deleteInventoryLotRecord, recordInventoryMovementRecord, createLeftoverLotRecord, recordLeftoverMovementRecord, type StatePatch, type HouseholdState } from "@/data/repo/household";
import { semanticSearch } from "@/lib/search";
import { requireUserId } from "@/lib/auth";
import type { HealthProfile, Allergen, Member, MemberState, Supplier, Order, PurchaseRecord, ReceiveShoppingItemInput, ReceiveShoppingItemResult, RecordInventoryMovementInput, RecordInventoryMovementResult, CreateLeftoverLotInput, LeftoverLot, RecordLeftoverMovementInput, RecordLeftoverMovementResult } from "@/domain/types";
import { COMMODITY_BY_ID } from "@/data/seed/commodity";
import { REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import { validateReceiptBusinessRules } from "@/domain/kitchen-execution/receipt";
import { evaluateCoolingWindow } from "@/domain/kitchen-execution/leftover-safety";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  loadOrCreateCurrentWeekPlan,
  saveWeekPlan,
  type WeekPlanEnvelope,
} from "@/data/repo/week-plan";
import type {
  SaveWeekPlanInput,
  SaveWeekPlanResult,
} from "@/domain/planning/persisted-week-plan";
import { currentWeekStartIso } from "@/lib/week";

const id = z.string().trim().min(1).max(128);
const shortText = z.string().trim().max(500);
const statePatchSchema = z.object({
  size: z.number().int().min(0).max(30).optional(),
  marketMode: z.enum(["traditional", "supermarket", "mixed"]).optional(),
  busyDays: z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])).max(7).optional(),
  lactatingMember: z.boolean().optional(),
  restrictions: z.array(z.enum(["vegetarian", "pescatarian", "no_pork", "no_beef"])).max(8).optional(),
  favorites: z.array(id).max(500).optional(),
  notes: z.array(z.object({ id: z.number().int().nonnegative(), text: shortText.min(1) })).max(500).optional(),
  pantry: z.array(z.object({
    commodityId: id,
    qty: z.number().positive().max(1_000_000),
    unit: z.string().trim().min(1).max(20),
    expiry: z.string().datetime().optional(),
  })).max(500).optional(),
}).strict();
const healthProfileSchema = z.object({
  lifeStage: z.enum(["none", "pregnant_t1", "pregnant_t2", "pregnant_t3", "lactating_0_6", "lactating_7_12"]),
  mode: z.literal("wellness"),
}).strict();
const allergenSchema = z.enum(["shellfish", "fish", "egg", "soy", "dairy", "gluten", "peanut"]);
const memberSchema = z.object({
  id: id.optional(),
  name: z.string().trim().max(80).optional(),
  role: z.enum(["adult", "child"]),
  sex: z.enum(["M", "F"]).optional(),
  ageBand: z.string().trim().max(40).optional(),
  allergies: z.array(allergenSchema).max(10).optional(),
  habits: z.array(shortText).max(30).optional(),
  conditions: z.array(shortText).max(30).optional(),
  dislikes: z.array(shortText).max(50).optional(),
}).strict();
const memberStateSchema = z.object({
  kind: z.enum(["illness", "mood", "context"]),
  value: shortText.min(1),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime().optional(),
}).strict();
const channelSchema = z.object({
  kind: z.enum(["zalo_chat", "hotline", "phone_sms", "their_zalo_oa", "their_app_web"]),
  value: z.string().trim().min(1).max(500),
  label: z.string().trim().max(80).optional(),
}).strict();
const supplierSchema = z.object({
  id: id.or(z.literal("")),
  name: z.string().trim().min(1).max(120),
  type: z.enum(["cho", "sieu_thi", "tiem", "online"]),
  channels: z.array(channelSchema).max(10),
  hours: shortText.optional(),
  shipFee: shortText.optional(),
  shipArea: shortText.optional(),
  handles: z.array(id).max(200).optional(),
  address: z.string().trim().max(500).optional(),
  location: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).optional(),
  storeLocatorUrl: z.url().max(2_000).optional(),
  note: z.string().trim().max(2_000).optional(),
  needsVerify: z.boolean().optional(),
  sources: z.array(z.url().max(2_000)).max(20).optional(),
}).strict();
const orderLineSchema = z.object({
  commodityId: id,
  qtyGross: z.number().positive().max(1_000_000),
  unit: z.string().trim().min(1).max(20),
}).strict();
const orderSchema = z.object({
  id: id.or(z.literal("")).optional(),
  supplierId: id,
  weekRef: z.iso.date(),
  lines: z.array(orderLineSchema).max(500),
  status: z.enum(["draft", "sent", "confirmed", "delivered"]),
  channelUsed: z.enum(["zalo_chat", "hotline", "phone_sms", "their_zalo_oa", "their_app_web"]).optional(),
  sentAt: z.string().datetime().optional(),
  note: z.string().trim().max(2_000).optional(),
}).strict();
const purchaseSchema = z.object({
  date: z.string().datetime(),
  orderRef: id.optional(),
  supplierId: id.optional(),
  lines: z.array(z.object({
    commodityId: id,
    qty: z.number().positive().max(1_000_000),
    unit: z.string().trim().min(1).max(20),
    pricePaid: z.number().positive().max(1_000_000_000).optional(),
  }).strict()).max(500),
  onTime: z.enum(["on_time", "late", "no_show"]).optional(),
  note: z.string().trim().max(2_000).optional(),
}).strict();
const receiveShoppingItemSchema = z.object({
  idempotencyKey: z.string().uuid(),
  weekRef: z.iso.date(),
  commodityId: id,
  vendor: z.string().trim().min(1).max(120),
  plannedQty: z.number().positive().max(1_000_000),
  actualQty: z.number().positive().max(1_000_000),
  unit: z.string().trim().min(1).max(20),
  boughtAt: z.string().datetime(),
  pricePaid: z.number().int().positive().max(1_000_000_000).optional(),
  addToPantry: z.boolean(),
  storageLocation: z.enum(["pantry", "fridge", "freezer"]).optional(),
  bestBefore: z.string().datetime().optional(),
}).strict().superRefine((value, ctx) => {
  for (const issue of validateReceiptBusinessRules(value)) {
    const path =
      issue === "PURCHASE_TIME_IN_FUTURE"
        ? ["boughtAt"]
        : issue === "STORAGE_REQUIRED"
          ? ["storageLocation"]
          : ["bestBefore"];
    ctx.addIssue({ code: "custom", path, message: issue });
  }
  if (!COMMODITY_BY_ID[value.commodityId]) {
    ctx.addIssue({ code: "custom", path: ["commodityId"], message: "UNKNOWN_COMMODITY" });
  }
});
const manualInventoryLotSchema = z.object({
  commodityId: id,
  qty: z.number().positive().max(1_000_000),
  unit: z.string().trim().min(1).max(20),
  purchasedAt: z.string().datetime(),
  storageLocation: z.enum(["pantry", "fridge", "freezer"]),
  bestBefore: z.string().datetime().optional(),
}).strict().superRefine((value, ctx) => {
  if (!COMMODITY_BY_ID[value.commodityId]) {
    ctx.addIssue({ code: "custom", path: ["commodityId"], message: "UNKNOWN_COMMODITY" });
  }
  if (value.bestBefore && new Date(value.bestBefore).getTime() <= new Date(value.purchasedAt).getTime()) {
    ctx.addIssue({ code: "custom", path: ["bestBefore"], message: "BEST_BEFORE_MUST_FOLLOW_PURCHASE" });
  }
});
const inventoryMovementSchema = z.object({
  idempotencyKey: z.string().uuid(),
  lotId: id,
  kind: z.enum(["consumed", "discarded"]),
  qty: z.number().positive().max(1_000_000),
  occurredAt: z.string().datetime(),
  note: z.string().trim().max(500).optional(),
}).strict().superRefine((value, ctx) => {
  if (new Date(value.occurredAt).getTime() > Date.now() + 5 * 60_000) {
    ctx.addIssue({ code: "custom", path: ["occurredAt"], message: "OCCURRED_AT_IN_FUTURE" });
  }
});
const createLeftoverLotSchema = z.object({
  idempotencyKey: z.string().uuid(),
  dishRef: id,
  servings: z.number().positive().max(100),
  preparedAt: z.string().datetime(),
  chilledAt: z.string().datetime(),
  storageLocation: z.enum(["fridge", "freezer"]),
  hotWeatherConfirmed: z.boolean(),
  sourceMealRunRef: z.string().trim().min(1).max(300).optional(),
  note: z.string().trim().max(500).optional(),
}).strict().superRefine((value, ctx) => {
  if (!REPERTOIRE_BY_ID[value.dishRef]) {
    ctx.addIssue({ code: "custom", path: ["dishRef"], message: "UNKNOWN_DISH" });
  }
  const result = evaluateCoolingWindow({
    preparedAt: value.preparedAt,
    chilledAt: value.chilledAt,
    hotWeatherConfirmed: value.hotWeatherConfirmed,
    now: new Date(),
  });
  if (!result.accepted) {
    ctx.addIssue({
      code: "custom",
      path: result.reasonCode === "CHILLED_BEFORE_PREPARED" ? ["chilledAt"] : ["preparedAt"],
      message: result.reasonCode ?? "INVALID_TIMESTAMP",
    });
  }
});
const leftoverMovementSchema = z.object({
  idempotencyKey: z.string().uuid(),
  lotId: id,
  kind: z.enum(["consumed", "discarded", "corrected"]),
  servings: z.number().nonnegative().max(100),
  occurredAt: z.string().datetime(),
  note: z.string().trim().max(500).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.kind !== "corrected" && value.servings <= 0) {
    ctx.addIssue({ code: "custom", path: ["servings"], message: "SERVINGS_MUST_BE_POSITIVE" });
  }
  if (new Date(value.occurredAt).getTime() > Date.now() + 5 * 60_000) {
    ctx.addIssue({ code: "custom", path: ["occurredAt"], message: "OCCURRED_AT_IN_FUTURE" });
  }
});
const plannedSlotSchema = z.object({
  day: z.number().int().min(0).max(6),
  slot: z.enum(["COM", "MAN", "RAU", "CANH", "TRANGMIENG"]),
  dishId: id,
  locked: z.boolean(),
}).strict();
const householdDishSchema = z.object({
  id,
  vnName: z.string().trim().min(1).max(120),
  enLabel: z.string().trim().max(120).optional(),
  proteinType: z.enum(["bo", "ga", "ca", "tom", "heo", "cua", "trung", "dau", "rau"]),
  method: z.enum(["kho", "xao", "luoc", "hap", "nuong", "ran", "song"]),
  slot: z.enum(["COM", "MAN", "RAU", "CANH", "TRANGMIENG"]),
  quick: z.boolean(),
  baseServings: z.number().int().min(1).max(30),
  cookTimeMin: z.number().int().positive().max(1_440).optional(),
  tags: z.array(shortText.min(1)).max(50).optional(),
  lines: z.array(z.object({
    commodityId: id,
    qtyBase: z.number().positive().max(1_000_000),
    unit: z.string().trim().min(1).max(20),
  }).strict()).max(100),
  origin: z.literal("B1"),
  sourceRepertoireId: id.optional(),
  vendor: z.string().trim().max(120).optional(),
  isFavorite: z.boolean().optional(),
}).strict();
const saveWeekPlanSchema = z.object({
  weekStart: z.iso.date(),
  expectedVersion: z.number().int().positive(),
  slots: z.array(plannedSlotSchema).max(35),
  householdDishes: z.array(householdDishSchema).max(100).optional(),
}).strict();

// Server Action boundary — client store calls these to load/persist to Neon.
export async function getHouseholdState(): Promise<HouseholdState> {
  await requireUserId();
  return loadHouseholdState();
}

export async function getCanonicalWeekPlan(): Promise<WeekPlanEnvelope> {
  await requireUserId();
  return loadOrCreateCurrentWeekPlan();
}

export async function persistCanonicalWeekPlan(
  raw: SaveWeekPlanInput,
): Promise<SaveWeekPlanResult> {
  await requireUserId();
  const input = saveWeekPlanSchema.parse(raw) as SaveWeekPlanInput;
  if (input.weekStart !== currentWeekStartIso()) {
    throw new Error("WEEK_OUTSIDE_CURRENT_SCOPE");
  }
  const result = await saveWeekPlan(input);
  revalidatePath("/week");
  revalidatePath("/overview");
  revalidatePath("/shopping");
  return result;
}

export async function persistState(patch: StatePatch): Promise<void> {
  await requireUserId();
  await saveHouseholdState(statePatchSchema.parse(patch) as StatePatch);
}

export async function persistMemberHealthProfile(memberId: string, profile: HealthProfile | null): Promise<void> {
  await requireUserId();
  await saveMemberHealthProfile(id.parse(memberId), profile === null ? null : healthProfileSchema.parse(profile) as HealthProfile);
}

export async function persistMemberAllergies(memberId: string, allergies: Allergen[]): Promise<void> {
  await requireUserId();
  await saveMemberAllergies(id.parse(memberId), z.array(allergenSchema).max(10).parse(allergies));
}

// ── "Không gian gia đình sống" — member base CRUD + dynamic states ──
export async function persistMember(
  input: Pick<Member, "name" | "role" | "sex" | "ageBand" | "allergies" | "habits" | "conditions" | "dislikes"> & { id?: string },
): Promise<string> {
  await requireUserId();
  return saveMember(memberSchema.parse(input) as typeof input);
}
export async function removeMember(memberId: string): Promise<void> {
  await requireUserId();
  await deleteMember(id.parse(memberId));
}
export async function persistMemberState(memberId: string, state: Omit<MemberState, "id">): Promise<void> {
  await requireUserId();
  await addMemberState(id.parse(memberId), memberStateSchema.parse(state));
}
export async function removeMemberState(stateId: string): Promise<void> {
  await requireUserId();
  await deleteMemberState(id.parse(stateId));
}

// ── Phase 2 — Supplier & Order (household-owned) ──
export async function persistSupplier(
  input: Omit<Supplier, "householdId" | "seed">,
): Promise<Supplier> {
  await requireUserId();
  return saveSupplier(supplierSchema.parse(input) as typeof input);
}

export async function removeSupplier(id: string): Promise<void> {
  await requireUserId();
  await deleteSupplier(idSchema(id));
}

export async function persistOrder(order: Omit<Order, "id"> & { id?: string }): Promise<Order> {
  await requireUserId();
  return saveOrder(orderSchema.parse(order) as typeof order);
}

export async function persistPurchase(record: Omit<PurchaseRecord, "id">): Promise<PurchaseRecord> {
  await requireUserId();
  return savePurchase(purchaseSchema.parse(record) as typeof record);
}

export async function receiveShoppingItem(
  input: ReceiveShoppingItemInput,
): Promise<ReceiveShoppingItemResult> {
  await requireUserId();
  return receiveShoppingItemRecord(
    receiveShoppingItemSchema.parse(input) as ReceiveShoppingItemInput,
  );
}

export async function createManualInventoryLot(
  input: z.infer<typeof manualInventoryLotSchema>,
) {
  await requireUserId();
  return createManualInventoryLotRecord(manualInventoryLotSchema.parse(input));
}

export async function deleteInventoryLot(lotId: string): Promise<void> {
  await requireUserId();
  await deleteInventoryLotRecord(id.parse(lotId));
}

export async function recordInventoryMovement(
  input: RecordInventoryMovementInput,
): Promise<RecordInventoryMovementResult> {
  await requireUserId();
  return recordInventoryMovementRecord(
    inventoryMovementSchema.parse(input) as RecordInventoryMovementInput,
  );
}

export async function createLeftoverLot(
  input: CreateLeftoverLotInput,
): Promise<LeftoverLot> {
  await requireUserId();
  const parsed = createLeftoverLotSchema.parse(input) as CreateLeftoverLotInput;
  const dish = REPERTOIRE_BY_ID[parsed.dishRef];
  if (!dish) throw new Error("UNKNOWN_DISH");
  const lot = await createLeftoverLotRecord({
    ...parsed,
    dishLabelSnapshot: dish.vnName,
  });
  revalidatePath("/pantry");
  return lot;
}

export async function recordLeftoverMovement(
  input: RecordLeftoverMovementInput,
): Promise<RecordLeftoverMovementResult> {
  await requireUserId();
  const result = await recordLeftoverMovementRecord(
    leftoverMovementSchema.parse(input) as RecordLeftoverMovementInput,
  );
  revalidatePath("/pantry");
  return result;
}

// Semantic dish search (Phase B) — returns ranked dish ids for the query.
export async function searchDishes(query: string): Promise<string[]> {
  await requireUserId();
  const hits = await semanticSearch(z.string().trim().min(1).max(300).parse(query), 12);
  return hits.filter((h) => h.score > 0.4).map((h) => h.id);
}

function idSchema(value: string): string {
  return id.parse(value);
}
