# QA + Dark Parity Pass — log

Gate: 11 mục Q's Kitchen §14.3 + 2 precedent (mọi % khai mẫu số · "đúng mà xấu = FAIL").
Method: dark-audit trước (bộ lọc thô), fix ở tầng **primitive** (không vá cục bộ), verdict kèm bằng chứng.

**Ràng buộc môi trường (khai trung thực):** browser-automation không lộ path file screenshot để copy vào repo. Ảnh sống trong hội thoại (Human thấy được realtime). Ở đây ghi verdict + **bằng chứng kiểm được bằng số** (computed style / grep) + mô tả micro-interaction. Mock ref: `qa/preview-desktop.png`, `qa/preview-mobile.png`.

---

## Primitives locked (thanh chuẩn — màn sau kế thừa, không tự đẻ giá trị)

| Primitive | Nơi | Vai trò |
|---|---|---|
| `--surface` ≠ `--raised` (dark) | globals.css | insets/chip (#211e24) tách khỏi card (#2a262f) → chip không chìm trên dark |
| `--shadow-card` (light+dark) | globals.css | depth token; dark dùng spread tối, không glow sáng |
| `--shadow-float` | globals.css | hover-lift + FAB |
| `.card` / `.card-interactive` | globals.css | raised card một-nguồn (bg-raised + hairline + radius 16 + shadow token); hover lift 1px |

**Luật kế thừa:** màn nào cần giá trị card mới ngoài `.card` ⇒ tín hiệu primitive thiếu → sửa primitive, không hardcode cục bộ.

---

## Verdict — Tổng quan (/overview)

**Dark parity: PASS** (iteration 1)
- **Hố tìm thấy (dark):** `--surface` == `--raised` (#211e24) ⇒ provenance chip "2.106 kcal" nền surface chìm vào card nền raised. Light không lỗi (surface #f6f1f2 vs raised #fff).
- **Fix (primitive):** tách dark `--raised` → #2a262f. Bằng chứng số sau fix: `card = rgb(42,38,47)`, `chip = rgb(33,30,36)` → distinct. Ảnh zoom xác nhận chip nổi.
- **Số khai mẫu số (mục 8):** donut = **"4/4 · nhóm có mặt"** (định tính R-NUT-4), KHÔNG "100%". Macro thật "2.106 kcal · 102 g đạm" + provenance dot. Không % trần nào.
- **L-1 (không số chế):** nước = "chưa có dữ liệu · demo"; ghi chú = "—"; không giá; gợi ý = dish thật + cook time. PASS.
- **token/grep:** không hex herb-green/geist trong src.

**Micro-interaction (khai bằng chữ — ảnh tĩnh không bắt):**
- Card interactive: `transform translateY(-1px)` + `box-shadow → --shadow-float` khi hover, `160ms cubic-bezier(0.2,0.8,0.2,1)`.
- Nút brand (AI gợi ý, FAB, CTA): `active:bg-brand-hover` (đổi nền tức thời khi nhấn).
- FAB mobile: shadow rose `0_10px_28px_rgba(239,87,117,0.4)`.
- **reduced-motion:** globals có `@media (prefers-reduced-motion: reduce)` — cần xác nhận phủ transition mới (`.card-interactive`) ở iteration sau.

**Còn (iteration sau):** đối chiếu 4 ảnh 1440/390 × light/dark cạnh mock; illustration thumb sáng trên dark hơi gắt (cân nhắc ring/tone dịu); mobile 390 bị Chrome clamp window-min-width (~500px) trong môi trường này → chụp true-390 cần devtools emulation.

---

## Verdict — Thực đơn tuần (/week)

**Dark parity: PASS** · **Mẫu-số: FIXED (primitive)**
- **Hố tìm thấy:** day card hiện **"26% thiếu"** — `AdequacyStrip` so bữa tối với nhu cầu **cả ngày** → verdict "thiếu" sai (đúng lỗi precedent, lần này ở shared component, hiện ở 3 nơi: dashboard-rail, week, nutrition).
- **Fix (component, không cục bộ):** `AdequacyStrip` → thanh **contribution** trung tính, nhãn nêu rõ base **"≈26% nhu cầu ngày"**, bỏ đủ/thiếu verdict, màu accent (không amber-oan). Bằng chứng (DOM text sau fix): `≈26% nhu cầu ngày`. Một fix → sạch cả 3 màn.
- **Kế thừa primitive:** card ngày dùng `bg-surface/40` (panel translucent, không phải `.card` raised) — nhất quán, không đẻ giá trị shadow rời. Chip provenance "2.106 kcal · 100%" nổi trên dark (kế thừa surface≠raised).

**Micro-interaction:** slot row `active:` states; lock 🔒/🔓 đổi màu brand tức thời; bottom-sheet đổi món trượt lên (BottomSheet, scrim `bg-black/40`). reduced-motion cần phủ ở iteration sau.

---

## Verdict — Đi chợ (/shopping)

**Dark: PASS · no new hole.** Kế thừa panel `bg-surface/40`; số gram thật (gross-up edibleYield), count "0/17" thật, không %. Vendor "CHƯA GÁN" = trạng thái thật (B0 chưa có vendor B1) — trung thực L-6, không phải defect. Bằng chứng: ảnh dark (hội thoại).
**Micro-interaction:** tick checkbox đổi nền brand + text line-through tức thời; group header sticky.

## Verdict — Công thức (/dishes)

**Dark: PASS · Layout: FIXED.**
- **Hố:** FAB "+ Thêm món" (`fixed bottom-20 left-1/2`, thiết kế cho mobile) **đè lên card** trên desktop (không có bottom-nav để né).
- **Fix:** desktop ghim góc `lg:bottom-8 lg:right-8` + đổi shadow hardcode → token `shadow-float`. Bằng chứng số: `right:32 bottom:32 centered:false`.
- D3 hiện đủ 3 bậc trên coverage thật: `≈996 (810–1.182)·69%` anchored · `924·100%` số · `743–1.379·11%` khoảng. Provenance mọi card.
**Micro-interaction:** filter chip active brand tức thời; FAB `active:bg-brand-hover`; card hover chưa gắn `.card-interactive` (list dùng panel) — ok.

## Verdict — Dinh dưỡng (/nutrition)

**Dark: PASS · Mẫu-số: kế thừa fix.** AdequacyStrip hiện "≈26% nhu cầu ngày" (một fix ở component → lan tới đây, đúng constraint #2). "độ phủ 100%" nêu base rõ (coverage khối lượng). Macro thật + provenance dot; "Đủ 4 nhóm" định tính. Không %-trần. Bằng chứng: ảnh dark (hội thoại).

## Verdict — Cài đặt (/settings)

**Dark: PASS · no new hole.** Segmented/toggle/stepper/chip kế thừa token; ngày bận honey (không đỏ). Bằng chứng: ảnh dark (hội thoại).

---

## Tổng kết pass (6/6 màn dark-audit)

| Màn | Dark | Hố tìm thấy | Fix tại |
|---|---|---|---|
| Tổng quan | PASS | surface==raised (chip chìm) | token (primitive) |
| Thực đơn tuần | PASS | "26% thiếu" (lỗi mẫu-số) | AdequacyStrip (component) |
| Đi chợ | PASS | — | kế thừa |
| Công thức | PASS | FAB đè card desktop | page + shadow token |
| Dinh dưỡng | PASS | — (kế thừa AdequacyStrip) | — |
| Cài đặt | PASS | — | kế thừa |

**3 fix thật, 2 ở tầng primitive/component** (1 fix → 3 màn sạch). Kế thừa hoạt động: 4 màn sau chỉ 1 hố (FAB, page-cục-bộ), phần còn lại bám primitive không đẻ hố mới → chứng minh thanh chuẩn khoá đúng chỗ.

## Mini-pass đóng gate (3 nợ → 0)

**Cách:** Playwright headless — `viewport override` KHÔNG bị clamp như resize cửa sổ (đúng chẩn đoán Human). Một công đóng cả mobile-390 lẫn ảnh-vào-`qa/`.

1. **Mobile true-390 — ĐÓNG.** 24 ảnh viewport thật vào `qa/`: 6 màn × {390, 1440} × {light, dark}. `scripts/qa-shots.mjs` tái tạo được. Cấu trúc `<lg` giờ PASS-**bằng-chứng** (ẩn sidebar, một cột, bottom-nav 4+FAB), không chỉ logic.
   - **Hố mới chỉ ảnh-390 bắt được:** /dishes có **2 FAB chồng** — "+ Thêm món" của trang + "+" của TabBar (cùng mở AddDishSheet). Logic-only bỏ sót. **Fix:** FAB trang `hidden lg:block` (chỉ desktop); mobile dùng TabBar FAB. Bằng chứng: `qa/dishes__390__dark.png` chỉ còn 1 FAB.
2. **reduced-motion — ĐÓNG.** Block `@media (prefers-reduced-motion: reduce)` phủ mọi transition/animation (gồm `.card-interactive`). Bằng chứng: `prefers-reduced-motion` có trong CSS bundle served.
3. **Thumb-dark — ĐÓNG.** `dark:brightness-[0.9]` dịu plate sáng. Bằng chứng: `brightness` trong CSS bundle served.

**Evidence set trong `qa/`:** 24 PNG (`{route}__{390|1440}__{light|dark}.png`) + `preview-desktop/mobile.png` (mock) + `QA-LOG.md`. Ảnh giờ nằm trong repo — constraint #1 đóng bằng Playwright, không còn "sống trong hội thoại".

**Gate 11+2 mục: có chứng trên cả hai trục breakpoint × theme + 390 thật.**

---

## UI-3/5 — Favorites + Dish detail/fork (ba câu kiểm ở 390, ngay khi dựng)

Method: `scripts/qa-ui35.mjs` — Playwright 390 × {light,dark}, mở detail sheet, kiểm bằng DOM + ảnh. Đúng precedent "giao điểm component cần ảnh".

| Check | Verdict | Bằng chứng |
|---|---|---|
| 1 · fork/tim/đóng chồng TabBar FAB? | **PASS (by image)** | detector báo geometric OVERLAP, nhưng sheet `z-40` full-width che kín FAB `z-20` → `qa/dish-detail__390__{light,dark}.png` không có rose "+" ở đáy. Modal occlusion, không phải hố nhìn-thấy. |
| 2 · fork làm rơi mẫu-số? | **PASS** | detail chỉ hiện macro *món* (per-dish + provenance, D3 anchored `≈996·69%`), KHÔNG AdequacyStrip. DOM: `nhu cầu ngày` **absent**. Fork = copy-lines verbatim → dishDisplay bất biến. |
| 3 · Yêu thích rỗng | **PASS** | empty state (♥ + "Chưa có món yêu thích" + hint), `qa/favorites-empty__390__{light,dark}.png`. DOM: empty text present. |

**Fork = B1⊳B0 thật:** `resolveDish(id, B0, b1)` → fork thắng; shopping/nutrition tự dùng lines B1 (cùng cơ chế đã test 42/42). Badge card flip "mẫu"→"Nhà mình", nút "Lưu vào Nhà mình"→"✓ Đã lưu".
**Micro-interaction:** heart `active:scale-90`; card `active:bg-surface`; sheet trượt lên (BottomSheet, scrim `bg-black/40`, Escape đóng); reduced-motion phủ (đã khoá).
**Evidence mới trong `qa/`:** `dish-detail__390__{light,dark}.png`, `favorites-empty__390__{light,dark}.png`.

---

## UI-7 (Ghi chú THẬT-nhẹ + Báo cáo SHELL) · UI-4 (Kho SHELL) · UI-6 (Dinh dưỡng)

`scripts/qa-ui74.mjs` — 390 × {light,dark} evidence + carried-check flow.

| Item | Tầng | Verdict | Bằng chứng |
|---|---|---|---|
| Ghi chú `/notes` | THẬT-nhẹ | PASS | store CRUD (add/xoá), empty state, right-rail "Ghi chú nhanh" nối thật. `notes__390__*.png` |
| Báo cáo `/reports` | SHELL | PASS | `ShellNotice` "sắp có" + "cần dữ liệu giá"; **không tiền giả** (probe: `reports-has-money=none`). `reports__390__*.png` |
| Kho `/pantry` | SHELL | PASS | `ShellNotice` "demo — chưa nối tồn kho, không tự trừ chợ" (L-6); link từ header Đi chợ. `pantry__390__*.png` |
| Dinh dưỡng | THẬT | PASS (no change) | kế thừa primitive + AdequacyStrip denominator; period Tuần/Tháng **cố ý bỏ** (không data → sẽ là số-chế, L-1) |

**Carried check (Human dặn) — fork→favorite lấy bản B1:** fork "Thịt kho trứng" → badge B0→**"Nhà mình"** (`=true`); favorite → `/favorites` (client-nav) hiện **đúng 1 món = bản B1**. `favorites-b1__1440__light.png`.

**Meta-lesson (probe, không phải app):** hai lần probe ra số vô lý — `favorites count=14` (hard-nav `page.goto` reset React state) và `="Tổng quan"` (`ul>li` bắt trúng sidebar nav ở 1440). Cả hai là **probe đo nhầm**, sửa probe (client-nav + scope `main`) → PASS thật. Số vô lý = tín hiệu sửa kiểm-chứng trước khi khai FAIL. Cùng họ "bất đồng là dữ liệu".

**Nợ mới (khai, không chặn):** trên mobile (<lg), các trang phụ (Yêu thích/Ghi chú/Báo cáo/Dinh dưỡng/Cài đặt) **chưa có đường vào từ bottom-nav** (chỉ 4 tab + FAB). Mock có "menu Thêm" — chưa dựng. Desktop vào đủ qua sidebar. Cần một "More" sheet cho mobile ở lượt sau.
