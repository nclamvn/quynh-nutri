# TIP-KE-005 — Điều phối nhiều món hoàn thành cùng giờ

## ROLE

Bạn là **BUILDER / Thợ**. Chủ thầu đã nghiệm thu KE-004 và bàn giao TIP này.
Triển khai đúng contract; không mở sang leftovers của KE-006.

## HEADER

- TIP-ID: `TIP-KE-005`
- Project: Quỳnh Nutri / Bữa cơm nhà
- Module: Kitchen Execution
- Depends on: `TIP-KE-004` — VERIFIED
- Priority: P0

## CONTRACTOR SCAN

- Week page đã có 7 day cards, mỗi ngày tối đa 5 slots.
- 12/49 món có `CookingGuide`; guide chưa có duration riêng.
- Cooking Mode hỗ trợ một món, sessionStorage, không notification/timer.
- `Dish.cookTimeMin` là ước lượng UI hiện có nhưng một số món như cơm không có.
- Không có dữ liệu thiết bị/bếp hay số người nấu; không được tối ưu giả theo
  burner/resource.

## DECISIONS LOG

- Điều phối v1 là lịch lùi từ giờ dọn cơm, không phải optimizer tài nguyên.
- Chỉ đưa món có guide đã review vào timeline; unsupported hiện công khai.
- `estimatedTotalMin` được thêm vào registry và luôn ghi “ước tính”, không dùng
  làm tiêu chí an toàn/chín.
- Người dùng được chỉnh 5..240 phút trước khi bắt đầu.
- Không notification, background timer, wake lock hoặc auto-start.
- Không tự hoàn tất Cooking Mode, không tự trừ pantry.

## OUTCOME

1. Mỗi day card có ít nhất hai reviewed guides được phép mở “Phối hợp nấu”.
2. Người dùng chọn giờ dọn cơm và chỉnh thời lượng ước tính từng món.
3. Planner tính mốc bắt đầu lùi để các món cùng hướng tới target serve time.
4. Full-screen Meal Run hiển thị timeline, trạng thái started/done và mở được
   Cooking Mode riêng từng món.
5. Unsupported dishes hiện rõ và không được silently scheduled.

## DATA/DOMAIN CONTRACT

Mở rộng `CookingGuide`:

```text
estimatedTotalMin integer 5..240
```

Pure domain:

```text
buildMealTimeline(dishes, durations, targetServeAt)
  → tasks [{ dishId, estimatedMin, startAt, finishAt }]
  → unsupportedDishIds
```

Rules:

- mỗi task finishAt = targetServeAt;
- startAt = target - estimatedTotalMin;
- sort startAt tăng dần, tie-break dishId;
- duplicate dish ID chỉ xuất hiện một lần;
- invalid target/duration fail closed;
- status(now): upcoming | due | late | done;
- `due` khi now nằm từ startAt đến target;
- thời gian chỉ là kế hoạch ước tính, safety check vẫn thuộc Cooking Mode.

Session:

```text
MealRunSession {
  day
  targetServeAt
  tasks [{ dishId, estimatedMin, startedAt?, completedAt? }]
  createdAt
}
```

Parser reject malformed/stale IDs/duration ngoài range.

## UI CONTRACT

### Week page / Coordinator

- Day card có `Phối hợp nấu` khi ≥2 món reviewed.
- Sheet ghi số món được hỗ trợ và liệt kê unsupported.
- Target datetime mặc định hiện tại + 60 phút, người dùng chỉnh.
- Duration input từng món, default từ registry.
- Copy bắt buộc: “Mốc giờ là ước tính; dùng điểm kiểm tra an toàn trong từng
  công thức để xác nhận chín.”
- Start disabled khi target trong quá khứ hoặc <2 supported dishes.

### MealRunMode

- Full-screen, focus trap/Escape.
- Header target time và progress done/total.
- Timeline sort theo startAt, mỗi card có start time, estimated duration, trạng thái.
- Actions: “Bắt đầu món”, “Mở hướng dẫn”, “Đánh dấu món xong”.
- `Mở hướng dẫn` dùng `CookingMode` hiện có; đóng guide quay lại Meal Run.
- Không tự đổi trạng thái khi clock đi qua mốc.
- Finish enabled khi tất cả reviewed tasks done; finish/cancel clear session.
- sessionStorage scoped household + weekStart + day.
- Reload/reopen coordinator cho cùng day khôi phục run.
- Việt/Anh, mobile 390×860.

## REQUIREMENTS MATRIX

| ID | Requirement | Priority |
|---|---|---|
| KE5-001 | Duration estimate reviewed cho 12 guides | P0 |
| KE5-002 | Backward timeline deterministic | P0 |
| KE5-003 | Unsupported dishes fail honestly | P0 |
| KE5-004 | User chỉnh target/duration có validation | P0 |
| KE5-005 | Meal Run status thủ công, không auto-complete | P0 |
| KE5-006 | Mở CookingMode từ timeline | P0 |
| KE5-007 | Session restore fail-closed | P1 |
| KE5-008 | Không bịa safety/không auto pantry mutation | P0 |
| KE5-009 | Copy luôn ghi thời gian là ước tính | P0 |
| KE5-010 | Việt/Anh, focus trap/Escape/mobile | P1 |
| KE5-011 | Domain thuần có unit test | P0 |
| KE5-012 | Full regression không lỗi | P0 |

## ACCEPTANCE CRITERIA

- AC-01: target 18:30, món 40 phút → start 17:50.
- AC-02: timeline sort đúng và dedupe.
- AC-03: unsupported hiển thị trong coordinator, không có task.
- AC-04: target quá khứ/duration <5 hoặc >240 bị chặn.
- AC-05: bắt đầu/chuyển món xong chỉ do click.
- AC-06: mở/đóng CookingMode quay đúng Meal Run.
- AC-07: reload khôi phục trạng thái run; malformed session bị bỏ.
- AC-08: finish chỉ khi tất cả task done và xoá session.
- AC-09: không inventory mutation.
- AC-10: mobile/focus/Escape đạt.

## REQUIRED TESTS

- Unit: timeline math/sort/dedupe/invalid/status/session parser.
- E2E: day coordinator → chỉnh target → start → manual status → open CookingMode
  → return → reload restore → finish; unsupported visible; screenshot 390×860.
- Full gates: type/lint/unit/build/e2e/diff check.

## CONSTRAINTS

- Không schema/dependency mới.
- Không schedule unsupported guide.
- Không tạo per-step timer hoặc resource optimizer.
- Không background notification.
- Không thay safety claims của KE-004.

## REPORT

Tạo `design/COMPLETION-KE-005.md`; Chủ thầu sẽ verify riêng.
