import type {
  IngredientHandlingGuide,
  KitchenGuideSource,
} from "@/domain/kitchen-execution";
import { resolveIngredientGuide } from "@/domain/kitchen-execution";
import type { Commodity } from "@/domain/types";

const FDA_SEAFOOD = "fda-seafood-2024";
const FDA_HANDLING = "fda-safe-handling";
const USDA_BASICS = "usda-food-safety-basics";
const USDA_CHICKEN = "usda-chicken";
const USDA_BEEF = "usda-beef";
const USDA_PRODUCE = "usda-produce-wash";

export const KITCHEN_GUIDE_SOURCES: KitchenGuideSource[] = [
  {
    id: FDA_SEAFOOD,
    publisher: "U.S. Food and Drug Administration",
    title: {
      vi: "Chọn, bảo quản và sử dụng hải sản an toàn",
      en: "Selecting and serving fresh and frozen seafood safely",
    },
    url: "https://www.fda.gov/food/buy-store-serve-safe-food/selecting-and-serving-fresh-and-frozen-seafood-safely",
    reviewedAt: "2026-07-29",
  },
  {
    id: FDA_HANDLING,
    publisher: "U.S. Food and Drug Administration",
    title: {
      vi: "Xử lý thực phẩm an toàn: sạch, tách riêng, nấu chín, làm lạnh",
      en: "Safe food handling: clean, separate, cook, chill",
    },
    url: "https://www.fda.gov/food/buy-store-serve-safe-food/safe-food-handling",
    reviewedAt: "2026-07-29",
  },
  {
    id: USDA_BASICS,
    publisher: "USDA Food Safety and Inspection Service",
    title: {
      vi: "Các bước cơ bản để giữ thực phẩm an toàn",
      en: "Keep food safe – food safety basics",
    },
    url: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/steps-keep-food-safe",
    reviewedAt: "2026-07-29",
  },
  {
    id: USDA_CHICKEN,
    publisher: "USDA Food Safety and Inspection Service",
    title: {
      vi: "Thịt gà từ trang trại tới bàn ăn",
      en: "Chicken from farm to table",
    },
    url: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/poultry/chicken-farm-table",
    reviewedAt: "2026-07-29",
  },
  {
    id: USDA_BEEF,
    publisher: "USDA Food Safety and Inspection Service",
    title: {
      vi: "Thịt bò từ trang trại tới bàn ăn",
      en: "Beef from farm to table",
    },
    url: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/meat-catfish/beef-farm-table",
    reviewedAt: "2026-07-29",
  },
  {
    id: USDA_PRODUCE,
    publisher: "USDA Food Safety and Inspection Service",
    title: {
      vi: "Cách rửa rau quả tươi trước khi ăn",
      en: "How fresh produce should be washed before eating",
    },
    url: "https://ask.fsis.usda.gov/article/How-should-fresh-produce-be-washed-before-eating",
    reviewedAt: "2026-07-29",
  },
];

const seafoodStorage = [
  {
    vi: "Đưa vào ngăn mát hoặc ngăn đông ngay sau khi mua. Ngăn mát phải ở 4°C hoặc thấp hơn.",
    en: "Refrigerate or freeze promptly after buying. Keep the refrigerator at 4°C or below.",
  },
  {
    vi: "Nếu dùng trong 2 ngày, giữ kín ở ngăn mát; nếu không, bọc kín chống ẩm và cấp đông.",
    en: "If using within 2 days, keep sealed and refrigerated; otherwise wrap tightly and freeze.",
  },
];

const coldTransport = [
  {
    vi: "Chọn đồ lạnh sau cùng; để riêng thịt, gia cầm và hải sản sống khỏi rau quả và đồ ăn sẵn.",
    en: "Pick chilled items last; separate raw meat, poultry, and seafood from produce and ready-to-eat food.",
  },
  {
    vi: "Làm lạnh trong vòng 2 giờ sau khi mua; trong thời tiết trên 32°C, rút xuống còn 1 giờ.",
    en: "Chill within 2 hours of buying, or within 1 hour when the weather is above 32°C.",
  },
];

const noRawWashing = [
  {
    vi: "Không rửa thịt, gia cầm hoặc cá sống dưới vòi nước; nước bắn có thể làm phát tán vi khuẩn. Rửa tay và dụng cụ sau khi chạm đồ sống.",
    en: "Do not rinse raw meat, poultry, or fish under running water; splashes can spread bacteria. Wash hands and utensils after contact.",
  },
];

export const INGREDIENT_HANDLING_GUIDES: IngredientHandlingGuide[] = [
  {
    id: "fresh-whole-fish",
    specificity: "ingredient",
    commodityIds: ["ca_dieu_hong", "ca_thu", "ca_loc"],
    selection: [
      {
        vi: "Chỉ mua cá đang được giữ lạnh hoặc đặt trên lớp đá sạch dày, tốt nhất có che chắn.",
        en: "Buy only fish kept refrigerated or on a thick bed of clean ice, preferably under cover.",
      },
      {
        vi: "Cá nguyên con nên có mùi nhẹ, mắt trong và bóng, thịt chắc đàn hồi, mang đỏ và không có mùi lạ.",
        en: "Whole fish should smell mild, with clear shiny eyes, firm springy flesh, and red odor-free gills.",
      },
    ],
    avoid: [
      {
        vi: "Tránh cá có mùi tanh gắt, chua hoặc khai amoniac; không dùng màu sắc đơn lẻ để kết luận độ tươi.",
        en: "Avoid strong fishy, sour, or ammonia odors; color alone is not a reliable freshness test.",
      },
      {
        vi: "Với cá đông lạnh, tránh gói rách, mép bẹp, nhiều tinh thể đá hoặc phần thịt còn uốn cong được.",
        en: "For frozen fish, avoid torn or crushed packs, heavy ice crystals, or flesh that still bends.",
      },
    ],
    transport: coldTransport,
    storage: seafoodStorage,
    preparation: noRawWashing,
    sourceIds: [FDA_SEAFOOD, FDA_HANDLING],
  },
  {
    id: "fresh-shrimp",
    specificity: "ingredient",
    commodityIds: ["tom"],
    selection: [
      {
        vi: "Chọn tôm được giữ lạnh hoặc trên đá; phần thịt trong, ánh ngọc trai và hầu như không có mùi.",
        en: "Choose shrimp kept chilled or on ice; flesh should be clear, pearl-like, with little or no odor.",
      },
    ],
    avoid: [
      {
        vi: "Tránh mùi chua, ôi, tanh gắt hoặc khai amoniac; với hàng đông lạnh, tránh gói rách và nhiều tinh thể đá.",
        en: "Avoid sour, rancid, strongly fishy, or ammonia odors; for frozen shrimp avoid torn packs and heavy ice crystals.",
      },
    ],
    transport: coldTransport,
    storage: seafoodStorage,
    preparation: noRawWashing,
    sourceIds: [FDA_SEAFOOD, FDA_HANDLING],
  },
  {
    id: "live-crab",
    specificity: "ingredient",
    commodityIds: ["ghe", "cua_dong"],
    selection: [
      {
        vi: "Với cua/ghẹ bán sống, chọn con còn cử động chân; nhóm này hỏng nhanh sau khi chết.",
        en: "For crab sold live, choose animals showing leg movement; they spoil rapidly after death.",
      },
    ],
    avoid: [
      {
        vi: "Không chọn con đã chết hoặc có mùi chua, ôi, tanh gắt hay khai amoniac.",
        en: "Do not choose dead crab or any with sour, rancid, strongly fishy, or ammonia odors.",
      },
    ],
    transport: coldTransport,
    storage: seafoodStorage,
    preparation: noRawWashing,
    sourceIds: [FDA_SEAFOOD, FDA_HANDLING],
  },
  {
    id: "raw-chicken",
    specificity: "ingredient",
    commodityIds: ["thit_ga"],
    selection: [
      {
        vi: "Chọn gà từ quầy giữ lạnh, lấy gần cuối lượt mua và kiểm tra ngày cùng hướng dẫn bảo quản trên bao gói nếu có.",
        en: "Choose chicken from a refrigerated case, pick it near checkout, and check package dates and handling instructions.",
      },
    ],
    avoid: [
      {
        vi: "Không lấy bao gói bị rách hoặc rò nước; màu da vàng hay trắng tự nó không phản ánh độ tươi hoặc an toàn.",
        en: "Avoid torn or leaking packages; yellow or white skin color alone does not indicate freshness or safety.",
      },
    ],
    transport: coldTransport,
    storage: [
      {
        vi: "Giữ ở 4°C hoặc thấp hơn và nấu trong 1–2 ngày; nếu chưa dùng, cấp đông.",
        en: "Keep at 4°C or below and cook within 1–2 days; freeze if not using in that window.",
      },
      {
        vi: "Để trong hộp hoặc túi kín ở tầng thấp để nước sống không chảy sang thực phẩm khác.",
        en: "Keep sealed on a low shelf so raw juices cannot drip onto other food.",
      },
    ],
    preparation: noRawWashing,
    sourceIds: [USDA_CHICKEN, FDA_HANDLING],
  },
  {
    id: "raw-beef",
    specificity: "ingredient",
    commodityIds: ["thit_bo"],
    selection: [
      {
        vi: "Chọn thịt đang được giữ lạnh; nếu có nhãn, kiểm tra đúng phần thịt và hướng dẫn bảo quản.",
        en: "Choose beef that is kept chilled; when labeled, verify the cut and handling instructions.",
      },
    ],
    avoid: [
      {
        vi: "Không lấy bao gói rách hoặc rò nước. Thịt có mùi lạ, bề mặt dính hay nhớt là dấu hiệu nên bỏ.",
        en: "Avoid torn or leaking packs. Off odors and a tacky or sticky surface are discard signs.",
      },
    ],
    transport: coldTransport,
    storage: [
      {
        vi: "Giữ ở 4°C hoặc thấp hơn. Miếng nguyên dùng trong 3–5 ngày; thịt xay dùng trong 1–2 ngày; quá thời gian thì cấp đông.",
        en: "Keep at 4°C or below. Use whole cuts within 3–5 days and ground beef within 1–2 days; otherwise freeze.",
      },
    ],
    preparation: noRawWashing,
    sourceIds: [USDA_BEEF, FDA_HANDLING],
  },
  {
    id: "raw-pork-category",
    specificity: "category",
    commodityIds: ["thit_ba_chi", "thit_heo_nac", "suon_heo"],
    selection: [
      {
        vi: "Chọn thịt đang được giữ lạnh; nếu đóng gói, bao bì phải nguyên vẹn và không rò nước.",
        en: "Choose pork that is kept chilled; packaged meat should be intact and leak-free.",
      },
    ],
    avoid: [
      {
        vi: "Không mua sản phẩm để ngoài vùng lạnh hoặc bao gói rách, rò nước.",
        en: "Do not buy products left outside refrigeration or in torn, leaking packs.",
      },
    ],
    transport: coldTransport,
    storage: [
      {
        vi: "Giữ ở 4°C hoặc thấp hơn. Miếng nguyên dùng trong 3–5 ngày; nếu đã xay/băm, dùng trong 1–2 ngày; quá thời gian thì cấp đông.",
        en: "Keep at 4°C or below. Use whole cuts within 3–5 days and ground/minced pork within 1–2 days; otherwise freeze.",
      },
    ],
    preparation: noRawWashing,
    sourceIds: [USDA_BASICS, FDA_HANDLING],
  },
  {
    id: "fresh-produce-category",
    specificity: "category",
    groups: ["rau", "trái cây"],
    selection: [
      {
        vi: "Chọn rau quả không dập nát hoặc hư hỏng rõ; rau quả đã cắt sẵn phải được giữ lạnh.",
        en: "Choose produce without obvious bruising or damage; pre-cut produce should be refrigerated.",
      },
    ],
    avoid: [
      {
        vi: "Tránh phần dập, nứt hoặc hỏng; nếu vẫn dùng được phần còn lại, cắt bỏ vùng tổn thương trước khi chế biến.",
        en: "Avoid bruised, cracked, or spoiled areas; cut away damaged portions before preparation when the rest remains usable.",
      },
    ],
    transport: [
      {
        vi: "Để rau quả tách khỏi thịt, gia cầm, hải sản sống và nước rỉ của chúng trong giỏ, túi và tủ lạnh.",
        en: "Keep produce separate from raw meat, poultry, seafood, and their juices in the cart, bags, and refrigerator.",
      },
    ],
    storage: [
      {
        vi: "Rau quả đã cắt phải được cho vào ngăn mát ngay. Với rau quả nguyên, làm theo điều kiện riêng của từng loại khi có hướng dẫn đặc thù.",
        en: "Refrigerate cut produce promptly. For whole produce, follow item-specific storage guidance when available.",
      },
    ],
    preparation: [
      {
        vi: "Rửa dưới vòi nước sạch ngay trước khi chuẩn bị hoặc ăn; không dùng xà phòng hay chất tẩy. Loại vỏ cứng có thể chà bằng bàn chải sạch.",
        en: "Rinse under clean running water before preparing or eating; do not use soap or detergent. Scrub firm produce with a clean brush.",
      },
    ],
    sourceIds: [USDA_PRODUCE, FDA_HANDLING],
  },
];

export const KITCHEN_GUIDE_SOURCE_BY_ID = Object.fromEntries(
  KITCHEN_GUIDE_SOURCES.map((source) => [source.id, source]),
);

export function kitchenGuideFor(commodity: Commodity | undefined) {
  return resolveIngredientGuide(
    commodity,
    INGREDIENT_HANDLING_GUIDES,
    KITCHEN_GUIDE_SOURCE_BY_ID,
  );
}
