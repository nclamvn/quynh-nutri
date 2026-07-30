import { z } from "zod";

export const PRODUCT_EVENT_NAMES = [
  "onboarding_started",
  "onboarding_completed",
  "week_proposal_confirmed",
  "shopping_item_received",
  "cooking_started",
  "meal_run_started",
  "leftover_recorded",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

const emptyProperties = z.object({}).strict();

const schemas = {
  onboarding_started: emptyProperties,
  onboarding_completed: z.object({
    adults: z.number().int().min(0).max(12),
    children: z.number().int().min(0).max(12),
    hasRestrictions: z.boolean(),
    busyDayCount: z.number().int().min(0).max(7),
    marketMode: z.enum(["traditional", "mixed", "supermarket"]),
  }).strict(),
  week_proposal_confirmed: z.object({
    changedSlotCount: z.number().int().min(1).max(35),
  }).strict(),
  shopping_item_received: z.object({
    addedToPantry: z.boolean(),
  }).strict(),
  cooking_started: emptyProperties,
  meal_run_started: z.object({
    dishCount: z.number().int().min(2).max(5),
  }).strict(),
  leftover_recorded: z.object({
    storageLocation: z.enum(["fridge", "freezer"]),
  }).strict(),
} satisfies Record<ProductEventName, z.ZodType>;

export type ProductEventInput = {
  name: ProductEventName;
  dedupeKey: string;
  properties: Record<string, unknown>;
};

export function parseProductEvent(input: unknown): ProductEventInput {
  const envelope = z.object({
    name: z.enum(PRODUCT_EVENT_NAMES),
    dedupeKey: z.string().trim().min(1).max(180),
    properties: z.record(z.string(), z.unknown()),
  }).strict().parse(input);

  return {
    ...envelope,
    properties: schemas[envelope.name].parse(envelope.properties),
  };
}

