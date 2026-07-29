# COMPLETION REPORT — TIP-KE-008

**Vai trò:** Thợ triển khai
**Ngày:** 2026-07-29
**STATUS:** **DONE**

## 1. Kết quả

Đã hoàn thành “Chuẩn bị cho bữa ngày mai” dưới dạng hướng dẫn hữu hạn,
đã rà soát và chỉ đọc:

- registry riêng cho đúng 12 món đang có hướng dẫn nấu;
- vocabulary sáu loại bước và resolver thuần, ổn định, không mutate input;
- nguồn FDA/FoodSafety.gov có ngày rà soát, liên kết HTTPS theo từng bước;
- nội dung chặn rửa thịt/gà sống, ướp ngoài lạnh, tái dùng nước ướp sống,
  nấu sơ để cất và thời lượng tự chế;
- CTA trên trang Tuần chỉ xuất hiện cho ngày mai trong tuần hiện tại;
- sheet nhóm theo thứ tự mâm, hiển thị bước, bảo quản, provenance và món
  chưa hỗ trợ;
- đổi số người chỉ co giãn lượng nguyên liệu của công thức hiện hữu;
- agenda có task `prep-ahead` riêng, không trộn với `prepare-frozen`;
- assistant chỉ đọc registry, không sinh fallback và không tự sửa việc;
- không thêm schema, migration, checkbox, trạng thái done hoặc mutation kho.

## 2. Requirement coverage

| ID | Trạng thái | Bằng chứng |
|---|---:|---|
| KE8-001 | Đạt | `PrepAheadKind`, step/guide/source registry riêng |
| KE8-002 | Đạt | integrity test phủ đúng 12/12 món, không trùng |
| KE8-003 | Đạt | mọi bước có source; HTTPS và `reviewedAt` hợp lệ |
| KE8-004 | Đạt | banned-pattern audit và copy fail-closed |
| KE8-005 | Đạt | resolver guide/plan-day, dedupe, slot order, unsupported, immutable |
| KE8-006 | Đạt | CTA “Chuẩn bị cho ngày mai” trên Week |
| KE8-007 | Đạt | sheet theo món/bước/bảo quản/provenance |
| KE8-008 | Đạt | input khẩu phần 1–12 chỉ gọi `scaleDishLines()` |
| KE8-009 | Đạt | agenda `prep-ahead` nhóm một task, evidence supported/unsupported |
| KE8-010 | Đạt | tool `prep_ahead_guide` trả registry read-only hoặc unsupported |
| KE8-011 | Đạt | không done, không inventory/shopping mutation; E2E so snapshot |
| KE8-012 | Đạt | Việt/Anh, mobile 390px, focus/Escape, reduced-motion hiện hữu |

**Coverage:** 12/12 — 100%.

## 3. Tệp chính

### Domain và dữ liệu

- `src/domain/kitchen-execution/prep-ahead.ts`
- `src/domain/kitchen-execution/prep-ahead.test.ts`
- `src/data/seed/prep-ahead-guides.ts`
- `src/domain/kitchen-execution/kitchen-agenda.ts`
- `src/domain/kitchen-execution/kitchen-agenda.test.ts`

### UI

- `src/ui/components/PrepAheadSheet.tsx`
- `src/app/(tabs)/week/page.tsx`
- `src/ui/hooks/useKitchenAgenda.ts`
- `src/i18n/vn.json`
- `src/i18n/en.json`

### Assistant

- `src/lib/assistant/prep-ahead.ts`
- `src/lib/assistant/prep-ahead.test.ts`
- `src/lib/assistant/kitchen-agenda.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/agent.ts`
- `src/app/api/assistant/route.ts`

### E2E

- `e2e/prep-ahead.spec.ts`
- `e2e/COVERAGE.md`

## 4. Test results

```text
Prisma validate: pass
TypeScript:      0 lỗi
ESLint:          0 lỗi
Unit/repository: 241/241 pass, 37 files
Build:           pass, 22 routes
E2E:             37/37 pass
Diff check:      pass
```

Scenario mới:

- registry phủ đúng 12 món, source integrity và bilingual fields;
- banned behavior, không có thời lượng ướp/rã đông tự chế;
- resolver known/unsupported, slot order, dedupe, immutability;
- Chủ nhật không tạo việc cho ngày ngoài tuần;
- một task prep-ahead nhóm supported/unsupported;
- CTA mobile, sheet, source links, Escape và không checkbox;
- đổi số người làm đổi lượng công thức nhưng không mutate local state;
- agenda hiển thị provenance và deep link `/week`;
- assistant trả guide đã rà soát hoặc unsupported, không fallback.

## 5. Deviations

1. Hàm domain `prepAheadGuideFor` nhận registry và source map để giữ domain
   thuần; seed export một facade cùng tên với chữ ký `dishId` tiện cho UI/server.
2. CTA được đặt trong hero của trang Tuần thay vì lặp trên card ngày. Nó chỉ
   hiện khi ngày mai thuộc tuần hiện tại và có ít nhất một guide hỗ trợ.
3. Số người ăn là trạng thái cục bộ của sheet. Nó không thay household size và
   không lưu một “lượng chuẩn bị” mới.
4. Assistant tự dựng plan seed chuẩn từ dữ liệu server, giống agenda hiện hữu.
   Những thay đổi plan chỉ nằm ở client vẫn được fail-closed, không bị AI suy đoán.

## 6. Issues

Không có lỗi P0/P1 còn mở.

## 7. Suggestions cho Chủ thầu

- Nghiệm thu đặc biệt ranh giới giữa “lượng công thức” và “lượng chuẩn bị”.
- Gói tiếp theo nên xử lý nguồn-sự-thật của thực đơn tuần: persist thay đổi
  reroll/đổi món/khóa để UI, agenda và assistant cùng đọc một plan.
- Chưa nên thêm notification cho đến khi plan đã persist, có opt-in và cơ chế
  chống nhắc trùng.
