# HANDOVER — TIP-KE-007

**Từ:** Chủ thầu / Kiến trúc sư trưởng
**Đến:** Thợ triển khai
**Trạng thái:** READY FOR NEXT BUILD — CHƯA THỰC THI
**Lệnh chuẩn:** `design/TIP-KE-007.md`

## Lệnh thi công

1. Đọc `AGENTS.md`, toàn bộ TIP-KE-007 và tài liệu Next.js cục bộ liên quan.
2. Scan lại `overview`, `store`, assistant tools, shopping/inventory/leftover/cooking domains.
3. Viết `kitchen-agenda.ts` cùng unit tests trước.
4. Tích hợp card và sheet/page agenda.
5. Thêm adapter assistant read-only nếu không phải đổi framework.
6. Bổ sung i18n/accessibility/E2E.
7. Chạy toàn bộ regression gates.
8. Nộp `design/COMPLETION-KE-007.md`.

## Ràng buộc

- Không thêm bảng task.
- Không lưu trạng thái done cục bộ.
- Không tự tạo deadline hay dữ liệu an toàn.
- Không cho assistant mutate.
- Không triển khai notification.

Kết thúc vòng Thợ phải chuyển lại Chủ thầu để nghiệm thu trước khi lập TIP tiếp theo.
