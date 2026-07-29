import type { KitchenGuideSource, LocalizedText } from "@/domain/kitchen-execution";
import type { CookingGuide } from "@/domain/kitchen-execution/cooking";

const l = (vi: string, en: string): LocalizedText => ({ vi, en });
const step = (
  id: string,
  title: LocalizedText,
  instruction: LocalizedText,
  safetyCheck?: LocalizedText,
  sourceIds?: string[],
) => ({ id, title, instruction, safetyCheck, sourceIds });

export const COOKING_GUIDE_SOURCES: KitchenGuideSource[] = [
  {
    id: "foodsafety-safe-temperatures",
    publisher: "FoodSafety.gov",
    title: l("Nhiệt độ bên trong tối thiểu an toàn", "Safe Minimum Internal Temperatures"),
    url: "https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures",
    reviewedAt: "2026-07-29",
  },
  {
    id: "fda-safe-handling",
    publisher: "U.S. Food and Drug Administration",
    title: l("Xử lý thực phẩm an toàn", "Safe Food Handling"),
    url: "https://www.fda.gov/food/buy-store-serve-safe-food/safe-food-handling",
    reviewedAt: "2026-07-29",
  },
  {
    id: "fda-produce",
    publisher: "U.S. Food and Drug Administration",
    title: l("Chọn và dùng rau quả an toàn", "Selecting and Serving Produce Safely"),
    url: "https://www.fda.gov/food/buy-store-serve-safe-food/selecting-and-serving-produce-safely",
    reviewedAt: "2026-07-29",
  },
];

export const COOKING_GUIDE_SOURCE_BY_ID = Object.fromEntries(
  COOKING_GUIDE_SOURCES.map((source) => [source.id, source]),
);

const CLEAN = "fda-safe-handling";
const TEMP = "foodsafety-safe-temperatures";
const PRODUCE = "fda-produce";
const reviewedAt = "2026-07-29";

export const COOKING_GUIDES: CookingGuide[] = [
  {
    id: "cook-com-trang-v1",
    dishId: "com_trang",
    specificity: "dish",
    reviewedAt,
    servings: 4,
    estimatedTotalMin: 30,
    miseEnPlace: [
      l("Gạo, nước sạch, nồi có nắp.", "Rice, clean water, and a pot with a lid."),
      l("Rửa tay và làm sạch nồi, dụng cụ.", "Wash hands and clean the pot and utensils."),
    ],
    steps: [
      step("rinse", l("Vo gạo", "Rinse"), l("Nhặt dị vật nếu có; vo nhẹ và chắt nước đục.", "Remove any debris; rinse gently and drain the cloudy water.")),
      step("water", l("Thêm nước", "Add water"), l("Cho lượng nước phù hợp với loại gạo và hướng dẫn trên bao bì.", "Add water according to the rice variety and package directions.")),
      step("cook", l("Nấu chín", "Cook"), l("Đậy nắp, nấu đến khi nước được hấp thu và hạt cơm chín; tránh mở nắp liên tục.", "Cover and cook until the water is absorbed and the grains are cooked; avoid repeatedly lifting the lid.")),
      step("rest", l("Ủ và xới", "Rest and fluff"), l("Tắt nhiệt, để cơm ổn định trong nồi rồi xới tơi bằng dụng cụ sạch.", "Turn off the heat, let the rice settle in the covered pot, then fluff with a clean utensil.")),
    ],
    sourceIds: [CLEAN],
  },
  {
    id: "cook-thit-kho-trung-v1",
    dishId: "thit_kho_trung",
    specificity: "dish",
    reviewedAt,
    servings: 4,
    estimatedTotalMin: 45,
    miseEnPlace: [
      l("Thịt ba chỉ cắt miếng, trứng đã luộc và bóc vỏ, nước dừa, nước mắm, đường.", "Cut pork belly, boiled peeled eggs, coconut water, fish sauce, and sugar."),
      l("Dùng riêng thớt/dao cho thịt sống và thực phẩm đã chín.", "Use separate boards and knives for raw meat and cooked food."),
    ],
    steps: [
      step("season", l("Chuẩn bị thịt", "Prepare the pork"), l("Thấm khô thịt, trộn gia vị trong tô riêng; rửa tay và bề mặt sau khi chạm thịt sống.", "Pat the pork dry and season in a separate bowl; wash hands and surfaces after handling raw pork."), undefined, [CLEAN]),
      step("brown", l("Làm săn thịt", "Brown the pork"), l("Cho thịt vào nồi, đảo các mặt đến khi bề mặt săn lại.", "Cook the pork in the pot, turning until the surfaces are lightly browned.")),
      step("braise", l("Kho", "Braise"), l("Thêm nước dừa và phần gia vị; giữ sôi nhẹ đến khi thịt mềm, sau đó cho trứng vào để thấm.", "Add coconut water and seasoning; maintain a gentle simmer until the pork is tender, then add the eggs to absorb flavor.")),
      step("check", l("Kiểm tra trước khi ăn", "Check before serving"), l("Đo ở phần dày nhất, tránh chạm mỡ hoặc nồi.", "Measure at the thickest part, away from fat and the pot."), l("Thịt heo nguyên miếng đạt ít nhất 63°C và nghỉ 3 phút.", "Whole-cut pork reaches at least 63°C and rests for 3 minutes."), [TEMP]),
    ],
    sourceIds: [CLEAN, TEMP],
  },
  {
    id: "cook-ga-kho-gung-v1",
    dishId: "ga_kho_gung",
    specificity: "dish",
    reviewedAt,
    servings: 4,
    estimatedTotalMin: 35,
    miseEnPlace: [
      l("Gà cắt miếng, gừng thái sợi, nước mắm và đường.", "Chicken pieces, julienned ginger, fish sauce, and sugar."),
      l("Không rửa gà sống làm bắn nước; tách dụng cụ sống/chín.", "Do not splash-wash raw chicken; separate raw and cooked utensils."),
    ],
    steps: [
      step("prep", l("Chuẩn bị an toàn", "Prepare safely"), l("Thấm khô gà, trộn với gừng và gia vị trong tô riêng; làm sạch tay và bề mặt sau đó.", "Pat the chicken dry and combine with ginger and seasoning in a separate bowl; clean hands and surfaces afterward."), undefined, [CLEAN]),
      step("sear", l("Làm săn gà", "Sear"), l("Cho gà vào nồi, đảo để các mặt săn đều.", "Add chicken to the pot and turn so the surfaces cook evenly.")),
      step("braise", l("Kho nhỏ lửa", "Braise gently"), l("Thêm lượng nước vừa đủ, đậy hé và kho đến khi nước sánh, thịt chín đều.", "Add enough water, partially cover, and braise until the liquid reduces and the chicken cooks evenly.")),
      step("check", l("Đo nhiệt độ", "Check temperature"), l("Đo phần thịt dày nhất, tránh chạm xương.", "Measure the thickest part without touching bone."), l("Tất cả phần thịt gà đạt ít nhất 74°C.", "All chicken pieces reach at least 74°C."), [TEMP]),
    ],
    sourceIds: [CLEAN, TEMP],
  },
  {
    id: "cook-ca-kho-to-v1",
    dishId: "ca_kho_to",
    specificity: "dish",
    reviewedAt,
    servings: 4,
    estimatedTotalMin: 40,
    miseEnPlace: [
      l("Cá đã làm sạch, nước dừa, nước mắm và đường.", "Cleaned fish, coconut water, fish sauce, and sugar."),
      l("Tách cá sống khỏi rau và dụng cụ ăn chín.", "Keep raw fish separate from produce and ready-to-eat utensils."),
    ],
    steps: [
      step("prep", l("Chuẩn bị cá", "Prepare the fish"), l("Thấm khô cá và cho vào nồi sạch; rửa tay, dao và thớt sau khi xử lý cá sống.", "Pat the fish dry and place it in a clean pot; wash hands, knife, and board after handling raw fish."), undefined, [CLEAN]),
      step("sauce", l("Tạo nước kho", "Build the braising liquid"), l("Thêm nước dừa, nước mắm và đường; đưa hỗn hợp lên sôi nhẹ.", "Add coconut water, fish sauce, and sugar; bring the liquid to a gentle simmer.")),
      step("braise", l("Kho cá", "Braise"), l("Kho nhẹ, hạn chế đảo mạnh để cá không vỡ; rưới nước kho lên mặt cá.", "Braise gently and avoid vigorous stirring; spoon the liquid over the fish.")),
      step("check", l("Kiểm tra cá", "Check the fish"), l("Đo ở phần dày nhất hoặc kiểm tra thịt cá đã đục và tách dễ bằng nĩa.", "Measure the thickest part, or check that the flesh is opaque and separates easily with a fork."), l("Cá đạt ít nhất 63°C.", "Fish reaches at least 63°C."), [TEMP]),
    ],
    sourceIds: [CLEAN, TEMP],
  },
  {
    id: "cook-ca-chien-sot-ca-v1",
    dishId: "ca_chien_sot_ca",
    specificity: "dish",
    reviewedAt,
    servings: 4,
    estimatedTotalMin: 25,
    miseEnPlace: [
      l("Cá thấm khô, cà chua cắt nhỏ, dầu ăn.", "Patted-dry fish, chopped tomatoes, and cooking oil."),
      l("Chuẩn bị đĩa sạch riêng cho cá đã chín.", "Prepare a separate clean plate for cooked fish."),
    ],
    steps: [
      step("prep", l("Chuẩn bị riêng sống/chín", "Separate raw and cooked"), l("Xử lý cá trên thớt riêng; rửa tay và dụng cụ trước khi cắt cà chua.", "Handle fish on a separate board; wash hands and utensils before cutting tomatoes."), undefined, [CLEAN]),
      step("fry", l("Chiên cá", "Fry the fish"), l("Làm nóng dầu vừa phải, cho cá vào và trở khi mặt dưới đã chắc; đặt cá chín lên đĩa sạch.", "Heat the oil moderately, add fish, and turn once the underside is firm; move cooked fish to a clean plate.")),
      step("sauce", l("Nấu sốt cà", "Cook the tomato sauce"), l("Nấu cà chua đến khi mềm và tạo sốt; nêm theo khẩu vị rồi cho cá trở lại.", "Cook tomatoes until softened into a sauce; season to taste and return the fish.")),
      step("check", l("Kiểm tra cá", "Check the fish"), l("Đo phần dày nhất hoặc kiểm tra thịt đục và tách dễ bằng nĩa.", "Measure the thickest part, or check for opaque flesh that separates easily with a fork."), l("Cá đạt ít nhất 63°C.", "Fish reaches at least 63°C."), [TEMP]),
    ],
    sourceIds: [CLEAN, TEMP],
  },
  {
    id: "cook-tom-rang-v1",
    dishId: "tom_rang",
    specificity: "dish",
    reviewedAt,
    servings: 4,
    estimatedTotalMin: 20,
    miseEnPlace: [
      l("Tôm đã làm sạch và thấm khô, dầu ăn, gia vị.", "Cleaned, patted-dry shrimp, cooking oil, and seasoning."),
      l("Giữ tôm sống tách khỏi dụng cụ dùng để ăn.", "Keep raw shrimp separate from serving utensils."),
    ],
    steps: [
      step("prep", l("Chuẩn bị tôm", "Prepare shrimp"), l("Xử lý tôm trên dụng cụ riêng; rửa tay và bề mặt ngay sau đó.", "Handle shrimp with separate utensils; wash hands and surfaces immediately afterward."), undefined, [CLEAN]),
      step("heat", l("Làm nóng chảo", "Heat the pan"), l("Làm nóng chảo và dầu trước khi cho tôm vào để hạn chế ra nước.", "Heat the pan and oil before adding shrimp to reduce excess liquid.")),
      step("cook", l("Rang đều", "Cook evenly"), l("Đảo tôm thành một lớp tương đối đều, nêm theo khẩu vị và tiếp tục đảo đến khi chín.", "Spread shrimp in a fairly even layer, season to taste, and continue turning until cooked.")),
      step("check", l("Kiểm tra tôm", "Check shrimp"), l("Quan sát phần thịt dày nhất của tôm.", "Check the thickest part of the shrimp."), l("Thịt tôm chuyển trắng/ngọc trai và đục hoàn toàn.", "Shrimp flesh is pearly or white and fully opaque."), [TEMP]),
    ],
    sourceIds: [CLEAN, TEMP],
  },
  {
    id: "cook-trung-chien-v1",
    dishId: "trung_chien",
    specificity: "dish",
    reviewedAt,
    servings: 4,
    estimatedTotalMin: 10,
    miseEnPlace: [
      l("Trứng, hành tây cắt nhỏ và dầu ăn.", "Eggs, chopped onion, and cooking oil."),
      l("Đập trứng vào tô sạch; bỏ vỏ ngay và rửa tay.", "Crack eggs into a clean bowl; discard shells and wash hands."),
    ],
    steps: [
      step("mix", l("Đánh trứng", "Whisk eggs"), l("Đánh trứng với hành tây và gia vị đến khi hỗn hợp đồng nhất.", "Whisk eggs with onion and seasoning until evenly combined."), undefined, [CLEAN]),
      step("heat", l("Làm nóng chảo", "Heat the pan"), l("Làm nóng chảo với lượng dầu vừa đủ, sau đó hạ về nhiệt vừa.", "Heat the pan with enough oil, then reduce to medium heat.")),
      step("cook", l("Chiên chín hai mặt", "Cook through"), l("Đổ trứng, dàn đều; khi mặt dưới chắc thì trở hoặc gập để phần còn lỏng tiếp xúc nhiệt.", "Pour and spread the eggs; once the underside sets, turn or fold so the remaining liquid reaches the heat.")),
      step("check", l("Kiểm tra trứng", "Check eggs"), l("Kiểm tra cả phần giữa trước khi lấy khỏi chảo.", "Check the center before removing from the pan."), l("Lòng đỏ và lòng trắng phải chín chắc; món trứng đạt 71°C.", "Yolk and white are firm; egg dishes reach 71°C."), [TEMP]),
    ],
    sourceIds: [CLEAN, TEMP],
  },
  {
    id: "cook-rau-muong-xao-toi-v1",
    dishId: "rau_muong_xao_toi",
    specificity: "dish",
    reviewedAt,
    servings: 4,
    estimatedTotalMin: 12,
    miseEnPlace: [
      l("Rau muống nhặt, tỏi băm và dầu ăn.", "Trimmed water spinach, minced garlic, and cooking oil."),
      l("Rửa rau dưới vòi nước chảy; không dùng xà phòng.", "Rinse produce under running water; do not use soap."),
    ],
    steps: [
      step("wash", l("Rửa và để ráo", "Rinse and drain"), l("Rửa kỹ rau dưới vòi nước, bỏ phần dập hỏng và để thật ráo.", "Rinse thoroughly under running water, remove damaged parts, and drain well."), undefined, [PRODUCE]),
      step("heat", l("Phi tỏi", "Heat garlic"), l("Làm nóng chảo và dầu, cho tỏi vào đảo đến khi thơm nhưng chưa cháy.", "Heat the pan and oil; stir garlic until fragrant but not burnt.")),
      step("stir", l("Xào nhanh", "Stir-fry"), l("Cho rau vào, đảo từ phần cọng đến lá để chín tương đối đều; nêm theo khẩu vị.", "Add the vegetables, turning stems before leaves for more even cooking; season to taste.")),
      step("serve", l("Dùng dụng cụ sạch", "Serve cleanly"), l("Chuyển rau chín sang đĩa sạch, không đặt lại trên dụng cụ đã chạm thực phẩm sống.", "Move cooked vegetables to a clean plate; do not return them to utensils that touched raw foods."), undefined, [CLEAN]),
    ],
    sourceIds: [PRODUCE, CLEAN],
  },
  {
    id: "cook-cai-ngot-luoc-v1",
    dishId: "cai_ngot_luoc",
    specificity: "dish",
    reviewedAt,
    servings: 4,
    estimatedTotalMin: 10,
    miseEnPlace: [
      l("Cải ngọt nhặt và nước sạch.", "Trimmed choy sum and clean water."),
      l("Rửa rau dưới vòi nước chảy, bỏ phần dập hỏng.", "Rinse under running water and remove damaged parts."),
    ],
    steps: [
      step("wash", l("Rửa rau", "Rinse"), l("Tách cọng và lá lớn nếu cần, rửa kỹ dưới vòi nước rồi để ráo.", "Separate large stems and leaves if needed, rinse thoroughly under running water, and drain."), undefined, [PRODUCE]),
      step("boil", l("Đun nước", "Boil water"), l("Đun nồi nước sạch đến sôi trước khi cho rau vào.", "Bring a pot of clean water to a boil before adding the vegetables.")),
      step("cook", l("Luộc", "Cook"), l("Cho phần cọng dày vào trước, sau đó đến lá; đảo nhẹ để rau tiếp xúc nước nóng.", "Add thicker stems first, followed by leaves; turn gently so the vegetables contact the hot water.")),
      step("drain", l("Vớt và để ráo", "Drain"), l("Khi rau đạt độ mềm mong muốn, vớt bằng dụng cụ sạch và để ráo.", "When the vegetables reach the desired tenderness, remove with a clean utensil and drain.")),
    ],
    sourceIds: [PRODUCE, CLEAN],
  },
  {
    id: "cook-bi-xanh-luoc-v1",
    dishId: "bi_xanh_luoc",
    specificity: "dish",
    reviewedAt,
    servings: 4,
    estimatedTotalMin: 12,
    miseEnPlace: [
      l("Bí xanh, dao/thớt sạch và nước sạch.", "Winter melon, a clean knife and board, and clean water."),
      l("Rửa cả vỏ dưới vòi nước trước khi gọt/cắt.", "Rinse the rind under running water before peeling or cutting."),
    ],
    steps: [
      step("wash", l("Rửa trước khi cắt", "Rinse before cutting"), l("Rửa mặt ngoài dưới vòi nước để tránh đưa bẩn từ vỏ vào phần thịt khi cắt.", "Rinse the outside under running water so cutting does not carry debris into the flesh."), undefined, [PRODUCE]),
      step("cut", l("Gọt và cắt", "Peel and cut"), l("Gọt vỏ, bỏ ruột già nếu cần và cắt miếng tương đối đều.", "Peel, remove mature seeds if needed, and cut into fairly even pieces.")),
      step("boil", l("Luộc", "Boil"), l("Cho bí vào nước đang sôi và giữ sôi vừa đến khi miếng bí mềm theo ý.", "Add the melon to boiling water and maintain a moderate boil until the pieces reach the desired tenderness.")),
      step("serve", l("Vớt bằng dụng cụ sạch", "Serve cleanly"), l("Vớt bí, để ráo và chuyển sang đĩa sạch.", "Remove, drain, and transfer to a clean plate."), undefined, [CLEAN]),
    ],
    sourceIds: [PRODUCE, CLEAN],
  },
  {
    id: "cook-canh-bi-dao-tom-v1",
    dishId: "canh_bi_dao_tom",
    specificity: "dish",
    reviewedAt,
    servings: 4,
    estimatedTotalMin: 20,
    miseEnPlace: [
      l("Bí xanh cắt miếng, tôm làm sạch và nước dùng/nước sạch.", "Cut winter melon, cleaned shrimp, and stock or clean water."),
      l("Dùng thớt riêng cho tôm; rửa rau trước khi cắt.", "Use a separate board for shrimp; rinse produce before cutting."),
    ],
    steps: [
      step("prep", l("Chuẩn bị tách biệt", "Prepare separately"), l("Xử lý tôm riêng, sau đó rửa tay và dụng cụ; rửa bí dưới vòi nước trước khi gọt/cắt.", "Handle shrimp separately, then wash hands and utensils; rinse the melon under running water before peeling and cutting."), undefined, [CLEAN, PRODUCE]),
      step("broth", l("Đun nước canh", "Heat the broth"), l("Đưa nước dùng hoặc nước sạch lên sôi nhẹ, nêm nền vừa phải.", "Bring stock or clean water to a gentle boil and season lightly.")),
      step("melon", l("Nấu bí", "Cook the melon"), l("Cho bí vào trước và nấu đến khi gần đạt độ mềm mong muốn.", "Add winter melon first and cook until nearly at the desired tenderness.")),
      step("shrimp", l("Cho tôm", "Add shrimp"), l("Cho tôm vào, đảo nhẹ để chín đều rồi kiểm tra phần thịt dày nhất.", "Add shrimp, stir gently for even cooking, then check the thickest part."), l("Tôm phải chuyển trắng/ngọc trai và đục hoàn toàn.", "Shrimp must become pearly or white and fully opaque."), [TEMP]),
    ],
    sourceIds: [CLEAN, PRODUCE, TEMP],
  },
  {
    id: "cook-canh-rau-ngot-thit-v1",
    dishId: "canh_rau_ngot_thit",
    specificity: "dish",
    reviewedAt,
    servings: 4,
    estimatedTotalMin: 15,
    miseEnPlace: [
      l("Rau ngót đã nhặt, thịt heo băm và nước dùng/nước sạch.", "Trimmed katuk leaves, ground pork, and stock or clean water."),
      l("Tách thịt sống khỏi rau; rửa tay và dụng cụ sau khi xử lý.", "Keep raw meat separate from vegetables; wash hands and utensils after handling."),
    ],
    steps: [
      step("prep", l("Chuẩn bị riêng", "Prepare separately"), l("Rửa rau dưới vòi nước và để ráo. Xử lý thịt băm trên dụng cụ riêng.", "Rinse leaves under running water and drain. Handle ground pork with separate utensils."), undefined, [CLEAN, PRODUCE]),
      step("broth", l("Đun nước canh", "Heat the broth"), l("Đưa nước dùng hoặc nước sạch lên sôi nhẹ.", "Bring stock or clean water to a gentle boil.")),
      step("pork", l("Nấu thịt băm", "Cook the pork"), l("Cho thịt băm vào, tách các cụm lớn để nhiệt đi đều.", "Add ground pork and break up large clumps for even heating.")),
      step("greens", l("Cho rau", "Add greens"), l("Khi thịt gần chín, cho rau vào và đảo nhẹ; nêm theo khẩu vị.", "When the pork is nearly cooked, add the greens and stir gently; season to taste.")),
      step("check", l("Kiểm tra thịt", "Check the pork"), l("Đo ở phần thịt băm dày nhất trong nồi.", "Measure the thickest cluster of ground pork in the pot."), l("Thịt băm đạt ít nhất 71°C.", "Ground meat reaches at least 71°C."), [TEMP]),
    ],
    sourceIds: [CLEAN, PRODUCE, TEMP],
  },
];

export const cookingGuideFor = (dishId: string) => {
  const guide = COOKING_GUIDES.find((candidate) => candidate.dishId === dishId);
  if (!guide) return undefined;
  return {
    guide,
    sources: guide.sourceIds.flatMap((id) => {
      const source = COOKING_GUIDE_SOURCE_BY_ID[id];
      return source ? [source] : [];
    }),
  };
};
