# TIP-KE-006 — Ghi nhận đồ thừa và tái sử dụng an toàn

**Trạng thái:** READY FOR BUILDER
**Chủ thầu:** Codex — Kiến trúc sư trưởng
**Ngày lập:** 2026-07-29
**Phụ thuộc:** KE-003, KE-004, KE-005 đã nghiệm thu

## 1. Mục tiêu

Sau khi hoàn tất một bữa ăn, gia đình có thể ghi nhận món còn thừa, nơi bảo quản, thời điểm chuẩn bị/làm lạnh và lượng khẩu phần. Ứng dụng hỗ trợ theo dõi, nhắc xem lại, hướng dẫn hâm nóng hoặc loại bỏ dựa trên dữ liệu người dùng đã xác nhận.

Sản phẩm không tự quan sát căn bếp, không tự xác nhận món đã nguội/đã cất, không thay thế đánh giá cảm quan hay tư vấn y tế, và không gọi một món là “an toàn” chỉ vì còn trong một khoảng thời gian.

## 2. Quyết định kiến trúc bắt buộc

### 2.1 Tách món thừa khỏi tồn kho nguyên liệu

Tạo aggregate `LeftoverLot` riêng. Không dùng `InventoryLot` vì món đã nấu:

- là thực phẩm hỗn hợp, không thể hoàn nguyên chính xác thành các nguyên liệu;
- có lịch sử chuẩn bị, làm nguội và hâm lại riêng;
- được đo phù hợp hơn bằng khẩu phần;
- cần ngôn ngữ an toàn thực phẩm khác với hạn dùng nguyên liệu.

KE-006 tuyệt đối không cộng lại nguyên liệu vào kho và không trừ `InventoryLot`.

### 2.2 Dữ liệu thực tế do người dùng xác nhận

Ứng dụng chỉ được lưu các sự kiện người dùng xác nhận:

- món nào còn thừa;
- số khẩu phần;
- `preparedAt`;
- `chilledAt`;
- ngăn mát hay ngăn đông;
- điều kiện nóng trên 32°C nếu người dùng biết và chủ động bật;
- đã dùng hoặc đã bỏ bao nhiêu.

Không suy ra `chilledAt` từ thời điểm bấm “xong bữa”. Có thể điền mặc định để giảm thao tác nhưng phải hiển thị và yêu cầu xác nhận.

### 2.3 Chính sách hướng dẫn, không phải “hạn an toàn”

Tạo domain policy thuần, có phiên bản và nguồn:

- Làm lạnh trong vòng 2 giờ; dùng ngưỡng 1 giờ khi người dùng xác nhận nhiệt độ môi trường trên 32°C.
- Với ngăn mát, hiển thị mốc “xem lại theo hướng dẫn” từ ngày thứ 3 và “đã qua khoảng 3–4 ngày theo hướng dẫn” sau ngày thứ 4.
- Với ngăn đông, không bịa hạn an toàn; nếu hiển thị mốc chất lượng phải ghi rõ đó là chất lượng, không phải an toàn.
- Khi hướng dẫn hâm lại đồ thừa, nêu nhiệt độ tâm 74°C/165°F.

Không lưu một `expiresAt` giả tạo. Các tín hiệu phải được tính từ dữ liệu gốc và phiên bản policy.

Nguồn chính thức đã được Chủ thầu đối chiếu ngày 2026-07-29:

- USDA FSIS — Leftovers and Food Safety:
  https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety
- FoodSafety.gov — Cold Food Storage Chart:
  https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts

Thợ phải kiểm tra lại nội dung nguồn trước khi chốt copy. Nếu nguồn thay đổi hoặc mâu thuẫn, dừng phần policy và báo Chủ thầu.

## 3. Mô hình dữ liệu đề xuất

Tên trường có thể điều chỉnh cho hợp schema hiện tại nhưng không được làm mất ngữ nghĩa.

```prisma
model LeftoverLot {
  id                    String   @id @default(cuid())
  householdId           String
  dishRef               String
  dishLabelSnapshot     String
  remainingServings     Float
  preparedAt            DateTime
  chilledAt             DateTime
  storageLocation       String
  hotWeatherConfirmed   Boolean  @default(false)
  policyVersion         String
  sourceMealRunRef      String?
  note                  String?
  createdByUserId       String
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  household             Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
  movements             LeftoverMovement[]

  @@index([householdId, chilledAt])
}

model LeftoverMovement {
  id              String   @id @default(cuid())
  householdId     String
  leftoverLotId   String
  kind            String
  servings        Float
  beforeServings  Float
  afterServings   Float
  idempotencyKey  String
  occurredAt      DateTime
  createdByUserId String
  createdAt       DateTime @default(now())

  leftoverLot     LeftoverLot @relation(fields: [leftoverLotId], references: [id], onDelete: Cascade)

  @@unique([householdId, idempotencyKey])
  @@index([householdId, leftoverLotId, occurredAt])
}
```

`dishRef` chủ ý chưa đặt foreign key: catalog món hiện còn trộn giữa dữ liệu seed và dữ liệu DB. `dishLabelSnapshot` giữ khả năng audit khi tên món thay đổi.

Các giá trị `storageLocation` và `kind` phải được ràng buộc bằng enum hoặc schema validation tập trung:

- `storageLocation`: `fridge | freezer`
- `kind`: `consumed | discarded | corrected`

## 4. Yêu cầu chức năng

| ID | Yêu cầu |
|---|---|
| KE6-001 | Có `LeftoverLot` cấp hộ gia đình, tách khỏi `InventoryLot`. |
| KE6-002 | Ghi nhận món, khẩu phần, giờ chuẩn bị, giờ làm lạnh và nơi bảo quản bằng xác nhận rõ ràng. |
| KE6-003 | Chặn việc ghi nhận là đang bảo quản nếu khoảng chờ làm lạnh vượt ngưỡng policy; trả lỗi có mã và hướng dẫn trung thực. |
| KE6-004 | Tính tín hiệu ngăn mát 3–4 ngày từ `chilledAt`; không lưu hoặc hiển thị như hạn bảo đảm an toàn. |
| KE6-005 | Hiển thị hướng dẫn hâm lại 74°C/165°F và liên kết nguồn. |
| KE6-006 | Server action bắt buộc auth, membership hộ gia đình, validation, transaction và idempotency. |
| KE6-007 | Mọi lần dùng/bỏ/sửa lượng phải có movement audit; không cho số âm. |
| KE6-008 | Sau khi kết thúc `MealRunMode`, cho mở luồng “Có món còn thừa?” với các món vừa hoàn thành. |
| KE6-009 | Trang kho có khu vực “Món còn thừa”, nhóm rõ ngăn mát/ngăn đông và ưu tiên món cần xem lại. |
| KE6-010 | Không tự động biến món thừa thành nguyên liệu, không sửa tồn kho và không tự đánh dấu đã dùng/bỏ. |
| KE6-011 | Copy Việt/Anh, semantic controls, focus management, Escape và thông báo lỗi truy cập được. |
| KE6-012 | Migration chỉ tạo và kiểm tra cục bộ; không áp dụng production trong TIP này. |

## 5. Domain policy

Tạo module thuần, ví dụ:

```text
src/domain/kitchen-execution/leftover-safety.ts
```

API gợi ý:

```ts
type LeftoverSafetySignal =
  | "within-guidance-window"
  | "review-guidance"
  | "past-guidance-window"
  | "freezer-quality-only";

evaluateCoolingWindow(input): {
  accepted: boolean;
  limitMinutes: 60 | 120;
  elapsedMinutes: number;
  reasonCode?: "COOLING_WINDOW_EXCEEDED";
}

evaluateLeftoverGuidance(input): {
  signal: LeftoverSafetySignal;
  ageHours: number;
  policyVersion: string;
}
```

Quy tắc:

- truyền `now` vào hàm, không đọc `Date.now()` ngầm;
- so sánh theo duration tuyệt đối, không theo ngày lịch;
- từ chối timestamp không hợp lệ, `chilledAt < preparedAt`, hoặc thời điểm vượt tương lai cho phép;
- mốc đúng biên phải có test;
- ngôn ngữ UI dùng “theo hướng dẫn”, “cần xem lại”, “đã qua khoảng hướng dẫn”; tránh nhãn “an toàn”/“không an toàn” nếu thiếu bằng chứng.

## 6. Server actions

Tạo các action tối thiểu:

```ts
createLeftoverLot(input)
recordLeftoverMovement(input)
```

Yêu cầu:

- xác thực Clerk và membership hộ gia đình ở phía server;
- kiểm tra `dishRef` thuộc bữa ăn/hộ đang thao tác hoặc catalog được phép;
- số khẩu phần hữu hạn và lớn hơn 0;
- idempotency key theo hộ gia đình;
- transaction khóa/điều kiện cập nhật để không overspend lượng còn lại;
- retry cùng key trả cùng kết quả, không tạo movement kép;
- không tin `beforeServings`, `afterServings` hay `createdByUserId` từ client;
- lỗi domain có mã ổn định để UI dịch;
- revalidate đúng trang liên quan, không dùng refresh rộng không cần thiết.

## 7. Trải nghiệm người dùng

### 7.1 Sau khi kết thúc bữa

- Nút kết thúc phiên mở câu hỏi không chặn: “Có món còn thừa cần cất không?”
- Liệt kê các món người dùng đã đánh dấu hoàn thành.
- Người dùng chọn từng món, nhập khẩu phần, xác nhận giờ chuẩn bị/giờ cho vào lạnh, vị trí và điều kiện nóng.
- Nếu vượt cooling window, không tạo lot active; hiển thị lý do và khuyến nghị theo nguồn.
- Có nút “Không có / Để sau”; không được ép khai báo.

### 7.2 Khu vực món còn thừa

- Hiển thị tên món, khẩu phần còn lại, nơi bảo quản, thời điểm làm lạnh và tín hiệu hướng dẫn.
- Sắp xếp ngăn mát theo tín hiệu cần xem lại rồi theo `chilledAt` cũ nhất.
- Hành động: “Đã dùng”, “Đã bỏ”, “Sửa lượng”.
- Hành động dùng/bỏ phải xác nhận lượng và không tự tạo bữa ăn hay log dinh dưỡng.
- Có liên kết mở hướng dẫn hâm lại; không bật timer hay đánh dấu hoàn tất tự động.

## 8. Ngoài phạm vi

- AI nhận diện món hoặc lượng thừa từ ảnh.
- Cảm biến nhiệt độ, tủ lạnh hoặc xác nhận tự động.
- Tính lại macro từ khẩu phần còn thừa.
- Tự xếp món thừa vào thực đơn tuần.
- Tự đặt hàng, tự nấu, tự hâm hoặc tự loại bỏ.
- Đồng bộ notification nền.
- Chuyển món thừa thành các lot nguyên liệu.

## 9. Kiểm thử bắt buộc

### Unit/domain

- ngưỡng 120 phút và 60 phút, gồm ngay trước/đúng/ngay sau biên;
- timestamp đảo, tương lai và không hợp lệ;
- ngăn mát trước 72 giờ, từ 72 đến 96 giờ, đúng 96 giờ và sau 96 giờ;
- ngăn đông không nhận nhãn hết hạn an toàn;
- thứ tự ưu tiên danh sách;
- parse input và mã lỗi ổn định.

### Repository/server

- auth và membership;
- idempotent create/movement;
- retry không nhân đôi;
- không cho overspend;
- household isolation;
- transaction rollback;
- không tạo/sửa `InventoryLot` hoặc `InventoryMovement`.

### E2E

1. Kết thúc phiên bữa ăn, ghi nhận một món còn thừa và thấy trên trang kho.
2. Ghi nhận giờ làm lạnh vượt ngưỡng và nhận cảnh báo, không tạo lot.
3. Dùng một phần, refresh, lượng còn lại đúng và movement chỉ có một.
4. Người dùng hộ khác không đọc hoặc sửa được lot.
5. Mobile 390px: dialog không tràn, focus và Escape hoạt động.

### Regression gates

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
git diff --check
```

## 10. Tiêu chí nghiệm thu

- 12/12 yêu cầu KE6 đạt.
- Không có đường dẫn nào tự sửa inventory hoặc tự tuyên bố món đã được bảo quản.
- Policy có source URL, version và unit test biên.
- Không có copy cam kết an toàn tuyệt đối.
- Server actions chống ghi kép và cách ly household.
- Migration được review nhưng chưa áp production.
- Tất cả quality gates xanh.
- Có `design/COMPLETION-KE-006.md` ánh xạ yêu cầu → code → test → bằng chứng.

## 11. Điểm dừng bắt buộc

Thợ phải dừng và báo Chủ thầu nếu:

- schema hiện tại không thể tạo quan hệ household mà không phá migration;
- quy định nguồn chính thức thay đổi đáng kể;
- muốn dùng một ngưỡng khác 60/120 phút hoặc 3–4 ngày;
- muốn ghi nhận món thừa vào `InventoryLot`;
- cần triển khai migration production, notification hoặc AI ngoài phạm vi.
