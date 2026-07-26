# VISION — Special Diets vertical (T1 first, on an extensible HealthProfile seam)

> Extends the Q's Kitchen product Vision. Scope of THIS document: open **T1 —
> pregnancy & postpartum (Q's women's health)** as the first instance of a general,
> extensible `HealthProfile` seam, with the clinical-constraint machinery present
> but **dormant**. T2 (chronic) / T3 (clinical) are designed-for but not built here.
>
> Grounded in real code seams (paths cited). House style follows `design/DESIGN-BLUEPRINT.md`.

---

## 0. Đặt vấn đề & bất biến sống còn

**Vấn đề.** Không app VN nào ghép được: mâm cơm Việt thật + định lượng đi chợ + provenance/SOT + chế độ ăn cho nhóm đặc biệt theo *chỉ định*. Q's Kitchen đã có bốn mảnh đầu; nhóm đặc biệt là ô trống — nhưng là địa hạt **làm ẩu gây hại thật**.

**Bất biến (không thương lượng, kể cả khi mở rộng):**
1. **App THỰC THI, không KÊ.** App không chẩn đoán, không kê, không tự sinh/điều chỉnh chế độ ăn *bệnh lý*. Chế độ ăn bệnh lý là y lệnh (khung: TT 18/2020/TT-BYT; mã QĐ 2879/QĐ-BYT). Điểm bất khả đảo = **quyết định lâm sàng** → người giữ (bác sĩ/chuyên gia). App lo **thực thi hằng ngày**.
2. **Không bịa số y tế.** Mọi giá trị nhu cầu theo giai đoạn sống / mọi mục avoid-list phải có nguồn (registry §4). Không nguồn → `honest_null` + "hỏi bác sĩ/chuyên gia dinh dưỡng". Builder KHÔNG tự chế giá trị dinh dưỡng lâm sàng — chúng đến từ INTAKE có nguồn, đúng DNA "SOT thắng LLM".
3. **Honesty precedents cũ vẫn đúng cho T1.** Mẫu-số luôn nêu rõ (adequacy denominator), donut 4/4 định tính, không đỏ cho adequacy trong `wellness mode`.
4. **Ranh giới SaMD cần rà pháp lý thật trước khi phát hành bất kỳ tầng nào chạm lâm sàng.** Tài liệu này là kiến trúc sản phẩm, không phải ý kiến pháp lý/y khoa.

---

## 1. Phân tầng rủi ro & hai chế độ hiển thị

| Tầng | Nhóm | App làm gì | Chế độ hiển thị | Chuyên gia |
|---|---|---|---|:-:|
| **T1** (build now) | mang thai · sau sinh/cho con bú | Nâng **nhu cầu** theo giai đoạn + **avoid-list** (loại trừ cứng) theo guideline công khai | `wellness` (đủ/thiếu, không đỏ) | không bắt buộc |
| **T2** (dormant) | ĐTĐ2 ổn định · THA · mỡ máu · gout | Nhận **ràng buộc** (carb/natri/purine) do chuyên gia đặt → thực đơn tuân thủ + cảnh báo vượt | `clinical-constraint` | nên |
| **T3** (dormant) | thận · hậu phẫu · suy gan · ung thư ĐT | **Chỉ thực thi** mã QĐ 2879 do bác sĩ kê | `clinical-constraint` | **bắt buộc** |

**Bẫy đã bắt:** framing "đủ/thiếu, không vượt/kiêng" là **tài sản của T1**, là **nợ của T2–T3** (với thận, "hạn chế kali" là y lệnh thật, không phải phán xét thẩm mỹ). ⇒ hai chế độ hiển thị **tách biệt**; T1 chỉ dùng `wellness`, `clinical-constraint` ship **ngủ**.

---

## 2. Kiến trúc — seam `HealthProfile` (điểm mấu chốt)

Mở T1 như **thể hiện đầu tiên** của một seam mở rộng, không phải vertical rời. Định nghĩa entity đầy đủ ngay; T1 chỉ *dùng một phần*; T2/T3 sau = bật cờ + cổng, không viết lại engine.

```ts
// đề xuất trong src/domain/types.ts — gắn per-Member (đúng với memberAdequacy đã có)
type LifeStage =
  | "none"
  | "pregnant_t1" | "pregnant_t2" | "pregnant_t3"
  | "lactating_0_6" | "lactating_7_12";        // T1 dùng các giá trị này
  // (điều kiện lâm sàng T2/T3 định nghĩa sau, không ở bản này)

interface HealthProfile {
  lifeStage: LifeStage;                 // T1
  mode: "wellness" | "clinical";        // T1 LUÔN = "wellness"
  // --- phần cho T2/T3, ship NGỦ, T1 không set/không render ---
  constraints?: ClinicalConstraint[];   // vd { nutrient, capPerDay, source } — dormant
  expertSet?: { by: string; at: string; ref: string }; // cổng: clinical-mode chỉ hợp lệ khi có cái này
}
interface Member { /* …hiện có… */ healthProfile?: HealthProfile }
```

**Vì sao gắn per-Member:** `memberAdequacy()` / `dailyNeed(member, …)` đã tính theo từng thành viên (`src/domain/nutrition/adequacy.ts`, `src/data/seed/needs.ts`). Một mẹ mang thai trong hộ 4 người → chỉ profile của mẹ đổi nhu cầu, không đụng người khác.

**Cổng an toàn khảm sẵn (dormant):** engine sẽ có guard: `mode==="clinical" && !expertSet ⇒ TỪ CHỐI sinh thực đơn` (chỉ hiện thông tin guideline). T1 không chạm nhánh này, nhưng guard tồn tại để T2/T3 sau chỉ là *cấu hình*, không phải *sửa engine*.

---

## 3. T1 cụ thể — mang thai & sau sinh (chỉ `wellness mode`)

### 3.1 Nhu cầu theo giai đoạn (mở rộng seam `dailyNeed`)
`dailyNeed(member, lactating)` ở `src/data/seed/needs.ts` **đã** cộng uplift cho lactating (P3/HD 776: +505 kcal, +19 g đạm 0–6 tháng). Mở rộng chữ ký: `dailyNeed(member)` đọc `member.healthProfile.lifeStage` và cộng uplift theo giai đoạn.

- **Vĩ mô** (kcal, đạm): đã có khung; thêm bậc mang thai T2/T3 + lactating 7–12 tháng — **giá trị lấy từ P3, chưa seed thì `honest_null`**, không đoán.
- **Vi chất quan trọng thai kỳ** (sắt, folate, canxi, i-ốt…): là *category* cần theo dõi; **con số RNI lấy từ P2 (Nhu cầu 2016) / P3, chưa có → honest_null + "tham khảo".** Đây là mở rộng adequacy sang vi chất, không phải chế độ bệnh lý.

### 3.2 Avoid-list = loại trừ cứng, tái dùng `dishAllowed`
Thai kỳ có **loại trừ cứng thật** (không phải "thiếu chất"): cá thuỷ ngân cao, đồ sống/tái, sữa/phô mai chưa tiệt trùng (listeria), gan (thừa vit A), rượu, caffeine cao. Tái dùng đúng engine đã có:
- `src/domain/dish/dietary.ts::dishAllowed` (loại trừ theo nguyên liệu) + tag ở commodity (`src/data/seed/commodity.ts`).
- Thêm nhóm hazard tag mới (song song `Allergen`), seed lên commodity bị ảnh hưởng, **mỗi tag phải có sourceRef (P3/WHO); chưa nguồn → không bật tag** (thà bỏ sót còn hơn khẳng định sai — nhưng surface "danh sách cần bác sĩ xác nhận").
- Khung tinh thần: **"tránh trong thai kỳ", có nguồn** — không phải "kiêng/phán xét".

### 3.3 Hiển thị (wellness, giữ mọi precedent)
- Adequacy theo **mẫu-số giai đoạn**, nêu rõ: *"Sắt: X% nhu cầu thai kỳ (nguồn: HD 776)"* — đúng precedent adequacy-denominator.
- Avoid-list hiện như **loại trừ trung thực có nguồn**, không đỏ-phán-xét.
- **Disclaimer thật ở mọi màn T1** (không cho-có): *"Hỗ trợ theo hướng dẫn công khai, không thay thế bác sĩ. Thai kỳ nguy cơ → theo chỉ định chuyên gia."*
- Vi chất chưa có nguồn → `honest_null` ("chưa đủ dữ liệu, hỏi chuyên gia"), không số giả.

---

## 4. Registry nguồn — MỞ RỘNG cái đã có (không tạo song song)

`src/data/seed/sources.ts` đã có `SOURCE_REGISTRY` P1–P6, trong đó **P3 = HD 776 (mang thai/cho con bú)** và P6 = WHO/FAO. ⇒ T1 **không cần registry mới**: dùng P2 (Nhu cầu 2016), P3 (HD 776), P6 (WHO) sẵn có. Chỉ bổ sung khi thật cần:

| Cần | Dùng nguồn đã có |
|---|---|
| Nhu cầu vi chất thai kỳ | **P2** (Nhu cầu 2016) · **P3** (HD 776) |
| Uplift kcal/đạm thai kỳ/cho con bú | **P3** |
| Avoid-list hazard | **P3** + **P6** (WHO) đối chiếu |

Cho T2/T3 (sau, dormant): thêm cấp lâm sàng vào cùng registry — **QĐ 2879/QĐ-BYT** (mã chế độ ăn) + **TT 18/2020** (khung ai được kê). Đặt tên nhất quán với P1–P6 hiện hữu, không dựng "PM" song song.

---

## 5. Cửa an toàn — fail-loud (như refinery có răng)

1. **Không nguồn → honest_null**, không suy diễn định lượng y tế. (đã là DNA)
2. **clinical-mode không có expertSet → engine từ chối sinh thực đơn** (guard dormant, khảm sẵn).
3. **Disclaimer thực chất** ở mọi surface T1 (và T2/T3 sau).
4. **Avoid-list chỉ bật tag khi có sourceRef.** Danh mục nghi ngờ chưa nguồn → liệt kê "cần bác sĩ xác nhận", không tự loại/không tự khẳng định an toàn.
5. **Builder không tự chế con số lâm sàng** — vào qua INTAKE có nguồn.

---

## 6. Phạm vi bản build này

**Ship (T1):** entity `HealthProfile` (per-Member) + `LifeStage` + `mode` (T1=wellness) · mở rộng `dailyNeed` theo lifeStage (giá trị từ P2/P3, honest_null nếu chưa seed) · avoid-list qua `dishAllowed` + hazard tag có nguồn · hiển thị adequacy-theo-giai-đoạn + avoid-list + disclaimer · persistence (`Member.healthProfile Json?` + repo/store patch) · UI đặt profile cho thành viên (Settings) + phản ánh ở Nutrition/Week.

**Ship NGỦ (khảm, không render):** `mode="clinical"`, `constraints`, `expertSet`, guard refuse-to-generate.

**KHÔNG làm:** chẩn đoán · tự đặt hạn mức lâm sàng qua UI · bất kỳ màn/logic T2–T3 · sinh chế độ ăn bệnh lý B2C · bịa RNI/uplift chưa nguồn.

---

## 7. Seam sẵn cho T2/T3 (tương lai, đã chừa)
`HealthProfile.mode="clinical"` + `constraints[]` + cổng `expertSet` + guard refuse-to-generate + cấp nguồn QĐ 2879/TT 18 trong cùng registry. Mô hình **B2B2C** (cơ sở y tế kê → bệnh nhân dùng ở nhà) — nơi có chuyên gia trong vòng lặp *và* doanh thu — cộng **rà SaMD/pháp lý** trước khi ship.

---

## 8. Cổng nghiệm thu (D-gate cho vertical này)
1. Mọi số nhu cầu theo giai đoạn + mọi hazard tag **có sourceRef** hoặc hiển `honest_null`; test: không số lâm sàng nào thiếu nguồn.
2. `wellness mode` T1 giữ precedent: mẫu-số nêu rõ, không đỏ adequacy, donut định tính.
3. Guard dormant: unit test `mode="clinical" && !expertSet ⇒ refuse` (dù chưa có UI).
4. Avoid-list loại đúng nguyên liệu (vd cá thuỷ ngân) ở cấp ingredient qua `dishAllowed`; test như allergen.
5. Disclaimer hiện ở mọi surface T1.
6. Playwright 390/1440 × sáng/tối cho màn HealthProfile + Nutrition-có-thai-kỳ.

---

*Cửa vào = T1 (mang thai/sau sinh) trên seam `HealthProfile`. Bất biến = thực thi, không kê; không bịa số y tế. Clinical-constraint mode khảm sẵn, ngủ. Kế tiếp: Blueprint (màn HealthProfile + hiển thị adequacy-giai-đoạn + disclaimer) → TIP → build.*
