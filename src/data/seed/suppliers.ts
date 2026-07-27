import type { Supplier } from "@/domain/types";

// Chain registry — SEED ONLY (households own their own suppliers, B1-style, added
// via the directory). These big chains are suggestions. Provenance discipline from
// the dataset: ≥2 independent current sources → corroborated; single/stale (Covid
// 2021) source → `needsVerify` (UI shows "cần xác minh"), never seeded as certain.
//
// Capability reality (dataset §2): chains are almost all `their_*` — the app can
// only OPEN their channel, not push an order into their cart. The high-value
// `zalo_chat` (neighbourhood shop) is added by the household, not seeded here.
export const SUPPLIER_REGISTRY: Supplier[] = [
  {
    id: "reg_bhx", name: "Bách Hoá Xanh", type: "sieu_thi", seed: true,
    channels: [
      { kind: "their_app_web", value: "https://www.bachhoaxanh.com", label: "bachhoaxanh.com" },
      { kind: "hotline", value: "1900 1908", label: "Tổng đài đặt hàng" },
    ],
    handles: ["thịt", "cá", "hải sản", "rau", "trái cây", "ngũ cốc", "gia vị"],
    sources: ["bachhoaxanh.com", "thegioididong 2026"],
  },
  {
    id: "reg_coopmart", name: "Co.opmart", type: "sieu_thi", seed: true,
    channels: [
      { kind: "their_zalo_oa", value: "Co.opmart - Bạn của mọi nhà", label: "Zalo OA" },
      { kind: "their_app_web", value: "https://cooponline.vn", label: "cooponline.vn / app Saigon Co.op" },
      { kind: "hotline", value: "1900 5555 68", label: "Tổng đài" },
    ],
    handles: ["thịt", "cá", "hải sản", "rau", "trái cây", "ngũ cốc", "gia vị"],
    sources: ["nld", "vnexpress", "zalopay", "Zalo Mini App official"],
  },
  {
    id: "reg_winmart", name: "WinMart / WinMart+", type: "sieu_thi", seed: true,
    channels: [{ kind: "their_app_web", value: "https://dicho.winmart.vn", label: "app VinID / dicho.winmart.vn" }],
    handles: ["thịt", "cá", "rau", "trái cây", "ngũ cốc", "gia vị"],
    sources: ["vinid.net official", "nld"],
  },
  {
    id: "reg_bigc", name: "Big C / GO!", type: "sieu_thi", seed: true,
    channels: [
      { kind: "their_zalo_oa", value: "Big C", label: "Zalo Big C" },
      { kind: "their_app_web", value: "GO! & Big C", label: "app GO!&Big C" },
      { kind: "hotline", value: "1900 1880", label: "Tổng đài" },
    ],
    handles: ["thịt", "cá", "hải sản", "rau", "trái cây", "ngũ cốc", "gia vị"],
    sources: ["voh", "nld"],
  },
  {
    id: "reg_grabmart", name: "GrabMart / ShopeeFood", type: "online", seed: true,
    channels: [{ kind: "their_app_web", value: "grab://mart", label: "app Grab / Shopee (đi chợ hộ)" }],
    handles: ["rau", "trái cây", "gia vị", "thịt", "cá"],
    sources: ["thoibaonganhang 2025"],
  },
  {
    id: "reg_aeon", name: "Aeon", type: "sieu_thi", seed: true, needsVerify: true,
    channels: [{ kind: "their_app_web", value: "GrabMart / ShopeeFood", label: "qua sàn giao" }],
    handles: ["thịt", "cá", "hải sản", "rau", "trái cây"],
    sources: ["nguồn 2021 — cần xác minh hiện hành"],
  },
  {
    id: "reg_convenience", name: "Cửa hàng tiện lợi (Circle K / GS25 / FamilyMart)", type: "sieu_thi", seed: true, needsVerify: true,
    channels: [{ kind: "their_app_web", value: "app riêng / GrabMart / ShopeeFood", label: "app / sàn" }],
    handles: ["gia vị", "trái cây"],
    sources: ["nguồn 2021 — không phải grocery gia đình chính"],
  },
];

export const SUPPLIER_REGISTRY_BY_ID: Record<string, Supplier> = Object.fromEntries(
  SUPPLIER_REGISTRY.map((s) => [s.id, s]),
);
