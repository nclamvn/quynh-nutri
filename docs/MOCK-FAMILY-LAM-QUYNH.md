# Mock gia đình Lâm – Quỳnh

Fixture này mô phỏng gia đình năm người để kiểm thử luồng lập thực đơn, chợ, kho và món thừa. Dữ liệu chỉ được chọn trong môi trường development với E2E bypass, không ghi vào Neon và không thay đổi hồ sơ thật.

## Bật mock

Khởi động dev server bằng biến môi trường:

```bash
E2E_BYPASS_AUTH=1 E2E_FAMILY_MOCK=lam-quynh npm run dev
```

Mở ứng dụng ở local, dữ liệu sẽ được nạp từ `src/data/seed/mock-family.ts`. Nếu không bật `E2E_FAMILY_MOCK`, ứng dụng vẫn dùng household E2E mặc định. `E2E_EMPTY_HOUSEHOLD=1` luôn được ưu tiên để các bài test onboarding bắt đầu từ trạng thái trống.

## Nguyên tắc dữ liệu

- Độ tuổi dùng đúng các age band hiện có: Cherry là `11-14`, Cốm là `0-2`.
- Sở thích và món không thích nằm ở lớp preference mềm, không bị diễn giải thành dị ứng hoặc bệnh nền.
- Chiều cao, cân nặng, nghề nghiệp và ghi chú bối cảnh được giữ trong `memberContexts` để kiểm thử và chuẩn bị cho data model đã được duyệt sau này.
- Đau chân và đau lưng thỉnh thoảng của bà nội được giữ như ghi chú bối cảnh, không tự động tạo chỉ định y khoa.
