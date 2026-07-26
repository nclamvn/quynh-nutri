# Bữa cơm nhà — Meal SOT

Kế hoạch bữa cơm gia đình Việt: **định lượng có nguồn**, xoay món thông minh, đi chợ gọn.
Điểm khác ChatGPT: mọi con số dinh dưỡng **tự khai độ chắc** (provenance), không phán số chính xác giả.

Xây theo khế ước **BLUEPRINT Meal SOT v1** (Vision → INTAKE-SEED → Blueprint → TIPs).

## Chạy

```bash
npm install
npm run dev        # http://localhost:3000  → /week
npm test           # 36 unit tests (domain thuần)
npm run build      # production build
```

Không cần database để chạy Phase 1 — dữ liệu seed là TS in-memory (xem *Deviations*).

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
src/app/(tabs)/         R-RESP-1 · R-PLAN-3  5 screens: week · shopping · dishes · nutrition · settings
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

1. **Seed là TS in-memory, không phải Postgres.** Schema Blueprint dùng enum + array (Postgres-only). Để app chạy ngay không cần provision Supabase/Neon, dữ liệu seed sống ở `src/data/seed/*.ts` (vừa nuôi dev runtime, vừa là nguồn cho `prisma/seed.ts`). Prisma schema đứng làm **contract**; cắm DB thật qua repo layer, không đụng domain/UI.
2. **~~Repertoire là skeleton~~ → ĐÃ REFINE (campaign R1–R4).** Định lượng từng món giờ **dẫn xuất từ portion model có nguồn** (`src/data/seed/portions.ts`: khẩu phần/adult-equivalent theo Nhu cầu 2016), không phải gram ad-hoc. Thêm **`edibleYield`** phân biệt *mua ≠ ăn* (xương/vỏ/vỏ trái): dish lines = gram ăn được (nuôi nutrition đúng), shopping gross-up theo yield. Commodity disputed/honest_null được đối chiếu web thật (USDA + nguồn VN): cua đồng → corroborated; sườn/nước dừa/mực giữ `disputed` (vênh VN↔quốc tế). Báo cáo D3 trên 49 món: **number 42 · anchored 3 · range 4** (`refinery.test.ts`).
3. **AI touchpoints có mock dev.** `import-dish` gọi Claude (haiku) khi có `ANTHROPIC_API_KEY`, thiếu key → mock deterministic theo từ khoá. `substitute` thuần deterministic (không phụ thuộc key). Key gắn ở E2E.
4. **PWA/Auth ở mức seam.** Service worker offline-read + manifest (installable); auth là stub single-household chừa chỗ Supabase multi-household.
5. **Next 16 (không phải 15)** — scaffold hiện hành; Tailwind v4 CSS-first.

## Còn lại (phase sau)

Provision Postgres + chạy `prisma db push && npm run db:seed` · refinery định lượng từng món · multi-household (Q's) · vertical mẹ sau sinh sâu · import ảnh/giọng nói · ngân sách/giá chợ.
