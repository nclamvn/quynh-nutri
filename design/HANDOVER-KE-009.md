# HANDOVER — TIP-KE-009

**Từ:** Chủ thầu / Kiến trúc sư trưởng
**Đến:** Thợ triển khai
**Trạng thái:** READY FOR NEXT BUILD — CHƯA THỰC THI
**Lệnh chuẩn:** `design/TIP-KE-009.md`

## Lệnh thi công

1. Đọc `AGENTS.md`, `design/TIP-KE-009.md` và tài liệu Next.js/Prisma cục bộ liên quan.
2. Audit dữ liệu `WeekPlan`/`DaySlot` hiện hữu trước migration; không xóa duplicate.
3. Viết domain validator và repository tests trước.
4. Thêm migration unique/version/timestamps và xác minh trên database test.
5. Triển khai load-or-create/save transaction, ownership, safety và B1.
6. Chuyển Store sang hydrate canonical plan và sync state trung thực.
7. Nối shopping, agenda, prep-ahead và assistant vào cùng plan.
8. Thêm error/conflict/retry UI, i18n và E2E hai context.
9. Chạy toàn bộ gates và nộp `design/COMPLETION-KE-009.md`.

## Ràng buộc

- Không last-write-wins âm thầm.
- Không render “đã lưu” trước response thành công.
- Không nhận householdId từ client/model.
- Không tin nutrition hoặc task state từ client.
- Không cho AI mutation plan.
- Không thêm bảng task, done, notification hoặc auto merge.
- Không bỏ qua B1 ownership.
- Không xóa dữ liệu để ép migration qua.

Sau Completion Report, chuyển lại Chủ thầu để nghiệm thu trước TIP kế tiếp.
