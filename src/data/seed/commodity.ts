import type { Commodity, Allergen } from "@/domain/types";

// A — commodity registry. Macros are per 100g edible portion.
// Provenance/confidence are seeded to reflect the arbitration order (INTAKE-SEED §5):
// staples & common proteins → P1/corroborated; regional/variable cuts → disputed;
// hard-to-pin items (field crab, some herbs) → honest_null. This spread lets the
// D3 gate exercise all three display tiers on real dishes.
//
// NOTE: full quantification against Bảng 2016 for every commodity is the
// data-seed refinery campaign; these are representative seed values.

const P1 = "Bảng Thành phần Thực phẩm VN 2017";

export const COMMODITIES: Commodity[] = [
  // ── Tinh bột (COM) ──
  {
    id: "com_trang", canonicalVn: "Cơm trắng", labelEn: "Steamed rice", group: "ngũ cốc",
    kcal: 130, proteinG: 2.7, carbG: 28.2, fatG: 0.3, fiberG: 0.4,
    provenanceLevel: "P1", confidence: "corroborated",
    sourceRefs: [{ source: P1, value: 130 }, { source: "USDA", value: 130 }],
  },
  {
    id: "bun", canonicalVn: "Bún", labelEn: "Rice vermicelli", group: "ngũ cốc",
    kcal: 110, proteinG: 2.0, carbG: 25.0, fatG: 0.2, fiberG: 0.5,
    provenanceLevel: "P1", confidence: "corroborated",
    sourceRefs: [{ source: P1, value: 110 }],
  },

  // ── Đạm động vật ──
  {
    id: "thit_ba_chi", canonicalVn: "Thịt ba chỉ", labelEn: "Pork belly", group: "thịt",
    kcal: 260, proteinG: 17.0, carbG: 0, fatG: 21.0, fiberG: 0,
    provenanceLevel: "P1", confidence: "corroborated",
    sourceRefs: [{ source: P1, value: 260 }, { source: "USDA", value: 260 }],
    storageNote: "Mua tươi, dùng trong ngày; không trữ đông lâu.",
    substitutes: ["thit_heo_nac"],
  },
  {
    id: "thit_heo_nac", canonicalVn: "Thịt heo nạc", labelEn: "Lean pork", group: "thịt",
    kcal: 143, proteinG: 20.9, carbG: 0, fatG: 6.2, fiberG: 0,
    provenanceLevel: "P1", confidence: "corroborated",
    sourceRefs: [{ source: P1, value: 143 }],
    substitutes: ["thit_ba_chi"],
  },
  {
    id: "suon_heo", canonicalVn: "Sườn heo", labelEn: "Pork ribs", group: "thịt",
    kcal: 277, proteinG: 15.5, carbG: 0, fatG: 23.4, fiberG: 0,
    // Refinery R1: USDA raw spareribs 277/15.5/23.4; Bảng VN 240. VN↔intl split
    // is real (cut variation sườn non/già) → stays disputed. Bone-in yield.
    provenanceLevel: "P5", confidence: "disputed",
    sourceRefs: [{ source: P1, value: 240 }, { source: "USDA FoodData Central", value: 277 }],
  },
  {
    id: "thit_bo", canonicalVn: "Thịt bò (nạc)", labelEn: "Lean beef", group: "thịt",
    kcal: 182, proteinG: 21.0, carbG: 0, fatG: 10.5, fiberG: 0,
    provenanceLevel: "P1", confidence: "corroborated",
    sourceRefs: [{ source: P1, value: 182 }, { source: "USDA", value: 187 }],
  },
  {
    id: "thit_ga", canonicalVn: "Thịt gà", labelEn: "Chicken", group: "thịt",
    kcal: 199, proteinG: 20.3, carbG: 0, fatG: 13.1, fiberG: 0,
    provenanceLevel: "P1", confidence: "corroborated",
    sourceRefs: [{ source: P1, value: 199 }],
  },
  {
    id: "ca_dieu_hong", canonicalVn: "Cá diêu hồng", labelEn: "Red tilapia", group: "cá",
    kcal: 124, proteinG: 16.0, carbG: 0, fatG: 6.5, fiberG: 0,
    provenanceLevel: "P1", confidence: "corroborated",
    sourceRefs: [{ source: P1, value: 124 }],
  },
  {
    id: "ca_thu", canonicalVn: "Cá thu", labelEn: "Mackerel", group: "cá",
    kcal: 190, proteinG: 21.0, carbG: 0, fatG: 11.0, fiberG: 0,
    provenanceLevel: "P1", confidence: "corroborated",
    sourceRefs: [{ source: P1, value: 190 }],
  },
  {
    id: "ca_loc", canonicalVn: "Cá lóc", labelEn: "Snakehead fish", group: "cá",
    kcal: 97, proteinG: 18.2, carbG: 0, fatG: 2.7, fiberG: 0,
    provenanceLevel: "P1", confidence: "corroborated",
    sourceRefs: [{ source: P1, value: 97 }],
  },
  {
    id: "tom", canonicalVn: "Tôm", labelEn: "Shrimp", group: "hải sản",
    kcal: 99, proteinG: 20.8, carbG: 0.9, fatG: 1.7, fiberG: 0,
    provenanceLevel: "P1", confidence: "corroborated",
    sourceRefs: [{ source: P1, value: 99 }, { source: "USDA", value: 99 }],
  },
  {
    id: "ghe", canonicalVn: "Ghẹ", labelEn: "Blue crab", group: "hải sản",
    kcal: 87, proteinG: 18.1, carbG: 0, fatG: 1.5, fiberG: 0,
    provenanceLevel: "P4", confidence: "corroborated",
    sourceRefs: [{ source: "FAO/INFOODS", value: 87 }],
  },
  {
    id: "cua_dong", canonicalVn: "Cua đồng", labelEn: "Field crab", group: "hải sản",
    kcal: 87, proteinG: 12.3, carbG: 2.0, fatG: 3.3, fiberG: 0,
    // Refinery R1: 87/12.3/3.3 corroborated across VN sources (Bảng VN + dinh
    // dưỡng articles). The uncertainty is the edible fraction (ground with
    // shell, strained) → captured as a low edibleYield, not honest_null macro.
    provenanceLevel: "P1", confidence: "corroborated",
    sourceRefs: [{ source: P1, value: 87 }, { source: "vietnam.vn / dinh dưỡng VN", value: 87 }],
  },
  {
    id: "muc", canonicalVn: "Mực", labelEn: "Squid", group: "hải sản",
    kcal: 92, proteinG: 15.6, carbG: 3.1, fatG: 1.4, fiberG: 0,
    provenanceLevel: "P5", confidence: "disputed",
    sourceRefs: [{ source: "USDA", value: 92 }, { source: P1, value: 73 }],
  },
  {
    id: "trung_ga", canonicalVn: "Trứng gà", labelEn: "Chicken egg", group: "trứng",
    kcal: 155, proteinG: 13.0, carbG: 1.1, fatG: 11.0, fiberG: 0,
    provenanceLevel: "P1", confidence: "corroborated",
    sourceRefs: [{ source: P1, value: 155 }, { source: "USDA", value: 155 }],
  },
  {
    id: "dau_hu", canonicalVn: "Đậu hũ", labelEn: "Tofu", group: "đậu",
    kcal: 76, proteinG: 8.1, carbG: 1.9, fatG: 4.8, fiberG: 0.3,
    provenanceLevel: "P1", confidence: "corroborated",
    sourceRefs: [{ source: P1, value: 76 }],
  },

  // ── Rau ──
  {
    id: "rau_muong", canonicalVn: "Rau muống", labelEn: "Water spinach", group: "rau",
    kcal: 23, proteinG: 2.6, carbG: 3.1, fatG: 0.2, fiberG: 2.1,
    provenanceLevel: "P1", confidence: "corroborated",
    sourceRefs: [{ source: P1, value: 23 }], seasonMonths: [3, 4, 5, 6, 7, 8, 9],
  },
  {
    id: "cai_ngot", canonicalVn: "Cải ngọt", labelEn: "Choy sum", group: "rau",
    kcal: 20, proteinG: 1.7, carbG: 2.2, fatG: 0.2, fiberG: 1.5,
    provenanceLevel: "P1", confidence: "corroborated", sourceRefs: [{ source: P1, value: 20 }],
  },
  {
    id: "bong_cai", canonicalVn: "Bông cải", labelEn: "Cauliflower", group: "rau",
    kcal: 34, proteinG: 2.8, carbG: 6.6, fatG: 0.4, fiberG: 2.6,
    provenanceLevel: "P1", confidence: "corroborated", sourceRefs: [{ source: P1, value: 34 }],
  },
  {
    id: "gia_do", canonicalVn: "Giá đỗ", labelEn: "Bean sprouts", group: "rau",
    kcal: 30, proteinG: 3.0, carbG: 5.9, fatG: 0.2, fiberG: 1.8,
    provenanceLevel: "P1", confidence: "corroborated", sourceRefs: [{ source: P1, value: 30 }],
  },
  {
    id: "bi_xanh", canonicalVn: "Bí xanh", labelEn: "Winter melon", group: "rau",
    kcal: 13, proteinG: 0.4, carbG: 3.0, fatG: 0.2, fiberG: 1.0,
    provenanceLevel: "P1", confidence: "corroborated", sourceRefs: [{ source: P1, value: 13 }],
  },
  {
    id: "su_su", canonicalVn: "Su su", labelEn: "Chayote", group: "rau",
    kcal: 19, proteinG: 0.8, carbG: 4.5, fatG: 0.1, fiberG: 1.7,
    provenanceLevel: "P1", confidence: "corroborated", sourceRefs: [{ source: P1, value: 19 }],
  },
  {
    id: "rau_lang", canonicalVn: "Rau lang", labelEn: "Sweet potato leaves", group: "rau",
    kcal: 22, proteinG: 2.6, carbG: 4.4, fatG: 0.3, fiberG: 2.0,
    provenanceLevel: "P1", confidence: "corroborated", sourceRefs: [{ source: P1, value: 22 }],
  },
  {
    id: "rau_ngot", canonicalVn: "Rau ngót", labelEn: "Katuk", group: "rau",
    kcal: 35, proteinG: 5.3, carbG: 3.4, fatG: 0.4, fiberG: 2.5,
    provenanceLevel: "P1", confidence: "corroborated", sourceRefs: [{ source: P1, value: 35 }],
  },
  {
    id: "rau_day", canonicalVn: "Rau đay", labelEn: "Jute mallow", group: "rau",
    kcal: 34, proteinG: 4.5, carbG: 5.8, fatG: 0.3, fiberG: 3.0,
    provenanceLevel: "P1", confidence: "corroborated", sourceRefs: [{ source: P1, value: 34 }],
  },
  {
    id: "mong_toi", canonicalVn: "Mồng tơi", labelEn: "Malabar spinach", group: "rau",
    kcal: 19, proteinG: 1.8, carbG: 3.4, fatG: 0.3, fiberG: 2.0,
    provenanceLevel: "P1", confidence: "corroborated", sourceRefs: [{ source: P1, value: 19 }],
  },
  {
    id: "ca_chua", canonicalVn: "Cà chua", labelEn: "Tomato", group: "rau",
    kcal: 18, proteinG: 0.9, carbG: 3.9, fatG: 0.2, fiberG: 1.2,
    provenanceLevel: "P1", confidence: "corroborated", sourceRefs: [{ source: P1, value: 18 }],
  },
  {
    id: "hanh_tay", canonicalVn: "Hành tây", labelEn: "Onion", group: "rau",
    kcal: 40, proteinG: 1.1, carbG: 9.3, fatG: 0.1, fiberG: 1.7,
    provenanceLevel: "P1", confidence: "corroborated", sourceRefs: [{ source: P1, value: 40 }],
  },
  {
    id: "can_tay", canonicalVn: "Cần tây", labelEn: "Celery", group: "rau",
    kcal: 16, proteinG: 0.7, carbG: 3.0, fatG: 0.2, fiberG: 1.6,
    provenanceLevel: "P5", confidence: "corroborated", sourceRefs: [{ source: "USDA", value: 16 }],
  },
  {
    id: "muop", canonicalVn: "Mướp", labelEn: "Luffa", group: "rau",
    kcal: 20, proteinG: 1.2, carbG: 4.4, fatG: 0.2, fiberG: 1.1,
    provenanceLevel: "P1", confidence: "corroborated", sourceRefs: [{ source: P1, value: 20 }],
  },

  // ── Gia vị / phụ (khối lượng nhỏ) ──
  {
    id: "nuoc_mam", canonicalVn: "Nước mắm", labelEn: "Fish sauce", group: "gia vị",
    kcal: 35, proteinG: 5.1, carbG: 3.6, fatG: 0, fiberG: 0,
    provenanceLevel: "P1", confidence: "corroborated", sourceRefs: [{ source: P1, value: 35 }],
  },
  {
    id: "duong", canonicalVn: "Đường", labelEn: "Sugar", group: "gia vị",
    kcal: 387, proteinG: 0, carbG: 100, fatG: 0, fiberG: 0,
    provenanceLevel: "P5", confidence: "corroborated", sourceRefs: [{ source: "USDA", value: 387 }],
  },
  {
    id: "dau_an", canonicalVn: "Dầu ăn", labelEn: "Cooking oil", group: "gia vị",
    kcal: 884, proteinG: 0, carbG: 0, fatG: 100, fiberG: 0,
    provenanceLevel: "P5", confidence: "corroborated", sourceRefs: [{ source: "USDA", value: 884 }],
  },
  {
    id: "nuoc_dua", canonicalVn: "Nước dừa", labelEn: "Coconut water", group: "gia vị",
    kcal: 19, proteinG: 0.7, carbG: 3.7, fatG: 0.2, fiberG: 1.1,
    provenanceLevel: "P5", confidence: "disputed",
    sourceRefs: [{ source: "USDA", value: 19 }, { source: P1, value: 24 }],
  },
  {
    id: "gung", canonicalVn: "Gừng", labelEn: "Ginger", group: "gia vị",
    kcal: 25, proteinG: 0.4, carbG: 5.9, fatG: 0.3, fiberG: 1.5,
    provenanceLevel: "P1", confidence: "corroborated", sourceRefs: [{ source: P1, value: 25 }],
  },
  {
    id: "me_chua", canonicalVn: "Me (chua)", labelEn: "Tamarind", group: "gia vị",
    kcal: 239, proteinG: 2.8, carbG: 62.5, fatG: 0.6, fiberG: 5.1,
    provenanceLevel: "P5", confidence: "disputed",
    sourceRefs: [{ source: "USDA", value: 239 }],
  },

  // ── Trái cây (tráng miệng) ──
  {
    id: "chuoi", canonicalVn: "Chuối", labelEn: "Banana", group: "trái cây",
    kcal: 89, proteinG: 1.1, carbG: 22.8, fatG: 0.3, fiberG: 2.6,
    provenanceLevel: "P1", confidence: "corroborated", sourceRefs: [{ source: P1, value: 89 }],
  },
  {
    id: "cam", canonicalVn: "Cam", labelEn: "Orange", group: "trái cây",
    kcal: 47, proteinG: 0.9, carbG: 11.8, fatG: 0.1, fiberG: 2.4,
    provenanceLevel: "P1", confidence: "corroborated", sourceRefs: [{ source: P1, value: 47 }],
  },
  {
    id: "dua_hau", canonicalVn: "Dưa hấu", labelEn: "Watermelon", group: "trái cây",
    kcal: 30, proteinG: 0.6, carbG: 7.6, fatG: 0.2, fiberG: 0.4,
    provenanceLevel: "P1", confidence: "corroborated", sourceRefs: [{ source: P1, value: 30 }],
  },
  {
    id: "thanh_long", canonicalVn: "Thanh long", labelEn: "Dragon fruit", group: "trái cây",
    kcal: 60, proteinG: 1.2, carbG: 13.0, fatG: 0, fiberG: 3.0,
    provenanceLevel: "P4", confidence: "corroborated", sourceRefs: [{ source: "FAO/INFOODS", value: 60 }],
  },
];

// Edible yield: fraction of purchased weight that ends up eaten (bone, shell,
// peel, trimming). Refinery R1 — the "mua ≠ ăn" distinction. Nutrition uses the
// edible grams in each dish line; the shopping list grosses up by this. Anything
// not listed defaults to 1.0 (boneless meat, fish fillet, dry goods, seasonings).
const EDIBLE_YIELD: Record<string, number> = {
  suon_heo: 0.6, // bone-in
  thit_ga: 0.66, // whole chicken, bone + skin discard
  ca_dieu_hong: 0.55, // whole fish → fillet
  ca_loc: 0.6,
  ca_thu: 0.65,
  tom: 0.6, // head + shell
  ghe: 0.38, // crab shell
  cua_dong: 0.35, // whole, ground + strained
  muc: 0.8,
  trung_ga: 0.88, // shell
  // leafy/veg trimming + fruit peel
  rau_muong: 0.85,
  cai_ngot: 0.85,
  bong_cai: 0.75,
  rau_lang: 0.8,
  rau_ngot: 0.75,
  rau_day: 0.8,
  mong_toi: 0.85,
  bi_xanh: 0.7,
  su_su: 0.8,
  muop: 0.75,
  hanh_tay: 0.9,
  chuoi: 0.65,
  cam: 0.72,
  dua_hau: 0.52,
  thanh_long: 0.6,
};

for (const c of COMMODITIES) c.edibleYield = EDIBLE_YIELD[c.id] ?? 1;

// Allergen tags (Phase A dietary). Kept minimal — the common Vietnamese-kitchen
// allergens present in the seed. Fish sauce carries fish.
const ALLERGENS: Record<string, Allergen[]> = {
  tom: ["shellfish"],
  ghe: ["shellfish"],
  cua_dong: ["shellfish"],
  muc: ["shellfish"],
  ca_dieu_hong: ["fish"],
  ca_thu: ["fish"],
  ca_loc: ["fish"],
  nuoc_mam: ["fish"],
  trung_ga: ["egg"],
  dau_hu: ["soy"],
};
for (const c of COMMODITIES) c.allergens = ALLERGENS[c.id];

export const COMMODITY_BY_ID: Record<string, Commodity> = Object.fromEntries(
  COMMODITIES.map((c) => [c.id, c]),
);

