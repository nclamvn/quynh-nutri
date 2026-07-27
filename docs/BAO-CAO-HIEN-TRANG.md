# BÁO CÁO HIỆN TRẠNG — Bữa cơm nhà / Quỳnh Nutri

**Ngày:** 2026-07-27  
**Sản phẩm:** Bữa cơm nhà (hệ thống lập bữa cho gia đình Việt)  
**Bản quyền/định hướng:** Chủ nhà (Product Owner)  
**Môi trường live:** https://anngon.io (Vercel production, SSL, www→apex 308)  
**Trạng thái tổng thể:** Đang phát triển — nền tảng + 3 vertical đã lên production, landing công khai đã ra mắt.

---

## 1. Định vị & lời hứa

Bữa cơm nhà giúp một gia đình lập kế hoạch ăn theo tuần, xoay món, cân lại định lượng, gộp danh sách đi chợ, theo dõi dinh dưỡng **có căn cứ**, và tích lũy trí nhớ riêng của nhà mình.

**Lời hứa:** *Một tuần ăn ngon, vừa sức và có căn cứ.* Ba lớp giá trị luôn hiện diện: **sống được** (hợp thời gian/công sức), **nhớ được** (học từ lựa chọn thật), **tin được** (số liệu tự khai độ chắc).

---

## 2. DNA & bất biến thiết kế (không đổi qua các phiên)

1. **AI điều phối — engine tính số.** LLM chỉ đề xuất cấu trúc; con số dinh dưỡng do engine tính từ dữ liệu nguồn.
2. **Không bịa số.** Mọi dữ liệu tự khai provenance; thiếu → `honest_null`, không đoán.
3. **Cổng hiển thị D3.** Độ phủ ≥85% → hiện số · 60–85% → số neo trong khoảng · <60% → chỉ khoảng. Thiếu dữ liệu = **xám**, không phải đỏ.
4. **Một màu một nghĩa.** Rose = thương hiệu/CTA (không dùng cho chất lượng dữ liệu); xanh lá = đã đối chiếu/đủ; hổ phách = ước lượng/thiếu; đỏ = nguy cơ thật.
5. **App THỰC THI, không KÊ ĐƠN.** Không chẩn đoán/kê thực đơn bệnh lý; phần lâm sàng là chỉ định của bác sĩ.
6. **Provenance chip là component chữ ký** của toàn sản phẩm.
7. **Hợp đồng UI khóa:** `design/QUYNH_NUTRI_UI_BLUEPRINT_v1.0.md` (FOUNDATION LOCKED) — chi phối mọi thiết kế UI về sau.

Tài liệu nền trong repo: `design/` (blueprint + tokens + vision/blueprint/TIP special-diets), `refinery/` + `refinery/suppliers/` (phương pháp làm giàu SOT có nguồn + người duyệt).

---

## 3. Hiện trạng kỹ thuật

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · TypeScript · Prisma 7.9 + `@prisma/adapter-pg` + Neon Postgres · Clerk auth (@clerk/nextjs v7) · Anthropic SDK + Vercel AI Gateway · Leaflet + OpenStreetMap (bản đồ) · Deploy Vercel.

**Chất lượng:** build xanh · **102 unit test** (16 test file) · QA pixel bằng Playwright ở 390/768/1024/1280/1440 + reduced-motion cho các bề mặt mới.

**Khu vực đã có (route):**
- **Công khai:** `/` (landing editorial), `/sign-in`, `/sign-up`, `/spike/share` (trang thử Web Share).
- **App (auth-gated):** `/overview`, `/week`, `/shopping`, `/suppliers` + `/suppliers/[id]`, `/dishes`, `/nutrition`, `/health`, `/reports`, `/favorites`, `/notes`, `/settings`.

**Shell:** desktop sidebar 240px (collapse 64px) + main + right rail ~288px; <1024px chuyển mobile top bar + bottom nav + bottom sheet. `StoreProvider` (state hộ gia đình) chỉ mount trong app `(tabs)`, không mount ở trang công khai.

---

## 4. Nhật ký các phiên gần nhất (mới → cũ)

### A. Landing công khai + nền tảng thiết kế (Blueprint UI v1.0)
- Ra mắt **landing editorial tại `/`** theo mock đã duyệt của Chủ nhà: 10 section khóa (header · hero · ticker · manifesto · product stage · household memory · data truth · brand quote · final CTA · footer). Font: Inter (UI) + **Lora** (serif display/quote). Ảnh thật có bản quyền (Unsplash, tải về `/public/landing`, credit trong manifest + footer, không hotlink).
- Nền tảng: landing tokens, `@keyframes` ticker/drift/seal, CSS scoped `.lp` không rò sang app.
- **Loạt sửa lỗi chồng đè text tiếng Việt** (dấu 2 tầng ố/ầ/ộ): nới line-height an toàn cho mọi heading; thêm margin cứng giữa các dòng hook; **dựng lại Product Stage thành lưới có kiểm soát** (bỏ 3 khối absolute chồng nhau); **seal xoay đổi sang chữ chạy vòng theo path SVG** (không cắt qua chữ "Q"); dời cụm số liệu hero khỏi góc chật; thêm lối "Mở ứng dụng" → `/overview`.
- *Commits:* `560d12b`…`809aaf3`.

### B. Phase 2 — Nhà cung cấp & Đặt hàng (last-mile) + refinery SOT
- **Trang "Nhà cung cấp" cao cấp:** danh bạ + trang chi tiết có **bản đồ Leaflet/OSM + chỉ đường** (deep-link Maps), địa chỉ/giờ/ship, kênh liên hệ, provenance, cờ "cần xác minh".
- **CRUD điểm mua** (household-owned) + **chia đơn theo shop** từ danh sách chợ (gram MUA đã gross-up) + **trạng thái đơn trung thực** (L-1: app chỉ tự "đã mở kênh", không claim "đã gửi"; kênh `their_*` chỉ mở app của họ).
- **Refinery nhà cung cấp:** nghiên cứu web ≥2 nguồn, Chủ nhà duyệt REVIEW trước khi merge; làm giàu 9 chuỗi (store-locator + hotline đã đối chiếu + sources), **không bịa** địa chỉ/toạ độ chi nhánh.
- **P2-0 spike Web Share → Zalo:** trang thử public để xác minh trên điện thoại thật.
- *Commits:* `2d95fe3`…`951cbab`.

### C. Thực đơn nhóm đặc biệt (T1: mang thai & sau sinh)
- Trang **"Sức khoẻ"** (discoverable, có dòng miễn trừ trách nhiệm) + HealthProfile theo thành viên.
- **Vi chất từ Bảng Thành phần Thực phẩm VN (P1):** sắt/canxi/kẽm/folate + vitamin A & C, map rộng → độ phủ ~99%; năng lượng/đạm thai kỳ theo nguồn P2/P3.
- Lâm sàng (T2/T3) **hiển thị nhưng khóa** ("cần chỉ định bác sĩ") — đúng ranh giới execute-not-prescribe.
- Polish chuyên nghiệp: loading state, chỉ báo đồng bộ, error toast, a11y modal.
- *Commits:* `7009cab`…`b75c9da`, `9fd214c`.

---

## 5. Hạng mục đang treo / cần quyết

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| **Clerk production** | Hoãn | Đang dùng key dev (pk_test) + workaround redirect. Cần tạo instance production trên domain anngon.io, dọn app trùng, nạp `sk_live` (Chủ nhà tự nhập, Thợ không chạm key). |
| **Verdict spike P2-0** | Chờ | Phải thử trên điện thoại có Zalo → quyết định nhánh `zalo_chat` (P2-4). Hiện P2-4 dùng navigator.share + fallback copy an toàn cả hai chiều. |
| **Media hero landing** | Tạm | Ảnh Unsplash theo mock; Chủ nhà có thể thay bằng ảnh gia đình/mâm cơm Việt "đúng gu" (chỉ thay file + manifest). |
| **REVIEW refinery** | Artifact | `refinery/suppliers/REVIEW.md` cố ý không commit theo convention. |
| **Geocode địa chỉ → pin** | Đề xuất | Hiện đặt pin bằng kéo tay; có thể thêm tra toạ độ từ địa chỉ (Nominatim) để tiện hơn. |
| **Lâm sàng T2/T3** | Dormant | Cần chuyên gia dinh dưỡng đối chiếu QĐ gốc trước khi mở (yếu tố pháp lý/SaMD). |

---

## 6. Lưu ý bàn giao

- **Kỷ luật QA auth:** app bị Clerk chặn; khi QA bằng Playwright phải tạm bypass `src/proxy.ts` rồi **khôi phục** (kiểm `redirectToSignIn` + `/` public) **trước khi commit**. Trang công khai (`/`) QA không cần bypass.
- **Bí mật:** không commit `.env*`/`.vercel`; `sk_live` do Chủ nhà nhập ở dashboard hoặc `vercel env` (Thợ không thấy giá trị).
- **Dữ liệu seed** hiện là TypeScript trong `src/data/seed/*` (chạy được không cần DB); Postgres là hợp đồng qua repo layer.
- **Prisma push consent:** `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`.

---

## 7. Đề xuất bước tiếp (để Chủ nhà chọn)

1. **Chốt spike P2-0** trên điện thoại → mở/điều chỉnh nhánh Zalo P2-4.
2. **Clerk production** trên anngon.io (đăng nhập thật cho người dùng ngoài).
3. **Rà toàn app theo Blueprint v1.0** (áp DNA landing vào các trang app còn ở mức "warm utility" cơ bản).
4. **Thay media hero** bằng ảnh/video bối cảnh Việt Nam đúng art-direction.
5. **Tiện ích bản đồ:** geocode địa chỉ → tự đặt pin.

> Toàn bộ mã nguồn, hợp đồng thiết kế (`design/`) và phương pháp refinery (`refinery/`) nằm trong repo và đã đồng bộ với production tại HEAD `809aaf3`.
