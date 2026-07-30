# Bữa cơm nhà — Meal SOT

Kế hoạch bữa cơm gia đình Việt: **định lượng có nguồn**, xoay món thông minh, đi chợ gọn.
Điểm khác ChatGPT: mọi con số dinh dưỡng **tự khai độ chắc** (provenance), không phán số chính xác giả.

Xây theo khế ước **BLUEPRINT Meal SOT v1** (Vision → INTAKE-SEED → Blueprint → TIPs).

## Chạy

```bash
npm install
npm run dev        # http://localhost:3000 (landing); app tại /overview
npm test           # unit tests (domain + security helpers)
npm run lint       # React 19 / Next.js lint gate
npm run test:e2e   # Playwright, DB-isolated + auth/AI/geocode mocks
npm run build      # production build
```

Runtime production dùng Clerk + Neon Postgres. E2E dùng adapter bộ nhớ và có
tripwire cấm Prisma, nên auth bypass không thể chạm database thật.

## Kiến trúc 3 lớp (bất biến override 2 tầng)

| Lớp | Nội dung | Sở hữu | Provenance |
|-----|----------|--------|-----------|
| **A** — commodity | macro/100g nguyên liệu + provenance | hệ thống | thấp → đối chiếu |
| **B0** — repertoire | ~45 món phổ dụng (seed) | hệ thống | thấp (default) |
| **B1** — household | món/định lượng/vendor của hộ | hộ | **cao (ground truth)** |

Luật: `B1 ⊳ B0` (tầng món) và `family ⊳ commodity` (tầng nguyên liệu) — cùng một invariant, hiện diện hai lần. Macro món luôn **dẫn xuất** từ A (single-source): sửa một số ở A → mọi món tự tính lại.

## Bản đồ mã → REQ

```
src/domain/nutrition/   R-NUT-* · R-PROV-1   calculator, d3-gate (3 bậc), adequacy, groups
src/domain/rotation/    R-PLAN-*             engine (5 luật + precedence khi vô nghiệm), rng
src/domain/shopping/    R-SHOP-*             aggregator (gộp vendor + tách chuyến + diff tick)
src/domain/dish/        R-DISH-1             resolver (B1 ⊳ B0)
src/data/seed/          R-A* · R-B0/B1       commodity(A) · repertoire(B0) · household · needs(2016) · sources
src/app/(tabs)/         R-RESP-1 · R-PLAN-3  app shell + overview/week/shopping/suppliers/dishes/nutrition/health/reports…
src/app/api/            R-DISH-2 · R-SUB-1   import-dish (Claude+mock) · substitute (deterministic)
src/ui/                 R-THEME-1 · R-PROV-1 tokens, ProvenanceChip (signature), TabBar, i18n VN/EN
prisma/                 —                    schema contract + seed script (chạy khi có Postgres)
public/                 R-PWA-1              manifest + service worker (offline-read)
```

## Cửa D3 — trung thực độ chắc (3 bậc, config)

Coverage = tỉ lệ **khối lượng** nguyên liệu `corroborated`. Ngưỡng ở `src/domain/nutrition/config.ts` (env override):

- `≥ 85%` → **số** + badge độ phủ
- `60–85%` → **số neo trong khoảng** (`≈540 (500–580)`)
- `< 60%` → **chỉ khoảng** + badge "ước lượng"

Hiển thị theo **đủ/thiếu** so Nhu cầu 2016 (adequacy) — không "vượt/kiêng" (an toàn cho hộ có mẹ sau sinh). Thiếu dữ liệu = **xám**, không đỏ (thiếu data không phải lỗi).

## Design (D4)

Cố ý **né cluster AI-slop** cream #F4F1EA + terracotta #D97757. Palette kéo từ subject: **herb green #2F6E4F** (rau tươi = đủ chất), **turmeric #B7822A** (badge ước lượng). **Inter** toàn text (VN/EN đủ dấu); **Geist Mono tabular** cho mọi con số — số đọc như *dữ liệu*. Signature = **provenance chip** trên mọi con số.

## Deviations (Thợ tự quyết, cần Human biết)

1. **SOT nền là typed seed; trạng thái hộ và thực đơn tuần ở Postgres.** Commodity/repertoire/supplier registry sống trong `src/data/seed/*.ts`. Household, members, favorites, notes, pantry, suppliers, orders, purchases và canonical WeekPlan đi qua Clerk-scoped repo → Neon. Món B1 đang được plan tham chiếu được lưu cùng aggregate; thư viện B1 chưa chọn vẫn ở localStorage theo household.
2. **~~Repertoire là skeleton~~ → ĐÃ REFINE (campaign R1–R4).** Định lượng từng món giờ **dẫn xuất từ portion model có nguồn** (`src/data/seed/portions.ts`: khẩu phần/adult-equivalent theo Nhu cầu 2016), không phải gram ad-hoc. Thêm **`edibleYield`** phân biệt *mua ≠ ăn* (xương/vỏ/vỏ trái): dish lines = gram ăn được (nuôi nutrition đúng), shopping gross-up theo yield. Commodity disputed/honest_null được đối chiếu web thật (USDA + nguồn VN): cua đồng → corroborated; sườn/nước dừa/mực giữ `disputed` (vênh VN↔quốc tế). Báo cáo D3 trên 49 món: **number 42 · anchored 3 · range 4** (`refinery.test.ts`).
3. **AI đi qua Vercel AI Gateway; E2E luôn mock.** Assistant/import/mood framing dùng model qua gateway; con số vẫn do engine thuần xác định. Import URL có SSRF guard, redirect validation, timeout và giới hạn body. `substitute` thuần deterministic.
4. **PWA + auth đã hoạt động.** Clerk scope mỗi user vào một household Neon. Proxy chỉ làm redirect lạc quan; layout, API, Server Actions và repo đều kiểm tra auth độc lập.
5. **Next 16 (không phải 15)** — scaffold hiện hành; Tailwind v4 CSS-first.
6. **Kitchen execution đã phủ 49/49 món B0.** Cooking Mode và “Chuẩn bị cho
   ngày mai” dùng registry song ngữ đã rà soát; ngưỡng an toàn lấy từ
   FoodSafety.gov/FDA. Món B1 hoặc ID lạ chưa có nội dung vẫn fail-closed, không
   được AI tự sinh hướng dẫn.
7. **Đề xuất thực đơn của trợ lý không tự ghi.** Máy chủ tạo candidate theo
   plan version và engine tất định; UI hiển thị toàn bộ diff trước/sau. Chỉ nút
   xác nhận riêng mới gọi mutation, payload bị sửa hoặc proposal stale đều bị
   từ chối thay vì tự rebase.

## Còn lại (phase sau)

Persist toàn bộ thư viện B1 chưa được chọn và shopping ticks · vertical mẹ sau sinh sâu · import ảnh/giọng nói · purchase analytics.
