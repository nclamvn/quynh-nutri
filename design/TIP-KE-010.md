# TIP-KE-010 — Làm năng lực bà quản gia nhìn thấy được

**Trạng thái:** APPROVED FOR BUILDER
**Chủ thầu:** Codex — Kiến trúc sư trưởng
**Ngày lập:** 2026-07-29
**Phụ thuộc:** KE-007, KE-008, KE-009
**Phê duyệt:** Chủ nhà đã duyệt đề xuất trong task hiện tại

## 1. Mục tiêu

Sửa khoảng cách giữa “tính năng đã có” và “người dùng nhìn thấy”:

- mọi tài khoản sau đăng nhập đều nhận ra sản phẩm hỗ trợ lên tuần, đi chợ,
  chuẩn bị/nấu và cất dùng tiếp;
- Kho & Tủ lạnh có đường vào rõ trên desktop lẫn mobile;
- khả năng chưa dùng được phải giải thích lý do và chỉ đường tạo dữ liệu thật,
  không biến mất hoàn toàn;
- trạng thái rỗng là hướng dẫn hành động, không phải dữ liệu minh họa;
- giữ nguyên ranh giới: AI chỉ đọc, không tự tạo/sửa việc và không có trạng thái
  hoàn tất giả.

Không thay schema, không migration và không thêm bảng task.

## 2. Hướng thiết kế

### Chủ thể và công việc duy nhất

- Chủ thể: người đang lo bữa ăn cho gia đình Việt.
- Công việc của màn Tổng quan: trả lời “bắt đầu từ đâu để bà quản gia giúp được
  nhà mình?”.

### Ngôn ngữ thị giác

- Giữ token, Inter/Lora, card, blossom và palette hiện hữu.
- Không thêm màu hoặc font mới.
- Điểm nhấn duy nhất: dải hành trình bếp có thứ tự thật
  `Lên tuần → Đi chợ → Nấu & cất`.
- Desktop hiển thị thành ba trạm nối nhau; mobile xếp dọc để không tràn.
- Mỗi trạm chỉ dùng số liệu đang có trong Store hoặc trạng thái “chưa có dữ
  liệu”; không dùng phần trăm hoàn thành.

## 3. Yêu cầu

| ID | Yêu cầu |
|---|---|
| KE10-001 | Thêm `/pantry` vào nguồn điều hướng chung, có icon riêng và nhãn Việt/Anh; desktop Sidebar và mobile Menu cùng nhận. |
| KE10-002 | Tổng quan luôn có dải “Bà quản gia bắt đầu từ đây” với ba trạm lên tuần, đi chợ, nấu & cất. |
| KE10-003 | Mỗi trạm derive từ plan/shopping/pantry/leftovers thật; trạng thái rỗng không được giả completed, badge hay số liệu. |
| KE10-004 | Mỗi trạm có đúng một CTA hành động rõ tới `/week`, `/shopping` hoặc `/pantry`; dùng `next/link`. |
| KE10-005 | Agenda rỗng vẫn giải thích dữ liệu nào cần ghi nhận và có đường tới thực đơn/kho; không tạo task thay người dùng. |
| KE10-006 | Nút chuẩn bị ngày mai trên Week không biến mất khi ngày mai có plan nhưng chưa có hướng dẫn hỗ trợ; sheet phải nói rõ unsupported. |
| KE10-007 | Mỗi ngày trên Week luôn thể hiện khả năng phối hợp nấu: đủ ≥2 món thì mở được; chưa đủ thì disabled và nói rõ lý do. |
| KE10-008 | Shopping/Pantry empty state giải thích cách mở hướng dẫn chọn-cất, xác nhận mua và tạo lô kho bằng dữ liệu thật. |
| KE10-009 | Việt/Anh, keyboard/focus, semantic heading/link/button, mobile 390px không tràn; navigation và discovery có E2E. |
| KE10-010 | Không schema/migration/task/done/notification; không cấp mutation cho AI và không seed dữ liệu giả. |

## 4. Chi tiết hành vi

### 4.1 Dải quản gia

Tổng quan đặt dải mới trước agenda:

1. **Lên thực đơn**
   - plan có slot: nói rõ số ngày/số món đang có;
   - chưa có: nói cần tạo thực đơn;
   - CTA luôn tới `/week`.
2. **Đi chợ**
   - có shopping: nói số mặt hàng còn cần xác nhận;
   - chưa có: nói danh sách sẽ được tạo từ thực đơn;
   - CTA luôn tới `/shopping`.
3. **Nấu & cất**
   - có kho/đồ thừa: nói số lô và số món thừa đang ghi nhận;
   - chưa có: nói xác nhận hàng mua để đưa vào kho;
   - CTA tới `/pantry`.

Không dùng checkmark để ngụ ý công việc đã hoàn tất.

### 4.2 Week

- Khi có `tomorrowPrep`, luôn render nút mở prep-ahead.
- Nếu `supported.length === 0`, nút vẫn mở sheet và hiển thị nội dung unsupported
  đã có; nhãn không gắn số 0 như thành tích.
- Footer từng ngày luôn tồn tại:
  - `reviewedCount >= 2`: nút Phối hợp nấu hoạt động;
  - ít hơn: nút disabled, kèm câu “Cần ít nhất 2 món có hướng dẫn đã rà soát”.

### 4.3 Empty states

- Shopping rỗng: CTA tạo/xem thực đơn và mô tả hai thao tác sẽ có khi danh sách
  xuất hiện.
- Pantry không có lô: CTA sang Shopping; nói rõ chỉ hàng người dùng xác nhận mới
  được đưa vào kho.
- Agenda rỗng: không sinh task; hiển thị hai đường tạo bằng chứng là Week và Pantry.

## 5. Constraints

- Reuse `PageContainer`, card/token, `NAV_GROUPS`, `useStore`, `useI18n`.
- Không đổi bottom tab 4 mục; Pantry nằm trong Menu mobile và Sidebar desktop.
- Không thêm dependency hoặc font.
- Không dùng localStorage làm nguồn cho trạng thái discovery.
- Không ghi database khi chỉ xem hub.
- Không thay thuật toán agenda, prep-ahead, shopping hoặc safety.
- Không sửa landing marketing trong gói này.

## 6. Acceptance criteria

1. **Given** tài khoản chưa có kho/đồ thừa
   **When** mở Overview
   **Then** vẫn thấy đủ ba trạm và CTA thật, không thấy dữ liệu hoàn tất giả.
2. **Given** mobile 390px
   **When** mở Menu
   **Then** thấy “Kho & Tủ lạnh” và đi được tới `/pantry`.
3. **Given** ngày mai không có prep guide được hỗ trợ
   **When** mở Week
   **Then** vẫn thấy “Chuẩn bị cho ngày mai”; sheet nói rõ món unsupported.
4. **Given** một ngày có dưới hai món được rà soát
   **When** xem card ngày
   **Then** thấy affordance disabled và lý do, không bị ẩn.
5. **Given** shopping/pantry rỗng
   **When** mở trang
   **Then** empty state giải thích dữ liệu thật cần tạo và CTA tiếp theo.
6. **Given** suite hiện hữu
   **When** chạy quality gates
   **Then** lint, unit, build và toàn bộ E2E đều xanh.

## 7. Quality gates

```bash
npm run check
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmsuZGV2JA \
CLERK_SECRET_KEY=sk_test_ci-placeholder npm run test:e2e
git diff --check
```

## 8. Báo cáo

Thợ phải nộp `design/COMPLETION-KE-010.md` với:

- coverage KE10-001..010;
- số test/gate cụ thể;
- ảnh mobile/desktop hoặc E2E visual evidence;
- deviations/issues còn lại;
- khẳng định không có schema, task, fake done hoặc AI mutation mới.
