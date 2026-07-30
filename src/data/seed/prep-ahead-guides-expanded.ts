import type { LocalizedText } from "@/domain/kitchen-execution";
import type {
  PrepAheadGuide,
  PrepAheadKind,
  PrepAheadStep,
} from "@/domain/kitchen-execution/prep-ahead";

const SAFE = "prep-fda-safe-handling";
const STORE = "prep-fda-storage";
const PRODUCE = "prep-fda-produce";
const TEMP = "prep-foodsafety-temperatures";
const reviewedAt = "2026-07-30";

const l = (vi: string, en: string): LocalizedText => ({ vi, en });
const step = (
  id: string,
  kind: PrepAheadKind,
  title: LocalizedText,
  instruction: LocalizedText,
  sourceIds: string[],
  storageInstruction?: LocalizedText,
): PrepAheadStep => ({ id, kind, title, instruction, sourceIds, storageInstruction });

interface PrepSpec {
  dishId: string;
  dishVi: string;
  dishEn: string;
  rawVi?: string;
  rawEn?: string;
  produceVi?: string;
  produceEn?: string;
  mayMarinate?: boolean;
  fruit?: boolean;
  deferVi: string;
  deferEn: string;
}

function expandedPrepGuide(spec: PrepSpec): PrepAheadGuide {
  const steps: PrepAheadStep[] = [
    step(
      "gather",
      "gather",
      l("Gom nguyên liệu và dụng cụ", "Gather ingredients and tools"),
      l(
        `Đối chiếu công thức ${spec.dishVi}; gom dụng cụ sạch và nguyên liệu còn nguyên bao gói.`,
        `Check the ${spec.dishEn} recipe; gather clean tools and ingredients still in their packaging.`,
      ),
      [SAFE],
    ),
    step(
      "measure",
      "measure",
      l("Đong phần khô riêng", "Measure dry items separately"),
      l(
        "Có thể đong gia vị khô vào hộp sạch riêng; chưa trộn với thực phẩm sống.",
        "Dry seasonings may be measured into a separate clean container; do not mix them with raw food yet.",
      ),
      [SAFE],
    ),
  ];

  if (spec.rawVi && spec.rawEn) {
    steps.push(
      step(
        "separate",
        "separate",
        l("Tách riêng đồ sống", "Separate raw food"),
        l(
          `Dành hộp, dao và thớt riêng cho ${spec.rawVi}; không để chạm rau hoặc dụng cụ ăn chín.`,
          `Reserve a separate container, knife, and board for ${spec.rawEn}; keep it away from produce and ready-to-eat utensils.`,
        ),
        [SAFE, STORE],
        l(
          "Giữ kín trong ngăn mát, đặt tách khỏi thực phẩm ăn liền.",
          "Keep covered in the refrigerator, separated from ready-to-eat food.",
        ),
      ),
    );
  }

  if (spec.mayMarinate && spec.rawVi && spec.rawEn) {
    steps.push(
      step(
        "marinate",
        "marinate-refrigerated",
        l("Ướp lạnh nếu chọn chuẩn bị trước", "Refrigerate if marinating ahead"),
        l(
          `Nếu chọn ướp ${spec.rawVi} trước, dùng hộp sạch có nắp và đưa ngay vào ngăn mát. Nước ướp đã chạm đồ sống không dùng trực tiếp làm xốt.`,
          `If you choose to marinate ${spec.rawEn} ahead, use a clean covered container and place it straight in the refrigerator. Do not use marinade that touched raw food directly as sauce.`,
        ),
        [SAFE, STORE],
        l(
          "Luôn ướp trong ngăn mát; giữ hộp kín và tách khỏi đồ ăn liền.",
          "Always marinate in the refrigerator; keep the container covered and separate from ready-to-eat food.",
        ),
      ),
    );
  }

  if (spec.produceVi && spec.produceEn && !spec.fruit) {
    steps.push(
      step(
        "produce",
        "produce",
        l("Chuẩn bị rau củ an toàn", "Prepare produce safely"),
        l(
          `Loại phần dập hỏng của ${spec.produceVi}, rửa dưới vòi nước sạch rồi làm ráo; không dùng xà phòng.`,
          `Remove damaged parts of ${spec.produceEn}, rinse under clean running water, and dry; do not use soap.`,
        ),
        [PRODUCE],
        l(
          "Giữ trong hộp sạch có nắp ở ngăn mát, tách khỏi thực phẩm sống.",
          "Keep in a clean covered container in the refrigerator, separate from raw food.",
        ),
      ),
    );
  }

  steps.push(
    step(
      "defer",
      "defer-until-cooking",
      l(spec.fruit ? "Để nguyên quả đến lúc dùng" : "Để lại đến lúc nấu", spec.fruit ? "Keep whole until serving" : "Leave until cooking"),
      l(spec.deferVi, spec.deferEn),
      spec.fruit ? [PRODUCE, STORE] : [SAFE, TEMP],
    ),
  );

  const sourceIds = [
    SAFE,
    ...(spec.rawVi ? [STORE, TEMP] : []),
    ...(spec.produceVi || spec.fruit ? [PRODUCE] : []),
  ];
  return {
    id: `prep-${spec.dishId.replaceAll("_", "-")}-v1`,
    dishId: spec.dishId,
    reviewedAt,
    scope: "previous-evening",
    steps,
    sourceIds: [...new Set(sourceIds)],
  };
}

const SPECS: PrepSpec[] = [
  { dishId: "ba_chi_luoc", dishVi: "ba chỉ luộc mắm tôm", dishEn: "boiled pork belly", rawVi: "ba chỉ sống", rawEn: "raw pork belly", deferVi: "Giữ thịt kín trong ngăn mát; luộc và pha nước chấm khi bắt đầu nấu.", deferEn: "Keep pork covered in the refrigerator; boil it and prepare dipping sauce when cooking begins." },
  { dishId: "suon_xao_chua_ngot", dishVi: "sườn xào chua ngọt", dishEn: "sweet-and-sour ribs", rawVi: "sườn sống", rawEn: "raw ribs", produceVi: "cà chua và hành tây", produceEn: "tomatoes and onion", mayMarinate: true, deferVi: "Chưa nấu sơ sườn để cất lại; xào sườn và hoàn thiện sốt khi bắt đầu nấu.", deferEn: "Do not partially cook ribs for later storage; stir-fry ribs and finish the sauce when cooking begins." },
  { dishId: "suon_nuong", dishVi: "sườn nướng", dishEn: "grilled ribs", rawVi: "sườn sống", rawEn: "raw ribs", mayMarinate: true, deferVi: "Chỉ nướng sườn và kiểm tra nhiệt độ khi bắt đầu nấu.", deferEn: "Grill the ribs and check temperature only when cooking begins." },
  { dishId: "thit_bam_xao_muop", dishVi: "thịt băm xào mướp", dishEn: "minced pork with luffa", rawVi: "thịt heo băm", rawEn: "ground pork", produceVi: "mướp nguyên quả", produceEn: "whole luffa", deferVi: "Chưa trộn thịt với mướp; chỉ gọt/cắt mướp và xào khi bắt đầu nấu.", deferEn: "Do not mix pork with luffa; peel, cut, and stir-fry only when cooking begins." },
  { dishId: "bo_xao_can", dishVi: "bò xào cần tây", dishEn: "beef with celery", rawVi: "thịt bò sống", rawEn: "raw beef", produceVi: "cần tây và hành tây", produceEn: "celery and onion", mayMarinate: true, deferVi: "Chưa xào thịt hoặc rau; hoàn thiện món khi bắt đầu nấu.", deferEn: "Do not pre-cook beef or vegetables; finish the dish when cooking begins." },
  { dishId: "bo_kho", dishVi: "bò kho", dishEn: "Vietnamese beef stew", rawVi: "thịt bò sống", rawEn: "raw beef", produceVi: "cà chua và hành tây", produceEn: "tomatoes and onion", mayMarinate: true, deferVi: "Chưa làm săn hoặc hầm thịt để cất lại; nấu theo công thức khi bắt đầu nấu.", deferEn: "Do not brown or partially stew beef for later storage; cook from the reviewed recipe when cooking begins." },
  { dishId: "bo_luc_lac", dishVi: "bò lúc lắc", dishEn: "shaking beef", rawVi: "thịt bò sống", rawEn: "raw beef", produceVi: "hành tây", produceEn: "onion", mayMarinate: true, deferVi: "Chưa áp chảo thịt; hoàn thiện món trên chảo nóng khi bắt đầu nấu.", deferEn: "Do not sear beef ahead; finish the dish in a hot pan when cooking begins." },
  { dishId: "ga_luoc", dishVi: "gà luộc", dishEn: "poached chicken", rawVi: "gà sống", rawEn: "raw chicken", deferVi: "Không làm gà sống bắn nước; chỉ luộc và đo phần dày nhất khi bắt đầu nấu.", deferEn: "Do not splash-rinse chicken; poach and measure the thickest part only when cooking begins." },
  { dishId: "ga_rang_muoi", dishVi: "gà rang muối", dishEn: "salt-fried chicken", rawVi: "gà sống", rawEn: "raw chicken", deferVi: "Không rửa hoặc nấu sơ gà; rang/chiên khi bắt đầu nấu.", deferEn: "Do not wash or partially cook chicken; fry it when cooking begins." },
  { dishId: "ga_kho_nuoc_dua", dishVi: "gà kho nước dừa", dishEn: "coconut-braised chicken", rawVi: "gà sống", rawEn: "raw chicken", mayMarinate: true, deferVi: "Không nấu sơ gà để cất lại; kho chín hoàn toàn khi bắt đầu nấu.", deferEn: "Do not partially cook chicken for later storage; braise it fully when cooking begins." },
  { dishId: "ca_nuong", dishVi: "cá nướng", dishEn: "grilled fish", rawVi: "cá sống", rawEn: "raw fish", mayMarinate: true, deferVi: "Giữ cá kín trong ngăn mát; nướng và kiểm tra độ chín khi bắt đầu nấu.", deferEn: "Keep fish covered in the refrigerator; grill and check doneness when cooking begins." },
  { dishId: "ca_hap_xi_dau", dishVi: "cá hấp xì dầu", dishEn: "soy-steamed fish", rawVi: "cá sống", rawEn: "raw fish", produceVi: "gừng", produceEn: "ginger", deferVi: "Chưa đặt cá và xốt chung; hấp cá khi bắt đầu nấu.", deferEn: "Do not combine fish and sauce ahead; steam the fish when cooking begins." },
  { dishId: "tom_rim_thit", dishVi: "tôm rim thịt ba chỉ", dishEn: "braised shrimp and pork belly", rawVi: "tôm và thịt ba chỉ sống", rawEn: "raw shrimp and pork belly", mayMarinate: true, deferVi: "Giữ hai loại đồ sống kín và tách biệt; chỉ rim khi bắt đầu nấu.", deferEn: "Keep both raw foods covered and separated; braise only when cooking begins." },
  { dishId: "tom_hap", dishVi: "tôm hấp", dishEn: "steamed shrimp", rawVi: "tôm sống", rawEn: "raw shrimp", deferVi: "Giữ tôm kín trong ngăn mát; làm sạch và hấp khi bắt đầu nấu.", deferEn: "Keep shrimp covered in the refrigerator; clean and steam when cooking begins." },
  { dishId: "ghe_hap", dishVi: "ghẹ hấp", dishEn: "steamed crab", rawVi: "ghẹ sống", rawEn: "live crab", deferVi: "Giữ ghẹ theo hướng dẫn của nơi bán và tách khỏi đồ ăn liền; hấp khi bắt đầu nấu.", deferEn: "Keep crab according to seller guidance and separate from ready-to-eat food; steam when cooking begins." },
  { dishId: "cua_rang_me", dishVi: "ghẹ rang me", dishEn: "tamarind crab", rawVi: "ghẹ sống", rawEn: "live crab", deferVi: "Có thể pha phần sốt me sạch riêng; chỉ xử lý và rang ghẹ khi bắt đầu nấu.", deferEn: "Clean tamarind sauce may be mixed separately; handle and cook crab only when cooking begins." },
  { dishId: "trung_hap_thit", dishVi: "trứng hấp thịt", dishEn: "steamed egg with pork", rawVi: "thịt heo băm và trứng nguyên vỏ", rawEn: "ground pork and shell eggs", deferVi: "Giữ trứng nguyên vỏ; chưa trộn trứng với thịt trước khi bắt đầu nấu.", deferEn: "Keep eggs in their shells; do not combine eggs and pork before cooking begins." },
  { dishId: "dau_hu_sot_ca", dishVi: "đậu hũ nhồi thịt sốt cà", dishEn: "pork-stuffed tofu in tomato sauce", rawVi: "thịt heo băm", rawEn: "ground pork", produceVi: "cà chua", produceEn: "tomatoes", deferVi: "Chưa nhồi thịt vào đậu hoặc nấu sơ; hoàn thiện món khi bắt đầu nấu.", deferEn: "Do not stuff tofu or partially cook it ahead; finish the dish when cooking begins." },
  { dishId: "bong_cai_xao", dishVi: "bông cải xào", dishEn: "stir-fried broccoli", produceVi: "bông cải", produceEn: "broccoli", deferVi: "Giữ bông cải đã ráo trong hộp sạch; chỉ xào khi bắt đầu nấu.", deferEn: "Keep drained broccoli in a clean covered container; stir-fry only when cooking begins." },
  { dishId: "gia_do_xao", dishVi: "giá đỗ xào", dishEn: "stir-fried bean sprouts", produceVi: "giá đỗ", produceEn: "bean sprouts", deferVi: "Giữ giá trong ngăn mát và nấu chín kỹ khi bắt đầu nấu.", deferEn: "Keep sprouts refrigerated and cook thoroughly when cooking begins." },
  { dishId: "rau_lang_luoc", dishVi: "rau lang luộc", dishEn: "boiled sweet-potato greens", produceVi: "rau lang", produceEn: "sweet-potato greens", deferVi: "Giữ rau đã ráo trong hộp sạch; luộc khi bắt đầu nấu.", deferEn: "Keep drained greens in a clean covered container; boil when cooking begins." },
  { dishId: "su_su_luoc", dishVi: "su su luộc", dishEn: "boiled chayote", produceVi: "su su nguyên quả", produceEn: "whole chayote", deferVi: "Để việc gọt, cắt và luộc đến lúc bắt đầu nấu.", deferEn: "Leave peeling, cutting, and boiling until cooking begins." },
  { dishId: "mong_toi_luoc", dishVi: "mồng tơi luộc", dishEn: "boiled Malabar spinach", produceVi: "mồng tơi", produceEn: "Malabar spinach", deferVi: "Giữ rau đã ráo trong hộp sạch; luộc khi bắt đầu nấu.", deferEn: "Keep drained greens in a clean covered container; boil when cooking begins." },
  { dishId: "rau_muong_luoc", dishVi: "rau muống luộc", dishEn: "boiled water spinach", produceVi: "rau muống", produceEn: "water spinach", deferVi: "Giữ rau đã ráo trong hộp sạch; luộc khi bắt đầu nấu.", deferEn: "Keep drained greens in a clean covered container; boil when cooking begins." },
  { dishId: "cai_ngot_xao", dishVi: "cải ngọt xào", dishEn: "stir-fried choy sum", produceVi: "cải ngọt", produceEn: "choy sum", deferVi: "Giữ cải đã ráo trong hộp sạch; chỉ xào khi bắt đầu nấu.", deferEn: "Keep drained greens in a clean covered container; stir-fry only when cooking begins." },
  { dishId: "canh_cai_thit", dishVi: "canh cải thịt băm", dishEn: "choy-sum soup with pork", rawVi: "thịt heo băm", rawEn: "ground pork", produceVi: "cải ngọt", produceEn: "choy sum", deferVi: "Chưa trộn thịt và rau hoặc nấu sơ; nấu canh khi bắt đầu nấu.", deferEn: "Do not combine pork and greens or partially cook them; make the soup when cooking begins." },
  { dishId: "canh_chua_ca", dishVi: "canh chua cá", dishEn: "sour fish soup", rawVi: "cá sống", rawEn: "raw fish", produceVi: "cà chua và giá đỗ", produceEn: "tomatoes and bean sprouts", deferVi: "Có thể pha nước me sạch riêng; chỉ cho cá và rau vào khi bắt đầu nấu.", deferEn: "Clean tamarind liquid may be mixed separately; add fish and vegetables only when cooking begins." },
  { dishId: "canh_cua_rau_day", dishVi: "canh cua rau đay", dishEn: "field-crab soup with jute leaves", rawVi: "cua đồng sống hoặc đã xay", rawEn: "raw or ground field crab", produceVi: "rau đay và mồng tơi", produceEn: "jute leaves and Malabar spinach", deferVi: "Giữ cua kín và tách khỏi rau; chỉ lọc/nấu cua khi bắt đầu nấu.", deferEn: "Keep crab covered and separated from greens; strain and cook only when cooking begins." },
  { dishId: "canh_rieu_cua", dishVi: "canh riêu cua", dishEn: "field-crab tomato soup", rawVi: "cua đồng sống hoặc đã xay", rawEn: "raw or ground field crab", produceVi: "cà chua", produceEn: "tomatoes", deferVi: "Giữ cua kín và tách khỏi cà chua; nấu canh khi bắt đầu nấu.", deferEn: "Keep crab covered and separate from tomatoes; cook the soup when cooking begins." },
  { dishId: "canh_mong_toi_tom", dishVi: "canh mồng tơi tôm", dishEn: "Malabar-spinach shrimp soup", rawVi: "tôm sống", rawEn: "raw shrimp", produceVi: "mồng tơi", produceEn: "Malabar spinach", deferVi: "Giữ tôm kín và tách khỏi rau; nấu canh khi bắt đầu nấu.", deferEn: "Keep shrimp covered and separate from greens; cook the soup when cooking begins." },
  { dishId: "canh_su_su_suon", dishVi: "canh su su sườn", dishEn: "chayote soup with ribs", rawVi: "sườn sống", rawEn: "raw ribs", produceVi: "su su nguyên quả", produceEn: "whole chayote", deferVi: "Chưa nấu sơ sườn; chỉ gọt/cắt su su và nấu canh khi bắt đầu nấu.", deferEn: "Do not partially cook ribs; peel/cut chayote and cook the soup when cooking begins." },
  { dishId: "canh_rau_muong_toi", dishVi: "canh rau muống", dishEn: "water-spinach soup", produceVi: "rau muống", produceEn: "water spinach", deferVi: "Giữ rau đã ráo trong hộp sạch; nấu canh khi bắt đầu nấu.", deferEn: "Keep drained greens in a clean covered container; cook the soup when cooking begins." },
  { dishId: "canh_bi_xanh_suon", dishVi: "canh bí xanh sườn", dishEn: "winter-melon soup with ribs", rawVi: "sườn sống", rawEn: "raw ribs", produceVi: "bí xanh nguyên quả", produceEn: "whole winter melon", deferVi: "Chưa nấu sơ sườn; chỉ gọt/cắt bí và nấu canh khi bắt đầu nấu.", deferEn: "Do not partially cook ribs; peel/cut winter melon and cook the soup when cooking begins." },
  { dishId: "tm_chuoi", dishVi: "chuối", dishEn: "banana", produceVi: "chuối nguyên quả", produceEn: "whole bananas", fruit: true, deferVi: "Giữ nguyên quả; rửa mặt ngoài rồi bóc hoặc cắt bằng dụng cụ sạch khi dùng.", deferEn: "Keep whole; rinse the exterior, then peel or cut with clean utensils when serving." },
  { dishId: "tm_cam", dishVi: "cam", dishEn: "orange", produceVi: "cam nguyên quả", produceEn: "whole oranges", fruit: true, deferVi: "Giữ nguyên quả; rửa vỏ rồi bóc hoặc cắt bằng dụng cụ sạch khi dùng.", deferEn: "Keep whole; rinse the peel, then peel or cut with clean utensils when serving." },
  { dishId: "tm_dua_hau", dishVi: "dưa hấu", dishEn: "watermelon", produceVi: "dưa hấu nguyên quả", produceEn: "whole watermelon", fruit: true, deferVi: "Giữ nguyên quả; rửa và chà vỏ dưới vòi nước trước khi cắt bằng dao sạch.", deferEn: "Keep whole; rinse and scrub the rind under running water before cutting with a clean knife." },
  { dishId: "tm_thanh_long", dishVi: "thanh long", dishEn: "dragon fruit", produceVi: "thanh long nguyên quả", produceEn: "whole dragon fruit", fruit: true, deferVi: "Giữ nguyên quả; rửa vỏ rồi cắt bằng dao và thớt sạch khi dùng.", deferEn: "Keep whole; rinse the peel, then cut with a clean knife and board when serving." },
];

export const EXPANDED_PREP_AHEAD_GUIDES: PrepAheadGuide[] = SPECS.map(expandedPrepGuide);
