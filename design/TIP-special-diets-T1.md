# TIP — Special Diets T1 (thi công)

> Task Implementation Plan cho `VISION-special-diets.md` + `BLUEPRINT-special-diets-T1.md`.
> Quyết định đã chốt: **avoid-list thai kỳ = cảnh báo MỀM có nguồn** (không loại cứng; dị ứng thật vẫn cứng). Chế độ = **wellness only**; clinical mode khảm sẵn, ngủ.

## Nguyên tắc thi công (đọc trước)
- **Ship kiến trúc honest, KHÔNG bịa số.** Build giao *bộ khung trung thực*: mọi nhu cầu giai đoạn / vi chất / hazard tag **chưa có nguồn → honest_null / không bật**. Feature *chạy được ngay* (không số giả), và *có giá trị dần* khi seed nguồn.
- **Giá trị duy nhất seed được ngay mà không cần sourcing mới:** uplift cho con bú 0–6 tháng (+505 kcal/+19 g) — **đã có sẵn trong `needs.ts`, nguồn P3**. Mọi giá trị khác (uplift thai kỳ, RNI vi chất, hazard tag) là **INTAKE có nguồn riêng** (P2/P3/P6), human duyệt — KHÔNG thợ tự chế.
- Mỗi WP: build xanh + test, không phá 59 test hiện có.

---

## WP1 — Domain: types + guard dormant (không data, không UI)
**Files:** `src/domain/types.ts`; mới `src/domain/health/index.ts`; test `src/domain/health/health.test.ts`.
- `types.ts`: thêm
  ```ts
  type LifeStage = "none" | "pregnant_t1" | "pregnant_t2" | "pregnant_t3" | "lactating_0_6" | "lactating_7_12";
  interface HealthProfile { lifeStage: LifeStage; mode: "wellness" | "clinical";
    constraints?: unknown[]; expertSet?: { by: string; at: string; ref: string }; } // 2 field cuối: T2/T3, ngủ
  interface Member { /*…*/ healthProfile?: HealthProfile }
  ```
- `health/index.ts`: `canGenerate(p?: HealthProfile): boolean` → `false` nếu `p?.mode==="clinical" && !p.expertSet`, ngược lại `true`. `activeLifeStages(hh): {memberId, lifeStage}[]`. `isPregnant(ls)`, `isLactating(ls)`.
- **Test:** clinical-không-expert ⇒ `canGenerate=false`; wellness/none ⇒ `true`; guard là backstop cho T2/T3 dù chưa UI.
- **Nghiệm thu:** compile + test; chưa đụng UI/DB.

## WP2 — Engine nhu cầu đọc lifeStage (honest khi chưa nguồn)
**Files:** `src/data/seed/needs.ts`; mới `src/data/seed/lifestage.ts` (bảng uplift + RNI, có sourceRef); test.
- `lifestage.ts`: `LIFESTAGE_UPLIFT: Partial<Record<LifeStage, { kcal?; proteinG?; source: ProvenanceLevel }>>` — **seed DUY NHẤT `lactating_0_6` (P3, đã có số)**; các stage khác **để trống** (chưa nguồn).
- `dailyNeed(member)`: đọc `member.healthProfile?.lifeStage`; nếu có entry trong bảng → cộng uplift; **nếu lifeStage set nhưng chưa có uplift nguồn → trả base + cờ `unsourcedStages`** (không cộng số bịa). Giữ tương thích: hộ có `lactatingMember` cũ vẫn chạy (profile per-member ưu tiên; xử lý double-count — nếu member đã có `lactating_*` thì bỏ qua cờ hộ cho member đó).
- Vi chất: `lifeStageMicros(member): { nutrient: "iron"|"folate"|"calcium"|"iodine"; need: number|null; source: ProvenanceLevel|null }[]` — **khởi tạo tất cả `need:null` (honest_null)** cho tới khi seed RNI có nguồn.
- **Test:** `lactating_0_6` cộng đúng +505/+19 (P3); `pregnant_t2` (chưa seed) → base + `unsourcedStages` chứa nó; `lifeStageMicros` → toàn null khi chưa seed.
- **Nghiệm thu:** không stage nào trả số uplift/vi chất thiếu nguồn.

## WP3 — Avoid-list thai kỳ (MỀM, có nguồn)
**Files:** `src/domain/types.ts` (type `PregnancyHazard`); `src/data/seed/commodity.ts` (tag); mới `src/domain/dish/pregnancy.ts`; test.
- `PregnancyHazard = "high_mercury" | "raw_undercooked" | "unpasteurized" | "liver_vit_a" | "alcohol" | "high_caffeine"`.
- Commodity: thêm optional `pregnancyHazards?: { hazard: PregnancyHazard; source: ProvenanceLevel }[]` — **chỉ tag khi có sourceRef; chưa nguồn → không tag** (không khẳng định an toàn, không khẳng định nguy hiểm).
- `pregnancy.ts`: `pregnancyWarnings(dish, member, source): { hazard; commodityId; source }[]` — chỉ trả khi member `isPregnant`; duyệt `dish.lines` → hazard tag. **MỀM: không loại món** (khác `dishAllowed`). `hasPregnancyData(): boolean` cho UI biết registry đã seed chưa (panel "đang đối chiếu nguồn" khi false).
- **Test:** món có nguyên liệu tag mercury + member `pregnant_t2` ⇒ 1 warning có nguồn; member none/lactating ⇒ rỗng; commodity chưa tag ⇒ rỗng (không false-safe).
- **Nghiệm thu:** cảnh báo mềm, mỗi cái có nguồn; dị ứng thật vẫn cứng qua `dishAllowed` (không đổi).

## WP4 — Persistence
**Files:** `prisma/schema.prisma`; `src/data/repo/household.ts`; `src/ui/store.tsx`.
- Schema: `model Member { … healthProfile Json? }`. **Migration `prisma db push`** (cột nullable, additive, ít rủi ro) — *cần consent lại*; regenerate client.
- Repo: map `Member.healthProfile` Json ↔ `HealthProfile`; `StatePatch` thêm `memberHealthProfiles?: Record<string, HealthProfile>`; `saveHouseholdState` ghi per-member.
- Store: `updateMemberHealthProfile(memberId, profile)` — optimistic set + `persistState`. Hydrate ở load.
- **Nghiệm thu:** đặt profile → reload → còn; build xanh.

## WP5 — UI (S1–S4) + disclaimer + i18n
**Files:** `settings/page.tsx` (S1 entry), mới `src/ui/components/HealthProfileSheet.tsx`, mới `src/ui/components/HealthDisclaimer.tsx`, `nutrition/page.tsx` (S2), `week/page.tsx`+`dishes` (S3 badge), `src/i18n/{vn,en}.json`.
- **S1:** hàng member (card "Gia đình & Thành viên") → nút mở `HealthProfileSheet` (BottomSheet glass-modal). Segmented lifeStage — **chỉ hiện mang thai/cho con bú khi `sex==="F" && role==="adult"`**; ghi chú nguồn; `<HealthDisclaimer/>`; Lưu → `updateMemberHealthProfile`. Hàng hiện badge giai đoạn + "Sửa" khi đã đặt.
- **S2:** Nutrition — nếu member chọn có `lifeStage!=="none"`: nhãn adequacy → "% nhu cầu [giai đoạn]"; hàng vi chất `lifeStageMicros` (honest_null path rõ ràng); panel "Nên tránh khi mang thai" từ `pregnancyWarnings` trên thực đơn (hoặc "đang đối chiếu nguồn" nếu `!hasPregnancyData`). Badge giai đoạn trên chip member. **Không đỏ.**
- **S3:** card món (Tuần/Công thức) của member mang thai → badge honey "⚠ nên tránh khi mang thai" + nguồn khi chạm. **Mềm, không ẩn/không loại.**
- **S4:** `HealthDisclaimer` (tone trung tính, không đỏ) — đầu Nutrition khi lifeStage active, trong S1, dòng gọn ở Tuần khi có warning. Ẩn khi không member nào bật lifeStage.
- **Nghiệm thu:** đủ 4 surface; disclaimer đúng điều kiện hiện/ẩn.

## WP6 — QA + cổng
- Playwright 390/1440 × sáng/tối: S1 sheet, S2 (gồm nhánh honest_null vi chất), S3 badge, S4 disclaimer. Bypass auth tạm (khôi phục sau) như các lần trước; ảnh `qa/t1-*`.
- **Cổng (Blueprint §9 + Vision §8):**
  1. Không số lifestage/vi chất nào thiếu nguồn mà hiện số → chỉ honest_null.
  2. Không đỏ; không "kiêng/cấm"; avoid-list mềm + nguồn.
  3. Clinical mode: 0 UI; unit test guard `clinical && !expertSet ⇒ refuse` (WP1).
  4. Sheet S1 chỉ mở mang thai/cho con bú cho F/adult.
  5. Disclaimer hiện/ẩn đúng.
- Build xanh + `vitest` (59 cũ + mới) xanh.

---

## Thứ tự & phụ thuộc
WP1 → WP2 → WP3 (song song được sau WP1) → WP4 → WP5 → WP6. Deploy 1 lần cuối sau WP6.

## Ngoài scope (khẳng định lại)
Uplift/RNI/hazard **giá trị thật** = INTAKE có nguồn riêng (P2/P3/P6), human duyệt — không thợ tự chế. Mọi thứ T2/T3, clinical UI, tự đặt hạn mức, chẩn đoán. Rà SaMD/pháp lý = trước khi chạm lâm sàng (không ở T1).

## Rủi ro/điểm cần chốt khi build
- **Consent `prisma db push`** (WP4) — sẽ hỏi lại.
- **Reconcile `lactatingMember` (hộ) ↔ `lifeStage` (member)** — tránh double-count (WP2): profile per-member thắng; giữ cờ hộ làm fallback tương thích.
- Seed nguồn: cần bạn cấp/duyệt trích P3 (HD 776) cho uplift thai kỳ + hazard — hoặc để honest_null tới khi có.
