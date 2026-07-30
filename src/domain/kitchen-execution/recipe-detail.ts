import type { Dish } from "@/domain/types";
import type { LocalizedText } from "./index";
import type {
  CookingGuide,
  CookingStep,
  ResolvedCookingGuide,
} from "./cooking";

export interface DetailedCookingStep extends CookingStep {
  estimatedMin: number;
  sensoryCue: LocalizedText;
}

export interface DetailedCookingGuide {
  summary: LocalizedText;
  equipment: LocalizedText[];
  steps: DetailedCookingStep[];
}

export interface ResolvedDishCooking {
  resolved: ResolvedCookingGuide;
  inheritedFromDishId?: string;
}

const localized = (vi: string, en: string): LocalizedText => ({ vi, en });

const METHOD_SUMMARY: Record<Dish["method"], (name: string) => LocalizedText> = {
  kho: (name) => localized(
    `${name} được nấu theo nhịp kho sôi nhẹ để nguyên liệu chín đều và phần nước dần cô lại.`,
    `${name} follows a gentle braise so the ingredients cook evenly as the liquid gradually reduces.`,
  ),
  xao: (name) => localized(
    `${name} được chuẩn bị sẵn từng phần rồi xào theo thứ tự để nguyên liệu vừa chín mà không ra quá nhiều nước.`,
    `${name} is prepared in separate components, then stir-fried in order so the ingredients cook without releasing too much liquid.`,
  ),
  luoc: (name) => localized(
    `${name} dùng nhiệt ẩm ổn định; nguyên liệu được cho vào theo độ dày và kiểm tra trước khi dọn.`,
    `${name} uses steady moist heat; ingredients are added by thickness and checked before serving.`,
  ),
  hap: (name) => localized(
    `${name} chín bằng hơi nước ổn định, hạn chế đảo để giữ kết cấu và hương vị.`,
    `${name} cooks in steady steam with minimal handling to preserve texture and flavor.`,
  ),
  nuong: (name) => localized(
    `${name} được làm chín bằng nhiệt khô, trở hoặc xoay khi cần để bề mặt lên màu đều.`,
    `${name} cooks with dry heat, turning or rotating as needed for even browning.`,
  ),
  ran: (name) => localized(
    `${name} được làm chín trên chảo với nhiệt vừa, theo dõi bề mặt và phần dày nhất trước khi dọn.`,
    `${name} cooks in a pan over moderate heat, with both the surface and thickest part checked before serving.`,
  ),
  song: (name) => localized(
    `${name} là hướng dẫn chuẩn bị sạch để dùng tươi, không tạo bước nấu không có thật.`,
    `${name} is a clean fresh-preparation guide; it does not invent a cooking step.`,
  ),
};

const METHOD_EQUIPMENT: Record<Dish["method"], LocalizedText[]> = {
  kho: [
    localized("Nồi đáy dày có nắp", "Heavy-bottomed pot with lid"),
    localized("Muỗng hoặc vá chịu nhiệt", "Heat-safe spoon or ladle"),
  ],
  xao: [
    localized("Chảo rộng", "Wide pan or wok"),
    localized("Xẻng đảo chịu nhiệt", "Heat-safe turner"),
  ],
  luoc: [
    localized("Nồi có nắp", "Pot with lid"),
    localized("Vá hoặc kẹp sạch", "Clean ladle or tongs"),
  ],
  hap: [
    localized("Nồi và xửng hấp có nắp", "Pot and covered steamer"),
    localized("Kẹp hoặc găng cách nhiệt", "Tongs or heat-safe mitts"),
  ],
  nuong: [
    localized("Lò, nồi chiên hoặc vỉ nướng phù hợp", "Suitable oven, air fryer, or grill"),
    localized("Khay sạch cho món chín", "Clean tray for cooked food"),
  ],
  ran: [
    localized("Chảo đáy phẳng", "Flat-bottomed pan"),
    localized("Xẻng hoặc kẹp chịu nhiệt", "Heat-safe turner or tongs"),
  ],
  song: [
    localized("Dao và thớt sạch", "Clean knife and board"),
    localized("Đĩa hoặc hộp sạch để dùng ngay", "Clean plate or container for serving"),
  ],
};

const THERMOMETER = localized(
  "Nhiệt kế thực phẩm nếu hướng dẫn có điểm kiểm tra nhiệt",
  "Food thermometer when the guide includes a temperature check",
);

const PREP_IDS = new Set(["prep", "prepare", "season", "mix"]);
const WASH_IDS = new Set(["wash", "rinse"]);
const CUT_IDS = new Set(["cut", "slice", "portion"]);
const HEAT_IDS = new Set(["heat", "water", "broth", "boil"]);
const ACTIVE_COOK_IDS = new Set([
  "cook",
  "braise",
  "fry",
  "grill",
  "steam",
  "stir",
  "sear",
  "brown",
  "melon",
  "shrimp",
  "sauce",
]);
const FINISH_IDS = new Set(["finish", "serve", "drain", "rest"]);
const CHECK_IDS = new Set(["check"]);

function stepWeight(step: CookingStep): number {
  if (PREP_IDS.has(step.id) || WASH_IDS.has(step.id) || CUT_IDS.has(step.id)) return 2;
  if (HEAT_IDS.has(step.id)) return 2;
  if (ACTIVE_COOK_IDS.has(step.id)) return 5;
  if (FINISH_IDS.has(step.id)) return 2;
  if (CHECK_IDS.has(step.id)) return 1;
  return 3;
}

function allocateMinutes(guide: CookingGuide): number[] {
  const target = Math.max(guide.steps.length, guide.estimatedTotalMin);
  const weights = guide.steps.map(stepWeight);
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  const minutes = weights.map((weight) =>
    Math.max(1, Math.round((target * weight) / weightTotal)),
  );
  let delta = target - minutes.reduce((sum, value) => sum + value, 0);
  const longestIndex = weights.indexOf(Math.max(...weights));
  while (delta !== 0) {
    if (delta > 0) {
      minutes[longestIndex] += 1;
      delta -= 1;
    } else if (minutes[longestIndex] > 1) {
      minutes[longestIndex] -= 1;
      delta += 1;
    } else {
      break;
    }
  }
  return minutes;
}

function methodCue(method: Dish["method"]): LocalizedText {
  switch (method) {
    case "kho":
      return localized(
        "Nước kho sôi lăn tăn, phủ nguyên liệu và bắt đầu sánh nhưng chưa cạn.",
        "The braising liquid bubbles gently, coats the ingredients, and begins to thicken without drying out.",
      );
    case "xao":
      return localized(
        "Nguyên liệu bóng nhẹ, nóng đều và lượng hơi nước trong chảo đã giảm.",
        "The ingredients look lightly glossy, are heated through, and release less steam into the pan.",
      );
    case "luoc":
      return localized(
        "Nước trở lại mức sôi vừa; phần dày nhất đạt độ mềm hoặc độ chín được mô tả.",
        "The water returns to a moderate boil and the thickest part reaches the described tenderness or doneness.",
      );
    case "hap":
      return localized(
        "Hơi nước lên đều quanh thực phẩm; phần dày nhất đã chuyển trạng thái chín.",
        "Steam moves steadily around the food and the thickest part shows the cooked state.",
      );
    case "nuong":
      return localized(
        "Bề mặt lên màu đều, không cháy cạnh; phần dày nhất đã được kiểm tra.",
        "The surface is evenly browned without burnt edges and the thickest part has been checked.",
      );
    case "ran":
      return localized(
        "Bề mặt đã chắc và lên màu vừa; món tách khỏi chảo mà không còn phần lỏng sống.",
        "The surface is set and moderately browned; the food releases from the pan without a raw liquid center.",
      );
    case "song":
      return localized(
        "Bề mặt sạch, phần dập hỏng đã bỏ và dụng cụ dùng để chia phần còn sạch.",
        "The surface is clean, damaged areas are removed, and the portioning utensils remain clean.",
      );
  }
}

function sensoryCue(step: CookingStep, method: Dish["method"]): LocalizedText {
  if (CHECK_IDS.has(step.id)) {
    return localized(
      "Đạt cả dấu hiệu cảm quan trong bước này và điểm kiểm tra an toàn bên dưới.",
      "Both the sensory sign in this step and the safety check below are satisfied.",
    );
  }
  if (WASH_IDS.has(step.id)) {
    return localized(
      "Không còn đất hoặc cặn nhìn thấy; nguyên liệu đã để ráo trước bước tiếp theo.",
      "No visible soil or debris remains and the ingredient is drained before the next step.",
    );
  }
  if (CUT_IDS.has(step.id)) {
    return localized(
      "Các miếng có độ dày tương đối đều để nhận nhiệt cùng nhịp.",
      "Pieces are reasonably even in thickness so they take heat at a similar pace.",
    );
  }
  if (PREP_IDS.has(step.id)) {
    return localized(
      "Nguyên liệu đã sẵn theo thứ tự dùng; dụng cụ chạm thực phẩm sống được để riêng.",
      "Ingredients are arranged in use order and utensils that touched raw food are kept separate.",
    );
  }
  if (HEAT_IDS.has(step.id)) {
    return localized(
      "Nhiệt đã ổn định theo mô tả, không có dấu hiệu cháy hoặc bốc khói quá mức.",
      "Heat is steady as described, without burning or excessive smoking.",
    );
  }
  if (FINISH_IDS.has(step.id)) {
    return localized(
      "Món được chuyển sang dụng cụ sạch và giữ được kết cấu mong muốn trước khi dọn.",
      "The food moves to clean serving ware with the intended texture intact.",
    );
  }
  return methodCue(method);
}

export function detailedCookingGuide(
  dish: Pick<Dish, "vnName" | "enLabel" | "method">,
  guide: CookingGuide,
): DetailedCookingGuide {
  const minutes = allocateMinutes(guide);
  const nameVi = dish.vnName;
  const nameEn = dish.enLabel ?? dish.vnName;
  const summaryByMethodVi = METHOD_SUMMARY[dish.method](nameVi).vi;
  const summaryByMethodEn = METHOD_SUMMARY[dish.method](nameEn).en;
  const needsThermometer = guide.steps.some((step) =>
    step.safetyCheck?.vi.includes("°C"),
  );
  return {
    summary: localized(summaryByMethodVi, summaryByMethodEn),
    equipment: [
      ...METHOD_EQUIPMENT[dish.method],
      ...(needsThermometer ? [THERMOMETER] : []),
    ],
    steps: guide.steps.map((step, index) => ({
      ...step,
      estimatedMin: minutes[index],
      sensoryCue: sensoryCue(step, dish.method),
    })),
  };
}

function sameProcedureBasis(dish: Dish, source: Dish): boolean {
  if (
    dish.method !== source.method ||
    dish.slot !== source.slot ||
    dish.baseServings !== source.baseServings ||
    dish.lines.length !== source.lines.length
  ) return false;
  return dish.lines.every((line, index) => {
    const original = source.lines[index];
    return (
      original?.commodityId === line.commodityId &&
      original.qtyBase === line.qtyBase &&
      original.unit === line.unit
    );
  });
}

export function resolveDishCooking(
  dish: Dish,
  sourceDish: Dish | undefined,
  cookingGuideFor: (dishId: string) => ResolvedCookingGuide | undefined,
): ResolvedDishCooking | undefined {
  if (dish.origin === "B0") {
    const resolved = cookingGuideFor(dish.id);
    return resolved ? { resolved } : undefined;
  }
  if (
    !dish.sourceRepertoireId ||
    !sourceDish ||
    !sameProcedureBasis(dish, sourceDish)
  ) return undefined;
  const resolved = cookingGuideFor(sourceDish.id);
  return resolved
    ? { resolved, inheritedFromDishId: sourceDish.id }
    : undefined;
}
