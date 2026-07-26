import type { Dish, ProteinType, Slot } from "@/domain/types";

// Dish → image. PRIMARY: a real food photo (public/dishes/photos/{category}.jpg,
// self-hosted, tone-consistent Asian home cooking). FALLBACK: the internal SVG
// (public/dishes/*.svg) if a photo is missing/broken. Decision (TIP-UI-8 +
// polish): "nhất-quán-tông hơn khớp-đúng-món" — one on-tone photo per category
// beats an off-tone exact match; SVG guarantees no broken/empty cell.

const PHOTO_BASE = "/dishes/photos";
const SVG_BASE = "/dishes";

// ── Photo category (real photos) ──
const PHOTO_BY_PROTEIN: Record<ProteinType, string> = {
  ca: "ca", ga: "ga", bo: "bo", tom: "tom", cua: "cua",
  heo: "heo", trung: "trung", dau: "dau", rau: "rau",
};

function photoCategory(dish: Pick<Dish, "slot" | "method" | "proteinType">): string {
  if (dish.slot === "COM") return "com";
  if (dish.slot === "TRANGMIENG") return "traicay";
  if (dish.slot === "CANH") return "canh";
  if (dish.slot === "RAU") return "rau";
  // MAN — method wins for braise/grill (distinct look), else by protein
  if (dish.method === "kho") return "kho";
  if (dish.method === "nuong") return "nuong";
  return PHOTO_BY_PROTEIN[dish.proteinType] ?? "man";
}

export function dishPhoto(dish: Pick<Dish, "slot" | "method" | "proteinType">): string {
  return `${PHOTO_BASE}/${photoCategory(dish)}.jpg`;
}

// ── SVG fallback (illustrations) ──
const SVG_DIRECT: Record<string, string> = {
  com_trang: "com-trang", thit_kho_trung: "thit-kho-tau", ca_kho_to: "ca-kho-to",
  ca_chien_sot_ca: "ca-chien-sot-ca", ga_kho_gung: "ga-kho-sa", ga_kho_nuoc_dua: "ga-kho-sa",
  ga_rang_muoi: "ga-nuong-mat-ong", ga_luoc: "ga-nuong-mat-ong", bo_xao_can: "bo-xao-hanh-tay",
  bo_luc_lac: "bo-xao-hanh-tay", bo_kho: "bo-xao-hanh-tay", rau_muong_xao_toi: "rau-muong-xao",
  rau_muong_luoc: "rau-muong-xao", tom_rang: "tom-rang-me", cua_rang_me: "tom-rang-me",
  canh_chua_ca: "canh-chua-ca", canh_bi_xanh_suon: "canh-bi-do", canh_bi_dao_tom: "canh-bi-do",
};
const SVG_PROTEIN: Record<ProteinType, string> = {
  ca: "ca-kho-to", ga: "ga-kho-sa", bo: "bo-xao-hanh-tay", tom: "tom-rang-me", cua: "tom-rang-me",
  heo: "thit-kho-tau", trung: "thit-kho-tau", dau: "thit-kho-tau", rau: "rau-muong-xao",
};
const SVG_SLOT: Record<Slot, string> = {
  COM: "com-trang", RAU: "rau-muong-xao", CANH: "canh-bi-do", TRANGMIENG: "trai-cay", MAN: "thit-kho-tau",
};

export function dishSvg(dish: Pick<Dish, "id" | "slot" | "proteinType">): string {
  const name = SVG_DIRECT[dish.id] ?? (dish.slot === "MAN" ? SVG_PROTEIN[dish.proteinType] : SVG_SLOT[dish.slot]) ?? SVG_SLOT[dish.slot];
  return `${SVG_BASE}/${name}.svg`;
}
