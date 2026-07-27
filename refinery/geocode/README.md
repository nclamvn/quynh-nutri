# Geocode refinery — địa chỉ VN → gợi ý pin

Kết quả campaign nghiên cứu geocoding cho địa chỉ Việt (như supply-channels). Giữ DNA:
**máy đoán pin (B0), người xác nhận pin (B1 = ground truth)** — không hứa "gõ địa chỉ
tự lên pin chính xác". Địa chỉ VN là bẫy geocoding kinh điển (hẻm, số nhà, tên không đều).

## Provenance (nối thẳng B0/B1)
- Toạ độ máy geocode = **B0** — gợi ý có confidence, có thể lệch. UI hiện pin **hổ phách** ở trạng thái "gợi ý — hãy xác nhận".
- Pin hộ kéo/xác nhận = **B1** — ground truth, pin **rose**. Lần sau không geocode đè.

## Policy Nominatim (osmfoundation — nguồn chính chủ, ràng buộc CỨNG)
- ≤ **1 request/giây** trên toàn ứng dụng · **phải cache** (query lặp bị coi là lỗi).
- **User-Agent riêng** định danh app → geocode **phải chạy server** (trình duyệt cấm set UA).
- **Attribution OSM** (ODbL, share-alike) · **cấm autocomplete gõ-từng-phím** · **cấm systematic/bulk**.
- Chức năng CHÍNH là geocoding → phải tự chạy server. Của ta là *phụ*, user-triggered, cache → hợp policy.

## Provider landscape (dataset)
| Provider | VN | Rate/giá | License | Provenance |
|---|---|---|---|---|
| **Nominatim public** | OSM VN không đều, kém hẻm/số nhà | 1 req/s · free | ODbL, attribution | policy corroborated (chính chủ) |
| Nominatim self-host | như trên | ~10 req/s · chi phí server | ODbL | corroborated |
| **Goong.io** (VN) | tối ưu tiếng Việt, data VN, ngành vận chuyển VN dùng | free ~600 req/phút · rẻ hơn Google | thương mại, cần key | ">90%", "hơn Google", "600 req/phút" = **vendor-claim (goong.io)**, CHƯA đối chiếu độc lập |
| Google | chính xác cao | đắt · cần thẻ | thương mại | — |

**Kỷ luật asymmetric:** con số của Goong là **vendor-claim** — không phong thành fact. Cái *có căn cứ*: Goong là provider bản địa chuyên địa chỉ VN. Muốn chắc số → benchmark trên chính tập địa chỉ người dùng.

## Kiến trúc (đã build — TIP-GEO)
`src/data/geocode` adapter: **Nominatim default v1** (free, đúng policy) → **Goong khi có `GOONG_API_KEY`** (server env, như ANTHROPIC_API_KEY) — đổi provider không đụng domain/UI. Chạy qua `/api/geocode` (server, set UA, cache + throttle ≤1 req/s). Geocode fail → không lỗi, về đặt pin tay. Wire ở `SupplierSheet` (nút "Tìm từ địa chỉ", pin gợi ý → xác nhận).
