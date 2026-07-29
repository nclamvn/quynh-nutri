# TIP-KE-002 — Nhận hàng đã mua và tạo lô thực phẩm trong kho

## ROLE

Bạn là **BUILDER / Thợ** trong Vibecode Kit v6.1. Blueprint đã được Chủ nhà duyệt.
Triển khai đúng contract dưới đây, tự kiểm thử và nộp Completion Report. Nếu phát
hiện cần đổi business rule, schema contract hoặc phạm vi, dừng và báo Chủ thầu;
không tự mở rộng.

## HEADER

- TIP-ID: `TIP-KE-002`
- Project: Quỳnh Nutri / Bữa cơm nhà
- Module: Kitchen Execution
- Depends on: `TIP-KE-001` — DONE
- Priority: P0
- Estimated effort: 6–10 giờ Builder
- Working directory: root của project sau khi giải nén

## CONTEXT

### Trạng thái hiện tại

- Next.js 16.2.12 App Router, React 19, TypeScript strict.
- Clerk bảo vệ household; mọi mutation phải fail-closed và scope theo household.
- Prisma 7 + Neon Postgres.
- Danh sách chợ được derive từ `WeekPlan`, pantry và repertoire.
- `ShoppingItem.checked` hiện chỉ nằm trong React state, mất khi reload.
- Pantry hiện nằm ở `Household.pantry Json` và `addPantry` gộp theo commodity.
- `PurchaseRecord` đã lưu được lượng/giá thực mua nhưng chưa nối tới dòng chợ.
- E2E bypass dùng in-memory adapter; tuyệt đối không được gọi Clerk/Neon thật.
- TIP-KE-001 đã thêm registry hướng dẫn và `IngredientGuideSheet`.

### Files phải đọc trước khi làm

- `AGENTS.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
- `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`
- `design/BLUEPRINT-kitchen-execution.md`
- `design/TIP-KE-001.md`
- `design/COMPLETION-KE-001.md`
- `prisma/schema.prisma`
- `src/domain/types.ts`
- `src/domain/shopping/aggregator.ts`
- `src/domain/pantry/index.ts`
- `src/data/repo/household.ts`
- `src/app/actions.ts`
- `src/ui/store.tsx`
- `src/app/(tabs)/shopping/page.tsx`
- `src/app/(tabs)/pantry/page.tsx`

### Pattern phải giữ

- Domain thuần và test được; UI không tự quyết business rule.
- Boundary Server Action dùng Zod `.strict()`.
- Repository tự scope household, không nhận `householdId` tin cậy từ client.
- Mutation production và E2E cùng contract, chỉ khác adapter.
- Optimistic UI phải rollback hoặc reload canonical state khi persistence lỗi.
- Dữ liệu người dùng là ground truth; app không tự bịa hạn dùng hoặc giá.

## OUTCOME

Khi người dùng đánh dấu một mặt hàng là đã mua:

1. Mở sheet xác nhận lượng thực mua, nơi cất, ngày mua và giá tùy chọn.
2. Xác nhận một lần tạo đúng một fulfillment cho dòng chợ.
3. Nếu chọn “Đưa vào kho”, tạo đúng một lô thực phẩm riêng biệt.
4. Trạng thái đã mua tồn tại sau reload và trên thiết bị khác.
5. Thao tác gửi lặp do mạng/chạm hai lần không tạo bản ghi trùng.

## DATA CONTRACT

### 1. `ShoppingFulfillment`

Thêm relation thực trong Prisma, không lưu trạng thái mua vào localStorage:

```text
id                String/UUID-CUID
householdId       String
weekRef           String          // ISO date YYYY-MM-DD
commodityId       String
vendor            String          // giữ đúng vendor của ShoppingItem
plannedQty        Float           // snapshot tại lúc xác nhận
actualQty         Float           // ground truth người dùng nhập
unit              String
boughtAt          DateTime
pricePaid         Int?            // VND cho dòng này; null = chưa biết
inventoryLotId    String? unique
createdAt         DateTime
updatedAt         DateTime
```

Unique business key:

```text
@@unique([householdId, weekRef, commodityId, vendor])
```

Không dùng trạng thái `checked` boolean riêng. Sự tồn tại của fulfillment hợp lệ
là nguồn sự thật cho “đã mua”.

### 2. `InventoryLot`

```text
id                String/UUID-CUID
householdId       String
commodityId       String
qty               Float
unit              String
purchasedAt       DateTime
storageLocation   pantry | fridge | freezer
bestBefore        DateTime?       // chỉ khi người dùng nhập từ nhãn
sourceWeekRef     String?
sourceShoppingKey String?
createdAt         DateTime
updatedAt         DateTime
```

Mỗi lần mua là một lot riêng, không gộp chỉ vì cùng commodity. `bestBefore` để
null nếu người dùng không nhập; tuyệt đối không sinh ngày hết hạn từ AI hoặc
`kitchen-guides`.

### 3. Legacy pantry JSON

`Household.pantry Json` đang có dữ liệu thật nên không được xóa ngay.

- Load path phải hợp nhất legacy items và relation lots để không mất dữ liệu.
- Legacy item được map thành lot chỉ-đọc với ID ổn định
  `legacy:<householdId>:<commodityId>:<index>`.
- Mutation mới chỉ ghi vào `InventoryLot`.
- Tạo script migration idempotent riêng để chuyển legacy JSON thành lots; script
  chỉ xóa JSON của một household sau khi transaction tạo đủ lots thành công.
- Không chạy migration production trong TIP nếu chưa có xác nhận của Chủ nhà.

## SERVER CONTRACT

Tạo Server Action duy nhất cho thao tác nhận hàng, tên đề xuất:

```ts
receiveShoppingItem(input: ReceiveShoppingItemInput): Promise<{
  fulfillment: ShoppingFulfillment;
  lot?: InventoryLot;
  purchase: PurchaseRecord;
}>
```

Input client được phép gửi:

```text
idempotencyKey    string UUID
weekRef           ISO date
commodityId       known commodity id
vendor            1..120 chars
plannedQty        > 0
actualQty         > 0
unit              1..20 chars
boughtAt          ISO datetime, không vượt quá now + 5 phút
pricePaid         integer 1..1,000,000,000 optional
addToPantry       boolean
storageLocation   required khi addToPantry=true
bestBefore        ISO datetime optional; phải sau purchasedAt
```

### Quy tắc mutation

1. `requireUserId()` trước mọi truy cập dữ liệu.
2. Không nhận hoặc tin `householdId` từ client.
3. Xác minh `commodityId` tồn tại trong registry.
4. Xác minh dòng `(weekRef, commodityId, vendor)` thực sự có trong danh sách chợ
   hiện tại của household hoặc đã có fulfillment trước đó.
5. Chạy transaction:
   - upsert fulfillment theo unique business key;
   - tạo hoặc update lot liên kết nếu `addToPantry=true`;
   - tạo `PurchaseRecord` tương ứng đúng một lần.
6. `idempotencyKey` phải được lưu hoặc ràng buộc unique để retry trả lại cùng kết
   quả, không tạo purchase/lot thứ hai.
7. Không cho client sửa fulfillment của household khác.
8. Trả canonical rows từ DB; client dùng kết quả này thay optimistic temporary ID.

### Re-confirm

Nếu người dùng mở một fulfillment đã có và xác nhận lại:

- Update `actualQty`, `pricePaid`, `boughtAt`.
- Nếu đã có lot liên kết, đồng bộ lượng/ngày/nơi cất.
- Nếu trước đó không đưa vào kho và nay bật, tạo lot.
- Nếu trước đó đã có lot nhưng nay tắt “Đưa vào kho”, không tự xóa lot. Trả lỗi
  business `LOT_ALREADY_CREATED`; người dùng phải quản lý lot tại trang Kho.

### Bỏ đánh dấu

Không xóa fulfillment, purchase hoặc lot bằng một cú click checkbox.

- Click vào mặt hàng đã mua mở chi tiết xác nhận đã mua.
- Có action “Cần mua lại” tạo trạng thái override riêng hoặc reset fulfillment
  chỉ khi chưa có lot/purchase; nếu chưa thiết kế được audit-safe thì **defer** và
  không hiển thị nút giả.

## UI CONTRACT

### `ReceiveShoppingItemSheet`

Sheet phải hiển thị:

- Tên mặt hàng, lượng kế hoạch và vendor.
- Lượng thực mua; prefill bằng planned quantity.
- Đơn vị giữ nguyên trong TIP này.
- Ngày/giờ mua, mặc định hiện tại.
- Giá đã trả, tùy chọn, ghi rõ là tổng giá cho dòng.
- Toggle “Đưa vào Kho & Tủ lạnh”, mặc định bật.
- Nơi cất: Tủ bếp / Ngăn mát / Ngăn đông.
- Hạn trên nhãn, tùy chọn; không prefill tự động.
- Tóm tắt hướng dẫn bảo quản từ TIP-KE-001 nếu có.
- Nút chính “Xác nhận đã mua”.

### Hành vi

- Click checkbox chưa mua mở sheet, chưa thay đổi trạng thái ngay.
- Disable submit khi request đang chạy; chống double-submit.
- Thành công: đóng sheet, hiển thị tick, cập nhật progress và toast.
- Lỗi: giữ sheet, giữ input, hiển thị lỗi dễ hiểu; không tick giả.
- Item đã mua hiển thị lượng thực tế nếu khác lượng kế hoạch.
- Keyboard/focus trap/escape giữ pattern `BottomSheet`.
- Đầy đủ nhãn tiếng Việt và tiếng Anh.

## SHOPPING DERIVATION RULES

- `aggregateShopping` vẫn tính nhu cầu kế hoạch và trừ tồn kho cũ.
- Lot được tạo từ chính fulfillment của `weekRef` hiện tại là hàng đã mua cho
  kế hoạch đó; không được làm dòng vừa mua biến mất khỏi progress của tuần.
- Resolver phải:
  1. derive planned items;
  2. attach fulfillment theo business key;
  3. chỉ trừ inventory không reserved cho chính dòng/tuần đó;
  4. giữ dòng fulfilled trong danh sách với trạng thái bought.
- Tuần sau, lot còn tồn được tính là pantry bình thường.
- Không tự trừ lượng đã ăn trong TIP này; consumption thuộc TIP sau.

## MIGRATION AND COMPATIBILITY

- Prisma schema phải có indexes cho `householdId`, `weekRef` và unique key.
- Cung cấp migration SQL/Prisma migration có thể review; không dùng `db push`
  trực tiếp lên production.
- Existing household không có fulfillment vẫn hoạt động như trước.
- Legacy pantry item thiếu expiry/storage không được gán giá trị giả.
- E2E state phải reset giữa tests hoặc tạo namespace để test không rò trạng thái.

## REQUIREMENTS MATRIX

| ID | Requirement | Priority |
|---|---|---|
| KE2-001 | Xác nhận lượng mua thực tế trước khi tick | P0 |
| KE2-002 | Fulfillment tồn tại qua reload/đa thiết bị | P0 |
| KE2-003 | Mỗi lần mua tạo lot riêng khi người dùng chọn | P0 |
| KE2-004 | Mutation idempotent, không trùng lot/purchase | P0 |
| KE2-005 | Auth fail-closed và household-scoped | P0 |
| KE2-006 | Không làm mất legacy pantry JSON | P0 |
| KE2-007 | Không tự sinh hạn dùng hoặc giá | P0 |
| KE2-008 | Dòng vừa mua không biến mất khỏi progress tuần | P0 |
| KE2-009 | UI rollback đúng khi server lỗi | P0 |
| KE2-010 | Việt/Anh và accessibility | P1 |
| KE2-011 | E2E adapter không gọi external services | P0 |
| KE2-012 | Migration reviewable và chưa tự chạy production | P0 |

## ACCEPTANCE CRITERIA

### AC-01 — Receive happy path

Given một shopping item chưa mua
When người dùng nhập lượng thực, chọn ngăn mát và xác nhận
Then một fulfillment, một purchase và một lot được tạo
And item vẫn nằm trong danh sách với trạng thái đã mua.

### AC-02 — Reload

Given item đã được xác nhận
When reload `/shopping` hoặc mở ở client mới
Then tick và lượng thực tế vẫn hiển thị từ server.

### AC-03 — Idempotency

Given cùng `idempotencyKey` và payload
When request được gửi hai lần
Then DB chỉ có một fulfillment, một purchase và tối đa một lot
And hai response cùng canonical IDs.

### AC-04 — Cross-household isolation

Given user A đoán được fulfillment/lot ID của user B
When user A thử đọc hoặc sửa
Then action trả not-found/forbidden mà không tiết lộ dữ liệu B.

### AC-05 — Validation

Given qty bằng 0, commodity không tồn tại, ngày mua tương lai quá 5 phút hoặc
bestBefore trước purchasedAt
When submit
Then Zod/business validation từ chối và không có partial write.

### AC-06 — Server failure

Given repository throw trong transaction
When submit
Then UI không tick, không mất input, hiển thị lỗi và không có partial record.

### AC-07 — Legacy pantry

Given household có pantry JSON cũ
When load pantry và shopping
Then lượng cũ vẫn được tính đúng, không nhân đôi và không bị xóa.

### AC-08 — Current-week reservation

Given lot được tạo từ item của tuần hiện tại
When shopping list re-derive
Then dòng đã mua không biến mất và progress tăng.

### AC-09 — No fabricated expiry

Given người dùng không nhập hạn trên nhãn
When lot được tạo
Then `bestBefore=null`; hướng dẫn bảo quản không được biến thành ngày hết hạn.

### AC-10 — Responsive/accessibility

Given viewport 390×860 và keyboard navigation
When mở sheet, nhập và xác nhận
Then không overflow, focus ở đầu sheet, labels đọc được và Escape đóng sheet.

## REQUIRED TESTS

### Unit

- Fulfillment merge vào shopping items.
- Current-week lot reservation không làm mất dòng.
- Previous-week/unreserved lot được trừ đúng.
- Legacy pantry normalization.
- Input validation, time bounds, best-before ordering.

### Repository/action

- Idempotency retry.
- Transaction rollback.
- Household isolation.
- Re-confirm update.
- `LOT_ALREADY_CREATED`.
- E2E adapter parity.

### E2E

- Mobile receive happy path + screenshot.
- Reload persistence.
- Double-click/double-submit không trùng.
- Invalid qty không tick.
- Pantry hiển thị lot vừa tạo.
- Existing 26 E2E tests không regress.

## QUALITY GATES

Phải chạy và báo số cụ thể:

```bash
npm ci
npx prisma generate
npm run lint
npx tsc --noEmit
npm test
npm run build
npm run test:e2e
git diff --check
```

Không được ghi “tests pass” chung chung; Completion Report phải có số pass/fail.

## CONSTRAINTS

- Không thay tech stack hoặc thêm state-management library.
- Không cho AI sinh hạn dùng, giá, nhiệt độ hoặc vị trí cất.
- Không xóa lịch sử purchase/lot như side effect của bỏ checkbox.
- Không chạy migration hay seed trên production.
- Không commit `.env*`, credentials, database dump hoặc test user.
- Không sửa ngoài phạm vi trừ lỗi P0 chặn TIP; nếu phải sửa, ghi DEVIATION.
- Giữ nguyên các thay đổi có sẵn trong worktree; không reset hoặc checkout đè.

## ESCALATION

- L1: tên helper, chia component, index nội bộ trong đúng contract.
- L2 → Chủ thầu: cần đổi unique key, action contract, legacy strategy hoặc UI flow.
- L3 → Chủ nhà: xóa/chuyển dữ liệu production, thay business rule, chạy migration.

## COMPLETION REPORT FORMAT

Tạo `design/COMPLETION-KE-002.md`:

```text
STATUS: DONE | PARTIAL | BLOCKED
FILES CHANGED: created + modified
REQUIREMENT COVERAGE: implemented/12 + %
SCENARIO RESULTS: AC-01..AC-10 pass/fail + severity
TECHNICAL HEALTH: lint/type/build/unit/e2e với số cụ thể
MIGRATION STATUS: generated/reviewed/applied-to-local/not-applied-production
ISSUES: severity + description
DEVIATIONS: what + why + impact
SUGGESTIONS: cho Chủ thầu
OVERALL STATUS: READY | READY-với-deferred | NOT READY
```
