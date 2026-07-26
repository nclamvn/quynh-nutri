import type { Dish, DishLine, ProteinType, CookMethod, Slot } from "@/domain/types";
import { slotTarget, CONDIMENT } from "./portions";

// B0 — repertoire phổ dụng (system seed), REFINED (R3).
// Quantities are EDIBLE grams for baseServings=4 (default 2 adults + 2 children
// = 3.2 adult-equivalents), DERIVED from the portion model (portions.ts) rather
// than hand-picked. The shopping list grosses these up by each commodity's
// edibleYield (bone/shell/peel). Condiments season the pot and are not AE-scaled.

const AE = 3.2; // 2 adults (1.0) + 2 children (0.6)
const MAN = slotTarget("MAN", AE); // 352 — primary protein, edible
const RAU = slotTarget("RAU", AE); // 352 — veg side, edible
const CANH_V = slotTarget("CANH", AE); // 208 — soup veg
const CANH_P = 96; // soup protein (30/AE)
const COM = slotTarget("COM", AE); // 640 — cooked rice
const TM = slotTarget("TRANGMIENG", AE); // 576 — fruit
const r = Math.round;

type L = [commodityId: string, qtyBase: number, unit?: string];

function dish(
  id: string,
  vnName: string,
  enLabel: string,
  proteinType: ProteinType,
  method: CookMethod,
  slot: Slot,
  opts: { quick?: boolean; cookTimeMin?: number; tags?: string[]; lines: L[] },
): Dish {
  const lines: DishLine[] = opts.lines.map(([commodityId, qtyBase, unit = "g"]) => ({
    commodityId,
    qtyBase,
    unit,
  }));
  return {
    id, vnName, enLabel, proteinType, method, slot,
    quick: opts.quick ?? false,
    baseServings: 4,
    cookTimeMin: opts.cookTimeMin,
    tags: opts.tags,
    lines,
    origin: "B0",
  };
}

const { nuoc_mam, duong, dau_an, gung, me_chua, nuoc_dua, hanh_tay, ca_chua } = CONDIMENT;

export const REPERTOIRE: Dish[] = [
  // ─────────────── CƠM (nền) ───────────────
  dish("com_trang", "Cơm trắng", "Steamed rice", "rau", "luoc", "COM", {
    quick: true, lines: [["com_trang", COM]],
  }),

  // ─────────────── MẶN (24) — main protein = MAN edible ───────────────
  dish("thit_kho_trung", "Thịt kho trứng", "Braised pork & eggs", "heo", "kho", "MAN", {
    cookTimeMin: 45, lines: [["thit_ba_chi", r(MAN * 0.7)], ["trung_ga", 150], ["nuoc_dua", nuoc_dua], ["nuoc_mam", nuoc_mam], ["duong", duong]],
  }),
  dish("ba_chi_luoc", "Ba chỉ luộc mắm tôm", "Boiled pork belly", "heo", "luoc", "MAN", {
    quick: true, cookTimeMin: 20, lines: [["thit_ba_chi", MAN], ["nuoc_mam", nuoc_mam]],
  }),
  dish("suon_xao_chua_ngot", "Sườn xào chua ngọt", "Sweet & sour ribs", "heo", "xao", "MAN", {
    cookTimeMin: 35, lines: [["suon_heo", MAN], ["ca_chua", ca_chua], ["hanh_tay", hanh_tay], ["duong", duong], ["dau_an", dau_an]],
  }),
  dish("suon_nuong", "Sườn nướng", "Grilled ribs", "heo", "nuong", "MAN", {
    cookTimeMin: 40, lines: [["suon_heo", MAN], ["duong", duong], ["nuoc_mam", nuoc_mam]],
  }),
  dish("thit_bam_xao_muop", "Thịt băm xào mướp", "Minced pork & luffa", "heo", "xao", "MAN", {
    quick: true, cookTimeMin: 20, lines: [["thit_heo_nac", r(MAN * 0.7)], ["muop", 250], ["dau_an", dau_an]],
  }),
  dish("bo_xao_can", "Bò xào cần tây", "Beef & celery stir-fry", "bo", "xao", "MAN", {
    quick: true, cookTimeMin: 20, lines: [["thit_bo", MAN], ["can_tay", 150], ["hanh_tay", hanh_tay], ["dau_an", dau_an]],
  }),
  dish("bo_kho", "Bò kho", "Beef stew", "bo", "kho", "MAN", {
    cookTimeMin: 60, lines: [["thit_bo", MAN], ["ca_chua", ca_chua], ["hanh_tay", hanh_tay], ["dau_an", dau_an]],
  }),
  dish("bo_luc_lac", "Bò lúc lắc", "Shaking beef", "bo", "xao", "MAN", {
    quick: true, cookTimeMin: 20, lines: [["thit_bo", MAN], ["hanh_tay", hanh_tay], ["dau_an", dau_an]],
  }),
  dish("ga_kho_gung", "Gà kho gừng", "Ginger braised chicken", "ga", "kho", "MAN", {
    cookTimeMin: 35, lines: [["thit_ga", MAN], ["gung", gung], ["nuoc_mam", nuoc_mam], ["duong", duong]],
  }),
  dish("ga_luoc", "Gà luộc", "Boiled chicken", "ga", "luoc", "MAN", {
    quick: true, cookTimeMin: 25, lines: [["thit_ga", MAN]],
  }),
  dish("ga_rang_muoi", "Gà rang muối", "Salt-fried chicken", "ga", "ran", "MAN", {
    cookTimeMin: 35, lines: [["thit_ga", MAN], ["dau_an", r(dau_an * 2)]],
  }),
  dish("ga_kho_nuoc_dua", "Gà kho nước dừa", "Coconut braised chicken", "ga", "kho", "MAN", {
    cookTimeMin: 40, lines: [["thit_ga", MAN], ["nuoc_dua", nuoc_dua], ["nuoc_mam", nuoc_mam]],
  }),
  dish("ca_kho_to", "Cá kho tộ", "Clay-pot braised fish", "ca", "kho", "MAN", {
    cookTimeMin: 40, lines: [["ca_dieu_hong", MAN], ["nuoc_dua", r(nuoc_dua / 2)], ["nuoc_mam", nuoc_mam], ["duong", duong]],
  }),
  dish("ca_chien_sot_ca", "Cá chiên sốt cà", "Fried fish, tomato sauce", "ca", "ran", "MAN", {
    quick: true, cookTimeMin: 25, lines: [["ca_dieu_hong", MAN], ["ca_chua", ca_chua], ["dau_an", r(dau_an * 2)]],
  }),
  dish("ca_nuong", "Cá nướng", "Grilled fish", "ca", "nuong", "MAN", {
    quick: true, cookTimeMin: 25, lines: [["ca_thu", MAN], ["nuoc_mam", nuoc_mam]],
  }),
  dish("ca_hap_xi_dau", "Cá hấp xì dầu", "Steamed fish", "ca", "hap", "MAN", {
    quick: true, cookTimeMin: 25, lines: [["ca_dieu_hong", MAN], ["gung", gung]],
  }),
  dish("tom_rim_thit", "Tôm rim thịt ba chỉ", "Braised shrimp & pork", "tom", "kho", "MAN", {
    cookTimeMin: 30, lines: [["tom", r(MAN * 0.7)], ["thit_ba_chi", 120], ["nuoc_mam", nuoc_mam], ["duong", duong]],
  }),
  dish("tom_rang", "Tôm rang", "Stir-fried shrimp", "tom", "xao", "MAN", {
    quick: true, cookTimeMin: 20, lines: [["tom", MAN], ["dau_an", dau_an]],
  }),
  dish("tom_hap", "Tôm hấp", "Steamed shrimp", "tom", "hap", "MAN", {
    quick: true, cookTimeMin: 15, lines: [["tom", MAN]],
  }),
  dish("ghe_hap", "Ghẹ hấp", "Steamed crab", "cua", "hap", "MAN", {
    quick: true, cookTimeMin: 20, lines: [["ghe", MAN]],
  }),
  dish("cua_rang_me", "Ghẹ rang me", "Tamarind crab", "cua", "xao", "MAN", {
    cookTimeMin: 30, lines: [["ghe", MAN], ["me_chua", me_chua], ["duong", duong], ["dau_an", dau_an]],
  }),
  dish("trung_chien", "Trứng chiên", "Fried eggs", "trung", "ran", "MAN", {
    quick: true, cookTimeMin: 10, lines: [["trung_ga", r(MAN * 0.8)], ["hanh_tay", 50], ["dau_an", dau_an]],
  }),
  dish("trung_hap_thit", "Trứng hấp thịt", "Steamed egg & pork", "trung", "hap", "MAN", {
    quick: true, cookTimeMin: 20, lines: [["trung_ga", r(MAN * 0.6)], ["thit_heo_nac", 140]],
  }),
  dish("dau_hu_sot_ca", "Đậu hũ nhồi thịt sốt cà", "Stuffed tofu, tomato", "dau", "xao", "MAN", {
    cookTimeMin: 30, lines: [["dau_hu", r(MAN * 0.8)], ["thit_heo_nac", 100], ["ca_chua", ca_chua], ["dau_an", dau_an]],
  }),

  // ─────────────── RAU (10) — veg = RAU edible ───────────────
  dish("rau_muong_xao_toi", "Rau muống xào tỏi", "Garlic water spinach", "rau", "xao", "RAU", {
    quick: true, cookTimeMin: 12, lines: [["rau_muong", RAU], ["dau_an", dau_an]],
  }),
  dish("cai_ngot_luoc", "Cải ngọt luộc", "Boiled choy sum", "rau", "luoc", "RAU", {
    quick: true, cookTimeMin: 10, lines: [["cai_ngot", RAU]],
  }),
  dish("bong_cai_xao", "Bông cải xào", "Stir-fried cauliflower", "rau", "xao", "RAU", {
    quick: true, cookTimeMin: 15, lines: [["bong_cai", RAU], ["dau_an", dau_an]],
  }),
  dish("gia_do_xao", "Giá đỗ xào", "Stir-fried bean sprouts", "rau", "xao", "RAU", {
    quick: true, cookTimeMin: 10, lines: [["gia_do", RAU], ["dau_an", dau_an]],
  }),
  dish("bi_xanh_luoc", "Bí xanh luộc", "Boiled winter melon", "rau", "luoc", "RAU", {
    quick: true, cookTimeMin: 12, lines: [["bi_xanh", RAU]],
  }),
  dish("rau_lang_luoc", "Rau lang luộc", "Boiled sweet potato leaves", "rau", "luoc", "RAU", {
    quick: true, cookTimeMin: 10, lines: [["rau_lang", RAU]],
  }),
  dish("su_su_luoc", "Su su luộc", "Boiled chayote", "rau", "luoc", "RAU", {
    quick: true, cookTimeMin: 12, lines: [["su_su", RAU]],
  }),
  dish("mong_toi_luoc", "Mồng tơi luộc", "Boiled malabar spinach", "rau", "luoc", "RAU", {
    quick: true, cookTimeMin: 10, lines: [["mong_toi", RAU]],
  }),
  dish("rau_muong_luoc", "Rau muống luộc", "Boiled water spinach", "rau", "luoc", "RAU", {
    quick: true, cookTimeMin: 10, lines: [["rau_muong", RAU]],
  }),
  dish("cai_ngot_xao", "Cải ngọt xào", "Stir-fried choy sum", "rau", "xao", "RAU", {
    quick: true, cookTimeMin: 12, lines: [["cai_ngot", RAU], ["dau_an", dau_an]],
  }),

  // ─────────────── CANH (10) — veg = CANH_V, protein = CANH_P ───────────────
  dish("canh_rau_ngot_thit", "Canh rau ngót thịt băm", "Katuk & pork soup", "rau", "luoc", "CANH", {
    quick: true, cookTimeMin: 15, tags: ["thanh"], lines: [["rau_ngot", CANH_V], ["thit_heo_nac", CANH_P]],
  }),
  dish("canh_bi_dao_tom", "Canh bí đao tôm", "Winter melon & shrimp soup", "rau", "luoc", "CANH", {
    cookTimeMin: 20, tags: ["thanh"], lines: [["bi_xanh", CANH_V], ["tom", CANH_P]],
  }),
  dish("canh_cai_thit", "Canh cải thịt băm", "Greens & pork soup", "rau", "luoc", "CANH", {
    quick: true, cookTimeMin: 15, tags: ["thanh"], lines: [["cai_ngot", CANH_V], ["thit_heo_nac", CANH_P]],
  }),
  dish("canh_chua_ca", "Canh chua cá", "Sour fish soup", "rau", "luoc", "CANH", {
    cookTimeMin: 30, tags: ["dam"], lines: [["ca_loc", r(CANH_P * 2)], ["ca_chua", 100], ["me_chua", me_chua], ["gia_do", 100]],
  }),
  dish("canh_cua_rau_day", "Canh cua rau đay", "Field crab & jute soup", "rau", "luoc", "CANH", {
    cookTimeMin: 30, tags: ["dam"], lines: [["cua_dong", CANH_P], ["rau_day", CANH_V], ["mong_toi", 80]],
  }),
  dish("canh_rieu_cua", "Canh riêu cua", "Crab riêu soup", "rau", "luoc", "CANH", {
    cookTimeMin: 35, tags: ["dam"], lines: [["cua_dong", CANH_P], ["ca_chua", ca_chua]],
  }),
  dish("canh_mong_toi_tom", "Canh mồng tơi tôm", "Malabar spinach & shrimp", "rau", "luoc", "CANH", {
    quick: true, cookTimeMin: 15, tags: ["thanh"], lines: [["mong_toi", CANH_V], ["tom", r(CANH_P * 0.8)]],
  }),
  dish("canh_su_su_suon", "Canh su su sườn", "Chayote & rib soup", "rau", "luoc", "CANH", {
    cookTimeMin: 40, tags: ["thanh"], lines: [["su_su", CANH_V], ["suon_heo", r(CANH_P * 1.6)]],
  }),
  dish("canh_rau_muong_toi", "Canh rau muống", "Water spinach soup", "rau", "luoc", "CANH", {
    quick: true, cookTimeMin: 12, tags: ["thanh"], lines: [["rau_muong", CANH_V]],
  }),
  dish("canh_bi_xanh_suon", "Canh bí xanh sườn", "Winter melon & rib soup", "rau", "luoc", "CANH", {
    cookTimeMin: 40, tags: ["thanh"], lines: [["bi_xanh", CANH_V], ["suon_heo", r(CANH_P * 1.6)]],
  }),

  // ─────────────── TRÁNG MIỆNG (4) — fruit = TM edible ───────────────
  dish("tm_chuoi", "Chuối", "Banana", "rau", "song", "TRANGMIENG", { quick: true, lines: [["chuoi", TM]] }),
  dish("tm_cam", "Cam", "Orange", "rau", "song", "TRANGMIENG", { quick: true, lines: [["cam", TM]] }),
  dish("tm_dua_hau", "Dưa hấu", "Watermelon", "rau", "song", "TRANGMIENG", { quick: true, lines: [["dua_hau", TM]] }),
  dish("tm_thanh_long", "Thanh long", "Dragon fruit", "rau", "song", "TRANGMIENG", { quick: true, lines: [["thanh_long", TM]] }),
];

export const REPERTOIRE_BY_ID: Record<string, Dish> = Object.fromEntries(
  REPERTOIRE.map((d) => [d.id, d]),
);

export const REPERTOIRE_BY_SLOT: Record<Slot, Dish[]> = REPERTOIRE.reduce(
  (acc, d) => {
    (acc[d.slot] ??= []).push(d);
    return acc;
  },
  {} as Record<Slot, Dish[]>,
);
