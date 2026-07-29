# TIP-KE-007 — Việc bếp hôm nay và nhịp quản gia

**Trạng thái:** READY FOR BUILDER
**Chủ thầu:** Codex — Kiến trúc sư trưởng
**Ngày lập:** 2026-07-29
**Phụ thuộc:** KE-001 đến KE-006 đã nghiệm thu

## 1. Mục tiêu

Hợp nhất các tín hiệu đang nằm rải rác ở thực đơn, danh sách chợ, kho nguyên liệu, hướng dẫn nấu và món còn thừa thành một agenda “Việc bếp hôm nay”.

Người dùng mở ứng dụng và biết:

- việc nào cần xem trước;
- vì sao việc đó xuất hiện;
- dữ liệu nào làm căn cứ;
- bấm vào đâu để thực hiện trong luồng chính thức;
- ứng dụng biết gì và chưa biết gì.

Agenda là projection tất định từ dữ liệu gốc. AI chỉ được diễn giải hoặc tóm tắt projection này; không được tự tạo deadline, nhiệt độ, trạng thái hoàn thành hay task không có bằng chứng.

## 2. Quyết định kiến trúc

### 2.1 Không tạo bảng task mới

KE-007 không thêm Prisma model. Task được derive từ nguồn sự thật hiện hữu:

- `WeekPlan`;
- `ShoppingItem` và `ShoppingFulfillment`;
- `InventoryLot`;
- `LeftoverLot`;
- cooking guide đã rà soát;
- policy thuần đã có.

Không lưu bản sao task vì dễ drift với nguồn. Task chỉ biến mất khi nguồn sự thật đổi hoặc điều kiện thời gian không còn đúng.

### 2.2 Domain engine thuần

Tạo:

```text
src/domain/kitchen-execution/kitchen-agenda.ts
```

API gợi ý:

```ts
type KitchenAgendaTaskKind =
  | "review-leftover"
  | "review-inventory-label"
  | "prepare-frozen"
  | "shop"
  | "confirm-purchase"
  | "cook"
  | "coordinate-meal";

type KitchenAgendaTask = {
  id: string;
  kind: KitchenAgendaTaskKind;
  priority: "now" | "today" | "next";
  titleKey: string;
  reasonKey: string;
  sourceRef: string;
  actionHref: string;
  actionKey: string;
  dueAt?: string;
  evidence: Record<string, string | number>;
};

buildKitchenAgenda(input): {
  generatedAt: string;
  tasks: KitchenAgendaTask[];
  unsupported: AgendaUnsupportedSignal[];
};
```

Mọi thời điểm (`now`) và timezone phải được truyền vào. Không đọc đồng hồ ngầm trong domain.

### 2.3 Thứ tự ưu tiên

Thứ tự mặc định:

1. Món còn thừa đã qua/cần xem lại theo policy.
2. Lô nguyên liệu đã qua/hôm nay theo **ngày trên nhãn**.
3. Việc chuẩn bị nguyên liệu đông lạnh cho món ngày kế tiếp.
4. Xác nhận món hàng đã đánh dấu mua nhưng chưa có fulfillment.
5. Mua các mặt hàng chưa hoàn tất của tuần.
6. Nấu các món hôm nay có hướng dẫn đã rà soát.
7. Điều phối bữa khi có từ hai món được hỗ trợ.

Không dùng màu hoặc từ ngữ “an toàn/không an toàn” để suy ra trạng thái thực phẩm.

### 2.4 Stable identity và dedupe

Task ID phải tất định từ `kind + sourceRef + ngày scope`, không dùng random UUID. Engine phải:

- loại trùng;
- sort ổn định theo priority, dueAt, kind và id;
- không tạo hai task cook/coordinate mâu thuẫn;
- giữ `sourceRef` đủ để audit nhưng không chứa PII.

## 3. Yêu cầu chức năng

| ID | Yêu cầu |
|---|---|
| KE7-001 | Domain engine thuần tạo agenda từ các nguồn hiện hữu, nhận `now` và timezone rõ ràng. |
| KE7-002 | Leftover review dùng lại `evaluateLeftoverGuidance`, không chép lại ngưỡng. |
| KE7-003 | Inventory review dùng lại `expirySignal` và luôn ghi “theo ngày trên nhãn”. |
| KE7-004 | Prepare-frozen dùng lại `frozenLotsNeededForDay`, không bịa số giờ rã đông. |
| KE7-005 | Shopping phân biệt chưa mua với đã tick nhưng chưa có fulfillment. |
| KE7-006 | Cook task chỉ tạo cho món hôm nay có cooking guide đã rà soát; món thiếu guide vào `unsupported`. |
| KE7-007 | Coordinate task chỉ xuất hiện khi cùng bữa có ít nhất hai món được hỗ trợ. |
| KE7-008 | Overview hiển thị card “Việc bếp hôm nay”, tối đa ba việc đầu và nút xem tất cả. |
| KE7-009 | Sheet/page agenda hiển thị lý do, bằng chứng ngắn và deep link tới luồng chính thức. |
| KE7-010 | Không có nút “đánh dấu xong” giả; hoàn thành phải xảy ra trong shopping/pantry/cooking/leftover source flow. |
| KE7-011 | Assistant có thể đọc snapshot agenda đã cấu trúc để trả lời “Tôi nên làm gì tiếp?”, nhưng không được mutate. |
| KE7-012 | Việt/Anh, mobile 390px, semantic list, focus/Escape và reduced-motion tương thích. |

## 4. Quy tắc sinh task

### 4.1 Món còn thừa

- Chỉ xét lot có `remainingServings > 0`.
- `past-guidance-window` → `now`.
- `review-guidance` → `today`.
- `within-guidance-window` và `freezer-quality-only` không tự tạo task cảnh báo.
- Deep link: `/pantry#leftovers`.

### 4.2 Nguyên liệu

- `overdue` hoặc `today` → `now`.
- `soon` → `today`.
- `unknown` không tạo task thời hạn.
- Copy bắt buộc nhắc đây là ngày người dùng/nhãn đã nhập.
- Deep link: `/pantry`.

### 4.3 Chuẩn bị đông lạnh

- Dùng projection cho ngày kế tiếp theo timezone household.
- Chỉ tạo khi có lot ngăn đông thực sự cần cho món kế hoạch.
- `reasonKey` không chứa một thời lượng rã đông nếu registry không có nguồn tương ứng.

### 4.4 Đi chợ

- Gộp task mua theo ngày/tuần, không tạo một card cho mỗi dòng nếu danh sách dài.
- Nếu `checked === true` nhưng chưa có fulfillment tương ứng, tạo `confirm-purchase`.
- Nếu chưa checked/fulfilled, tạo `shop`.
- Evidence chứa số mặt hàng, không chứa giá giả.

### 4.5 Nấu và điều phối

- Chỉ xét slot của ngày hiện tại.
- `cook`: một task gộp theo bữa/ngày, evidence có số món hỗ trợ và số món chưa hỗ trợ.
- `coordinate-meal`: chỉ khi có ít nhất hai guide đã rà soát trong cùng nhóm ngày/bữa.
- Deep link tối thiểu `/week`; nếu thêm query/hash thì trang đích phải xử lý thật.

## 5. Assistant boundary

Thêm tool hoặc context adapter read-only, ví dụ `getKitchenAgenda`.

Yêu cầu:

- tool output chỉ là `KitchenAgendaTask[]` đã qua domain engine;
- không cho model truyền `now`, householdId hoặc sửa priority;
- server tự resolve household và thời gian;
- không trả PII không cần thiết;
- assistant phải nói rõ “theo dữ liệu bạn đã ghi nhận”;
- nếu agenda rỗng, trả lời rằng chưa có việc nào đủ căn cứ, không tự nghĩ thêm;
- không cung cấp nhiệt độ hoặc mốc bảo quản ngoài registry/policy đã kiểm duyệt;
- không gọi action ghi dữ liệu.

Nếu tích hợp assistant đòi thay kiến trúc tool framework ngoài phạm vi, hoàn tất agenda UI trước và báo Chủ thầu ở Level 2; không tự mở rộng.

## 6. UX

### Overview card

- Heading: “Việc bếp hôm nay”.
- Hiển thị số việc theo priority.
- Tối đa ba dòng: tiêu đề, lý do ngắn, nhãn nguồn.
- Empty state trung thực: “Chưa có việc bếp nào đủ dữ liệu để nhắc.”
- CTA “Xem tất cả”.

### Agenda sheet/page

- Nhóm `Cần xem ngay`, `Trong hôm nay`, `Tiếp theo`.
- Mỗi task có action duy nhất dẫn tới nguồn.
- Có dòng “Tạo từ…” để giải thích provenance.
- Có timestamp “Cập nhật lúc…”.
- Không có checkbox hoàn tất cục bộ.
- Khi quay lại sau mutation, agenda được derive lại từ store mới.

## 7. Ngoài phạm vi

- Notification push/email/SMS.
- Lịch nền hoặc cron.
- Tự mua hàng, tự thay đổi thực đơn hoặc tự đánh dấu hoàn tất.
- AI tự sinh task.
- Tạo schema task/acknowledgement/snooze.
- Dự đoán thời gian di chuyển, giá chợ hoặc thời gian rã đông.
- Đồng bộ timezone profile mới trong DB; dùng timezone cấu hình ứng dụng hiện tại.

## 8. Kiểm thử bắt buộc

### Unit/domain

- agenda rỗng;
- từng kind riêng lẻ;
- ưu tiên và sort ổn định;
- stable ID và dedupe;
- biên ngày theo timezone;
- leftover và inventory không sao chép/đổi semantic policy;
- shopping checked nhưng chưa fulfilled;
- shopping fulfilled không tạo task;
- một guide chỉ có cook, hai guide cùng bữa có coordinate;
- unsupported được báo trung thực;
- input không bị mutate.

### Assistant

- tool bắt buộc auth và household scope;
- agenda rỗng không sinh việc giả;
- tool read-only, không import mutation action;
- prompt/output giữ provenance language.

### E2E

1. Overview hiển thị agenda từ state đã ghi nhận.
2. Task món thừa mở đúng khu vực pantry.
3. Thực hiện movement ở source flow rồi quay lại, task derive lại/biến mất đúng.
4. Shopping checked chưa confirm hiển thị task xác nhận mua.
5. Mobile 390px: sheet không tràn, Tab/Escape đúng.
6. Empty state không bịa việc.

### Regression gates

```bash
npx prisma validate
npx tsc --noEmit
npm run lint
npm test
npm run build
npm run test:e2e
git diff --check
```

## 9. Tiêu chí nghiệm thu

- 12/12 yêu cầu KE7 đạt.
- Agenda hoàn toàn derive, không có DB task mới.
- Không có checkbox/local “done” làm lệch nguồn.
- AI chỉ đọc projection và không mutate.
- Mọi task có reason, sourceRef và action thật.
- Không bịa deadline, nhiệt độ, giá hoặc sự kiện đã xảy ra.
- Tất cả gate xanh.
- Có `design/COMPLETION-KE-007.md`.

## 10. Điểm dừng

Thợ phải báo Chủ thầu nếu:

- cần thêm schema để hoàn thành;
- không thể đưa agenda snapshot vào assistant mà không đổi framework;
- muốn thêm notification/snooze;
- muốn AI tự sắp priority hoặc sinh task;
- muốn tạo deep link mà trang đích chưa xử lý;
- phát hiện task có thể làm người dùng hiểu sai về an toàn thực phẩm.
