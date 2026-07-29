# HANDOVER — TIP-KE-006

**Từ:** Chủ thầu / Kiến trúc sư trưởng
**Đến:** Thợ triển khai
**Trạng thái:** READY FOR NEXT BUILD — CHƯA THỰC THI
**Tài liệu lệnh:** `design/TIP-KE-006.md`

## Lệnh thi công

Đọc toàn bộ `TIP-KE-006.md`, `AGENTS.md`, schema Prisma, các domain/actions tồn kho hiện hữu và tài liệu Next.js nằm trong `node_modules/next/dist/docs/` trước khi sửa code.

Thi công KE-006 theo thứ tự:

1. Khảo sát schema, auth/membership, transaction và idempotency hiện hữu.
2. Viết domain policy thuần cùng test biên trước.
3. Thêm schema/migration cục bộ cho `LeftoverLot` và `LeftoverMovement`.
4. Viết repository/server actions và integration tests.
5. Thêm luồng ghi nhận sau Meal Run.
6. Thêm khu vực món còn thừa và các movement thủ công.
7. Hoàn thiện i18n, accessibility và E2E.
8. Chạy toàn bộ regression gates.
9. Nộp `design/COMPLETION-KE-006.md`.

## Ràng buộc không được tự ý thay đổi

- Không gộp món thừa vào kho nguyên liệu.
- Không tự xác nhận thời điểm làm lạnh, lượng còn lại hay trạng thái đã dùng.
- Không diễn đạt mốc thời gian như bảo đảm an toàn.
- Không triển khai migration production.
- Không mở rộng sang AI nhận diện ảnh, notification hoặc tự động lên thực đơn.

## Định nghĩa hoàn thành

Chỉ báo hoàn thành khi:

- đủ 12/12 yêu cầu và tiêu chí nghiệm thu;
- tất cả gate xanh;
- có bằng chứng server-side household isolation và idempotency;
- có ảnh chụp luồng mobile;
- có báo cáo sai lệch và khoản hoãn rõ ràng.

Sau khi Thợ nộp báo cáo, phải chuyển vai lại Chủ thầu để nghiệm thu trước khi tạo hoặc triển khai TIP tiếp theo.
