# TIP-KE-004 — Công thức có cấu trúc và chế độ “Bắt đầu nấu”

## ROLE

Bạn là **BUILDER / Thợ** trong Vibecode Kit v6.1. Chủ thầu đã scan codebase,
đối chiếu nguồn an toàn thực phẩm và bàn giao contract này. Chỉ code sau mốc
handover; không tự mở rộng sang điều phối nhiều món của TIP-KE-005.

## HEADER

- TIP-ID: `TIP-KE-004`
- Project: Quỳnh Nutri / Bữa cơm nhà
- Module: Kitchen Execution
- Depends on: `TIP-KE-003` — DONE
- Priority: P0
- Working directory: project root

## CONTRACTOR SCAN

- `Dish` hiện có ingredients, `cookTimeMin`, method và nutrition; chưa có steps.
- `DishDetailSheet` chỉ hiển thị dinh dưỡng/nguyên liệu/fork.
- `REPERTOIRE` có 49 món B0; B1/imported dishes không có quy trình đã kiểm duyệt.
- `BottomSheet` đã có focus trap/Escape; i18n dùng flat JSON.
- Không cần schema mới cho registry nội dung hệ thống.
- Nguồn an toàn chính thức đã đối chiếu:
  - FoodSafety.gov Safe Minimum Internal Temperatures, reviewed 2024-11-21.
  - FDA Safe Food Handling: clean, separate, cook, chill.
- Khoảng trống P0: không được tự suy diễn bước nấu từ tên món/method rồi trình bày
  như công thức riêng.

## DECISIONS LOG

| ID | Quyết định | Lý do |
|---|---|---|
| D-004-01 | Registry typed, tĩnh và reviewable | Không cho AI runtime sinh bước/nhiệt độ. |
| D-004-02 | Lát cắt đầu có 12 món cụ thể | Chất lượng/độ trung thực quan trọng hơn coverage giả 49/49. |
| D-004-03 | Món chưa có guide chỉ hiện trạng thái thiếu; không có Start giả | Fail honestly. |
| D-004-04 | Progress dùng `sessionStorage`, không DB | Đây là trạng thái phiên nấu, không phải ground truth cần đa thiết bị. |
| D-004-05 | Không timer/push trong TIP này | Timer và điều phối nhiều món thuộc KE-005. |
| D-004-06 | Không tự trừ kho khi hoàn tất nấu | Consumption cần người dùng xác nhận lượng, không suy diễn. |

## OUTCOME

1. 12 món B0 phổ biến có quy trình nấu riêng, song ngữ, nguồn và ngày rà soát.
2. Dish detail hiển thị chuẩn bị, các bước, điểm kiểm tra an toàn và specificity.
3. “Bắt đầu nấu” mở giao diện tập trung theo từng bước, có checklist/progress.
4. Reload cùng tab khôi phục phiên; hoàn tất sẽ xoá session.
5. Món không có guide hoặc B1 không được nhận hướng dẫn giả.

## CONTENT CONTRACT

Tạo `CookingGuide`:

```text
id
dishId unique
specificity = dish
reviewedAt ISO date
servings
miseEnPlace[] LocalizedText
steps[] {
  id stable
  title LocalizedText
  instruction LocalizedText
  safetyCheck? LocalizedText
  sourceIds?[]
}
sourceIds[]
```

12 dish IDs bắt buộc:

```text
com_trang
thit_kho_trung
ga_kho_gung
ca_kho_to
ca_chien_sot_ca
tom_rang
trung_chien
rau_muong_xao_toi
cai_ngot_luoc
bi_xanh_luoc
canh_bi_dao_tom
canh_rau_ngot_thit
```

### Safety claims allowed

- Poultry: 74°C internal.
- Fish: 63°C internal, or opaque and separates easily with a fork.
- Whole cuts beef/pork: 63°C plus 3-minute rest.
- Ground meat: 71°C.
- Eggs: yolk and white firm; egg dishes 71°C.
- Shrimp/crab: pearly/white and opaque.
- Clean/separate/raw-to-cooked plate rules from FDA.

Mọi claim nhiệt độ phải gắn source. Không đưa storage duration hoặc medical claim.
Thời gian tổng từ `Dish.cookTimeMin` chỉ là ước lượng hiện có; không biến thành
đảm bảo chín. Không thêm timer step chưa kiểm duyệt.

## DOMAIN CONTRACT

- `resolveCookingGuide(dishId)` trả guide riêng hoặc undefined.
- `scaleDishLines(dish, householdSize)` scale từ `baseServings`; household size
  0 dùng base servings để tránh zero recipe.
- `CookingSession` gồm `dishId`, `guideId`, `completedStepIds`, `startedAt`.
- `nextIncompleteStep` deterministic.
- Session parser fail-closed khi JSON sai, guide mismatch hoặc step ID không còn.

## UI CONTRACT

### DishDetailSheet

- Với guide: hiển thị số bước, ngày rà soát, preview chuẩn bị, nguồn và nút
  “Bắt đầu nấu”.
- Không có guide: hiển thị “Chưa có quy trình đã kiểm chứng”; vẫn cho xem
  ingredients/nutrition/fork, không hiện nút Start.
- Ingredients hiển thị lượng scale theo household hiện tại và ghi rõ khẩu phần.

### CookingMode

- Full-screen mobile-first, trên BottomSheet/tab bar.
- Header: tên món, tiến độ `x/y`, đóng.
- Màn đầu: ingredient checklist + clean/separate note.
- Mỗi bước có title, instruction, optional safety check và nguồn.
- Người dùng tự tick; nút tiếp không tự đánh dấu.
- Có trước/sau, danh sách bước và nút kết thúc chỉ khi tất cả bước đã tick.
- Reload cùng tab khôi phục tiến độ; “Kết thúc” và “Huỷ phiên” xoá session.
- Không tự giảm tồn kho, không phát notification, không giữ màn hình sáng.
- Việt/Anh đầy đủ, focus visible, Escape đóng về dish detail, viewport 390×860.

## REQUIREMENTS MATRIX

| ID | Requirement | Priority |
|---|---|---|
| KE4-001 | Registry typed cho 12 dish-specific guides | P0 |
| KE4-002 | Không sinh hướng dẫn runtime/fallback giả | P0 |
| KE4-003 | Safety claims có nguồn và đơn vị SI | P0 |
| KE4-004 | Ingredients scale đúng household/baseServings | P0 |
| KE4-005 | Start mode checklist từng bước | P0 |
| KE4-006 | Session restore fail-closed | P1 |
| KE4-007 | Không auto-complete hoặc tự trừ kho | P0 |
| KE4-008 | Unsupported/B1 fail honestly | P0 |
| KE4-009 | Việt/Anh và accessibility/mobile | P1 |
| KE4-010 | Nguồn + reviewedAt hiển thị | P0 |
| KE4-011 | Domain thuần có unit test | P0 |
| KE4-012 | Existing nutrition/safety/E2E không regress | P0 |

## ACCEPTANCE CRITERIA

- AC-01: 12 guide có unique dishId, stable step IDs, ≥3 steps và source hợp lệ.
- AC-02: dish unsupported không có nút Bắt đầu nấu.
- AC-03: household 2 người scale recipe base 4 xuống 0.5; household 0 dùng base.
- AC-04: mở supported dish, start, tick step; progress tăng nhưng Next không tự tick.
- AC-05: reload cùng tab giữ completed steps.
- AC-06: stale/invalid session bị bỏ, không crash.
- AC-07: safety check nhiệt độ hiển thị nguồn.
- AC-08: finish chỉ enable khi đủ steps và xoá session.
- AC-09: không có inventory mutation khi finish.
- AC-10: mobile 390×860 không overflow, keyboard/Escape hoạt động.

## REQUIRED TESTS

- Unit: registry integrity/coverage/source; scaling; session parser; next step.
- E2E mobile: supported detail → start → tick → reload restore → finish +
  screenshot; unsupported dish không có start.
- Full regression: lint/type/unit/build/e2e.

## CONSTRAINTS

- Không đổi schema/tech stack/dependency.
- Không dùng AI runtime để viết hoặc chỉnh steps.
- Không tạo generic method template dưới nhãn dish-specific.
- Không thêm timer, multi-dish coordination, notifications hay inventory decrement.
- Giữ nguyên các thay đổi chưa commit.

## QUALITY GATES

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
npm run test:e2e
git diff --check
```

## REPORT FORMAT

Tạo `design/COMPLETION-KE-004.md` với coverage 12 REQ, AC-01..10, số test
cụ thể, issues, deviations, suggestions và overall status.
