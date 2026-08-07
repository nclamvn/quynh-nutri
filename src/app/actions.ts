"use server";

import { currentHouseholdId, loadHouseholdState, saveHouseholdState, saveMemberHealthProfile, saveMemberAllergies, saveMember, deleteMember, addMemberState, deleteMemberState, saveSupplier, deleteSupplier, saveOrder, savePurchase, receiveShoppingItemRecord, createManualInventoryLotRecord, deleteInventoryLotRecord, recordInventoryMovementRecord, createLeftoverLotRecord, recordLeftoverMovementRecord, completeHouseholdOnboarding, type StatePatch, type HouseholdState } from "@/data/repo/household";
import { semanticSearch } from "@/lib/search";
import { isE2EMode, requireUserId } from "@/lib/auth";
import type { HealthProfile, Allergen, Member, MemberState, Supplier, Order, PurchaseRecord, ReceiveShoppingItemInput, ReceiveShoppingItemResult, RecordInventoryMovementInput, RecordInventoryMovementResult, CreateLeftoverLotInput, LeftoverLot, RecordLeftoverMovementInput, RecordLeftoverMovementResult, ConfirmMealCloseoutInput, ConfirmMealCloseoutResult, SaveMealFeedbackInput, SaveMealFeedbackResult, DeleteMealFeedbackInput, DeleteMealFeedbackResult, MealOccasion } from "@/domain/types";
import { COMMODITY_BY_ID } from "@/data/seed/commodity";
import { REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import { validateReceiptBusinessRules } from "@/domain/kitchen-execution/receipt";
import { evaluateCoolingWindow } from "@/domain/kitchen-execution/leftover-safety";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  loadHouseholdDishLibrary,
  loadOrCreateCurrentWeekPlan,
  saveWeekPlan,
  syncMissingHouseholdDishes,
  type WeekPlanEnvelope,
} from "@/data/repo/week-plan";
import type {
  SaveWeekPlanInput,
  SaveWeekPlanResult,
} from "@/domain/planning/persisted-week-plan";
import { currentWeekStartIso } from "@/lib/week";
import type { ConfirmAssistantWeekPlanProposalInput } from "@/domain/assistant/week-plan-proposal";
import { verifyAssistantWeekPlanProposal } from "@/lib/assistant/week-plan-proposal";
import {
  disableHouseholdReminders,
  enableReminderSubscription,
  getReminderSettings as getStoredReminderSettings,
} from "@/data/repo/reminders";
import { isValidTimeZone } from "@/domain/reminders/policy";
import { vapidPublicKey } from "@/lib/reminders/web-push";
import {
  deleteKitchenSession,
  loadKitchenSession,
  saveKitchenSession,
} from "@/data/repo/kitchen-session";
import {
  parseCookingSession,
  type CookingSession,
} from "@/domain/kitchen-execution/cooking";
import {
  parseMealRunSession,
  type MealRunSession,
} from "@/domain/kitchen-execution/meal-coordination";
import { cookingGuideFor } from "@/data/seed/cooking-guides";
import type {
  DeleteKitchenSessionResult,
  PersistedKitchenSession,
  SaveKitchenSessionResult,
} from "@/domain/kitchen-execution/persisted-session";
import {
  onboardingInputSchema,
  type OnboardingResult,
} from "@/domain/onboarding";
import { recordProductEventSafely } from "@/data/repo/product-events";
import { confirmMealCloseoutRecord } from "@/data/repo/meal-completion";
import {
  deleteMealFeedbackRecord,
  saveMealFeedbackRecord,
} from "@/data/repo/meal-feedback";

const id = z.string().trim().min(1).max(128);
const mealOccasionSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);
const shortText = z.string().trim().max(500);
const reminderSubscriptionSchema = z.object({
  endpoint: z.url().max(2_000),
  p256dh: z.string().trim().min(1).max(512),
  auth: z.string().trim().min(1).max(512),
  userAgent: z.string().trim().max(500).optional(),
  timeZone: z.string().trim().min(1).max(100).refine(isValidTimeZone),
  reminderHour: z.number().int().min(0).max(23),
}).strict();
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
const memberContextProfileSchema = z.object({
  ageYears: z.number().int().min(0).max(130).optional(),
  ageMonths: z.number().int().min(0).max(11).optional(),
  heightCm: z.number().int().min(30).max(260).optional(),
  weightKg: z.number().positive().max(400).optional(),
  routine: z.array(shortText).max(20).optional(),
  foodNotes: z.array(shortText).max(30).optional(),
  wellbeingNotes: z.array(shortText).max(20).optional(),
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
  contextProfile: memberContextProfileSchema.optional(),
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
  mealCompletionId: id.optional(),
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
const confirmMealCloseoutSchema = z.object({
  idempotencyKey: z.string().uuid(),
  weekRef: z.iso.date(),
  day: z.number().int().min(0).max(6),
  occasion: mealOccasionSchema,
  expectedSessionVersion: z.number().int().positive(),
  completedAt: z.string().datetime(),
  consumptions: z.array(z.object({
    lotId: id,
    qty: z.number().positive().max(1_000_000),
  }).strict()).max(100),
}).strict().superRefine((value, ctx) => {
  if (new Date(value.completedAt).getTime() > Date.now() + 5 * 60_000) {
    ctx.addIssue({ code: "custom", path: ["completedAt"], message: "COMPLETED_AT_IN_FUTURE" });
  }
  const lotIds = value.consumptions.map((item) => item.lotId);
  if (new Set(lotIds).size !== lotIds.length) {
    ctx.addIssue({ code: "custom", path: ["consumptions"], message: "DUPLICATE_LOT" });
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
const saveMealFeedbackSchema = z.object({
  idempotencyKey: z.string().uuid(),
  mealCompletionId: id,
  dishRef: id,
  repeatIntent: z.enum(["repeat", "neutral", "avoid"]).optional(),
  portionFit: z.enum(["too_little", "right", "too_much"]).optional(),
  effortFit: z.enum(["easy", "manageable", "too_much"]).optional(),
  expectedVersion: z.number().int().positive().nullable(),
}).strict().superRefine((value, ctx) => {
  if (!value.repeatIntent && !value.portionFit && !value.effortFit) {
    ctx.addIssue({
      code: "custom",
      path: ["repeatIntent"],
      message: "MEAL_FEEDBACK_ANSWER_REQUIRED",
    });
  }
});
const deleteMealFeedbackSchema = z.object({
  feedbackId: id,
  expectedVersion: z.number().int().positive(),
}).strict();
const plannedSlotSchema = z.object({
  day: z.number().int().min(0).max(6),
  occasion: mealOccasionSchema,
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
  slots: z.array(plannedSlotSchema).max(140),
  householdDishes: z.array(householdDishSchema).max(100).optional(),
}).strict();
const confirmAssistantWeekPlanProposalSchema = z.object({
  proposalId: z.string().uuid(),
  kind: z.literal("week-plan"),
  weekStart: z.iso.date(),
  baseVersion: z.number().int().positive(),
  seed: z.number().int().positive(),
  slots: z.array(plannedSlotSchema).max(140),
  confirmedByUser: z.literal(true),
}).strict();
const sessionVersionSchema = z.number().int().positive().nullable();
const cookingSessionSchema = z.object({
  dishId: id,
  guideId: id,
  completedStepIds: z.array(id).max(100),
  startedAt: z.string().datetime(),
  targetServings: z.number().int().min(1).max(12).optional(),
}).strict();
const mealRunSessionSchema = z.object({
  day: z.number().int().min(0).max(6),
  targetServeAt: z.string().datetime(),
  tasks: z.array(z.object({
    dishId: id,
    estimatedMin: z.number().int().min(5).max(240),
    startedAt: z.string().datetime().optional(),
    completedAt: z.string().datetime().optional(),
  }).strict()).min(2).max(5),
  createdAt: z.string().datetime(),
}).strict();

const validateCookingPayload = (raw: unknown): CookingSession => {
  const input = cookingSessionSchema.parse(raw) as CookingSession;
  const resolved = cookingGuideFor(input.dishId);
  const parsed = resolved
    ? parseCookingSession(JSON.stringify(input), resolved.guide)
    : undefined;
  if (!parsed) throw new Error("INVALID_COOKING_SESSION");
  return parsed;
};

const validateMealRunPayload = async (
  weekStart: string,
  day: number,
  raw: unknown,
): Promise<MealRunSession> => {
  if (weekStart !== currentWeekStartIso()) {
    throw new Error("WEEK_OUTSIDE_CURRENT_SCOPE");
  }
  const input = mealRunSessionSchema.parse(raw) as MealRunSession;
  if (input.day !== day) throw new Error("MEAL_RUN_DAY_MISMATCH");
  const { plan } = await loadOrCreateCurrentWeekPlan();
  const supportedDishIds = new Set(
    plan.slots
      .filter((slot) => slot.day === day && cookingGuideFor(slot.dishId))
      .map((slot) => slot.dishId),
  );
  const parsed = parseMealRunSession(
    JSON.stringify(input),
    day,
    supportedDishIds,
  );
  if (!parsed) throw new Error("INVALID_MEAL_RUN_SESSION");
  return parsed;
};

// Server Action boundary – client store calls these to load/persist to Neon.
export async function getHouseholdState(): Promise<HouseholdState> {
  await requireUserId();
  return loadHouseholdState();
}

export async function getCanonicalWeekPlan(): Promise<WeekPlanEnvelope> {
  await requireUserId();
  return loadOrCreateCurrentWeekPlan();
}

export async function getHouseholdDishLibrary() {
  await requireUserId();
  return loadHouseholdDishLibrary();
}

export async function syncHouseholdDishLibrary(raw: unknown) {
  await requireUserId();
  const dishes = z.array(householdDishSchema).max(100).parse(raw);
  return syncMissingHouseholdDishes(dishes);
}

export async function getCookingSession(
  dishId: string,
): Promise<PersistedKitchenSession<CookingSession> | undefined> {
  await requireUserId();
  const safeDishId = id.parse(dishId);
  const session = await loadKitchenSession<CookingSession>(
    "cooking",
    safeDishId,
  );
  if (!session) return undefined;
  return { ...session, payload: validateCookingPayload(session.payload) };
}

export async function persistCookingSession(
  raw: unknown,
  expectedVersion: number | null,
): Promise<SaveKitchenSessionResult<CookingSession>> {
  await requireUserId();
  const input = validateCookingPayload(raw);
  const result = await saveKitchenSession(
    "cooking",
    input.dishId,
    input,
    sessionVersionSchema.parse(expectedVersion),
  );
  if (result.ok && expectedVersion === null) {
    await recordProductEventSafely({
      name: "cooking_started",
      dedupeKey: `cooking_started:${result.session.id}`,
      properties: {},
    });
  }
  return result;
}

export async function clearCookingSession(
  dishId: string,
  expectedVersion: number,
): Promise<DeleteKitchenSessionResult<CookingSession>> {
  await requireUserId();
  return deleteKitchenSession(
    "cooking",
    id.parse(dishId),
    z.number().int().positive().parse(expectedVersion),
  );
}

export async function getMealRunSession(
  weekStart: string,
  day: number,
  occasion: MealOccasion = "dinner",
): Promise<PersistedKitchenSession<MealRunSession> | undefined> {
  await requireUserId();
  const safeWeek = z.iso.date().parse(weekStart);
  const safeDay = z.number().int().min(0).max(6).parse(day);
  const safeOccasion = mealOccasionSchema.parse(occasion);
  const scopeKey = `${safeWeek}:${safeDay}:${safeOccasion}`;
  const session = await loadKitchenSession<MealRunSession>(
    "meal-run",
    scopeKey,
  );
  if (!session) return undefined;
  return {
    ...session,
    payload: await validateMealRunPayload(
      safeWeek,
      safeDay,
      session.payload,
    ),
  };
}

export async function persistMealRunSession(
  weekStart: string,
  day: number,
  occasion: MealOccasion,
  raw: unknown,
  expectedVersion: number | null,
): Promise<SaveKitchenSessionResult<MealRunSession>> {
  await requireUserId();
  const safeWeek = z.iso.date().parse(weekStart);
  const safeDay = z.number().int().min(0).max(6).parse(day);
  const safeOccasion = mealOccasionSchema.parse(occasion);
  const input = await validateMealRunPayload(safeWeek, safeDay, raw);
  const result = await saveKitchenSession(
    "meal-run",
    `${safeWeek}:${safeDay}:${safeOccasion}`,
    input,
    sessionVersionSchema.parse(expectedVersion),
  );
  if (result.ok && expectedVersion === null) {
    await recordProductEventSafely({
      name: "meal_run_started",
      dedupeKey: `meal_run_started:${result.session.id}`,
      properties: { occasion: safeOccasion, dishCount: input.tasks.length },
    });
  }
  return result;
}

export async function clearMealRunSession(
  weekStart: string,
  day: number,
  occasion: MealOccasion,
  expectedVersion: number,
): Promise<DeleteKitchenSessionResult<MealRunSession>> {
  await requireUserId();
  const safeWeek = z.iso.date().parse(weekStart);
  const safeDay = z.number().int().min(0).max(6).parse(day);
  const safeOccasion = mealOccasionSchema.parse(occasion);
  if (safeWeek !== currentWeekStartIso()) {
    throw new Error("WEEK_OUTSIDE_CURRENT_SCOPE");
  }
  return deleteKitchenSession(
    "meal-run",
    `${safeWeek}:${safeDay}:${safeOccasion}`,
    z.number().int().positive().parse(expectedVersion),
  );
}

export async function confirmMealCloseout(
  raw: ConfirmMealCloseoutInput,
): Promise<ConfirmMealCloseoutResult> {
  const userId = await requireUserId();
  const input = confirmMealCloseoutSchema.parse(raw) as ConfirmMealCloseoutInput;
  const { plan } = await loadOrCreateCurrentWeekPlan();
  if (input.weekRef !== plan.weekStart || input.weekRef !== currentWeekStartIso()) {
    throw new Error("WEEK_OUTSIDE_CURRENT_SCOPE");
  }
  const allowedDishIds = [...new Set(
    plan.slots
      .filter((slot) =>
        slot.day === input.day
        && slot.occasion === input.occasion
        && cookingGuideFor(slot.dishId)
      )
      .map((slot) => slot.dishId),
  )];
  if (allowedDishIds.length === 0) throw new Error("NO_REVIEWED_DISH");
  const householdId = await currentHouseholdId();
  const e2eState = isE2EMode() ? await loadHouseholdState() : undefined;
  const e2eSession = isE2EMode()
    ? await loadKitchenSession<MealRunSession>(
      "meal-run",
      `${input.weekRef}:${input.day}:${input.occasion}`,
    )
    : undefined;
  const result = await confirmMealCloseoutRecord(
    {
      ...input,
      householdId,
      userId,
      allowedDishIds,
    },
    e2eState
      ? { pantry: e2eState.pantry, session: e2eSession }
      : undefined,
  );
  if (isE2EMode() && result.ok) {
    await deleteKitchenSession(
      "meal-run",
      `${input.weekRef}:${input.day}:${input.occasion}`,
      input.expectedSessionVersion,
    );
  }
  revalidatePath("/overview");
  revalidatePath("/week");
  revalidatePath("/pantry");
  return result;
}

export async function saveMealFeedback(
  raw: SaveMealFeedbackInput,
): Promise<SaveMealFeedbackResult> {
  const userId = await requireUserId();
  const input = saveMealFeedbackSchema.parse(raw) as SaveMealFeedbackInput;
  const householdId = await currentHouseholdId();
  const e2eState = isE2EMode() ? await loadHouseholdState() : undefined;
  const result = await saveMealFeedbackRecord(
    { ...input, householdId, userId },
    e2eState?.mealCompletions.find(
      (completion) => completion.id === input.mealCompletionId,
    ),
  );
  if (result.ok) {
    const dimensionsAnswered = [
      input.repeatIntent,
      input.portionFit,
      input.effortFit,
    ].filter(Boolean).length;
    await recordProductEventSafely({
      name: "meal_feedback_saved",
      dedupeKey: `meal_feedback_saved:${input.idempotencyKey}`,
      properties: {
        dimensionsAnswered,
        isEdit: input.expectedVersion !== null,
      },
    });
  }
  revalidatePath("/reports");
  revalidatePath("/overview");
  return result;
}

export async function deleteMealFeedback(
  raw: DeleteMealFeedbackInput,
): Promise<DeleteMealFeedbackResult> {
  await requireUserId();
  const input = deleteMealFeedbackSchema.parse(raw) as DeleteMealFeedbackInput;
  const householdId = await currentHouseholdId();
  const stateBeforeDelete = await loadHouseholdState();
  const existing = stateBeforeDelete.mealFeedback.find(
    (feedback) => feedback.id === input.feedbackId,
  );
  const result = await deleteMealFeedbackRecord({ ...input, householdId });
  if (result.ok) {
    await recordProductEventSafely({
      name: "meal_feedback_deleted",
      dedupeKey: `meal_feedback_deleted:${input.feedbackId}:${input.expectedVersion}`,
      properties: {
        hadAllDimensions: Boolean(
          existing?.repeatIntent
          && existing.portionFit
          && existing.effortFit,
        ),
      },
    });
  }
  revalidatePath("/reports");
  revalidatePath("/overview");
  return result;
}

export async function persistCanonicalWeekPlan(
  raw: SaveWeekPlanInput,
): Promise<SaveWeekPlanResult> {
  await requireUserId();
  const input = saveWeekPlanSchema.parse(raw) as SaveWeekPlanInput;
  if (input.weekStart !== currentWeekStartIso()) {
    throw new Error("WEEK_OUTSIDE_CURRENT_SCOPE");
  }
  const before = (await loadOrCreateCurrentWeekPlan()).plan;
  const result = await saveWeekPlan(input);
  if (result.ok && result.plan.version !== before.version) {
    const key = (slot: typeof input.slots[number]) =>
      `${slot.day}:${slot.occasion}:${slot.slot}`;
    const beforeByKey = new Map(before.slots.map((slot) => [key(slot), slot]));
    const afterByKey = new Map(input.slots.map((slot) => [key(slot), slot]));
    const changedKeys = new Set([...beforeByKey.keys(), ...afterByKey.keys()]);
    await Promise.all([...changedKeys].flatMap((slotKey) => {
      const previous = beforeByKey.get(slotKey);
      const next = afterByKey.get(slotKey);
      if (previous?.dishId === next?.dishId) return [];
      const action = !previous ? "add" : !next ? "remove" : "replace";
      const occasion = (next ?? previous)!.occasion;
      return [recordProductEventSafely({
        name: "meal_occasion_edited",
        dedupeKey: `meal_occasion_edited:${result.plan.id}:${result.plan.version}:${slotKey}`,
        properties: { occasion, action },
      })];
    }));
  }
  revalidatePath("/week");
  revalidatePath("/overview");
  revalidatePath("/shopping");
  return result;
}

export async function confirmAssistantWeekPlanProposal(
  raw: ConfirmAssistantWeekPlanProposalInput,
): Promise<SaveWeekPlanResult> {
  await requireUserId();
  const input = confirmAssistantWeekPlanProposalSchema.parse(
    raw,
  ) as ConfirmAssistantWeekPlanProposalInput;
  if (input.weekStart !== currentWeekStartIso()) {
    throw new Error("WEEK_OUTSIDE_CURRENT_SCOPE");
  }
  const verified = await verifyAssistantWeekPlanProposal(input);
  if (!verified.ok) return verified;
  const result = await saveWeekPlan({
    weekStart: input.weekStart,
    expectedVersion: input.baseVersion,
    slots: verified.slots,
  });
  if (result.ok) {
    await recordProductEventSafely({
      name: "week_proposal_confirmed",
      dedupeKey: `week_proposal_confirmed:${input.proposalId}`,
      properties: { changedSlotCount: verified.changeCount },
    });
  }
  revalidatePath("/week");
  revalidatePath("/overview");
  revalidatePath("/shopping");
  return result;
}

export async function persistState(patch: StatePatch): Promise<void> {
  await requireUserId();
  await saveHouseholdState(statePatchSchema.parse(patch) as StatePatch);
}

export async function startHouseholdOnboarding(): Promise<void> {
  await requireUserId();
  await recordProductEventSafely({
    name: "onboarding_started",
    dedupeKey: "onboarding_started:v1",
    properties: {},
  });
}

export async function finishHouseholdOnboarding(
  raw: unknown,
): Promise<OnboardingResult> {
  await requireUserId();
  return completeHouseholdOnboarding(onboardingInputSchema.parse(raw));
}

export async function loadReminderSettings() {
  await requireUserId();
  return {
    settings: await getStoredReminderSettings(),
    publicKey: vapidPublicKey(),
  };
}

export async function enableKitchenReminders(
  raw: z.infer<typeof reminderSubscriptionSchema>,
) {
  await requireUserId();
  return enableReminderSubscription(reminderSubscriptionSchema.parse(raw));
}

export async function disableKitchenReminders(): Promise<void> {
  await requireUserId();
  await disableHouseholdReminders();
}

export async function persistMemberHealthProfile(memberId: string, profile: HealthProfile | null): Promise<void> {
  await requireUserId();
  await saveMemberHealthProfile(id.parse(memberId), profile === null ? null : healthProfileSchema.parse(profile) as HealthProfile);
}

export async function persistMemberAllergies(memberId: string, allergies: Allergen[]): Promise<void> {
  await requireUserId();
  await saveMemberAllergies(id.parse(memberId), z.array(allergenSchema).max(10).parse(allergies));
}

// ── "Không gian gia đình sống" – member base CRUD + dynamic states ──
export async function persistMember(
  input: Pick<Member, "name" | "role" | "sex" | "ageBand" | "allergies" | "habits" | "conditions" | "dislikes" | "contextProfile"> & { id?: string },
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

// ── Phase 2 – Supplier & Order (household-owned) ──
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
  const parsed = receiveShoppingItemSchema.parse(input) as ReceiveShoppingItemInput;
  const result = await receiveShoppingItemRecord(
    parsed,
  );
  await recordProductEventSafely({
    name: "shopping_item_received",
    dedupeKey: `shopping_item_received:${parsed.idempotencyKey}`,
    properties: { addedToPantry: parsed.addToPantry },
  });
  return result;
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
  await recordProductEventSafely({
    name: "leftover_recorded",
    dedupeKey: `leftover_recorded:${parsed.idempotencyKey}`,
    properties: { storageLocation: parsed.storageLocation },
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

// Semantic dish search (Phase B) – returns ranked dish ids for the query.
export async function searchDishes(query: string): Promise<string[]> {
  await requireUserId();
  const hits = await semanticSearch(z.string().trim().min(1).max(300).parse(query), 12);
  return hits.filter((h) => h.score > 0.4).map((h) => h.id);
}

function idSchema(value: string): string {
  return id.parse(value);
}
