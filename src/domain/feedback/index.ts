import type {
  Commodity,
  Dish,
  InventoryMovement,
  LeftoverLot,
  LeftoverMovement,
  PurchaseRecord,
  ShoppingFulfillment,
} from "@/domain/types";
import type { ShoppingItem } from "@/domain/shopping";
import type { CommoditySource } from "@/domain/nutrition/calculator";
import { costReport, type CostReport } from "@/domain/cost";
import { resolvePrice, type PriceSource } from "@/domain/purchase";

export interface CoverageAmount {
  valueVnd: number;
  pricedCount: number;
  totalCount: number;
  coveragePct: number;
  lowerBound: boolean;
}

export interface QuantityVariance {
  avoidedSpendVnd: number;
  extraSpendVnd: number;
  comparableCount: number;
  totalCount: number;
  coveragePct: number;
}

export interface InventoryFeedbackLine {
  movementId: string;
  commodityId: string;
  label: string;
  kind: "consumed" | "discarded";
  qty: number;
  unit: string;
  valueVnd: number | null;
}

export interface LeftoverFeedbackLine {
  movementId: string;
  dishLabel: string;
  kind: "consumed" | "discarded";
  servings: number;
  estimatedValueVnd: number;
  pricedIngredientCount: number;
  ingredientCount: number;
  coveragePct: number;
  lowerBound: boolean;
  priceSources: PriceSource[];
}

export interface WeeklyFeedback {
  weekRef: string;
  planned: CostReport;
  actualSpend: CoverageAmount;
  quantityVariance: QuantityVariance;
  inventory: {
    lines: InventoryFeedbackLine[];
    consumed: CoverageAmount;
    discarded: CoverageAmount;
  };
  leftovers: {
    lines: LeftoverFeedbackLine[];
    consumedServings: number;
    discardedServings: number;
    reusedEstimated: CoverageAmount;
    discardedEstimated: CoverageAmount;
    correctionCount: number;
  };
  stages: {
    planned: boolean;
    bought: boolean;
    used: boolean;
    discarded: boolean;
  };
}

export interface WeeklyFeedbackInput {
  weekRef: string;
  hasPlan: boolean;
  shopping: ShoppingItem[];
  fulfillments: ShoppingFulfillment[];
  inventoryMovements: InventoryMovement[];
  leftoverLots: LeftoverLot[];
  leftoverMovements: LeftoverMovement[];
  purchases: PurchaseRecord[];
  commodity: CommoditySource;
  dish: (dishId: string) => Dish | undefined;
  budgetWeeklyVnd?: number;
}

const pct = (priced: number, total: number) =>
  total > 0 ? Math.round((priced / total) * 100) : 0;

const amount = (
  valueVnd: number,
  pricedCount: number,
  totalCount: number,
): CoverageAmount => ({
  valueVnd: Math.round(valueVnd),
  pricedCount,
  totalCount,
  coveragePct: pct(pricedCount, totalCount),
  lowerBound: pricedCount < totalCount,
});

const sameUnit = (left: string, right: string) =>
  left.trim().toLocaleLowerCase("vi") === right.trim().toLocaleLowerCase("vi");

function actualSpendFor(fulfillments: ShoppingFulfillment[]): CoverageAmount {
  const priced = fulfillments.filter(
    (fulfillment) => fulfillment.pricePaid != null && fulfillment.pricePaid > 0,
  );
  return amount(
    priced.reduce((sum, fulfillment) => sum + (fulfillment.pricePaid ?? 0), 0),
    priced.length,
    fulfillments.length,
  );
}

function quantityVarianceFor(fulfillments: ShoppingFulfillment[]): QuantityVariance {
  let avoidedSpendVnd = 0;
  let extraSpendVnd = 0;
  let comparableCount = 0;
  for (const fulfillment of fulfillments) {
    if (
      fulfillment.pricePaid == null
      || fulfillment.pricePaid <= 0
      || fulfillment.actualQty <= 0
      || fulfillment.plannedQty <= 0
    ) continue;
    comparableCount += 1;
    const plannedAtPaidRate =
      fulfillment.pricePaid * (fulfillment.plannedQty / fulfillment.actualQty);
    const delta = plannedAtPaidRate - fulfillment.pricePaid;
    if (delta >= 0) avoidedSpendVnd += delta;
    else extraSpendVnd += Math.abs(delta);
  }
  return {
    avoidedSpendVnd: Math.round(avoidedSpendVnd),
    extraSpendVnd: Math.round(extraSpendVnd),
    comparableCount,
    totalCount: fulfillments.length,
    coveragePct: pct(comparableCount, fulfillments.length),
  };
}

function inventoryFeedback(
  movements: InventoryMovement[],
  fulfillments: ShoppingFulfillment[],
  commodity: CommoditySource,
) {
  const fulfillmentByLot = new Map(
    fulfillments.flatMap((fulfillment) =>
      fulfillment.inventoryLotId ? [[fulfillment.inventoryLotId, fulfillment] as const] : []),
  );
  const lines: InventoryFeedbackLine[] = [];
  for (const movement of movements) {
    const fulfillment = fulfillmentByLot.get(movement.inventoryLotId);
    if (!fulfillment) continue;
    const valueVnd =
      fulfillment.pricePaid != null
      && fulfillment.pricePaid > 0
      && fulfillment.actualQty > 0
      && sameUnit(movement.unit, fulfillment.unit)
        ? (fulfillment.pricePaid / fulfillment.actualQty) * movement.qty
        : null;
    lines.push({
      movementId: movement.id,
      commodityId: movement.commodityId,
      label: commodity(movement.commodityId)?.canonicalVn ?? movement.commodityId,
      kind: movement.kind,
      qty: movement.qty,
      unit: movement.unit,
      valueVnd: valueVnd == null ? null : Math.round(valueVnd),
    });
  }
  const summarize = (kind: InventoryFeedbackLine["kind"]) => {
    const selected = lines.filter((line) => line.kind === kind);
    const priced = selected.filter(
      (line): line is InventoryFeedbackLine & { valueVnd: number } => line.valueVnd != null,
    );
    return amount(
      priced.reduce((sum, line) => sum + line.valueVnd, 0),
      priced.length,
      selected.length,
    );
  };
  return {
    lines,
    consumed: summarize("consumed"),
    discarded: summarize("discarded"),
  };
}

interface ServingEstimate {
  valueVnd: number;
  pricedIngredientCount: number;
  ingredientCount: number;
  priceSources: PriceSource[];
}

function dishServingEstimate(
  dish: Dish | undefined,
  preparedAt: string,
  purchases: PurchaseRecord[],
  commodity: CommoditySource,
): ServingEstimate {
  if (!dish || dish.baseServings <= 0) {
    return { valueVnd: 0, pricedIngredientCount: 0, ingredientCount: 1, priceSources: [] };
  }
  const preparedAtMs = new Date(preparedAt).getTime();
  const knownAtPreparation = purchases.filter(
    (record) => new Date(record.date).getTime() <= preparedAtMs,
  );
  let valueVnd = 0;
  let pricedIngredientCount = 0;
  const priceSources = new Set<PriceSource>();
  for (const line of dish.lines) {
    if (!sameUnit(line.unit, "g")) continue;
    const item: Commodity | undefined = commodity(line.commodityId);
    const price = resolvePrice(
      line.commodityId,
      knownAtPreparation,
      item?.priceVndPerKg,
    );
    if (!price) continue;
    const grossQty = line.qtyBase / (item?.edibleYield ?? 1);
    valueVnd += ((grossQty / 1000) * price.vndPerKg) / dish.baseServings;
    pricedIngredientCount += 1;
    priceSources.add(price.source);
  }
  return {
    valueVnd,
    pricedIngredientCount,
    ingredientCount: dish.lines.length,
    priceSources: [...priceSources],
  };
}

function leftoverFeedback(
  weekRef: string,
  lots: LeftoverLot[],
  movements: LeftoverMovement[],
  purchases: PurchaseRecord[],
  commodity: CommoditySource,
  dish: (dishId: string) => Dish | undefined,
) {
  const weekLots = lots.filter((lot) =>
    lot.sourceMealRunRef?.includes(`:${weekRef}:`),
  );
  const lotById = new Map(weekLots.map((lot) => [lot.id, lot]));
  const lines: LeftoverFeedbackLine[] = [];
  let correctionCount = 0;
  for (const movement of movements) {
    const lot = lotById.get(movement.leftoverLotId);
    if (!lot) continue;
    if (movement.kind === "corrected") {
      correctionCount += 1;
      continue;
    }
    const estimate = dishServingEstimate(
      dish(lot.dishRef),
      lot.preparedAt,
      purchases,
      commodity,
    );
    lines.push({
      movementId: movement.id,
      dishLabel: movement.dishLabelSnapshot,
      kind: movement.kind,
      servings: movement.servings,
      estimatedValueVnd: Math.round(estimate.valueVnd * movement.servings),
      pricedIngredientCount: estimate.pricedIngredientCount,
      ingredientCount: estimate.ingredientCount,
      coveragePct: pct(estimate.pricedIngredientCount, estimate.ingredientCount),
      lowerBound: estimate.pricedIngredientCount < estimate.ingredientCount,
      priceSources: estimate.priceSources,
    });
  }
  const summarize = (kind: LeftoverFeedbackLine["kind"]) => {
    const selected = lines.filter((line) => line.kind === kind);
    const pricedCount = selected.reduce((sum, line) => sum + line.pricedIngredientCount, 0);
    const totalCount = selected.reduce((sum, line) => sum + line.ingredientCount, 0);
    return amount(
      selected.reduce((sum, line) => sum + line.estimatedValueVnd, 0),
      pricedCount,
      totalCount,
    );
  };
  return {
    lines,
    consumedServings: lines
      .filter((line) => line.kind === "consumed")
      .reduce((sum, line) => sum + line.servings, 0),
    discardedServings: lines
      .filter((line) => line.kind === "discarded")
      .reduce((sum, line) => sum + line.servings, 0),
    reusedEstimated: summarize("consumed"),
    discardedEstimated: summarize("discarded"),
    correctionCount,
  };
}

export function weeklyFeedback(input: WeeklyFeedbackInput): WeeklyFeedback {
  const fulfillments = input.fulfillments.filter(
    (fulfillment) => fulfillment.weekRef === input.weekRef,
  );
  const planned = costReport(
    input.shopping,
    input.commodity,
    input.budgetWeeklyVnd,
  );
  const inventory = inventoryFeedback(
    input.inventoryMovements,
    fulfillments,
    input.commodity,
  );
  const leftovers = leftoverFeedback(
    input.weekRef,
    input.leftoverLots,
    input.leftoverMovements,
    input.purchases,
    input.commodity,
    input.dish,
  );
  const actualSpend = actualSpendFor(fulfillments);
  return {
    weekRef: input.weekRef,
    planned,
    actualSpend,
    quantityVariance: quantityVarianceFor(fulfillments),
    inventory,
    leftovers,
    stages: {
      planned: input.hasPlan,
      bought: fulfillments.length > 0,
      used: inventory.consumed.totalCount > 0 || leftovers.consumedServings > 0,
      discarded: inventory.discarded.totalCount > 0 || leftovers.discardedServings > 0,
    },
  };
}
