import type { Supplier } from "@/domain/types";

// Chain registry — SEED ONLY (households own their own suppliers, B1-style, added
// via the directory). These big chains are suggestions. Provenance discipline from
// the supplier refinery (refinery/suppliers/REVIEW.md, 2026-07): a field is trusted
// only with ≥2 independent current sources; single/stale/legacy → `needsVerify`
// (UI shows "cần xác minh"). NO fabricated branch address/phone/coordinates — chains
// carry a `storeLocatorUrl` (official branch finder) instead of a fake single pin.
//
// Capability reality: chains are almost all `their_*` — the app can only OPEN their
// channel, not push an order into their cart. The high-value `zalo_chat`
// (neighbourhood shop) is added by the household, not seeded here.
export const SUPPLIER_REGISTRY: Supplier[] = [
  {
    id: "reg_bhx", name: "Bách Hoá Xanh", type: "sieu_thi", seed: true, needsVerify: true,
    channels: [
      { kind: "their_app_web", value: "https://www.bachhoaxanh.com", label: "bachhoaxanh.com" },
      { kind: "hotline", value: "1900 1908", label: "Tổng đài đặt hàng" },
    ],
    storeLocatorUrl: "https://www.bachhoaxanh.com/he-thong-cua-hang",
    handles: ["thịt", "cá", "hải sản", "rau", "trái cây", "ngũ cốc", "gia vị"],
    // needsVerify: locator + web/app corroborated, but the order hotline and the
    // per-store Zalo model are not fully confirmed.
    sources: ["bachhoaxanh.com/he-thong-cua-hang", "bachhoaxanh.com (footer)", "thegioididong.com"],
  },
  {
    id: "reg_coopmart", name: "Co.opmart", type: "sieu_thi", seed: true,
    channels: [
      { kind: "their_zalo_oa", value: "Co.opmart - Bạn của mọi nhà", label: "Zalo OA" },
      { kind: "their_app_web", value: "https://cooponline.vn", label: "cooponline.vn / app Co.op Online" },
      { kind: "hotline", value: "1900 5555 68", label: "Tổng đài (phím 1: đặt hàng)" },
    ],
    storeLocatorUrl: "https://co-opmart.com.vn/he-thong-sieu-thi",
    shipFee: "Miễn phí đơn ≥200.000đ trong 6km",
    handles: ["thịt", "cá", "hải sản", "rau", "trái cây", "ngũ cốc", "gia vị"],
    sources: ["co-opmart.com.vn/he-thong-sieu-thi", "cooponline.vn/chinh-sach-giao-hang", "cooponline.vn"],
  },
  {
    id: "reg_winmart", name: "WinMart / WinMart+", type: "sieu_thi", seed: true, needsVerify: true,
    channels: [
      { kind: "their_app_web", value: "https://winmart.vn", label: "winmart.vn / app WIN" },
      { kind: "hotline", value: "024 7106 6866", label: "Tổng đài (8h–21h)" },
    ],
    shipFee: "Miễn phí đơn ≥300.000đ (bán kính ~5km)",
    handles: ["thịt", "cá", "rau", "trái cây", "ngũ cốc", "gia vị"],
    // needsVerify: ordering moved from VinID → Masan "WIN" app; no confirmed web
    // store-locator (branch finder lives inside the app).
    sources: ["winmart.vn/info/delivery-policy", "thewinx.com.vn", "bnews.vn"],
  },
  {
    id: "reg_bigc", name: "Big C / GO!", type: "sieu_thi", seed: true,
    channels: [
      { kind: "their_zalo_oa", value: "Đại Siêu thị GO & Big C", label: "Zalo OA (đặt hàng)" },
      { kind: "their_app_web", value: "https://sieuthi-go.vn", label: "app GO! & Big C / sieuthi-go.vn" },
      { kind: "hotline", value: "1900 1880", label: "Tổng đài (8h–21h)" },
    ],
    storeLocatorUrl: "https://sieuthi-go.vn/about-us/store.html",
    shipFee: "Miễn phí đơn ≥300.000đ",
    handles: ["thịt", "cá", "hải sản", "rau", "trái cây", "ngũ cốc", "gia vị"],
    sources: ["sieuthi-go.vn/about-us/store.html", "zalopay.vn (GO!/Big C)", "go-vietnam.vn"],
  },
  {
    id: "reg_grabmart", name: "GrabMart / ShopeeFood", type: "online", seed: true, needsVerify: true,
    channels: [{ kind: "their_app_web", value: "https://www.grab.com/vn/en/mart/", label: "app Grab / Shopee (đi chợ hộ)" }],
    storeLocatorUrl: "https://www.grab.com/vn/en/mart/",
    handles: ["rau", "trái cây", "gia vị", "thịt", "cá"],
    // needsVerify: app-based đi-chợ-hộ, no official hotline; ship fees not published.
    sources: ["grab.com/vn/en/mart", "vietnamplus.vn"],
  },
  {
    id: "reg_aeon", name: "Aeon", type: "sieu_thi", seed: true,
    channels: [
      { kind: "their_app_web", value: "https://aeoneshop.com", label: "aeoneshop.com / app AEON" },
      { kind: "hotline", value: "1800 888 699", label: "Tổng đài đặt hàng (miễn phí)" },
    ],
    storeLocatorUrl: "https://www.aeon.com.vn/en/aeon-stores",
    shipFee: "Miễn phí: ≥300k trong 10km · ≥1tr trong 20km · ≥2tr trong 30km",
    hours: "GMS ~08:00–22:00 (tuỳ chi nhánh)",
    handles: ["thịt", "cá", "hải sản", "rau", "trái cây", "ngũ cốc", "gia vị"],
    sources: ["aeon.com.vn/en/aeon-stores", "aeoneshop.com/t/policy-on-transportation…", "corp.aeon.com.vn"],
  },
  {
    id: "reg_circlek", name: "Circle K", type: "tiem", seed: true,
    channels: [
      { kind: "their_app_web", value: "https://www.circlek.com.vn", label: "app CK Go / circlek.com.vn" },
      { kind: "hotline", value: "1900 3110", label: "Tổng đài" },
    ],
    storeLocatorUrl: "https://www.circlek.com.vn/vi/he-thong-circle-k/",
    hours: "24/7",
    handles: ["gia vị", "trái cây"],
    sources: ["circlek.com.vn/vi/he-thong-circle-k", "circlek.com.vn/ckgo"],
  },
  {
    id: "reg_gs25", name: "GS25", type: "tiem", seed: true,
    channels: [{ kind: "their_app_web", value: "https://gs25.com.vn", label: "app GS25 VN / gs25.com.vn" }],
    storeLocatorUrl: "https://gs25.com.vn/store/",
    hours: "24/7",
    handles: ["gia vị", "trái cây"],
    sources: ["gs25.com.vn/store", "gs25.com.vn/contact-us"],
  },
  {
    id: "reg_familymart", name: "FamilyMart", type: "tiem", seed: true, needsVerify: true,
    channels: [{ kind: "their_app_web", value: "https://famima.vn", label: "famima.vn (giao qua ShopeeFood/Grab)" }],
    storeLocatorUrl: "https://famima.vn/branches",
    handles: ["gia vị", "trái cây"],
    // needsVerify: locator + delivery-via-ShopeeFood/Grab corroborated, but the CSKH
    // hotline and 24/7 hours are single-source — do NOT assert them.
    sources: ["famima.vn/branches", "shopeefood.vn (FamilyMart)", "USDA FAS 2024 retail report"],
  },
];

export const SUPPLIER_REGISTRY_BY_ID: Record<string, Supplier> = Object.fromEntries(
  SUPPLIER_REGISTRY.map((s) => [s.id, s]),
);
