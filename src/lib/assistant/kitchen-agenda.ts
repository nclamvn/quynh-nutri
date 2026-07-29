import "server-only";

import { loadHouseholdState, type HouseholdState } from "@/data/repo/household";
import { REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import { COMMODITY_BY_ID } from "@/data/seed/commodity";
import { COOKING_GUIDES } from "@/data/seed/cooking-guides";
import { PREP_AHEAD_DISH_IDS } from "@/data/seed/prep-ahead-guides";
import { aggregateShopping } from "@/domain/shopping";
import {
  buildKitchenAgenda,
  type KitchenAgenda,
} from "@/domain/kitchen-execution/kitchen-agenda";
import type { WeekPlan } from "@/domain/types";
import { loadOrCreateCurrentWeekPlan } from "@/data/repo/week-plan";

export const KITCHEN_AGENDA_TIME_ZONE = "Asia/Ho_Chi_Minh";
const REVIEWED_DISH_IDS = new Set(COOKING_GUIDES.map((guide) => guide.dishId));
const commodity = (id: string) => COMMODITY_BY_ID[id];

export function buildAssistantKitchenAgenda(input: {
  state: HouseholdState;
  plan: WeekPlan;
  now: Date;
  timeZone?: string;
}): KitchenAgenda {
  const shopping = aggregateShopping(
    input.plan,
    (id) => REPERTOIRE_BY_ID[id],
    commodity,
    input.state.household,
    [],
    input.state.pantry,
    input.state.fulfillments,
  );
  return buildKitchenAgenda({
    now: input.now,
    timeZone: input.timeZone ?? KITCHEN_AGENDA_TIME_ZONE,
    plan: input.plan,
    shopping,
    pantry: input.state.pantry,
    leftovers: input.state.leftoverLots,
    dish: (id) => REPERTOIRE_BY_ID[id],
    reviewedCookingDishIds: REVIEWED_DISH_IDS,
    prepAheadDishIds: PREP_AHEAD_DISH_IDS,
  });
}

/** Read-only request-scoped projection. Authentication and household scoping
 * happen inside loadHouseholdState; the model supplies no IDs, clock or inputs. */
export async function getKitchenAgendaSnapshot(): Promise<KitchenAgenda> {
  const state = await loadHouseholdState();
  const now = new Date();
  const { plan } = await loadOrCreateCurrentWeekPlan();
  return buildAssistantKitchenAgenda({ state, plan, now });
}
