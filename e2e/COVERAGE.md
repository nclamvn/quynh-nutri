# E2E Coverage — Bữa cơm nhà

**"Toàn diện" = phủ có bằng chứng, không phải phủ 100% giả.** Bảng dưới phân rõ
**auto** (Playwright, assertion thật) · **manual** (không auto được → checklist) ·
**not-yet** (chưa phủ, để batch sau). Suite chạy hermetic: `E2E_BYPASS_AUTH` (commit,
prod-guarded) + mock AI + mock geocode → **không gọi Clerk/AI/Nominatim/hotline thật**.

Chạy: `npm run test:e2e` (25 test) · unit: `npm test` (135 test). Ảnh: `e2e/__screens__/`.

## P0 SAFETY
| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| Crisis: trực diện ("tôi muốn chết") → nguồn hỗ trợ, KHÔNG món | **auto** | safety.spec (4 ca) |
| Crisis: gián tiếp/gánh-nặng ("con sẽ tốt hơn nếu không có tôi", "không trụ nổi", "không thấy lối thoát") | **auto** | safety.spec |
| Crisis: PPD ("là một người mẹ tồi") — postpartum-gated | **auto (unit)** | mood.test.ts (cần household postpartum → unit) |
| Benign không nhầm ("đang stress", "mẹ tôi nấu ăn ngon") | **auto** | safety.spec (3 ca) |
| Nguồn hỗ trợ khớp `resources.ts` (Ngày Mai 096 306 1414 · **T4/T6/T7/CN** · 1900 1267 24/7 · 115) | **auto** | safety.spec (assert-against-source) |
| Lối hỗ trợ song song ở nhánh gợi ý | **auto** | safety.spec |
| Execute-not-prescribe: /health disclaimer + T2/T3 gated | **auto** | safety.spec |
| **Hotline gọi thật** | **CẤM auto** | chỉ assert hiển thị; xem MANUAL |

## P0 HONESTY
| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| Geocode B0 "gợi ý — hãy xác nhận" (amber) | **auto** (mock) | honesty.spec + geocode-suggest-390.png |
| Geocode B0→B1 kéo-thành-ground-truth (rose) | **manual** | drag khó ổn định headless; xem MANUAL |
| Order status: "Đã mở kênh" (sent), không auto-confirmed; confirmed/delivered chỉ là nút tay | **auto** | honesty.spec |
| Provenance/coverage hiển thị ở /nutrition | **auto** | honesty.spec |
| D3 3 bậc (≥85 số · 60–85 neo · <60 khoảng) | **auto (unit)** | d3-gate + nutrition unit tests |
| Purchase: giá tuỳ chọn = honest-null; sparse → "chưa đủ dữ liệu" | **auto (unit)** | purchase.test.ts (11) |
| Không-số-chế (giá ẩn khi thiếu, adequacy đủ/thiếu không đỏ) | **auto (unit)** + not-yet(UI grep) | cost/adequacy unit; UI-grep = not-yet |

## P0 CORE
| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| 11 route render không crash JS (overview…settings) | **auto** | core.spec |
| Overview CTA row 390 không wrap (regression guard) | **auto** | core.spec + overview-cta-390.png |
| Week reroll giữ ghim · shopping tick giữ · dish fork B1⊳B0 · settings VN/EN·theme | **not-yet** | batch sau (unit rotation/dish đã có) |

## P1 responsive / P2 edge
| Hạng mục | Trạng thái |
|---|---|
| Ma trận 390/768/1024/1280 × light/dark toàn trang | **not-yet** (spot-checks đã có qua QA từng feature) |
| Empty/error/offline · geocode fail→nhập tay · đổi household size | **not-yet** (geocode fail có unit) |

## Auth
| | |
|---|---|
| Suite chạy | **auto** qua `E2E_BYPASS_AUTH` (commit, `NODE_ENV!==production`, mặc định tắt) — **hết bypass proxy thủ công** |
| Real-auth `@clerk/testing` | **wired, chưa bật** — cần Chủ nhà tạo test user `+clerk_test` + `E2E_CLERK_USER/PASSWORD` (xem `clerk-auth.setup.ts` + MANUAL) |

## Không gọi service thật
mock AI (`E2E_MOCK_AI`) · mock geocode (`E2E_MOCK_GEOCODE`, gồm case Bến Thành confidence~0) · crisis không gọi mạng · hotline chỉ-assert. **CI không chạm Clerk/AI/Nominatim/hotline thật.**
