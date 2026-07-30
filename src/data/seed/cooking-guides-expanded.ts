import type { CookingGuide, CookingStep } from "@/domain/kitchen-execution/cooking";
import type { LocalizedText } from "@/domain/kitchen-execution";

const CLEAN = "fda-safe-handling";
const TEMP = "foodsafety-safe-temperatures";
const PRODUCE = "fda-produce";
const reviewedAt = "2026-07-30";

const l = (vi: string, en: string): LocalizedText => ({ vi, en });

type SafetyProfile =
  | "whole-pork"
  | "ground-meat"
  | "whole-beef"
  | "poultry"
  | "fish"
  | "shellfish"
  | "egg-ground"
  | "shrimp-pork"
  | "produce"
  | "fruit";

interface ExpandedGuideSpec {
  dishId: string;
  viName: string;
  enName: string;
  minutes: number;
  miseVi: string;
  miseEn: string;
  prepareVi: string;
  prepareEn: string;
  cookVi: string;
  cookEn: string;
  finishVi: string;
  finishEn: string;
  safety: SafetyProfile;
  hasProduce?: boolean;
}

function safetyStep(profile: SafetyProfile): CookingStep | undefined {
  const common = {
    id: "check",
    title: l("Kiểm tra trước khi dọn", "Check before serving"),
    sourceIds: [TEMP],
  };
  if (profile === "whole-pork") {
    return {
      ...common,
      instruction: l("Đo ở phần thịt dày nhất, tránh chạm xương hoặc nồi.", "Measure the thickest part, away from bone or the cookware."),
      safetyCheck: l("Thịt heo nguyên miếng đạt ít nhất 63°C và nghỉ 3 phút.", "Whole-cut pork reaches at least 63°C and rests for 3 minutes."),
    };
  }
  if (profile === "whole-beef") {
    return {
      ...common,
      instruction: l("Đo ở phần thịt dày nhất trước khi dọn.", "Measure the thickest part before serving."),
      safetyCheck: l("Thịt bò nguyên miếng đạt ít nhất 63°C và nghỉ 3 phút.", "Whole-cut beef reaches at least 63°C and rests for 3 minutes."),
    };
  }
  if (profile === "ground-meat") {
    return {
      ...common,
      instruction: l("Đo ở cụm thịt băm dày nhất.", "Measure the thickest cluster of ground meat."),
      safetyCheck: l("Thịt băm đạt ít nhất 71°C.", "Ground meat reaches at least 71°C."),
    };
  }
  if (profile === "poultry") {
    return {
      ...common,
      instruction: l("Đo phần thịt gà dày nhất, tránh chạm xương.", "Measure the thickest chicken portion without touching bone."),
      safetyCheck: l("Tất cả phần thịt gà đạt ít nhất 74°C.", "All chicken portions reach at least 74°C."),
    };
  }
  if (profile === "fish") {
    return {
      ...common,
      instruction: l("Đo phần dày nhất hoặc kiểm tra thịt cá đã đục và tách dễ bằng nĩa.", "Measure the thickest part, or check that the flesh is opaque and separates easily with a fork."),
      safetyCheck: l("Cá đạt ít nhất 63°C.", "Fish reaches at least 63°C."),
    };
  }
  if (profile === "shellfish") {
    return {
      ...common,
      instruction: l("Kiểm tra phần thịt dày nhất của tôm hoặc cua/ghẹ.", "Check the thickest part of the shrimp or crab."),
      safetyCheck: l("Thịt chuyển trắng hoặc ánh ngọc trai và đục hoàn toàn.", "The flesh becomes pearly or white and fully opaque."),
    };
  }
  if (profile === "egg-ground") {
    return {
      ...common,
      instruction: l("Đo ở tâm phần nhân dày nhất và kiểm tra trứng đã đông chắc.", "Measure the center of the thickest filling and check that the egg is fully set."),
      safetyCheck: l("Thịt băm và món trứng đạt ít nhất 71°C.", "Ground meat and egg dishes reach at least 71°C."),
    };
  }
  if (profile === "shrimp-pork") {
    return {
      ...common,
      instruction: l("Đo phần thịt heo dày nhất và kiểm tra phần thịt tôm.", "Measure the thickest pork portion and inspect the shrimp flesh."),
      safetyCheck: l("Thịt heo đạt ít nhất 63°C và nghỉ 3 phút; tôm trắng/ngọc trai và đục hoàn toàn.", "Pork reaches at least 63°C and rests for 3 minutes; shrimp is pearly or white and fully opaque."),
    };
  }
  return undefined;
}

function expandedGuide(spec: ExpandedGuideSpec): CookingGuide {
  const isRaw = !["produce", "fruit"].includes(spec.safety);
  const sourceIds = [
    CLEAN,
    ...(spec.hasProduce || spec.safety === "produce" || spec.safety === "fruit" ? [PRODUCE] : []),
    ...(isRaw ? [TEMP] : []),
  ];
  const steps: CookingStep[] = [
    {
      id: "prepare",
      title: l("Chuẩn bị", "Prepare"),
      instruction: l(spec.prepareVi, spec.prepareEn),
      sourceIds: [CLEAN, ...(spec.hasProduce || !isRaw ? [PRODUCE] : [])],
    },
    {
      id: "cook",
      title: l(spec.safety === "fruit" ? "Cắt và chia phần" : "Nấu món", spec.safety === "fruit" ? "Cut and portion" : "Cook the dish"),
      instruction: l(spec.cookVi, spec.cookEn),
    },
    {
      id: "finish",
      title: l(spec.safety === "fruit" ? "Dọn bằng dụng cụ sạch" : "Hoàn thiện", spec.safety === "fruit" ? "Serve with clean utensils" : "Finish"),
      instruction: l(spec.finishVi, spec.finishEn),
      sourceIds: [CLEAN],
    },
  ];
  const check = safetyStep(spec.safety);
  if (check) steps.push(check);
  return {
    id: `cook-${spec.dishId.replaceAll("_", "-")}-v1`,
    dishId: spec.dishId,
    specificity: "dish",
    reviewedAt,
    servings: 4,
    estimatedTotalMin: spec.minutes,
    miseEnPlace: [
      l(spec.miseVi, spec.miseEn),
      isRaw
        ? l("Dành riêng dụng cụ cho thực phẩm sống và đĩa sạch cho món chín.", "Reserve utensils for raw food and a clean plate for the cooked dish.")
        : l("Rửa tay, mặt bàn và dụng cụ trước khi bắt đầu.", "Wash hands, the work surface, and utensils before starting."),
    ],
    steps,
    sourceIds: [...new Set(sourceIds)],
  };
}

const SPECS: ExpandedGuideSpec[] = [
  {
    dishId: "ba_chi_luoc", viName: "ba chỉ luộc mắm tôm", enName: "boiled pork belly",
    minutes: 35, miseVi: "Ba chỉ nguyên miếng, nước sạch và phần nước chấm để riêng.", miseEn: "A whole piece of pork belly, clean water, and dipping sauce kept separate.",
    prepareVi: "Thấm khô thịt; không rửa dưới vòi nước. Rửa tay và bề mặt sau khi chạm thịt sống.", prepareEn: "Pat the pork dry; do not rinse it under running water. Wash hands and surfaces after handling raw pork.",
    cookVi: "Cho thịt vào nồi nước sạch, đưa lên sôi rồi giữ sôi vừa để phần dày chín đều.", cookEn: "Place pork in clean water, bring to a boil, then maintain a moderate boil so the thick section cooks evenly.",
    finishVi: "Gắp thịt sang thớt sạch, để nghỉ rồi thái; không để nước chấm chạm dụng cụ sống.", finishEn: "Move pork to a clean board, rest, then slice; keep dipping sauce away from raw-food utensils.",
    safety: "whole-pork",
  },
  {
    dishId: "suon_xao_chua_ngot", viName: "sườn xào chua ngọt", enName: "sweet-and-sour pork ribs",
    minutes: 40, miseVi: "Sườn heo, cà chua, hành tây, đường và dầu.", miseEn: "Pork ribs, tomatoes, onion, sugar, and oil.",
    prepareVi: "Thấm khô sườn trên dụng cụ riêng; rửa cà chua và hành tây dưới vòi nước trước khi cắt.", prepareEn: "Pat ribs dry on separate utensils; rinse tomatoes and onion under running water before cutting.",
    cookVi: "Làm săn sườn, sau đó thêm phần rau và sốt chua ngọt; đảo để sốt phủ đều.", cookEn: "Brown the ribs, then add the vegetables and sweet-and-sour sauce; turn to coat evenly.",
    finishVi: "Giữ sôi nhẹ đến khi sốt sánh và phần thịt sát xương chín đều.", finishEn: "Maintain a gentle simmer until the sauce thickens and the meat near the bone cooks evenly.",
    safety: "whole-pork", hasProduce: true,
  },
  {
    dishId: "suon_nuong", viName: "sườn nướng", enName: "grilled pork ribs",
    minutes: 45, miseVi: "Sườn heo, nước mắm, đường và khay sạch.", miseEn: "Pork ribs, fish sauce, sugar, and a clean tray.",
    prepareVi: "Ướp sườn trong ngăn mát; không dùng trực tiếp phần nước ướp đã chạm thịt sống để quét sau cùng.", prepareEn: "Marinate ribs in the refrigerator; do not directly reuse marinade that touched raw pork as a finishing glaze.",
    cookVi: "Nướng sườn, trở đều và chỉ quét bằng phần sốt sạch đã để riêng.", cookEn: "Grill the ribs, turning evenly and basting only with sauce reserved before raw-food contact.",
    finishVi: "Chuyển sườn chín sang khay sạch, không dùng lại khay đựng sườn sống.", finishEn: "Transfer cooked ribs to a clean tray; do not reuse the raw-rib tray.",
    safety: "whole-pork",
  },
  {
    dishId: "thit_bam_xao_muop", viName: "thịt băm xào mướp", enName: "stir-fried minced pork with luffa",
    minutes: 20, miseVi: "Thịt heo băm, mướp và dầu.", miseEn: "Ground pork, luffa, and oil.",
    prepareVi: "Xử lý thịt băm riêng; rửa vỏ mướp dưới vòi nước trước khi gọt và cắt.", prepareEn: "Handle ground pork separately; rinse the luffa under running water before peeling and cutting.",
    cookVi: "Xào thịt, tách các cụm lớn; khi thịt gần chín mới cho mướp vào.", cookEn: "Stir-fry the pork and break up large clumps; add luffa when the meat is nearly cooked.",
    finishVi: "Đảo đến khi mướp vừa mềm và nước trong chảo sôi đều.", finishEn: "Cook until the luffa is tender and the pan liquid is bubbling evenly.",
    safety: "ground-meat", hasProduce: true,
  },
  {
    dishId: "bo_xao_can", viName: "bò xào cần tây", enName: "stir-fried beef with celery",
    minutes: 20, miseVi: "Thịt bò thái miếng, cần tây, hành tây và dầu.", miseEn: "Sliced beef, celery, onion, and oil.",
    prepareVi: "Thấm khô thịt bò; rửa cần tây và hành tây dưới vòi nước rồi cắt trên thớt sạch.", prepareEn: "Pat beef dry; rinse celery and onion under running water and cut them on a clean board.",
    cookVi: "Xào bò thành lớp mỏng, sau đó cho rau vào và đảo nhanh để nhiệt phân bố đều.", cookEn: "Stir-fry beef in a thin layer, then add the vegetables and toss quickly for even heat.",
    finishVi: "Dọn ngay trên đĩa sạch khi rau vừa chín tới.", finishEn: "Serve immediately on a clean plate when the vegetables are just tender.",
    safety: "whole-beef", hasProduce: true,
  },
  {
    dishId: "bo_kho", viName: "bò kho", enName: "Vietnamese beef stew",
    minutes: 90, miseVi: "Thịt bò cắt miếng, cà chua, hành tây, dầu và nước sạch.", miseEn: "Cubed beef, tomatoes, onion, oil, and clean water.",
    prepareVi: "Thấm khô thịt bò; rửa cà chua và hành tây dưới vòi nước trên dụng cụ riêng.", prepareEn: "Pat beef dry; rinse tomatoes and onion under running water using separate utensils.",
    cookVi: "Làm săn thịt, thêm rau và nước; đưa lên sôi rồi hạ nhỏ lửa.", cookEn: "Brown the beef, add vegetables and water, bring to a boil, then reduce to a gentle simmer.",
    finishVi: "Hầm đến khi thịt mềm và nước dùng sánh theo ý.", finishEn: "Stew until the beef is tender and the broth reaches the desired body.",
    safety: "whole-beef", hasProduce: true,
  },
  {
    dishId: "bo_luc_lac", viName: "bò lúc lắc", enName: "shaking beef",
    minutes: 20, miseVi: "Thịt bò cắt khối, hành tây và dầu.", miseEn: "Cubed beef, onion, and oil.",
    prepareVi: "Thấm khô thịt bò; rửa hành tây dưới vòi nước rồi cắt bằng dụng cụ sạch.", prepareEn: "Pat beef dry; rinse onion under running water and cut it with clean utensils.",
    cookVi: "Áp chảo bò thành một lớp, lắc hoặc trở để các mặt tiếp xúc nhiệt.", cookEn: "Sear beef in a single layer, shaking or turning so all sides contact the heat.",
    finishVi: "Cho hành tây vào cuối, đảo đến độ chín mong muốn rồi chuyển sang đĩa sạch.", finishEn: "Add onion near the end, cook to the desired tenderness, and transfer to a clean plate.",
    safety: "whole-beef", hasProduce: true,
  },
  {
    dishId: "ga_luoc", viName: "gà luộc", enName: "poached chicken",
    minutes: 45, miseVi: "Gà, nước sạch, nồi đủ lớn và đĩa sạch.", miseEn: "Chicken, clean water, a sufficiently large pot, and a clean plate.",
    prepareVi: "Không rửa gà sống; thấm khô nếu cần và làm sạch tay, bề mặt sau khi chạm gà.", prepareEn: "Do not wash raw chicken; pat dry if needed and clean hands and surfaces after contact.",
    cookVi: "Cho gà vào nồi, đưa nước lên sôi rồi giữ sôi nhẹ để nhiệt đi đều vào phần dày.", cookEn: "Place chicken in the pot, bring the water to a boil, then keep a gentle boil so heat reaches the thick portions evenly.",
    finishVi: "Gắp gà bằng dụng cụ sạch và đặt lên đĩa chưa từng đựng gà sống.", finishEn: "Lift chicken with clean utensils onto a plate that never held raw chicken.",
    safety: "poultry",
  },
  {
    dishId: "ga_rang_muoi", viName: "gà rang muối", enName: "salt-fried chicken",
    minutes: 30, miseVi: "Gà cắt miếng, hỗn hợp muối rang, dầu và đĩa sạch.", miseEn: "Chicken pieces, toasted salt mixture, oil, and a clean plate.",
    prepareVi: "Không rửa gà sống; xử lý trên thớt riêng rồi làm sạch tay và bề mặt.", prepareEn: "Do not wash raw chicken; handle it on a separate board, then clean hands and surfaces.",
    cookVi: "Chiên hoặc áp chảo gà theo mẻ để các miếng tiếp xúc nhiệt đều.", cookEn: "Fry or pan-cook chicken in batches so the pieces heat evenly.",
    finishVi: "Đảo gà chín với hỗn hợp muối bằng chảo và dụng cụ sạch.", finishEn: "Toss the cooked chicken with the salt mixture using a clean pan and utensils.",
    safety: "poultry",
  },
  {
    dishId: "ga_kho_nuoc_dua", viName: "gà kho nước dừa", enName: "coconut-braised chicken",
    minutes: 40, miseVi: "Gà cắt miếng, nước dừa, nước mắm và đường.", miseEn: "Chicken pieces, coconut water, fish sauce, and sugar.",
    prepareVi: "Không rửa gà sống; thấm khô và trộn gia vị trong hộp riêng.", prepareEn: "Do not wash raw chicken; pat dry and season in a separate container.",
    cookVi: "Làm săn gà, thêm nước dừa và giữ sôi nhẹ để các miếng chín đều.", cookEn: "Brown chicken, add coconut water, and maintain a gentle simmer so all pieces cook evenly.",
    finishVi: "Kho đến khi nước sánh và chuyển gà sang dụng cụ sạch.", finishEn: "Braise until the liquid thickens and transfer chicken with clean utensils.",
    safety: "poultry",
  },
  {
    dishId: "ca_nuong", viName: "cá nướng", enName: "grilled fish",
    minutes: 30, miseVi: "Cá thu, nước mắm và khay sạch.", miseEn: "Mackerel, fish sauce, and a clean tray.",
    prepareVi: "Không rửa cá làm bắn nước; thấm khô và ướp trong ngăn mát.", prepareEn: "Do not splash-wash fish; pat dry and marinate in the refrigerator.",
    cookVi: "Nướng cá, trở khi mặt dưới đã chắc và dùng phần sốt sạch để quét nếu cần.", cookEn: "Grill fish, turning once the underside is firm and using clean reserved sauce if basting.",
    finishVi: "Chuyển cá chín sang khay sạch, không dùng lại dụng cụ chạm cá sống.", finishEn: "Transfer cooked fish to a clean tray and do not reuse utensils that touched raw fish.",
    safety: "fish",
  },
  {
    dishId: "ca_hap_xi_dau", viName: "cá hấp xì dầu", enName: "soy-steamed fish",
    minutes: 30, miseVi: "Cá diêu hồng, gừng, xì dầu và đĩa hấp.", miseEn: "Tilapia, ginger, soy sauce, and a steaming plate.",
    prepareVi: "Thấm khô cá; rửa gừng dưới vòi nước trước khi gọt/cắt bằng dụng cụ sạch.", prepareEn: "Pat fish dry; rinse ginger under running water before peeling or cutting with clean utensils.",
    cookVi: "Đặt cá lên đĩa hấp, thêm gừng và xì dầu; hấp có nắp để hơi nóng bao quanh.", cookEn: "Place fish on the steaming plate with ginger and soy sauce; cover so steam surrounds the fish.",
    finishVi: "Mở nắp tránh hơi nóng và dùng dụng cụ sạch để chuyển cá.", finishEn: "Open the lid away from steam and transfer fish with clean utensils.",
    safety: "fish", hasProduce: true,
  },
  {
    dishId: "tom_rim_thit", viName: "tôm rim thịt ba chỉ", enName: "braised shrimp and pork belly",
    minutes: 30, miseVi: "Tôm, ba chỉ, nước mắm và đường.", miseEn: "Shrimp, pork belly, fish sauce, and sugar.",
    prepareVi: "Xử lý tôm và thịt trên dụng cụ riêng; rửa tay và bề mặt sau đó.", prepareEn: "Handle shrimp and pork with separate utensils; wash hands and surfaces afterward.",
    cookVi: "Làm săn thịt trước, sau đó cho tôm và sốt vào để các phần chín đều.", cookEn: "Brown the pork first, then add shrimp and sauce so each component cooks evenly.",
    finishVi: "Rim đến khi sốt bám đều và cả tôm lẫn thịt chín.", finishEn: "Braise until the sauce coats evenly and both shrimp and pork are cooked.",
    safety: "shrimp-pork",
  },
  {
    dishId: "tom_hap", viName: "tôm hấp", enName: "steamed shrimp",
    minutes: 15, miseVi: "Tôm, xửng hấp và đĩa sạch.", miseEn: "Shrimp, a steamer, and a clean plate.",
    prepareVi: "Xử lý tôm trên dụng cụ riêng; làm sạch tay và bề mặt sau đó.", prepareEn: "Handle shrimp with separate utensils; clean hands and surfaces afterward.",
    cookVi: "Xếp tôm thành lớp tương đối đều và hấp có nắp để hơi nóng lưu thông.", cookEn: "Arrange shrimp in a fairly even layer and steam covered so heat circulates.",
    finishVi: "Gắp tôm bằng dụng cụ sạch sang đĩa chưa chạm tôm sống.", finishEn: "Move shrimp with clean utensils to a plate that did not hold raw shrimp.",
    safety: "shellfish",
  },
  {
    dishId: "ghe_hap", viName: "ghẹ hấp", enName: "steamed crab",
    minutes: 20, miseVi: "Ghẹ sống, xửng hấp và khay sạch.", miseEn: "Live crab, a steamer, and a clean tray.",
    prepareVi: "Giữ ghẹ sống tách khỏi thực phẩm ăn liền; làm sạch tay và bề mặt sau khi xử lý.", prepareEn: "Keep live crab separate from ready-to-eat food; clean hands and surfaces after handling.",
    cookVi: "Xếp ghẹ trong xửng và hấp có nắp để hơi nóng tiếp xúc đều.", cookEn: "Arrange crab in the steamer and cover so steam reaches it evenly.",
    finishVi: "Chuyển ghẹ chín sang khay sạch bằng kẹp sạch.", finishEn: "Transfer cooked crab to a clean tray with clean tongs.",
    safety: "shellfish",
  },
  {
    dishId: "cua_rang_me", viName: "ghẹ rang me", enName: "tamarind crab",
    minutes: 30, miseVi: "Ghẹ, me chua, đường, dầu và chảo sạch.", miseEn: "Crab, tamarind, sugar, oil, and a clean pan.",
    prepareVi: "Xử lý ghẹ riêng; pha sốt me trong tô sạch không chạm hải sản sống.", prepareEn: "Handle crab separately; mix tamarind sauce in a clean bowl away from raw seafood.",
    cookVi: "Làm chín ghẹ trong chảo, sau đó thêm sốt me và đảo để phủ đều.", cookEn: "Cook crab in the pan, then add tamarind sauce and turn to coat evenly.",
    finishVi: "Giữ sốt sôi nhẹ trước khi chuyển món sang đĩa sạch.", finishEn: "Keep the sauce gently bubbling before transferring the dish to a clean plate.",
    safety: "shellfish",
  },
  {
    dishId: "trung_hap_thit", viName: "trứng hấp thịt", enName: "steamed egg with minced pork",
    minutes: 25, miseVi: "Trứng, thịt heo băm, tô hấp và xửng.", miseEn: "Eggs, ground pork, a steaming bowl, and a steamer.",
    prepareVi: "Xử lý thịt băm riêng; đập trứng vào tô sạch và rửa tay sau khi bỏ vỏ.", prepareEn: "Handle ground pork separately; crack eggs into a clean bowl and wash hands after discarding shells.",
    cookVi: "Trộn thịt và trứng, chia đều trong tô rồi hấp có nắp.", cookEn: "Combine pork and eggs, spread evenly in the bowl, and steam covered.",
    finishVi: "Để hơi nóng thoát khỏi mặt trước khi kiểm tra phần giữa.", finishEn: "Let steam escape away from your face before checking the center.",
    safety: "egg-ground",
  },
  {
    dishId: "dau_hu_sot_ca", viName: "đậu hũ nhồi thịt sốt cà", enName: "pork-stuffed tofu in tomato sauce",
    minutes: 35, miseVi: "Đậu hũ, thịt heo băm, cà chua và dầu.", miseEn: "Tofu, ground pork, tomatoes, and oil.",
    prepareVi: "Nhồi thịt bằng dụng cụ riêng; rửa cà chua dưới vòi nước trước khi cắt.", prepareEn: "Stuff tofu using separate utensils; rinse tomatoes under running water before cutting.",
    cookVi: "Áp chảo phần đậu nhồi, sau đó cho vào sốt cà đang sôi nhẹ.", cookEn: "Pan-cook the stuffed tofu, then place it in gently simmering tomato sauce.",
    finishVi: "Đậy nắp để nhiệt vào đều phần nhân, sau đó chuyển sang đĩa sạch.", finishEn: "Cover so heat reaches the filling evenly, then transfer to a clean plate.",
    safety: "ground-meat", hasProduce: true,
  },
  {
    dishId: "bong_cai_xao", viName: "bông cải xào", enName: "stir-fried broccoli",
    minutes: 15, miseVi: "Bông cải, dầu, dao và chảo sạch.", miseEn: "Broccoli, oil, a clean knife, and pan.",
    prepareVi: "Rửa bông cải dưới vòi nước, bỏ phần hỏng và cắt miếng đều; không dùng xà phòng.", prepareEn: "Rinse broccoli under running water, remove damaged parts, and cut evenly; do not use soap.",
    cookVi: "Xào bông cải trên chảo nóng, đảo để các mặt tiếp xúc nhiệt.", cookEn: "Stir-fry broccoli in a hot pan, turning so all sides contact the heat.",
    finishVi: "Dọn bằng dụng cụ sạch khi bông cải đạt độ mềm mong muốn.", finishEn: "Serve with clean utensils when the broccoli reaches the desired tenderness.",
    safety: "produce",
  },
  {
    dishId: "gia_do_xao", viName: "giá đỗ xào", enName: "stir-fried bean sprouts",
    minutes: 10, miseVi: "Giá đỗ, dầu và chảo sạch.", miseEn: "Bean sprouts, oil, and a clean pan.",
    prepareVi: "Loại phần hỏng, rửa giá dưới vòi nước và để ráo; không dùng xà phòng.", prepareEn: "Remove damaged sprouts, rinse under running water, and drain; do not use soap.",
    cookVi: "Xào giá trên chảo nóng và đảo để toàn bộ giá tiếp xúc nhiệt.", cookEn: "Stir-fry sprouts in a hot pan, turning so all sprouts contact the heat.",
    finishVi: "Dọn bằng dụng cụ sạch khi giá đã nóng đều và đạt độ mềm mong muốn.", finishEn: "Serve with clean utensils when the sprouts are heated through and reach the desired tenderness.",
    safety: "produce",
  },
  {
    dishId: "rau_lang_luoc", viName: "rau lang luộc", enName: "boiled sweet-potato greens",
    minutes: 12, miseVi: "Rau lang, nước sạch và nồi.", miseEn: "Sweet-potato greens, clean water, and a pot.",
    prepareVi: "Nhặt phần hỏng, rửa rau dưới vòi nước và để ráo; không dùng xà phòng.", prepareEn: "Remove damaged parts, rinse greens under running water, and drain; do not use soap.",
    cookVi: "Cho cọng dày vào nước sôi trước, sau đó cho lá và đảo nhẹ.", cookEn: "Add thicker stems to boiling water first, then leaves, and turn gently.",
    finishVi: "Vớt bằng dụng cụ sạch khi rau đạt độ mềm mong muốn.", finishEn: "Remove with clean utensils when the greens reach the desired tenderness.",
    safety: "produce",
  },
  {
    dishId: "su_su_luoc", viName: "su su luộc", enName: "boiled chayote",
    minutes: 15, miseVi: "Su su, nước sạch, dao và nồi.", miseEn: "Chayote, clean water, a knife, and pot.",
    prepareVi: "Rửa vỏ su su dưới vòi nước trước khi gọt/cắt; không dùng xà phòng.", prepareEn: "Rinse chayote under running water before peeling or cutting; do not use soap.",
    cookVi: "Cắt miếng đều rồi cho vào nước đang sôi.", cookEn: "Cut into even pieces and add to boiling water.",
    finishVi: "Vớt và để ráo bằng dụng cụ sạch khi su su vừa mềm.", finishEn: "Remove and drain with clean utensils when the chayote is tender.",
    safety: "produce",
  },
  {
    dishId: "mong_toi_luoc", viName: "mồng tơi luộc", enName: "boiled Malabar spinach",
    minutes: 10, miseVi: "Mồng tơi, nước sạch và nồi.", miseEn: "Malabar spinach, clean water, and a pot.",
    prepareVi: "Nhặt phần hỏng, rửa lá dưới vòi nước và để ráo; không dùng xà phòng.", prepareEn: "Remove damaged parts, rinse leaves under running water, and drain; do not use soap.",
    cookVi: "Cho rau vào nước sôi, đảo nhẹ để lá tiếp xúc nhiệt.", cookEn: "Add greens to boiling water and turn gently so the leaves contact the heat.",
    finishVi: "Vớt bằng dụng cụ sạch khi rau đạt độ mềm mong muốn.", finishEn: "Remove with clean utensils when the greens reach the desired tenderness.",
    safety: "produce",
  },
  {
    dishId: "rau_muong_luoc", viName: "rau muống luộc", enName: "boiled water spinach",
    minutes: 12, miseVi: "Rau muống, nước sạch và nồi.", miseEn: "Water spinach, clean water, and a pot.",
    prepareVi: "Nhặt phần hỏng, rửa rau dưới vòi nước và để ráo; không dùng xà phòng.", prepareEn: "Remove damaged parts, rinse under running water, and drain; do not use soap.",
    cookVi: "Cho cọng dày vào nước sôi trước rồi đến phần ngọn.", cookEn: "Add thicker stems to boiling water first, followed by the tender tips.",
    finishVi: "Vớt bằng dụng cụ sạch khi rau đạt độ mềm mong muốn.", finishEn: "Remove with clean utensils when the greens reach the desired tenderness.",
    safety: "produce",
  },
  {
    dishId: "cai_ngot_xao", viName: "cải ngọt xào", enName: "stir-fried choy sum",
    minutes: 12, miseVi: "Cải ngọt, dầu và chảo sạch.", miseEn: "Choy sum, oil, and a clean pan.",
    prepareVi: "Rửa cải dưới vòi nước, bỏ phần hỏng và để ráo; không dùng xà phòng.", prepareEn: "Rinse choy sum under running water, remove damaged parts, and drain; do not use soap.",
    cookVi: "Xào phần cọng trước, sau đó cho lá và đảo để nhiệt đi đều.", cookEn: "Stir-fry stems first, then add leaves and turn for even heating.",
    finishVi: "Dọn bằng dụng cụ sạch khi cải đạt độ mềm mong muốn.", finishEn: "Serve with clean utensils when the greens reach the desired tenderness.",
    safety: "produce",
  },
  {
    dishId: "canh_cai_thit", viName: "canh cải thịt băm", enName: "choy-sum soup with minced pork",
    minutes: 18, miseVi: "Cải ngọt, thịt heo băm và nước sạch.", miseEn: "Choy sum, ground pork, and clean water.",
    prepareVi: "Xử lý thịt riêng; rửa cải dưới vòi nước và để ráo.", prepareEn: "Handle pork separately; rinse choy sum under running water and drain.",
    cookVi: "Cho thịt vào nước đang sôi, tách cụm lớn, sau đó thêm phần cọng và lá.", cookEn: "Add pork to simmering water, break up large clumps, then add stems and leaves.",
    finishVi: "Giữ canh sôi nhẹ đến khi thịt chín và rau đạt độ mềm mong muốn.", finishEn: "Keep the soup gently simmering until pork is cooked and greens are tender.",
    safety: "ground-meat", hasProduce: true,
  },
  {
    dishId: "canh_chua_ca", viName: "canh chua cá", enName: "sour fish soup",
    minutes: 30, miseVi: "Cá lóc, cà chua, me, giá đỗ và nước sạch.", miseEn: "Snakehead fish, tomatoes, tamarind, bean sprouts, and clean water.",
    prepareVi: "Xử lý cá riêng; rửa cà chua và giá dưới vòi nước, không dùng xà phòng.", prepareEn: "Handle fish separately; rinse tomatoes and sprouts under running water without soap.",
    cookVi: "Đưa nước me lên sôi nhẹ, cho cá vào trước rồi thêm cà chua và giá.", cookEn: "Bring the tamarind broth to a gentle boil, add fish first, then tomatoes and sprouts.",
    finishVi: "Giữ sôi nhẹ để cá chín đều mà không đảo mạnh làm vỡ cá.", finishEn: "Maintain a gentle simmer so fish cooks evenly without vigorous stirring.",
    safety: "fish", hasProduce: true,
  },
  {
    dishId: "canh_cua_rau_day", viName: "canh cua rau đay", enName: "field-crab soup with jute leaves",
    minutes: 25, miseVi: "Cua đồng đã sơ chế, rau đay, mồng tơi và nước sạch.", miseEn: "Prepared field crab, jute leaves, Malabar spinach, and clean water.",
    prepareVi: "Giữ cua sống/sống xay tách khỏi rau; rửa các loại lá dưới vòi nước.", prepareEn: "Keep raw or ground crab separate from greens; rinse the leaves under running water.",
    cookVi: "Đun phần nước cua đến sôi ổn định, sau đó cho rau vào và khuấy nhẹ.", cookEn: "Bring the crab broth to a steady boil, then add greens and stir gently.",
    finishVi: "Giữ canh sôi nhẹ đến khi thịt cua đục hoàn toàn và rau chín.", finishEn: "Maintain a gentle boil until crab flesh is fully opaque and greens are cooked.",
    safety: "shellfish", hasProduce: true,
  },
  {
    dishId: "canh_rieu_cua", viName: "canh riêu cua", enName: "field-crab tomato soup",
    minutes: 30, miseVi: "Cua đồng đã sơ chế, cà chua và nước sạch.", miseEn: "Prepared field crab, tomatoes, and clean water.",
    prepareVi: "Giữ cua tách khỏi thực phẩm ăn liền; rửa cà chua dưới vòi nước trước khi cắt.", prepareEn: "Keep crab separate from ready-to-eat food; rinse tomatoes under running water before cutting.",
    cookVi: "Đưa nước cua lên sôi ổn định để riêu kết lại, sau đó thêm cà chua.", cookEn: "Bring crab broth to a steady boil so curds form, then add tomatoes.",
    finishVi: "Giữ canh sôi nhẹ đến khi phần thịt cua đục hoàn toàn.", finishEn: "Maintain a gentle boil until the crab flesh is fully opaque.",
    safety: "shellfish", hasProduce: true,
  },
  {
    dishId: "canh_mong_toi_tom", viName: "canh mồng tơi tôm", enName: "Malabar-spinach shrimp soup",
    minutes: 18, miseVi: "Mồng tơi, tôm và nước sạch.", miseEn: "Malabar spinach, shrimp, and clean water.",
    prepareVi: "Xử lý tôm riêng; rửa mồng tơi dưới vòi nước và để ráo.", prepareEn: "Handle shrimp separately; rinse Malabar spinach under running water and drain.",
    cookVi: "Cho tôm vào nước đang sôi nhẹ, sau đó thêm rau và đảo nhẹ.", cookEn: "Add shrimp to gently boiling water, then add greens and stir gently.",
    finishVi: "Giữ sôi nhẹ đến khi tôm đục hoàn toàn và rau chín.", finishEn: "Maintain a gentle boil until shrimp is fully opaque and greens are cooked.",
    safety: "shellfish", hasProduce: true,
  },
  {
    dishId: "canh_su_su_suon", viName: "canh su su sườn", enName: "chayote soup with pork ribs",
    minutes: 45, miseVi: "Su su, sườn heo và nước sạch.", miseEn: "Chayote, pork ribs, and clean water.",
    prepareVi: "Xử lý sườn riêng; rửa vỏ su su dưới vòi nước trước khi gọt/cắt.", prepareEn: "Handle ribs separately; rinse chayote under running water before peeling or cutting.",
    cookVi: "Nấu sườn trong nước sôi nhẹ, sau đó cho su su vào khi sườn gần mềm.", cookEn: "Cook ribs at a gentle boil, then add chayote when the ribs are nearly tender.",
    finishVi: "Giữ canh sôi nhẹ đến khi sườn và su su chín đều.", finishEn: "Maintain a gentle boil until ribs and chayote cook evenly.",
    safety: "whole-pork", hasProduce: true,
  },
  {
    dishId: "canh_rau_muong_toi", viName: "canh rau muống", enName: "water-spinach soup",
    minutes: 12, miseVi: "Rau muống, nước sạch và nồi.", miseEn: "Water spinach, clean water, and a pot.",
    prepareVi: "Nhặt phần hỏng, rửa rau dưới vòi nước và để ráo; không dùng xà phòng.", prepareEn: "Remove damaged parts, rinse under running water, and drain; do not use soap.",
    cookVi: "Đưa nước lên sôi, cho phần cọng vào trước rồi đến ngọn.", cookEn: "Bring water to a boil, add stems first, then tender tips.",
    finishVi: "Giữ sôi đến khi rau đạt độ mềm mong muốn và dọn bằng dụng cụ sạch.", finishEn: "Boil until the greens reach the desired tenderness and serve with clean utensils.",
    safety: "produce",
  },
  {
    dishId: "canh_bi_xanh_suon", viName: "canh bí xanh sườn", enName: "winter-melon soup with pork ribs",
    minutes: 45, miseVi: "Bí xanh, sườn heo và nước sạch.", miseEn: "Winter melon, pork ribs, and clean water.",
    prepareVi: "Xử lý sườn riêng; rửa vỏ bí dưới vòi nước trước khi gọt/cắt.", prepareEn: "Handle ribs separately; rinse the melon rind under running water before peeling or cutting.",
    cookVi: "Nấu sườn trong nước sôi nhẹ, sau đó thêm bí khi sườn gần mềm.", cookEn: "Cook ribs at a gentle boil, then add winter melon when the ribs are nearly tender.",
    finishVi: "Giữ canh sôi nhẹ đến khi sườn chín và bí vừa mềm.", finishEn: "Maintain a gentle boil until ribs are cooked and melon is tender.",
    safety: "whole-pork", hasProduce: true,
  },
  {
    dishId: "tm_chuoi", viName: "chuối", enName: "banana",
    minutes: 5, miseVi: "Chuối nguyên quả, nước sạch, dao và đĩa sạch nếu cần cắt.", miseEn: "Whole bananas, clean water, a knife, and clean plate if slicing.",
    prepareVi: "Rửa mặt ngoài dưới vòi nước trước khi bóc hoặc cắt; không dùng xà phòng.", prepareEn: "Rinse the exterior under running water before peeling or cutting; do not use soap.",
    cookVi: "Bóc vỏ bằng tay sạch; nếu cắt, dùng dao và thớt sạch.", cookEn: "Peel with clean hands; if slicing, use a clean knife and board.",
    finishVi: "Dọn ngay hoặc giữ phần đã cắt trong hộp sạch ở ngăn mát.", finishEn: "Serve promptly or refrigerate cut portions in a clean covered container.",
    safety: "fruit",
  },
  {
    dishId: "tm_cam", viName: "cam", enName: "orange",
    minutes: 5, miseVi: "Cam nguyên quả, nước sạch, dao và đĩa sạch.", miseEn: "Whole oranges, clean water, a knife, and clean plate.",
    prepareVi: "Rửa vỏ cam dưới vòi nước trước khi bóc hoặc cắt; không dùng xà phòng.", prepareEn: "Rinse the orange peel under running water before peeling or cutting; do not use soap.",
    cookVi: "Bóc bằng tay sạch hoặc cắt trên thớt sạch để không đưa bẩn từ vỏ vào múi.", cookEn: "Peel with clean hands or cut on a clean board to avoid carrying debris from peel to flesh.",
    finishVi: "Dọn bằng dụng cụ sạch; cho phần đã cắt vào ngăn mát nếu chưa dùng ngay.", finishEn: "Serve with clean utensils; refrigerate cut portions if not eaten promptly.",
    safety: "fruit",
  },
  {
    dishId: "tm_dua_hau", viName: "dưa hấu", enName: "watermelon",
    minutes: 8, miseVi: "Dưa hấu nguyên quả, bàn chải rau quả sạch, dao và thớt.", miseEn: "A whole watermelon, clean produce brush, knife, and board.",
    prepareVi: "Rửa và chà vỏ dưới vòi nước trước khi cắt; không dùng xà phòng.", prepareEn: "Rinse and scrub the rind under running water before cutting; do not use soap.",
    cookVi: "Dùng dao và thớt sạch để bổ, bỏ vỏ và chia miếng.", cookEn: "Use a clean knife and board to cut, remove rind, and portion.",
    finishVi: "Dọn bằng dụng cụ sạch; giữ kín phần đã cắt trong ngăn mát.", finishEn: "Serve with clean utensils; keep cut portions covered in the refrigerator.",
    safety: "fruit",
  },
  {
    dishId: "tm_thanh_long", viName: "thanh long", enName: "dragon fruit",
    minutes: 5, miseVi: "Thanh long nguyên quả, nước sạch, dao và đĩa.", miseEn: "Whole dragon fruit, clean water, a knife, and plate.",
    prepareVi: "Rửa vỏ dưới vòi nước trước khi cắt; không dùng xà phòng.", prepareEn: "Rinse the peel under running water before cutting; do not use soap.",
    cookVi: "Cắt bằng dao và thớt sạch, tách vỏ rồi chia phần.", cookEn: "Cut with a clean knife and board, remove peel, and portion.",
    finishVi: "Dọn bằng dụng cụ sạch; cho phần đã cắt vào ngăn mát nếu chưa dùng ngay.", finishEn: "Serve with clean utensils; refrigerate cut portions if not eaten promptly.",
    safety: "fruit",
  },
];

export const EXPANDED_COOKING_GUIDES: CookingGuide[] = SPECS.map(expandedGuide);
