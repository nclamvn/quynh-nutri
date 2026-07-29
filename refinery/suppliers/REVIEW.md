# SUPPLIER REFINERY — REVIEW (2026-07, để Chủ nhà DUYỆT)

Nghiên cứu web (WebSearch/WebFetch), nguồn hiện hành 2024–2026. Chuẩn honesty: field
**corroborated** chỉ khi ≥2 nguồn độc lập khớp; nếu không → **needsVerify** hoặc để trống.
KHÔNG bịa địa chỉ/SĐT/toạ độ. Đọc và chốt trước khi merge vào `src/data/seed/suppliers.ts`.

## Coverage summary

| Chuỗi | storeLocatorUrl | hotline | kênh | ship | giờ |
|---|---|---|---|---|---|
| **BHX** | ✅ | ⚠️ order line (corp ✅) | web/app ✅; Zalo ⚠️ | ⬜ chưa công bố | ⬜ |
| **Co.opmart** | ✅ | ✅ 1900 5555 68 | web/app ✅; Zalo OA ⚠️ | ✅ ≥200k/6km | ⬜ |
| **WinMart** | ⚠️ (trong app) | ✅ 02471066866 | web ✅; app WIN ⚠️; Zalo ✗ | ✅ ≥300k (bán kính đơn-nguồn) | ⚠️ |
| **Big C / GO!** | ✅ | ✅ 1900 1880 | app/web/Zalo OA ✅ | ✅ ≥300k (bán kính ⚠️) | ⬜ |
| **GrabMart** | ✅ trang dịch vụ | ⚠️ không có hotline | app ✅; web/Zalo ✗ | ⬜ | ✅ 24/7 |
| **ShopeeFood** | ⚠️ | ⚠️ | app ✅; extra ⚠️ | ⬜ | ⬜ |
| **Aeon** | ✅ | ✅ 1800 888 699 | web/app/phone ✅; Zalo ⚠️ | ✅ tiered free-ship | ✅ pattern |
| **Circle K** | ✅ | ✅ 1900 3110 | app+web ✅; Grab/Zalo ⚠️ | ⚠️ third-party | ✅ 24/7 |
| **GS25** | ✅ | ✅ 1900 63 60 78 | app ✅; web/Grab ⚠️ | ⬜ | ✅ 24/7 |
| **FamilyMart** | ✅ famima.vn/branches | ⚠️ CSKH (office ✅) | ShopeeFood+Grab ✅; app ⚠️ | ⬜ | ⚠️ (KHÔNG khẳng định 24/7) |

Legend: ✅ ≥2 nguồn khớp · ⚠️ needsVerify (đơn/lệch/cũ) · ⬜ không công bố (để trống, không đoán).

## storeLocatorUrl đề xuất (đã đối chiếu)
- BHX: `https://www.bachhoaxanh.com/he-thong-cua-hang`
- Co.opmart: `https://co-opmart.com.vn/he-thong-sieu-thi`
- WinMart: (không có locator web — nằm trong app WIN) → để trống, needsVerify
- Big C / GO!: `https://sieuthi-go.vn/about-us/store.html` (go-vietnam.vn 301 → sieuthi-go.vn)
- GrabMart: `https://www.grab.com/vn/en/mart/` (trang dịch vụ, không phải locator)
- Aeon: `https://www.aeon.com.vn/en/aeon-stores`
- Circle K: `https://www.circlek.com.vn/vi/he-thong-circle-k/`
- GS25: `https://gs25.com.vn/store/`
- FamilyMart: `https://famima.vn/branches` (đổi domain: familymart.com.vn → famima.vn)

## Reviewer action items (cờ giá trị cao)
1. **Sửa domain:** FamilyMart → `famima.vn`; Big C/GO! → `sieuthi-go.vn`; Circle K delivery → `giaodoan.vn/circlek`.
2. **WinMart:** đặt hàng đã chuyển VinID → app **WIN** (Masan). Bản ghi VinID/vinmart.com là cũ. Không có locator web (chỉ trong app).
3. **Hotline cần xác nhận:** BHX `1900 1908`, ShopeeFood `1900 2042`, FamilyMart CSKH `037 703 8778`, Aeon biến thể `1800 888 886`, GrabMart (không có — chỉ in-app).
4. **KHÔNG khẳng định:** FamilyMart 24/7; ngưỡng free-ship của BHX/GrabMart/ShopeeFood/Circle K/GS25/FamilyMart (không công bố); bán kính giao GO! (nguồn lệch 7/10/15 km).
5. **Zalo đặt hàng:** chỉ **GO!/Big C** có OA đặt hàng đã đối chiếu. BHX (nhóm theo cửa hàng), Co.opmart, Aeon, tiện lợi → needsVerify.
6. Không bịa địa chỉ/SĐT/lat-lng. Địa chỉ chi nhánh cụ thể để người dùng tự tra qua storeLocatorUrl.

> Đề xuất merge: các chuỗi có core corroborated (Co.opmart, Big C/GO!, Aeon, Circle K, GS25)
> → thêm `storeLocatorUrl` + `hotline` (đã có) + `sources[]`, bỏ cờ needsVerify. BHX/WinMart/
> ShopeeFood/FamilyMart/GrabMart → thêm `storeLocatorUrl` (khi có) nhưng GIỮ `needsVerify: true`
> cho tới khi các cờ trên được xác nhận. Aeon (đang needsVerify) có thể GỠ cờ (core đã đủ nguồn).
