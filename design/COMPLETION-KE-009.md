# COMPLETION REPORT — TIP-KE-009

**Vai trò:** Thợ triển khai
**Ngày:** 2026-07-29
**STATUS:** **DONE — NEON MAIN MIGRATED AND VERIFIED**

## 1. Kết quả triển khai

Đã hoàn thành mã nguồn cho một nguồn sự thật của thực đơn tuần:

- canonical `PersistedWeekPlan` có `version` và stable slot ordering;
- validator server chặn ngày/slot trùng, dish sai slot, B1 không thuộc hộ,
  allergy/restriction không còn an toàn;
- repository load-or-create hội tụ và save toàn aggregate trong transaction;
- identical retry không tăng version;
- stale divergence trả conflict, không last-write-wins;
- B1 được persist cùng plan, không nhận macro/nutrition từ client;
- Store hydrate plan server thay vì render plan seed tạm;
- optimistic draft có `loading/saving/synced/unsynced/conflict`;
- lỗi mạng giữ draft và cần Retry rõ;
- conflict giữ draft đến khi người dùng chọn tải canonical;
- reroll, đổi món và khóa sống qua reload;
- shopping, agenda và prep-ahead client dùng cùng plan trong Store;
- assistant agenda/prep đọc plan canonical server, không có mutation tool;
- `plan_week` được ghi rõ là preview không lưu.

## 2. Requirement coverage

| ID | Trạng thái | Bằng chứng |
|---|---:|---|
| KE9-001 | Đạt | domain type/validator, stable sort, exact comparison tests |
| KE9-002 | Đạt production | migration preflight, version/timestamps/unique, clean-branch và Neon `main` schema diff pass |
| KE9-003 | Đạt | load-or-create, concurrent convergence, household key |
| KE9-004 | Đạt | transaction OCC, idempotent retry, structured conflict |
| KE9-005 | Đạt | server validation dish/slot/safety/restriction |
| KE9-006 | Đạt | B1 persist, ownership isolation và reload không localStorage |
| KE9-007 | Đạt | Store canonical hydration; change/lock/reroll persist |
| KE9-008 | Đạt | năm sync states, Retry và explicit conflict action |
| KE9-009 | Đạt | các client derivation dùng `plan` duy nhất từ Store |
| KE9-010 | Đạt | assistant adapters dùng canonical repository, không mutation |
| KE9-011 | Đạt | current-week action, Monday validator, household isolation tests |
| KE9-012 | Đạt | Việt/Anh, mobile paths, full unit/E2E/build xanh |

**Implementation coverage:** 12/12 — 100%.
**Release readiness:** database gate đạt. Việc deploy ứng dụng lên hosting không
thuộc lượt migration này và chưa được thực hiện.

## 3. Tệp chính

### Domain/schema

- `src/domain/planning/persisted-week-plan.ts`
- `src/domain/planning/persisted-week-plan.test.ts`
- `src/domain/planning/canonical-week-plan-migration.test.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260729170000_canonical_week_plan/migration.sql`

### Repository/server

- `src/data/repo/week-plan.ts`
- `src/data/repo/week-plan.test.ts`
- `src/data/repo/household.ts`
- `src/app/actions.ts`

### Client/UI

- `src/ui/store.tsx`
- `src/app/(tabs)/week/page.tsx`
- `src/i18n/vn.json`
- `src/i18n/en.json`

### Assistant

- `src/lib/assistant/kitchen-agenda.ts`
- `src/lib/assistant/prep-ahead.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/agent.ts`
- `src/app/api/assistant/route.ts`

### E2E

- `e2e/week-plan-persistence.spec.ts`
- `e2e/COVERAGE.md`

## 4. Test results

```text
Prisma validate:               pass
Migration SQL rollback test:   pass
Migration static safety test:  pass
Neon branch migration:         4/4 applied
Neon branch schema diff:       no difference
Neon branch CRUD smoke:        pass, rollback residue 0
Neon main migration:           4/4 applied
Neon main schema diff:         no difference
Neon main CRUD smoke:          pass, rollback residue 0
TypeScript:                    0 lỗi
ESLint:                        0 lỗi
Unit/repository:               256/256 pass, 40 files
Build:                         pass, 22 routes
E2E:                           41/41 pass
git diff check:                pass
Production migrate status:     database schema is up to date
```

Scenario mới:

- real Monday/invalid date;
- stable sorting, exact comparison, immutable input;
- duplicate day-slot, wrong day/slot/dish;
- restriction recheck;
- concurrent load-or-create hội tụ một aggregate;
- version increment đúng một lần;
- identical stale retry trả canonical không tăng version;
- stale divergent save trả conflict không ghi;
- household A không dùng B1 của household B;
- thay món/khóa/reroll qua reload;
- network save fail giữ unsynced draft và Retry;
- hai browser stale không auto overwrite;
- selected B1 vẫn resolve sau khi xóa localStorage;
- assistant đọc cùng canonical plan và tuyên bố read-only.

## 5. Migration audit

Read-only audit trước migration:

```text
WeekPlan rows:       0
DaySlot rows:        0
Duplicate plans:     0
Duplicate day-slots: 0
```

Database production `main` trước migration:

```text
pending migrations: 4
target tables from KE-002/003/006: 0/6
WeekPlan KE-009 columns:         0/3
production writes performed:    0
```

Database production `main` sau migration:

```text
migrations applied:   4/4
target tables:        6/6
target foreign keys:  11
WeekPlan columns:     3/3
canonical indexes:    2/2
Prisma migrate status: database schema is up to date
Prisma schema diff:   no difference
CRUD smoke:           insert pass; duplicate plan/slot rejected
rollback residue:     household 0, plan 0, slot 0
```

Nhánh nghiệm thu sạch:

```text
project:              late-star-36228366
parent:               main
approved test branch: codex-ke009-migration-v3-20260729
preflight duplicates: WeekPlan 0, DaySlot 0
migrations applied:   4/4
target tables:        6/6
target foreign keys:  11
WeekPlan columns:     3/3
canonical indexes:    2/2
Prisma schema diff:   no difference
CRUD smoke:           insert pass; duplicate plan/slot rejected
rollback residue:     household 0, plan 0, slot 0
```

Nhánh thử nghiệm đã phát hiện và sửa một sai lệch trước khi bàn giao:
`WeekPlan.updatedAt` ban đầu còn database default dù Prisma dùng `@updatedAt`.
Migration nguồn nay dùng default tạm để backfill rồi `DROP DEFAULT`; clean branch
v3 xác nhận schema diff bằng 0.

Database hiện hữu được tạo trước khi dự án bắt đầu lưu lịch sử Prisma Migrate,
nên `prisma migrate deploy` trực tiếp trả P3005. Trên branch, Thợ đã dùng quy
trình baseline có kiểm chứng: mỗi file SQL chạy trong transaction riêng; sau khi
kiểm tra object tương ứng tồn tại đúng mới ghi migration đó là applied. Không có
migration nào được đánh dấu applied trước khi SQL chạy thành công.

## 6. Deviations

1. B1 được gửi kèm save aggregate chỉ khi đang được plan tham chiếu. B1 chưa chọn
   vẫn tiếp tục ở localStorage cho đến khi một gói riêng persist toàn bộ thư viện
   món Nhà mình.
2. OCC dùng atomic `updateMany(id, householdId, version)` trong transaction thay
   vì serializable isolation. Cách này giúp request stale nhận structured conflict
   thay vì lỗi serialization chung.
3. Error-save E2E chặn đúng Server Action POST bằng Playwright route; không thêm
   test hook vào production.
4. Migration đã deploy bền vững trên Neon branch sạch v3 rồi được áp dụng vào
   Neon `main` sau phê duyệt ngày 2026-07-29.
5. Hai nhánh thử nghiệm trước v3 không phải bằng chứng nghiệm thu: v1 phát hiện
   lệch default `updatedAt`; v2 dùng để loại bỏ chiến lược gộp DDL dài. Chỉ v3
   được tính là kết quả pass. V1/v2 đã được xóa sau kiểm tra; Neon giữ `main` và
   nhánh nghiệm thu v3.

## 7. Issues

### Không còn blocker KE-009

Toàn bộ migration, unit, build và E2E hermetic đều xanh. Ứng dụng chưa được
deploy lên hosting trong lượt này; đây là hành động release tiếp theo, không phải
trạng thái migration.

## 8. Bàn giao cho Chủ thầu

KE-009 đủ điều kiện nghiệm thu `DONE`: 12/12 yêu cầu, quality gates xanh và
database production đã khớp schema. Chủ thầu có thể lập gói release ứng dụng
tiếp theo; không cần thêm migration cho KE-009.
