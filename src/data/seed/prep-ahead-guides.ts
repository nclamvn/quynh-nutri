import type { KitchenGuideSource, LocalizedText } from "@/domain/kitchen-execution";
import {
  prepAheadGuideFor as resolvePrepAheadGuide,
  type PrepAheadGuide,
  type PrepAheadKind,
  type PrepAheadStep,
} from "@/domain/kitchen-execution/prep-ahead";
import { EXPANDED_PREP_AHEAD_GUIDES } from "./prep-ahead-guides-expanded";

const l = (vi: string, en: string): LocalizedText => ({ vi, en });
const reviewedAt = "2026-07-30";

export const PREP_AHEAD_SOURCES: KitchenGuideSource[] = [
  {
    id: "prep-fda-safe-handling",
    publisher: "U.S. Food and Drug Administration",
    title: l("Xử lý thực phẩm an toàn", "Safe Food Handling"),
    url: "https://www.fda.gov/food/buy-store-serve-safe-food/safe-food-handling",
    reviewedAt,
  },
  {
    id: "prep-fda-storage",
    publisher: "U.S. Food and Drug Administration",
    title: l("Bảo quản thực phẩm an toàn", "Are You Storing Food Safely?"),
    url: "https://www.fda.gov/consumers/consumer-updates/are-you-storing-food-safely",
    reviewedAt,
  },
  {
    id: "prep-fda-produce",
    publisher: "U.S. Food and Drug Administration",
    title: l("Chọn và dùng rau quả an toàn", "Selecting and Serving Produce Safely"),
    url: "https://www.fda.gov/food/buy-store-serve-safe-food/selecting-and-serving-produce-safely",
    reviewedAt,
  },
  {
    id: "prep-foodsafety-temperatures",
    publisher: "FoodSafety.gov",
    title: l("Nhiệt độ tâm an toàn tối thiểu", "Safe Minimum Internal Temperatures"),
    url: "https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures",
    reviewedAt,
  },
];

export const PREP_AHEAD_SOURCE_BY_ID = Object.fromEntries(
  PREP_AHEAD_SOURCES.map((source) => [source.id, source]),
) as Record<string, KitchenGuideSource>;

const SAFE = "prep-fda-safe-handling";
const STORE = "prep-fda-storage";
const PRODUCE = "prep-fda-produce";
const TEMP = "prep-foodsafety-temperatures";

const step = (
  id: string,
  kind: PrepAheadKind,
  title: LocalizedText,
  instruction: LocalizedText,
  sourceIds: string[],
  storageInstruction?: LocalizedText,
): PrepAheadStep => ({ id, kind, title, instruction, storageInstruction, sourceIds });

const gather = (dish: string, enDish: string) =>
  step(
    "gather",
    "gather",
    l("Gom nguyên liệu và dụng cụ", "Gather ingredients and tools"),
    l(
      `Đối chiếu công thức ${dish}; gom dụng cụ sạch và nguyên liệu còn nguyên bao gói.`,
      `Check the ${enDish} recipe; gather clean tools and ingredients still in their packaging.`,
    ),
    [SAFE],
  );

const measure = () =>
  step(
    "measure",
    "measure",
    l("Đong phần khô riêng", "Measure dry items separately"),
    l(
      "Có thể đong gia vị khô vào hộp sạch riêng; chưa trộn với thực phẩm sống.",
      "Dry seasonings may be measured into a separate clean container; do not mix them with raw food yet.",
    ),
    [SAFE],
  );

const separate = (rawVi: string, rawEn: string) =>
  step(
    "separate",
    "separate",
    l("Tách riêng đồ sống", "Separate raw food"),
    l(
      `Dành hộp, dao và thớt riêng cho ${rawVi}; không để chạm rau hoặc dụng cụ ăn chín.`,
      `Reserve a separate container, knife, and board for ${rawEn}; keep it away from produce and ready-to-eat utensils.`,
    ),
    [SAFE, STORE],
    l(
      "Giữ kín trong ngăn mát, đặt tách khỏi thực phẩm ăn liền.",
      "Keep covered in the refrigerator, separated from ready-to-eat food.",
    ),
  );

const marinate = (rawVi: string, rawEn: string) =>
  step(
    "marinate",
    "marinate-refrigerated",
    l("Ướp lạnh nếu chọn chuẩn bị trước", "Refrigerate if marinating ahead"),
    l(
      `Nếu chọn ướp ${rawVi} trước, dùng hộp sạch có nắp và đưa ngay vào ngăn mát. Nước ướp đã chạm đồ sống không dùng trực tiếp làm xốt.`,
      `If you choose to marinate ${rawEn} ahead, use a clean covered container and place it straight in the refrigerator. Do not use marinade that touched raw food directly as sauce.`,
    ),
    [SAFE, STORE],
    l(
      "Luôn ướp trong ngăn mát; giữ hộp kín và tách khỏi đồ ăn liền.",
      "Always marinate in the refrigerator; keep the container covered and separate from ready-to-eat food.",
    ),
  );

const produce = (itemVi: string, itemEn: string) =>
  step(
    "produce",
    "produce",
    l("Chuẩn bị rau củ an toàn", "Prepare produce safely"),
    l(
      `Loại phần dập hỏng của ${itemVi}, rửa dưới vòi nước sạch rồi làm ráo; không dùng xà phòng.`,
      `Remove damaged parts of ${itemEn}, rinse under clean running water, and dry; do not use soap.`,
    ),
    [PRODUCE],
    l(
      "Giữ trong hộp sạch có nắp ở ngăn mát, tách khỏi thực phẩm sống.",
      "Keep in a clean covered container in the refrigerator, separate from raw food.",
    ),
  );

const defer = (vi: string, en: string, sources = [SAFE]) =>
  step(
    "defer",
    "defer-until-cooking",
    l("Để lại đến lúc nấu", "Leave until cooking"),
    l(vi, en),
    sources,
  );

const guide = (
  dishId: string,
  dishVi: string,
  dishEn: string,
  extra: PrepAheadStep[],
  sourceIds: string[],
): PrepAheadGuide => ({
  id: `prep-${dishId}-v1`,
  dishId,
  reviewedAt,
  scope: "previous-evening",
  steps: [gather(dishVi, dishEn), measure(), ...extra],
  sourceIds: [...new Set([SAFE, ...sourceIds])],
});

const CORE_PREP_AHEAD_GUIDES: PrepAheadGuide[] = [
  guide("com_trang", "cơm trắng", "steamed rice", [
    defer(
      "Giữ gạo khô trong đồ chứa sạch; vo và nấu theo công thức khi bắt đầu bữa.",
      "Keep dry rice in a clean container; rinse and cook from the reviewed recipe when the meal starts.",
    ),
  ], [SAFE]),
  guide("thit_kho_trung", "thịt kho trứng", "pork and egg braise", [
    separate("thịt heo sống", "raw pork"),
    marinate("thịt heo", "pork"),
    defer(
      "Chưa nấu sơ thịt để cất lại. Luộc, bóc trứng và nấu món theo công thức khi bắt đầu nấu.",
      "Do not partially cook pork for later storage. Boil and peel eggs and cook the dish when cooking begins.",
      [SAFE, TEMP],
    ),
  ], [STORE, TEMP]),
  guide("ga_kho_gung", "gà kho gừng", "ginger chicken braise", [
    separate("gà sống", "raw chicken"),
    marinate("gà", "chicken"),
    defer(
      "Không rửa gà sống làm bắn nước; nấu chín hoàn toàn theo công thức đã rà soát.",
      "Do not splash-wash raw chicken; cook it fully with the reviewed recipe.",
      [SAFE, TEMP],
    ),
  ], [STORE, TEMP]),
  guide("ca_kho_to", "cá kho tộ", "clay-pot fish", [
    separate("cá sống", "raw fish"),
    marinate("cá", "fish"),
    defer(
      "Để việc nấu cá và kiểm tra độ chín đến lúc bắt đầu nấu.",
      "Leave cooking and doneness checks until cooking begins.",
      [TEMP],
    ),
  ], [STORE, TEMP]),
  guide("ca_chien_sot_ca", "cá chiên sốt cà", "fried fish with tomato sauce", [
    separate("cá sống", "raw fish"),
    produce("cà chua", "tomatoes"),
    defer(
      "Giữ cá sống nguyên trạng trong hộp kín; chỉ chiên và nấu sốt khi bắt đầu nấu.",
      "Keep raw fish covered and unchanged; fry it and cook the sauce only when cooking begins.",
      [SAFE, TEMP],
    ),
  ], [STORE, PRODUCE, TEMP]),
  guide("tom_rang", "tôm rang", "stir-fried shrimp", [
    separate("tôm sống", "raw shrimp"),
    defer(
      "Giữ tôm sống trong hộp kín ở ngăn mát; làm sạch và rang khi bắt đầu nấu.",
      "Keep raw shrimp covered in the refrigerator; clean and cook it when cooking begins.",
      [SAFE, STORE, TEMP],
    ),
  ], [STORE, TEMP]),
  guide("trung_chien", "trứng chiên", "omelet", [
    produce("hành", "onion"),
    defer(
      "Giữ trứng nguyên vỏ trong hộp tại ngăn mát; chỉ đập và đánh trứng khi bắt đầu nấu.",
      "Keep eggs uncracked in their carton in the refrigerator; crack and whisk only when cooking begins.",
      [STORE, TEMP],
    ),
  ], [STORE, PRODUCE, TEMP]),
  guide("rau_muong_xao_toi", "rau muống xào tỏi", "water spinach with garlic", [
    produce("rau muống", "water spinach"),
    defer(
      "Để việc băm tỏi và xào rau đến lúc bắt đầu nấu.",
      "Leave mincing garlic and stir-frying until cooking begins.",
      [PRODUCE],
    ),
  ], [PRODUCE]),
  guide("cai_ngot_luoc", "cải ngọt luộc", "boiled choy sum", [
    produce("cải ngọt", "choy sum"),
    defer(
      "Để việc cắt cọng và luộc rau đến lúc bắt đầu nấu.",
      "Leave cutting stems and boiling the greens until cooking begins.",
      [PRODUCE],
    ),
  ], [PRODUCE]),
  guide("bi_xanh_luoc", "bí xanh luộc", "boiled winter melon", [
    produce("bí xanh nguyên quả", "whole winter melon"),
    defer(
      "Chỉ gọt, cắt bí và luộc khi bắt đầu nấu.",
      "Peel, cut, and boil the winter melon only when cooking begins.",
      [PRODUCE],
    ),
  ], [PRODUCE]),
  guide("canh_bi_dao_tom", "canh bí đao tôm", "winter melon and shrimp soup", [
    produce("bí đao nguyên quả", "whole winter melon"),
    separate("tôm sống", "raw shrimp"),
    defer(
      "Chưa xử lý chung bí và tôm; chỉ gọt bí, làm tôm và nấu canh khi bắt đầu nấu.",
      "Do not handle melon and shrimp together; peel, clean shrimp, and cook the soup only when cooking begins.",
      [SAFE, PRODUCE, TEMP],
    ),
  ], [STORE, PRODUCE, TEMP]),
  guide("canh_rau_ngot_thit", "canh rau ngót thịt", "katuk and pork soup", [
    produce("rau ngót", "katuk leaves"),
    separate("thịt heo sống", "raw pork"),
    defer(
      "Chưa nấu sơ thịt để cất lại; nấu thịt và rau theo công thức khi bắt đầu nấu.",
      "Do not partially cook pork for later storage; cook the pork and leaves from the reviewed recipe when cooking begins.",
      [SAFE, TEMP],
    ),
  ], [STORE, PRODUCE, TEMP]),
];

export const PREP_AHEAD_GUIDES: PrepAheadGuide[] = [
  ...CORE_PREP_AHEAD_GUIDES,
  ...EXPANDED_PREP_AHEAD_GUIDES,
];

export const PREP_AHEAD_DISH_IDS = new Set(
  PREP_AHEAD_GUIDES.map((guideItem) => guideItem.dishId),
);

export const prepAheadGuideFor = (dishId: string) =>
  resolvePrepAheadGuide(dishId, PREP_AHEAD_GUIDES, PREP_AHEAD_SOURCE_BY_ID);
