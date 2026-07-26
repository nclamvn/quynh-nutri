import type { Dish, ProteinType, Slot } from "@/domain/types";

// Dish → internal SVG illustration (public/dishes/*). Decision (TIP-UI-8): SVG
// nội bộ cho v1 — nhất quán tông, không rủi ro bản quyền. Ảnh chụp thật khi có
// bộ của Quỳnh. "Nhất quán tông hơn khớp-đúng-món": a same-style stand-in beats
// an off-tone exact match, so unmapped dishes fall back by slot/protein.

const BASE = "/dishes";

// Explicit id → asset (closest real illustration available).
const DIRECT: Record<string, string> = {
  com_trang: "com-trang",
  thit_kho_trung: "thit-kho-tau",
  ca_kho_to: "ca-kho-to",
  ca_chien_sot_ca: "ca-chien-sot-ca",
  ga_kho_gung: "ga-kho-sa",
  ga_kho_nuoc_dua: "ga-kho-sa",
  ga_rang_muoi: "ga-nuong-mat-ong",
  ga_luoc: "ga-nuong-mat-ong",
  bo_xao_can: "bo-xao-hanh-tay",
  bo_luc_lac: "bo-xao-hanh-tay",
  bo_kho: "bo-xao-hanh-tay",
  rau_muong_xao_toi: "rau-muong-xao",
  rau_muong_luoc: "rau-muong-xao",
  tom_rang: "tom-rang-me",
  cua_rang_me: "tom-rang-me",
  canh_chua_ca: "canh-chua-ca",
  canh_bi_xanh_suon: "canh-bi-do",
  canh_bi_dao_tom: "canh-bi-do",
};

const PROTEIN_FALLBACK: Record<ProteinType, string> = {
  ca: "ca-kho-to",
  ga: "ga-kho-sa",
  bo: "bo-xao-hanh-tay",
  tom: "tom-rang-me",
  cua: "tom-rang-me",
  heo: "thit-kho-tau",
  trung: "thit-kho-tau",
  dau: "thit-kho-tau",
  rau: "rau-muong-xao",
};

const SLOT_FALLBACK: Record<Slot, string> = {
  COM: "com-trang",
  RAU: "rau-muong-xao",
  CANH: "canh-bi-do",
  TRANGMIENG: "trai-cay",
  MAN: "thit-kho-tau",
};

export function dishImage(dish: Pick<Dish, "id" | "slot" | "proteinType">): string {
  const name =
    DIRECT[dish.id] ??
    (dish.slot === "MAN" ? PROTEIN_FALLBACK[dish.proteinType] : SLOT_FALLBACK[dish.slot]) ??
    SLOT_FALLBACK[dish.slot];
  return `${BASE}/${name}.svg`;
}
