# TIP-KE-003 — Dùng trước, ghi nhận tiêu thụ và nhắc nguyên liệu đông lạnh

## ROLE

Bạn là **BUILDER / Thợ** trong Vibecode Kit v6.1. Blueprint Kitchen Execution
đã được Chủ nhà duyệt; triển khai đúng contract, tự kiểm thử và nộp Completion
Report. Không tự sinh hạn dùng hoặc kết luận thực phẩm đã hỏng.

## HEADER

- TIP-ID: `TIP-KE-003`
- Project: Quỳnh Nutri / Bữa cơm nhà
- Module: Kitchen Execution
- Depends on: `TIP-KE-002` — DONE
- Priority: P0
- Working directory: project root

## CONTEXT

- `InventoryLot.qty` là lượng còn lại hiện tại.
- `bestBefore` chỉ tồn tại khi người dùng nhập hạn trên nhãn.
- Legacy pantry JSON vẫn được load nhưng chưa phải relation lot.
- Pantry đang hiển thị theo thứ tự lưu, nút xoá chưa tạo audit trail.
- WeekPlan hiện derive ở client; có thể dùng để nhắc nguyên liệu đông lạnh cho
  món ngày kế tiếp nhưng không được tự đặt giờ hoặc phương pháp rã đông.

## DECISIONS LOG

- Blueprint/TIP checkpoint được gộp vì task graph KE-003 đã được Chủ nhà duyệt và
  Chủ nhà yêu cầu tiếp tục trong vai trò Thầu–Thợ.
- “Hạn trên nhãn” là tín hiệu ưu tiên dùng, không phải kết luận an toàn.
- Không gửi push/email trong TIP này; reminder chỉ xuất hiện trong app.
- Không xoá relation lot khi dùng hết; giữ qty=0 và movement để audit.
- Legacy item chưa ghi movement; UI đánh dấu dữ liệu cũ và giữ đường xoá tương
  thích cho đến khi migration được duyệt.

## OUTCOME

1. Kho hiển thị lô còn hàng theo FEFO: hạn nhãn sớm trước, lô không có hạn sau.
2. Người dùng mở một lô và ghi nhận “Đã dùng” hoặc “Bỏ đi”.
3. Mutation trừ đúng lượng, không âm, idempotent và household-scoped.
4. Lô hết hàng rời danh sách đang có nhưng lịch sử movement vẫn được giữ.
5. Lô ngăn đông cần cho món ngày kế tiếp được nhắc trong app, không bịa thời gian
   rã đông.

## DATA CONTRACT

Thêm `InventoryMovement`:

```text
id                String
idempotencyKey    String unique
householdId       String
inventoryLotId    String
kind              consumed | discarded
qty               Float
unit              String
qtyBefore         Float
qtyAfter          Float
occurredAt        DateTime
note              String?
createdAt         DateTime
```

`InventoryLot.qty` là số dư hiện tại. Không sửa `purchasedAt`, `bestBefore` hoặc
nguồn mua khi ghi movement.

## SERVER CONTRACT

```ts
recordInventoryMovement(input): Promise<{
  movement: InventoryMovement;
  lot: InventoryLot;
}>
```

Input:

- `idempotencyKey`: UUID.
- `lotId`: 1..120 ký tự.
- `kind`: `consumed | discarded`.
- `qty`: >0 và <=1,000,000.
- `occurredAt`: ISO datetime, không quá now + 5 phút.
- `note`: optional, tối đa 500 ký tự.

Quy tắc:

1. `requireUserId()` và Zod `.strict()`.
2. Tìm lot bằng `(id, currentHouseholdId)`; không nhận household ID từ client.
3. Legacy ID bị từ chối với `LEGACY_LOT_READ_ONLY`.
4. Transaction serializable kiểm tra qty không vượt số dư.
5. Cùng idempotency key trả cùng canonical movement/lot.
6. Hai request cạnh tranh không được làm số dư âm.
7. Lỗi không tạo partial movement hoặc partial decrement.

## DOMAIN CONTRACT

- `expirySignal(lot, now)` trả `unknown | overdue | today | soon | later`.
- `soon` là hạn trên nhãn trong 1–2 ngày lịch tiếp theo.
- Copy UI phải dùng “hạn trên nhãn”, không dùng “an toàn tới” hay “đã hỏng”.
- `sortLotsFefo` chỉ xếp lot qty>0: dated ascending, undated last, rồi
  purchasedAt/id để deterministic.
- `frozenLotsNeededForDay` chỉ match commodity của lô freezer qty>0 với nguyên
  liệu trong các món kế hoạch ngày mục tiêu.

## UI CONTRACT

- Trang Kho có nhóm “Ưu tiên dùng trước”.
- Mỗi card: tên, số dư, nơi cất, hạn trên nhãn nếu có, badge trạng thái trung thực.
- Relation lot mở `InventoryLotSheet`; không còn nút xoá nhanh.
- Sheet có lượng ghi nhận, loại “Đã dùng/Bỏ đi”, thời điểm, ghi chú và số dư sau.
- Không optimistic decrement; chỉ cập nhật canonical result sau server success.
- Lỗi giữ sheet và input.
- Lô qty=0 xuất hiện trong phần “Hoạt động gần đây”, không tính vào số đang có
  hoặc gợi ý nấu.
- Reminder ngăn đông nêu món ngày mai cần nguyên liệu nào và yêu cầu xem hướng
  dẫn/nhãn; không đưa số giờ tự sinh.
- Nhãn đầy đủ Việt/Anh, mobile 390×860, focus/Escape theo `BottomSheet`.

## REQUIREMENTS MATRIX

| ID | Requirement | Priority |
|---|---|---|
| KE3-001 | FEFO deterministic cho lô còn hàng | P0 |
| KE3-002 | Không bịa hạn; copy phân biệt hạn trên nhãn với an toàn | P0 |
| KE3-003 | Ghi nhận consumed/discarded có audit | P0 |
| KE3-004 | Số dư không âm và không partial write | P0 |
| KE3-005 | Mutation idempotent | P0 |
| KE3-006 | Auth fail-closed và household-scoped | P0 |
| KE3-007 | Legacy pantry không mất dữ liệu | P0 |
| KE3-008 | Lô hết không tính vào shopping/cook-from-pantry | P0 |
| KE3-009 | Reminder freezer dựa trên kế hoạch, không bịa giờ rã đông | P1 |
| KE3-010 | UI lỗi không giảm tồn giả | P0 |
| KE3-011 | Việt/Anh và accessibility/mobile | P1 |
| KE3-012 | Migration reviewable, chưa chạy production | P0 |

## ACCEPTANCE CRITERIA

- AC-01: dated lots được xếp trước undated và theo hạn tăng dần.
- AC-02: lot không có bestBefore hiển thị “Chưa nhập hạn trên nhãn”.
- AC-03: ghi dùng 100g từ lot 310g tạo movement và trả số dư 210g.
- AC-04: retry cùng key không trừ lần hai.
- AC-05: qty vượt số dư bị từ chối, không movement/không thay số dư.
- AC-06: đoán lot household khác không đọc hoặc sửa được.
- AC-07: lot về 0 không còn trong tồn khả dụng nhưng movement còn audit.
- AC-08: server lỗi không thay đổi UI.
- AC-09: freezer lot cần cho món ngày kế tiếp tạo reminder không có số giờ.
- AC-10: mobile sheet dùng được bằng keyboard và không overflow.

## REQUIRED TESTS

- Unit: expiry states, FEFO tie-break, zero exclusion, frozen-plan matching.
- Repository adapter: decrement, retry, overdraw, reconcurrent business behavior.
- E2E mobile: open lot, consume partial, canonical balance, reload persistence,
  overdraw disabled/rejected và screenshot.
- Existing unit/E2E không regress.

## QUALITY GATES

```bash
npx prisma format
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run lint
npm test
npm run build
npm run test:e2e
git diff --check
```

## MIGRATION

- Sinh migration SQL reviewable.
- Không `db push`, không apply local/production.
- Không gọi Neon/Clerk thật trong E2E.

## COMPLETION REPORT

Tạo `design/COMPLETION-KE-003.md` với requirement coverage, AC results,
technical health có số cụ thể, migration status, issues, deviations và overall
`READY | READY-với-deferred | NOT READY`.
