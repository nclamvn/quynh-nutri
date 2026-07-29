# BLUEPRINT — Kitchen Execution

Ngày: 2026-07-29
Trạng thái: Đã được chủ sản phẩm duyệt định hướng

## Mục tiêu

Khép kín phần việc mà phần mềm không thể tự làm ngoài đời: giúp người dùng chọn,
mang về, sơ chế, bảo quản và nấu thực phẩm đúng cách. AI chỉ điều phối và giải
thích; nội dung an toàn phải đến từ dữ liệu đã kiểm duyệt, có nguồn và ngày rà soát.

## Nguyên tắc kiến trúc

1. `src/domain/kitchen-execution` giữ vocabulary và resolver thuần, không phụ
   thuộc React, Prisma hay AI.
2. `src/data/seed/kitchen-guides.ts` là registry nội dung đã kiểm duyệt. Mỗi hướng
   dẫn phải có nguồn HTTPS, đơn vị SI và ngày rà soát.
3. UI chỉ hiển thị nội dung từ registry. Khi chưa có hướng dẫn đặc thù, phải ghi
   rõ hướng dẫn đang áp dụng ở cấp nhóm; không biến nội dung tổng quát thành khẳng
   định riêng cho nguyên liệu.
4. Không để mô hình ngôn ngữ sinh thời gian bảo quản, nhiệt độ hay điểm an toàn.
5. Schema dữ liệu chưa thay đổi ở lát cắt đầu tiên. Khi người dùng bắt đầu ghi nhận
   lô mua thực tế, `InventoryLot` mới trở thành nguồn sự thật cho hạn dùng.

## Luồng mục tiêu

```text
Món trong thực đơn
  → nguyên liệu trong danh sách chợ
  → mở hướng dẫn chọn
  → đánh dấu đã mua
  → ghi nhận lô vào kho
  → nhắc sơ chế/bảo quản
  → hướng dẫn nấu theo bữa
```

## Task graph

- `TIP-KE-001`: Hướng dẫn chọn và bảo quản ngay trong danh sách chợ. — DONE
- `TIP-KE-002`: Đánh dấu mua xong → xác nhận số lượng và tạo lô trong kho. — DONE
- `TIP-KE-003`: Hạn dùng, ưu tiên dùng trước và nhắc rã đông. — DONE
- `TIP-KE-004`: Quy trình công thức có cấu trúc và chế độ “Bắt đầu nấu”. — DONE
- `TIP-KE-005`: Điều phối nhiều món để hoàn thành cùng giờ. — DONE
- `TIP-KE-006`: Ghi nhận đồ thừa và tái sử dụng an toàn. — DONE
- `TIP-KE-007`: Việc bếp hôm nay và nhịp quản gia. — DONE
- `TIP-KE-008`: Chuẩn bị trước có kiểm chứng cho bữa ngày mai. — READY FOR BUILDER

## Ngoài phạm vi TIP-KE-001

- Không tự động thêm hàng đã đánh dấu vào kho.
- Không thay Prisma schema.
- Không tạo hướng dẫn bằng AI ở runtime.
- Không đưa thời hạn bảo quản riêng cho nguyên liệu khi nguồn mới chỉ hỗ trợ ở
  cấp nhóm.
