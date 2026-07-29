# COMPLETION REPORT — TIP-KE-003

Ngày hoàn thành: 2026-07-29
STATUS: DONE

## Requirement coverage

| ID | Kết quả |
|---|---|
| KE3-001 | PASS — `sortLotsFefo` loại qty=0, xếp hạn nhãn tăng dần, undated sau và tie-break deterministic. |
| KE3-002 | PASS — không sinh bestBefore; toàn bộ copy dùng “hạn trên nhãn” và có disclaimer. |
| KE3-003 | PASS — consumed/discarded tạo `InventoryMovement` append-only với before/after. |
| KE3-004 | PASS — transaction decrement có guard `qty >= input`, rollback khi lỗi. |
| KE3-005 | PASS — `idempotencyKey` unique; retry trả canonical movement/lot. |
| KE3-006 | PASS — action fail-closed; repository tự resolve và scope household. |
| KE3-007 | PASS — legacy item vẫn đọc/xoá tương thích nhưng movement bị từ chối rõ ràng. |
| KE3-008 | PASS — qty=0 không vào FEFO, cook-from-pantry hoặc shopping deduction hữu ích. |
| KE3-009 | PASS — reminder match freezer lot với ingredient của món ngày kế tiếp, không đưa số giờ. |
| KE3-010 | PASS — UI không optimistic decrement; lỗi giữ sheet/input. |
| KE3-011 | PASS — Việt/Anh, label/role/focus/Escape và visual mobile 390×860. |
| KE3-012 | PASS — migration SQL reviewable, chưa apply local/production. |

REQUIREMENT COVERAGE: 12/12 — 100%.

## Scenario results

| AC | Kết quả |
|---|---|
| AC-01 | PASS — unit test FEFO dated/undated/tie-break/zero. |
| AC-02 | PASS — undated hiển thị “Chưa nhập hạn trên nhãn”. |
| AC-03 | PASS — E2E 240g dùng 40g còn canonical 200g; repository test 310g dùng 100g còn 210g. |
| AC-04 | PASS — repository retry giữ cùng movement ID và không trừ lần hai. |
| AC-05 | PASS — overdraw bị từ chối; repository state giữ nguyên và E2E disable submit. |
| AC-06 | PASS theo cấu trúc — lookup/update production đều có householdId từ session. |
| AC-07 | PASS — lô hết bị loại khỏi active views; movement không bị xoá. |
| AC-08 | PASS — store chỉ commit canonical response sau action success. |
| AC-09 | PASS — unit test chỉ match positive freezer lot của target plan day. |
| AC-10 | PASS — mobile sheet, focus trap/Escape, labels và không overflow. |

Không có lỗi P0/P1 còn mở trong phạm vi TIP.

## Files changed

Created:

- `design/TIP-KE-003.md`
- `design/COMPLETION-KE-003.md`
- `prisma/migrations/20260729103000_inventory_movements/migration.sql`
- `src/domain/kitchen-execution/inventory.ts`
- `src/domain/kitchen-execution/inventory.test.ts`
- `src/ui/components/InventoryLotSheet.tsx`
- `e2e/inventory-execution.spec.ts`
- `e2e/__screens__/inventory-fefo-390.png`

Modified:

- `design/BLUEPRINT-kitchen-execution.md`
- `HANDOFF-TO-BUILDER.md`
- `prisma/schema.prisma`
- `src/domain/types.ts`
- `src/domain/pantry/index.ts`
- `src/domain/pantry/pantry.test.ts`
- `src/data/repo/household.ts`
- `src/data/repo/household.test.ts`
- `src/app/actions.ts`
- `src/ui/store.tsx`
- `src/app/(tabs)/pantry/page.tsx`
- `src/i18n/vn.json`
- `src/i18n/en.json`

## Technical health

- Prisma format/validation/generate: PASS, Prisma 7.9.1.
- TypeScript: PASS, 0 errors.
- ESLint: PASS, 0 errors.
- Unit/repository: 190/190 PASS, 29/29 files.
- E2E: 29/29 PASS, Chromium, one worker, 49.5 giây.
- KE-003 mobile E2E: 1/1 PASS.
- Production build: PASS, 22/22 routes generated.
- Visual QA: PASS tại 390×860; `e2e/__screens__/inventory-fefo-390.png`.
- `git diff --check`: PASS.

## Migration status

- Migration SQL: generated/reviewable.
- Applied local: NO.
- Applied production: NO.
- Không `db push`, seed hoặc write tới Neon production.

## Issues / deferred

- MEDIUM — reminder “ngày mai” đang dựa vào WeekPlan derive ở client. Khi
  WeekPlan được persist, nên chuyển rule này sang scheduled reminder có cùng
  nguồn sự thật đa thiết bị.
- LOW — tenant isolation và transaction serialization production được bảo đảm
  bằng scoped query/constraint nhưng chưa chạy integration suite trên Neon
  ephemeral branch.
- LOW — E2E adapter vẫn dùng state theo process và một worker; cần namespace/reset
  hook trước khi chạy parallel.

## Deviations

- Không thêm push/email notification. TIP đã quyết reminder trong app để không
  mở rộng quyền gửi và hạ tầng ngoài phạm vi.
- Không tự tính thời gian rã đông; reminder yêu cầu xem nhãn/hướng dẫn đã kiểm
  chứng, đúng nguyên tắc không bịa dữ liệu an toàn.

## Suggestions for Contractor

1. Review và migrate KE-002 + KE-003 trên Neon branch/staging theo đúng thứ tự.
2. TIP-KE-004 triển khai công thức có bước cấu trúc và chế độ “Bắt đầu nấu”.
3. Persist WeekPlan trước khi bật reminder đa thiết bị hoặc lịch tự động.
4. Bổ sung Neon ephemeral integration suite cho tenant isolation/rollback.

OVERALL STATUS: READY-với-deferred.
