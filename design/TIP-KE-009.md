# TIP-KE-009 — Một nguồn sự thật cho thực đơn tuần

**Trạng thái:** READY FOR BUILDER
**Chủ thầu:** Codex — Kiến trúc sư trưởng
**Ngày lập:** 2026-07-29
**Phụ thuộc:** KE-007, KE-008

## 1. Mục tiêu

Biến thực đơn tuần thành dữ liệu canonical theo hộ gia đình và tuần:

- reload hoặc đổi thiết bị vẫn thấy đúng món, khóa và thay đổi đã lưu;
- shopping, agenda, prep-ahead và assistant cùng đọc một plan;
- reroll/đổi món/khóa không còn chỉ sống trong React state;
- lỗi mạng hoặc xung đột không bị che giấu;
- AI chỉ đọc plan canonical, không được tự thay món hoặc lưu plan.

Gói này xử lý nguồn sự thật, không thêm bảng task, trạng thái done, notification
hoặc quyền mutation cho AI.

## 2. Vấn đề hiện tại

Hiện có hai nguồn khác nhau:

1. UI tạo plan từ `seed` và giữ `manualPlan` trong client.
2. Assistant tự tạo một plan seed chuẩn ở server.

Hậu quả:

- reroll, đổi món và khóa mất sau reload;
- assistant có thể nói về plan khác màn hình;
- agenda client và agenda assistant có thể khác nhau;
- schema `WeekPlan`/`DaySlot` đã tồn tại nhưng repository chưa dùng;
- schema chưa có unique `(householdId, weekStart)`, unique
  `(weekPlanId, day, slot)` và version chống ghi đè.

## 3. Nguyên tắc kiến trúc

### 3.1 Canonical aggregate

`WeekPlan` là aggregate root. `DaySlot` không được ghi riêng lẻ từ client.

Domain vocabulary gợi ý:

```ts
type PersistedWeekPlan = WeekPlan & {
  id: string;
  version: number;
  updatedAt: string;
};

type SaveWeekPlanInput = {
  weekStart: string;
  expectedVersion: number;
  slots: PlannedSlot[];
};

type WeekPlanSyncState =
  | "loading"
  | "synced"
  | "saving"
  | "unsynced"
  | "conflict";
```

Không dùng `updatedAt` làm concurrency token. Dùng số `version` nguyên, tăng trong
cùng transaction.

### 3.2 Schema và migration

Tận dụng model hiện hữu, bổ sung tối thiểu:

```prisma
model WeekPlan {
  // fields hiện hữu
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([householdId, weekStart])
}

model DaySlot {
  // fields hiện hữu
  @@unique([weekPlanId, day, slot])
}
```

Migration phải có tên rõ, chạy được trên database có dữ liệu và không xóa plan
âm thầm. Nếu phát hiện duplicate cũ, migration hoặc script preflight phải dừng với
diagnostic; không tự chọn một bản ghi ngẫu nhiên.

Không tạo bảng task, event done hoặc assistant command.

### 3.3 Repository boundary

Tạo repository chuyên trách, ví dụ:

```text
src/data/repo/week-plan.ts
src/domain/planning/persisted-week-plan.ts
```

API repository:

```ts
loadOrCreateCurrentWeekPlan(...)
loadWeekPlan(weekStart)
saveWeekPlan(input)
```

Mọi hàm:

- lấy household từ auth/repository context, không nhận householdId từ client;
- chuẩn hóa `weekStart` là ngày ISO và đúng đầu tuần theo policy hiện hữu;
- load/create trong transaction hoặc xử lý unique race;
- trả aggregate đầy đủ theo thứ tự day/slot ổn định;
- không leak plan của household khác.

### 3.4 Load-or-create

Khi tuần chưa có plan:

1. server load household và repertoire hợp lệ;
2. gọi `generateWeek()` với seed chuẩn;
3. validate tất cả slot;
4. create một lần;
5. nếu hai request đua nhau, unique constraint thắng và request còn lại load bản
   canonical vừa tạo.

Không generate lại chỉ vì client reload.

### 3.5 Save và optimistic concurrency

Save là replace toàn bộ slot set trong một transaction:

1. validate input;
2. load plan thuộc household;
3. nếu payload slots giống canonical, trả canonical hiện tại, không tăng version;
4. nếu `expectedVersion` khác, trả conflict có cấu trúc, không ghi;
5. nếu khớp, replace/upsert slots và tăng version đúng một lần.

Không last-write-wins âm thầm. Không merge lock/món bằng AI.

## 4. Validation và an toàn

Server phải kiểm tra lại:

- `weekStart` đúng ISO date và đúng tuần yêu cầu;
- day 0..6, slot thuộc enum, tối đa 35 slot;
- không trùng `(day, slot)`;
- mỗi `dishId` tồn tại trong B0 hoặc B1 thuộc chính household;
- món vẫn qua `dishSafety()` với allergy/restriction hiện tại;
- mỗi slot dùng đúng loại slot của món, trừ khi policy hiện hữu cho phép rõ;
- `locked` là boolean;
- không nhận kcal, macro, prep step hoặc task state từ client.

### 4.1 B1 household dishes

Plan canonical phải giữ được món B1 mà UI cho phép chọn.

- Dùng quan hệ `householdDishId` hiện hữu.
- Không nhận nutrition/macro do client khai.
- Nếu B1 hiện chỉ có localStorage, bổ sung đường persist household dish tối thiểu
  trước hoặc cùng transaction plan.
- Validate commodity IDs, quantity/unit và ownership.
- Fork B1 có `sourceRepertoireId` vẫn là record household riêng, không giả thành B0.
- Nếu không thể persist một imported B1 hợp lệ, hiển thị lỗi unsynced rõ; không
  âm thầm đổi về món nguồn.

## 5. Yêu cầu chức năng

| ID | Yêu cầu |
|---|---|
| KE9-001 | Có type/validator canonical plan, stable slot order và exact round-trip. |
| KE9-002 | Migration thêm unique plan/week, unique day-slot, version/timestamps; không mất dữ liệu âm thầm. |
| KE9-003 | Repository load-or-create household-scoped, chống race và không generate lại sau reload. |
| KE9-004 | Save transaction có optimistic concurrency; identical retry idempotent, conflict không ghi đè. |
| KE9-005 | Server validate day/slot/dish/ownership/allergy/restriction và không tin nutrition từ client. |
| KE9-006 | B1 được persist/resolve đúng ownership; imported B1 không hợp lệ fail-closed. |
| KE9-007 | Store hydrate plan canonical trước khi cho chỉnh; reroll/change/lock lưu được qua reload. |
| KE9-008 | UI có trạng thái loading/saving/synced/unsynced/conflict, Retry rõ; không báo “đã lưu” giả. |
| KE9-009 | Shopping, agenda và prep-ahead client đều derive từ canonical/draft đang hiển thị, không từ seed song song. |
| KE9-010 | Assistant và server agenda đọc đúng plan canonical hiện tại; không có tool mutation plan. |
| KE9-011 | Week boundary/timezone và household isolation có repository tests; client không truyền householdId. |
| KE9-012 | Việt/Anh, mobile 390px, keyboard/focus, full unit/repository/E2E/regression xanh. |

## 6. Client state và UX

### 6.1 Hydration

- Trong khi load plan, trang Week hiển thị skeleton hoặc trạng thái đang tải.
- Không render plan seed tạm rồi đổi sang plan server gây flash.
- Các trang phụ thuộc plan dùng cùng Store state.
- Khi load thất bại, có thông báo trung thực và Retry; không tự nhận bản mặc định
  là đã đồng bộ.

### 6.2 Mutation

Reroll, đổi món và khóa có thể optimistic nhưng phải:

- cập nhật UI ngay;
- chuyển sync state sang `saving`;
- serialize/coalesce request để response cũ không ghi đè draft mới;
- khi thành công nhận version mới từ server;
- khi lỗi giữ draft dưới trạng thái `unsynced`, cho Retry;
- khi conflict giữ cả draft và canonical metadata đủ để người dùng chọn tải bản
  mới hoặc thử lại sau khi xem; không auto overwrite.

Không toast “đã lưu” trước response thành công.

### 6.3 Sync indicator

Trên Week hiển thị nhỏ gọn:

- “Đang tải thực đơn…”
- “Đang lưu…”
- “Đã lưu”
- “Chưa đồng bộ — Thử lại”
- “Thực đơn đã đổi ở nơi khác — Tải bản mới”

Không dùng dấu check cho hành động nấu/sơ chế; đây chỉ là trạng thái đồng bộ dữ liệu.

## 7. Assistant boundary

- Thay `generateWeek(seed: 1)` trong assistant agenda/prep bằng repository
  `loadOrCreateCurrentWeekPlan()`.
- Tool plan tuần nếu chỉ dùng để mô phỏng theo ràng buộc phải ghi rõ là preview,
  không phải canonical và không được lưu.
- Câu hỏi “thực đơn nhà tôi”, “việc bếp”, “chuẩn bị ngày mai” đọc cùng plan
  canonical.
- Không thêm tool save/reroll/change/lock cho model.
- Không nhận householdId, version hoặc weekStart tùy ý từ model.

## 8. Ngoài phạm vi

- Notification, background sync hoặc offline-first service worker.
- Lịch sử phiên bản/undo nhiều bước.
- CRDT hoặc merge tự động nhiều thiết bị.
- AI tự đổi món hay giải quyết conflict.
- Persist trạng thái nấu, prep-ahead hoặc done.
- Persist checkbox shopping trong gói này, trừ khi cần để bảo toàn schema migration;
  shopping vẫn derive từ plan và fulfillment hiện hữu.
- Tuần tương lai nhiều tuần trong UI.

## 9. Kiểm thử bắt buộc

### Domain/repository

- validator chặn duplicate day-slot, unknown dish, wrong slot, bad date;
- exact round-trip và stable ordering;
- load-or-create gọi hai lần chỉ có một plan;
- concurrent create không tạo duplicate;
- save đúng version tăng một lần;
- retry payload giống nhau không tăng version;
- stale version trả conflict và không đổi slots;
- household A không load/save plan B;
- B1 household A không dùng được ở B;
- allergy/restriction đổi sau khi plan tạo làm save unsafe bị chặn;
- migration constraints hoạt động trên database test.

### Client/E2E

1. Week load → đổi món → reload vẫn đúng.
2. Khóa slot → reroll → reload giữ slot khóa.
3. Plan lưu làm shopping và prep-ahead đổi cùng dữ liệu.
4. Overview agenda và assistant nói về cùng ngày/món canonical.
5. Giả lỗi save → hiện unsynced, không hiện “đã lưu”, Retry thành công.
6. Hai context/browser dùng stale version → conflict, không ghi đè.
7. B1 được chọn → reload vẫn resolve đúng hoặc fail rõ trước khi tuyên bố synced.
8. Mobile 390px không tràn; loading/error/conflict có keyboard path.

Không dùng mạng AI thật trong E2E.

### Gates

```bash
npx prisma validate
npx prisma migrate status
npx tsc --noEmit
npm run lint
npm test
npm run build
npm run test:e2e
git diff --check
```

## 10. Tiêu chí nghiệm thu

- 12/12 yêu cầu KE9 đạt.
- Reload và hai lần load không đổi plan canonical.
- Reroll/change/lock persist thật.
- Conflict không last-write-wins.
- UI, shopping, agenda, prep-ahead và assistant dùng cùng plan.
- B1 ownership fail-closed.
- Không AI mutation, task table hoặc done state.
- Full gates xanh.
- Có `design/COMPLETION-KE-009.md`.

## 11. Điểm dừng

Thợ phải báo Chủ thầu nếu:

- migration gặp duplicate plan/day-slot hiện hữu;
- cần xóa dữ liệu để thêm unique constraint;
- muốn dùng last-write-wins hoặc auto merge conflict;
- muốn bỏ qua B1 hoặc đổi B1 âm thầm về B0;
- muốn cho AI save/reroll/change plan;
- cần thêm task/done/notification;
- schema production không khớp migration history.
