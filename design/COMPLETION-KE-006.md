# COMPLETION REPORT — TIP-KE-006

**Vai trò:** Thợ triển khai
**Ngày:** 2026-07-29
**Trạng thái:** **DONE**

## 1. Kết quả

Đã hoàn thành luồng món còn thừa tách biệt khỏi tồn kho nguyên liệu:

- kết thúc Meal Run và chủ động hỏi “Có món còn thừa?”;
- người dùng xác nhận món, khẩu phần, giờ nấu xong, giờ cho vào lạnh, nơi cất và điều kiện nóng;
- chặn tạo lot khi dữ liệu thời gian vi phạm policy làm lạnh;
- theo dõi mốc hướng dẫn cho ngăn mát và nhãn chất lượng-only cho ngăn đông;
- ghi nhận đã dùng, đã bỏ hoặc sửa lượng bằng movement audit;
- hiển thị hướng dẫn hâm lại 74°C/165°F có liên kết nguồn;
- khôi phục dữ liệu sau refresh qua repository/store;
- không tạo, sửa hoặc hoàn nguyên `InventoryLot`.

## 2. Requirement coverage

| ID | Trạng thái | Bằng chứng |
|---|---:|---|
| KE6-001 | Đạt | `LeftoverLot`, `LeftoverMovement`, enums và migration riêng |
| KE6-002 | Đạt | `LeftoverCaptureSheet`; mọi trường thực tế đều hiển thị để xác nhận |
| KE6-003 | Đạt | `evaluateCoolingWindow`; validation ở UI, action và repository |
| KE6-004 | Đạt | `evaluateLeftoverGuidance`; mốc 72/96 giờ được kiểm thử |
| KE6-005 | Đạt | `LeftoverLotSheet`; 74°C/165°F và URL USDA |
| KE6-006 | Đạt | auth fail-closed, household query scope, serializable transaction, idempotency |
| KE6-007 | Đạt | movement before/after; atomic update; chống âm/overspend |
| KE6-008 | Đạt | `MealCoordinatorSheet` mở capture sau khi người dùng hoàn tất |
| KE6-009 | Đạt | khu vực “Món còn thừa” tại `/pantry`, ưu tiên review |
| KE6-010 | Đạt | aggregate/repository riêng; regression test xác nhận inventory bất biến |
| KE6-011 | Đạt | Việt/Anh; `BottomSheet` quản lý focus, Tab và Escape |
| KE6-012 | Đạt | migration SQL đã tạo/validate; không apply local hoặc production |

**Coverage:** 12/12 — 100%.

## 3. Tệp chính

### Domain và dữ liệu

- `src/domain/kitchen-execution/leftover-safety.ts`
- `src/domain/kitchen-execution/leftover-safety.test.ts`
- `src/domain/types.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260729143000_leftovers/migration.sql`

### Persistence và server boundary

- `src/data/repo/household.ts`
- `src/data/repo/household.test.ts`
- `src/data/repo/leftover-household-isolation.test.ts`
- `src/app/actions.ts`
- `src/ui/store.tsx`

### UI và E2E

- `src/ui/components/LeftoverCaptureSheet.tsx`
- `src/ui/components/LeftoverLotSheet.tsx`
- `src/ui/components/MealCoordinatorSheet.tsx`
- `src/app/(tabs)/pantry/page.tsx`
- `src/i18n/vn.json`
- `src/i18n/en.json`
- `e2e/leftovers.spec.ts`
- `e2e/__screens__/leftover-capture-390.png`

## 4. Test results

```text
Prisma schema: valid
TypeScript:    0 lỗi
ESLint:        0 lỗi
Unit/repo:     220/220 đạt, 33 tệp
Build:         đạt, 22 routes
E2E:           33/33 đạt
Diff check:    đạt
```

Các scenario mới đã kiểm tra:

- biên 60/120 phút;
- timestamp sai, đảo và ở tương lai;
- biên 72/96 giờ;
- ngăn đông không nhận “hạn an toàn”;
- tạo/retry idempotent;
- dùng một phần/retry/overspend;
- correction về 0 có audit;
- cùng idempotency key ở hai household tạo hai lot riêng;
- household B không sửa được lot của household A;
- tạo/dùng món thừa không làm đổi inventory;
- mobile 390px, cảnh báo cooling, lưu, reload và movement duy nhất.

## 5. Deviations

1. Thêm `idempotencyKey` trực tiếp vào `LeftoverLot`. TIP yêu cầu create idempotent nhưng schema gợi ý ban đầu chưa có trường này. Thay đổi bảo toàn kiến trúc và giúp replay theo household mà không cần bảng request phụ.
2. Với movement `corrected`, input `servings` mang nghĩa **số dư mục tiêu**; audit lưu độ chênh tuyệt đối cùng before/after. Cách này làm thao tác “Sửa lượng” rõ ràng và vẫn giữ movement bất biến.
3. Household isolation được kiểm tra tự động tại repository contract thay vì đăng nhập hai tài khoản Clerk trong browser. Suite hermetic không có hai bộ credential thật; server-side scope vẫn có test thực thi.

## 6. Issues

Không có lỗi P0/P1 còn mở trong phạm vi TIP.

## 7. Suggestions cho Chủ thầu

- Gói tiếp theo nên gom các tín hiệu đã có (đi chợ, rã đông, bắt đầu nấu, món thừa cần xem lại) thành một “Việc bếp hôm nay”.
- AI chỉ nên diễn giải và ưu tiên từ task engine tất định; không tự sinh nhiệt độ, hạn bảo quản hoặc tuyên bố người dùng đã làm xong.
- Khi có môi trường staging và hai tài khoản Clerk kiểm thử, bổ sung browser test real-auth cho household isolation.
