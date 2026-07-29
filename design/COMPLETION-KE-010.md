# COMPLETION REPORT — TIP-KE-010

**Vai trò:** Thợ triển khai  
**Ngày:** 2026-07-29  
**STATUS:** **DONE**

## 1. Kết quả

Đã làm các năng lực quản gia hiện rõ trong ứng dụng chính:

- thêm `Kho & Tủ lạnh` vào nguồn điều hướng chung;
- desktop Sidebar và mobile Menu cùng có đường tới `/pantry`;
- thêm dải ba trạm trên Tổng quan:
  `Lên tuần → Đi chợ → Nấu & cất`;
- dải chỉ đọc plan, shopping, pantry và leftovers thật từ Store;
- khi Store đang hydrate, UI nói đang đọc dữ liệu; không dựng số hoặc trạng thái
  completed giả;
- agenda rỗng giải thích nguồn bằng chứng và có CTA tới thực đơn/kho;
- nút chuẩn bị ngày mai không còn biến mất chỉ vì `supported = 0`;
- mỗi card ngày luôn cho biết khả năng phối hợp nấu; thiếu hướng dẫn thì disabled
  và nói rõ cần ít nhất hai món đã rà soát;
- Shopping và Pantry rỗng trở thành hướng dẫn hành động có CTA thật;
- thay nút desktop “Bắt đầu nấu” không có handler bằng link thật “Mở điều phối
  nấu” tới `/week`;
- bổ sung Việt/Anh, focus-visible và semantic headings/links.

## 2. Requirement coverage

| ID | Trạng thái | Bằng chứng |
|---|---:|---|
| KE10-001 | Đạt | `PantryIcon`, `NAV_GROUPS`, Sidebar/Menu dùng chung |
| KE10-002 | Đạt | `HousekeeperPathCard` luôn render trên Overview |
| KE10-003 | Đạt | derive trực tiếp từ Store; loading/empty trung thực |
| KE10-004 | Đạt | ba `Link` lần lượt tới Week/Shopping/Pantry |
| KE10-005 | Đạt | agenda empty-state có giải thích và hai CTA nguồn |
| KE10-006 | Đạt | prep-ahead render khi có ngày mai dù supported bằng 0 |
| KE10-007 | Đạt | 7 card ngày đều có affordance; thiếu guide disabled + lý do |
| KE10-008 | Đạt | Shopping/Pantry empty-state mới có chỉ dẫn và CTA |
| KE10-009 | Đạt | Việt/Anh, focus, 390px + desktop E2E |
| KE10-010 | Đạt | không schema/migration/task/done/AI mutation/fake seed |

**Implementation coverage:** 10/10 — 100%.

## 3. Files changed

### Created

- `design/TIP-KE-010.md` — hợp đồng thi công.
- `src/ui/components/HousekeeperPathCard.tsx` — dải hành trình quản gia.
- `e2e/feature-discovery.spec.ts` — E2E discovery mobile/desktop/Week.
- `design/COMPLETION-KE-010.md` — báo cáo này.

### Modified

- `src/ui/nav.tsx`
- `src/ui/components/icons.tsx`
- `src/ui/components/KitchenAgendaCard.tsx`
- `src/ui/components/RightRail.tsx`
- `src/app/(tabs)/overview/page.tsx`
- `src/app/(tabs)/week/page.tsx`
- `src/app/(tabs)/shopping/page.tsx`
- `src/app/(tabs)/pantry/page.tsx`
- `src/i18n/vn.json`
- `src/i18n/en.json`
- `e2e/core.spec.ts`
- `e2e/kitchen-agenda.spec.ts`

## 4. Test results

```text
JSON i18n parse:   pass
TypeScript:        0 lỗi
ESLint:            0 lỗi
Unit/repository:   256/256 pass, 40 files
Build:             pass, 22 routes
E2E:               46/46 pass
git diff check:    pass
Schema diff:       none
```

E2E mới:

1. Overview 390px luôn thấy ba trạm, đúng CTA và không có checkbox done.
2. Desktop thấy Pantry trong Sidebar và link điều phối nấu thật.
3. Mobile Menu thấy Pantry, điều hướng tới `/pantry` và empty-state đúng.
4. Week có một prep affordance và đúng bảy coordinate affordance; trạng thái
   unsupported có lý do.
5. Core smoke bổ sung `/pantry`.
6. Kitchen agenda flow cũ vẫn hoàn tất bằng nút coordinate đang enabled.

## 5. Visual evidence

- `e2e/__screens__/housekeeper-path-390.png`
- `e2e/__screens__/housekeeper-path-desktop.png`

Hai ảnh được sinh từ E2E hermetic:

- mobile 390px xếp ba trạm dọc, không tràn và bottom tab không che CTA;
- desktop 1440px xếp ba trạm ngang, Pantry hiện trong Sidebar, agenda nằm ngay
  bên dưới và right rail có link điều phối thật.

## 6. Audit honesty và boundary

- Không sửa `prisma/schema.prisma`.
- Không thêm migration hoặc bảng.
- Không ghi Neon khi chỉ xem dải quản gia.
- Không thêm task state, checkbox done, notification hoặc completion badge.
- Không sửa assistant tools/prompt và không cấp mutation cho AI.
- Không seed inventory, leftovers hoặc shopping fulfillment.
- Các con số hiển thị đều tính từ dữ liệu Store hiện tại.

## 7. Deviations

1. Pantry được thêm vào Menu mobile thay vì thành tab thứ năm, đúng constraint
   giữ thanh dưới gọn bốn mục.
2. Ở Chủ nhật, nút chuẩn bị ngày mai không hiện vì không có “ngày mai” trong
   phạm vi plan tuần hiện tại; đây là thiếu dữ liệu thật, không phải ẩn guide.
3. Nút “Bắt đầu nấu” cũ ở right rail được đổi thành link “Mở điều phối nấu”.
   Đây là sửa affordance chết phát hiện trong visual review, không mở rộng domain.

## 8. Issues discovered

Không còn P0/P1 trong phạm vi KE-010.

Deferred ngoài phạm vi:

- không thêm onboarding tour hoặc popup “có gì mới”;
- không đưa Pantry vào bottom TabBar;
- không tạo dữ liệu mẫu cho household rỗng;
- không thay đổi landing marketing.

## 9. Bàn giao cho Chủ thầu

TIP-KE-010 đủ điều kiện nghiệm thu `DONE`: 10/10 yêu cầu, toàn bộ quality gates
xanh, visual review mobile/desktop đạt và không có thay đổi database. Chưa
commit, push hoặc deploy trong Completion này; release cần hành động riêng sau
nghiệm thu.
