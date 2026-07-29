# COMPLETION REPORT — TIP-KE-007

**Vai trò:** Thợ triển khai
**Ngày:** 2026-07-29
**STATUS:** **DONE**

## 1. Kết quả

Đã hoàn thành “Việc bếp hôm nay” dưới dạng projection tất định:

- gom tín hiệu món còn thừa, ngày trên nhãn, nguyên liệu đông lạnh, đi chợ và nấu ăn;
- nhận `now` và timezone rõ ràng;
- tạo task ID ổn định, dedupe và sort tất định;
- mỗi task có reason, provenance, sourceRef và deep link thật;
- Overview hiển thị tối đa ba việc;
- sheet nhóm “Cần xem ngay / Trong hôm nay / Tiếp theo”;
- task chỉ thay đổi khi dữ liệu nguồn thay đổi, không có trạng thái done cục bộ;
- assistant có tool agenda read-only, không nhận householdId, thời gian hay priority từ model;
- không thêm schema hoặc migration.

## 2. Requirement coverage

| ID | Trạng thái | Bằng chứng |
|---|---:|---|
| KE7-001 | Đạt | `buildKitchenAgenda()` thuần; nhận `now`, `timeZone` |
| KE7-002 | Đạt | gọi lại `evaluateLeftoverGuidance()` |
| KE7-003 | Đạt | gọi lại `expirySignal()`; copy luôn ghi “ngày trên nhãn” |
| KE7-004 | Đạt | gọi lại `frozenLotsNeededForDay()`; không sinh số giờ |
| KE7-005 | Đạt | tách `shop` và `confirm-purchase`; fulfillment loại task |
| KE7-006 | Đạt | chỉ guide đã rà soát sinh cook; phần còn lại vào `unsupported` |
| KE7-007 | Đạt | một guide → cook; từ hai guide → coordinate, không tạo hai task xung đột |
| KE7-008 | Đạt | `KitchenAgendaCard`, tối đa ba task trên Overview |
| KE7-009 | Đạt | sheet nhóm priority, reason, provenance và deep link |
| KE7-010 | Đạt | không checkbox/done; E2E xác nhận mutation nguồn làm task biến mất |
| KE7-011 | Đạt | tool `kitchen_agenda` server-side read-only và prompt guardrail |
| KE7-012 | Đạt | Việt/Anh, mobile 390px, BottomSheet focus/Escape, global reduced-motion |

**Coverage:** 12/12 — 100%.

## 3. Tệp chính

### Domain

- `src/domain/kitchen-execution/kitchen-agenda.ts`
- `src/domain/kitchen-execution/kitchen-agenda.test.ts`
- `src/domain/kitchen-execution/inventory.ts`
- `src/domain/kitchen-execution/inventory.test.ts`

### UI

- `src/ui/hooks/useKitchenAgenda.ts`
- `src/ui/components/KitchenAgendaCard.tsx`
- `src/app/(tabs)/overview/page.tsx`
- `src/app/(tabs)/pantry/page.tsx`
- `src/i18n/vn.json`
- `src/i18n/en.json`

### Assistant

- `src/lib/assistant/kitchen-agenda.ts`
- `src/lib/assistant/kitchen-agenda.test.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/agent.ts`
- `src/app/api/assistant/route.ts`
- `src/ui/components/AssistantSheet.tsx`

### E2E

- `e2e/kitchen-agenda.spec.ts`
- `e2e/__screens__/kitchen-agenda-390.png`
- `e2e/COVERAGE.md`

## 4. Test results

```text
Prisma validate: pass
TypeScript:      0 lỗi
ESLint:          0 lỗi
Unit/repository: 231/231 pass, 35 files
Build:           pass, 22 routes
E2E:             35/35 pass
Diff check:      pass
```

Scenario mới:

- empty projection trung thực;
- timezone Asia/Ho_Chi_Minh tại biên ngày;
- từng nhóm task và thứ tự ưu tiên;
- stable ID, dedupe và input immutability;
- leftover policy và label policy được tái sử dụng;
- checked/chưa fulfillment khác với đã fulfillment;
- một guide/có hai guide/unsupported;
- assistant tự load household và không nhận model input;
- mobile agenda → deep link món thừa → movement nguồn → task biến mất;
- assistant E2E hermetic nói rõ chỉ dựa trên dữ liệu đã ghi nhận.

## 5. Deviations

1. `expirySignal` và `planDayForDate` được mở rộng thêm tham số timezone tùy chọn. Giá trị mặc định vẫn là UTC nên không phá caller cũ; agenda truyền timezone Việt Nam rõ ràng.
2. Assistant dựng agenda từ dữ liệu **đã lưu trên server** và plan seed chuẩn. Reroll hoặc dấu tick chỉ còn ở client chưa được gửi server sẽ không được assistant khẳng định. Đây là lựa chọn fail-closed để tránh tin payload do client/model cung cấp.
3. Nhánh `confirm-purchase` có unit test đầy đủ. UI shopping hiện mở thẳng form xác nhận thay vì lưu một trạng thái tick tạm, nên không có browser path tự nhiên tạo trạng thái checked-chưa-fulfillment.
4. Empty state có unit test; E2E app tiêu chuẩn luôn sinh plan và shopping nên không dùng test hook giả để ép empty state.

## 6. Issues

Không có lỗi P0/P1 còn mở.

## 7. Suggestions cho Chủ thầu

- Ưu tiên gói tiếp theo cho “chuẩn bị trước theo thực đơn”: cấu trúc hóa những việc có thể sơ chế từ tối hôm trước và đưa vào agenda mà không bịa thời lượng.
- Trước khi thêm notification, cần có policy opt-in, timezone và chống nhắc trùng.
- Plan/reroll phía client nên được persist ở một gói riêng trước khi yêu cầu assistant phản ánh chính xác mọi chỉnh sửa tức thời trên nhiều thiết bị.
