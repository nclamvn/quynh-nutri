# Supplier refinery — AI làm giàu SOT nhà cung cấp

Song song với refinery món (`../README.md`), nhưng cho **nhà cung cấp**. Dùng nghiên cứu
web để làm giàu dữ liệu chuỗi thật, **giữ nguyên DNA honesty**: không bịa địa chỉ / SĐT /
toạ độ; mỗi field chỉ được coi là chắc khi có **≥2 nguồn độc lập, hiện hành** khớp nhau,
nếu không thì gắn `needsVerify: true` (UI hiện "cần xác minh") hoặc để trống.

## Vòng lặp

```
1. SINH     Agent nghiên cứu web (WebSearch/WebFetch) từng chuỗi:
            storeLocatorUrl (trang tra cứu chi nhánh), hotline, kênh đặt hàng,
            chính sách ship, giờ mở cửa. Ghi nguồn cho TỪNG dữ kiện.

2. VALIDATE ≥2 nguồn hiện hành khớp → tin; đơn/lệch/cũ (VinID, 2021…) → needsVerify.
            KHÔNG bịa địa chỉ hay lat/lng cho chuỗi nhiều chi nhánh — chỉ giữ
            storeLocatorUrl để người dùng tự tra chi nhánh gần mình.

3. DUYỆT    (người) đọc REVIEW.md, chốt field nào merge, field nào giữ needsVerify.

4. MERGE    Sửa tay src/data/seed/suppliers.ts theo bản đã duyệt (sources[] + cờ).
```

## Bất biến honesty

- **Không bịa.** Địa chỉ/SĐT/toạ độ phải có nguồn; thiếu nguồn → để trống, không đoán.
- **Chuỗi không có pin bản đồ.** Chuỗi nhiều chi nhánh → `storeLocatorUrl`, không phải một
  toạ độ giả. Chỉ hàng quen do hộ tự thêm mới có pin (người dùng tự đặt = ground truth).
- **needsVerify khi <2 nguồn.** Số/field đơn nguồn hoặc lệch nhau bị cờ, không nâng "chắc".
- **Không auto-merge.** Agent chỉ đề xuất trong REVIEW.md; người duyệt trước khi sửa seed.

`REVIEW.md` là artifact tái tạo được (chạy lại agent là ra) → không cần commit; chỉ commit
README này + kết quả đã merge vào `suppliers.ts`.
