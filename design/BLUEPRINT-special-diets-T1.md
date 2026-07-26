# BLUEPRINT — Special Diets T1 (mang thai & sau sinh), wellness mode

> UX/screen blueprint cho vertical T1 đã chốt ở `VISION-special-diets.md`. Nối tiếp
> `DESIGN-BLUEPRINT.md` (§4 layout, §5–10 page blueprints, tokens giữ nguyên).
> Chế độ hiển thị = **wellness only**; clinical-constraint mode ngủ, KHÔNG có UI ở bản này.

---

## 0. Nguyên tắc hiển thị (kế thừa + một precedent mới)

1. **Không đỏ, không phán xét** (wellness) — mang thai/sau sinh là nhóm dễ tổn thương; copy ấm, không shaming. Avoid-list là "nên tránh trong thai kỳ", **có nguồn**, không phải "kiêng/cấm/đỏ".
2. **Mẫu-số nêu rõ giai đoạn** (mở rộng adequacy-denominator precedent): mọi % nhu cầu phải ghi *của giai đoạn nào* — "% nhu cầu **thai kỳ (giữa)**", không chỉ "nhu cầu ngày".
3. **Honest-null có răng**: vi chất/uplift chưa seed nguồn → hiện "chưa đủ dữ liệu · hỏi chuyên gia", **không số giả, không màu tự tin**.
4. **Disclaimer thực chất** hiện ở mọi surface khi member đang bật lifeStage. Không cho-có, không giấu trong Settings.
5. **Nguồn luôn kề số**: reuse `ProvenanceChip`; con số lifestage mang nhãn nguồn (P2/P3) y như macro.

---

## 1. Bản đồ surface (4 điểm chạm, tái dùng màn có sẵn)

| # | Surface | Màn | Mới / sửa |
|---|---|---|---|
| S1 | **Đặt HealthProfile cho thành viên** | Cài đặt → hàng thành viên | sheet mới |
| S2 | **Adequacy theo giai đoạn + vi chất + avoid-list** | Dinh dưỡng (khi chọn member có lifeStage) | sửa card |
| S3 | **Cảnh báo/loại trừ avoid-list trên mâm** | Tuần / Công thức | badge + lọc |
| S4 | **Disclaimer T1** | mọi màn khi có lifeStage active | banner mới |

---

## 2. S1 — Sheet đặt HealthProfile (Cài đặt → thành viên)

**Điểm vào:** hàng thành viên trong card "Gia đình & Thành viên" (`settings/page.tsx`) thành **nút bấm** → mở `BottomSheet` (reuse, đã là glass-modal).

**Nội dung sheet (per member):**
- Header: avatar + tên vai trò ("Người lớn (Nữ)").
- **Giai đoạn sống** — chọn 1: `Không` · `Mang thai — 3 tháng đầu/giữa/cuối` · `Đang cho con bú — 0–6 tháng / 7–12 tháng`. (Chỉ hiện lựa chọn mang thai/cho con bú cho member `sex==="F"`, `role==="adult"`; tôn trọng dữ liệu, không suy diễn.)
- **Ghi chú nguồn** dưới lựa chọn: "Điều chỉnh theo HD 776/QĐ-BYT. Hỗ trợ chung, không thay chỉ định bác sĩ."
- **Disclaimer** cứng cuối sheet trước nút Lưu.
- Nút **Lưu** (cta-primary) → `updateMemberHealthProfile(memberId, { lifeStage, mode: "wellness" })`.

**KHÔNG có** ở bản này: ô tự nhập hạn mức dinh dưỡng, chọn "bệnh lý", nhập mã chế độ ăn. (Đó là clinical mode — ngủ.)

**Trạng thái:** member đã đặt → hàng hiện **badge giai đoạn** (S3) + nút "Sửa". Bỏ chọn `Không` → xoá profile, mọi hiển thị về mặc định.

---

## 3. S2 — Dinh dưỡng theo giai đoạn (sửa `nutrition/page.tsx`)

Khi member được chọn ở chip-selector có `lifeStage !== "none"`:

- **Chip member** hiện badge giai đoạn (vd "Mẹ 🤰 thai kỳ giữa").
- **Card A (adequacy)**: mẫu-số đổi sang nhu cầu giai đoạn. `AdequacyStrip` giữ nguyên hình, nhãn đổi: *"≈X% nhu cầu **thai kỳ**"*. Coverage chip giữ nguyên cơ chế.
- **Hàng vi chất trọng điểm thai kỳ** (mới, dưới macro): Sắt · Folate · Canxi · I-ốt. Mỗi dòng = `[nhãn] [ProvenanceChip theo nhu cầu giai đoạn]`. **Chưa có nguồn RNI giai đoạn → dòng hiện honest-null**: "— · chưa đủ dữ liệu, hỏi chuyên gia" (xám, không số). Không suy diễn.
- **Panel "Nên tránh trong thai kỳ"** (mới): liệt kê nhóm hazard **đang xuất hiện trong thực đơn tuần của member** (nếu có), mỗi mục kèm nguồn ("cá thu vua · thuỷ ngân cao · HD 776"). Nếu registry hazard chưa seed → panel hiện "danh sách đang được đối chiếu nguồn", không tự khẳng định an toàn.
- **Không đỏ**: vi chất thiếu → honey "cần bổ sung", không đỏ. Avoid-list → tone trung tính + nguồn, không đỏ-cấm.

---

## 4. S3 — Avoid-list trên mâm (Tuần / Công thức)

- **Loại trừ mặc định mềm**: món chứa nguyên liệu hazard (đã seed tag + nguồn) **không bị xoá cứng** khỏi repertoire cho member mang thai, mà **gắn badge cảnh báo** "⚠ tránh khi mang thai" (honey, có nguồn khi chạm) trên card món + trong sheet đổi món. Lý do: quyết định vẫn của người dùng/bác sĩ; app *cảnh báo có nguồn*, không *cấm*. (Khác allergen dị ứng — allergen loại cứng như hiện tại.)
  - *Quyết định cần chốt ở TIP:* mang thai dùng **cảnh báo mềm** (badge) hay **loại cứng** như allergen? Đề xuất: **mềm + nguồn** cho hazard thai kỳ (tôn trọng "app không kê"); allergen thật vẫn cứng.
- Badge tái dùng mẫu chip honey đang có; chạm badge → nguồn + "hỏi bác sĩ".
- Chỉ bật khi member trong hộ có `lifeStage` mang thai; sau sinh/cho con bú không kích avoid-list thai kỳ.

---

## 5. S4 — Disclaimer banner (component mới, dùng lại nhiều surface)

- Component `HealthDisclaimer` nhỏ, tone trung tính (không đỏ), icon nhẹ: *"Hỗ trợ theo hướng dẫn công khai (HD 776), không thay thế bác sĩ. Thai kỳ nguy cơ → theo chỉ định chuyên gia."*
- Hiện: đầu Dinh dưỡng (khi member có lifeStage), trong sheet S1, và một dòng gọn ở Tuần khi avoid-list active.
- Ẩn khi không có member nào bật lifeStage (không làm phiền nhóm wellness thường).

---

## 6. Component & tái dùng

| Cần | Nguồn |
|---|---|
| Sheet đặt profile | `BottomSheet` (glass-modal) — có sẵn |
| Chọn giai đoạn | mẫu `Segmented`/chip trong Settings — có sẵn |
| Số vi chất + nguồn | `ProvenanceChip` + `honest_null` path — có sẵn |
| Thanh adequacy | `AdequacyStrip` (đổi nhãn mẫu-số) — có sẵn |
| Badge giai đoạn | chip nhỏ (mẫu badge) — mới nhẹ |
| Badge avoid-list | chip honey + nguồn — mới nhẹ |
| Disclaimer | `HealthDisclaimer` — **mới** |
| Panel avoid-list | list trong `.card` — bố cục có sẵn |

**Không** thêm màu/kiểu mới ngoài token hiện có (rose/botanical/honey/muted). Giai đoạn mang thai KHÔNG dùng đỏ.

---

## 7. Trạng thái & biên (states)

1. **Không member nào có lifeStage** → toàn bộ T1 ẩn; app y như hiện tại. (mặc định)
2. **Có lifeStage, vi chất chưa seed nguồn** → honest-null rõ ràng, không số. (đường phổ biến ban đầu)
3. **Avoid-list registry chưa seed** → panel "đang đối chiếu nguồn", badge không bật; không khẳng định an toàn.
4. **Nhiều member có profile** → selector member đã có; mỗi member hiển adequacy giai đoạn của mình.
5. **Sau sinh/cho con bú** → uplift kcal/đạm (đã có P3), KHÔNG avoid-list thai kỳ.
6. **Đổi/bỏ profile** → hiển thị hồi mặc định ngay (store optimistic + persist).

---

## 8. Copy (tone — ấm, có nguồn, không phán xét)

- Giai đoạn: "Mang thai — 3 tháng giữa", "Đang cho con bú (0–6 tháng)".
- Vi chất honest-null: "Sắt — chưa đủ dữ liệu để hiện nhu cầu thai kỳ. Hỏi chuyên gia dinh dưỡng."
- Avoid badge: "Nên tránh khi mang thai — cá thuỷ ngân cao (HD 776)."
- Disclaimer: như S4.
- **Cấm**: "cấm", "kiêng tuyệt đối", "nguy hiểm" phán xét, con số không nguồn, tông đỏ.

---

## 9. Cổng review (Blueprint gate)

1. Mọi surface T1 có disclaimer khi lifeStage active; ẩn khi không.
2. Không số lifestage/vi chất nào thiếu nguồn mà vẫn hiện số (chỉ honest-null).
3. Không đỏ, không "kiêng/cấm"; avoid-list là cảnh báo có nguồn.
4. Clinical mode: không có bất kỳ UI nào (không ô hạn mức, không mã bệnh).
5. Sheet S1 chỉ mở lựa chọn mang thai/cho con bú cho `F/adult`; tôn trọng dữ liệu.
6. Playwright 390/1440 × sáng/tối: S1 sheet, S2 nutrition-có-thai-kỳ (cả nhánh honest-null), S4 disclaimer.

---

*Blueprint T1 = 4 surface (S1 đặt profile · S2 adequacy giai đoạn + vi chất honest-null · S3 avoid-list mềm có nguồn · S4 disclaimer), tái dùng tối đa component sẵn, wellness-only, clinical mode không UI. Kế tiếp: TIP (tách task build + thứ tự: schema → types/engine → seed nguồn → UI → QA).*
