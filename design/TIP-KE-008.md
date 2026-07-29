# TIP-KE-008 — Chuẩn bị trước có kiểm chứng cho bữa ngày mai

**Trạng thái:** READY FOR BUILDER
**Chủ thầu:** Codex — Kiến trúc sư trưởng
**Ngày lập:** 2026-07-29
**Phụ thuộc:** KE-004, KE-007

## 1. Mục tiêu

Giúp gia đình tối hôm trước biết những việc nào có thể chuẩn bị cho bữa ngày mai:

- lấy và gom đúng nguyên liệu/dụng cụ;
- đong sẵn nguyên liệu khô;
- sơ chế rau củ khi có hướng dẫn phù hợp;
- ướp thực phẩm sống trong tủ lạnh khi công thức và nguồn cho phép;
- giữ sống/chín tách biệt;
- biết việc nào phải để đến sát lúc nấu.

Phần mềm chỉ hướng dẫn và điều phối. Người dùng tự xác nhận điều kiện thực tế. AI không được sinh bước sơ chế, thời lượng ướp, thời lượng rã đông hoặc nhiệt độ bảo quản.

## 2. Nguồn đã đối chiếu

Thợ phải rà lại trước khi chốt nội dung:

- FDA — Safe Food Handling:
  https://www.fda.gov/food/buy-store-serve-safe-food/safe-food-handling
- FDA — Are You Storing Food Safely?:
  https://www.fda.gov/consumers/consumer-updates/are-you-storing-food-safely
- FDA — Selecting and Serving Produce Safely:
  https://www.fda.gov/food/buy-store-serve-safe-food/selecting-and-serving-produce-safely
- FoodSafety.gov — Safe Minimum Internal Temperatures:
  https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures

Nguyên tắc bắt buộc:

- thực phẩm sống cần ướp phải ở ngăn mát, không để trên bàn;
- không tái dùng nước ướp đã chạm đồ sống làm xốt nếu chưa xử lý theo nguồn;
- không rửa thịt/gia cầm sống làm bắn nước;
- thực phẩm sống tách khỏi đồ ăn sẵn và dụng cụ sạch;
- không nấu sơ thịt/gia cầm rồi cất để hôm sau nấu tiếp;
- không tự đặt một số giờ rã đông hoặc ướp khi registry không có căn cứ món-specific.

## 3. Kiến trúc

### 3.1 Registry kiểm duyệt

Tạo:

```text
src/data/seed/prep-ahead-guides.ts
src/domain/kitchen-execution/prep-ahead.ts
```

Vocabulary gợi ý:

```ts
type PrepAheadKind =
  | "gather"
  | "measure"
  | "produce"
  | "marinate-refrigerated"
  | "separate"
  | "defer-until-cooking";

type PrepAheadStep = {
  id: string;
  kind: PrepAheadKind;
  title: LocalizedText;
  instruction: LocalizedText;
  storageInstruction?: LocalizedText;
  sourceIds: string[];
};

type PrepAheadGuide = {
  id: string;
  dishId: string;
  reviewedAt: string;
  scope: "previous-evening";
  steps: PrepAheadStep[];
  sourceIds: string[];
};
```

Registry ban đầu phải phủ đủ 12 món đã có `CookingGuide`.

Mỗi bước liên quan an toàn phải có source ID. Bước chỉ mang tính tổ chức như gom nồi hoặc đong gạo có thể dùng source guide món hiện hữu nhưng không được thêm tuyên bố an toàn mới.

### 3.2 Resolver thuần

Tạo resolver:

```ts
prepAheadGuideFor(dishId)
prepAheadForPlanDay(plan, day, dishResolver)
```

Kết quả phải:

- stable và dedupe;
- giữ món unsupported riêng;
- không mutate plan/registry;
- không fallback bằng nội dung AI hay một hướng dẫn chung giả.

### 3.3 Mở rộng agenda

Thêm kind `prep-ahead` vào `KitchenAgendaTaskKind`.

Task chỉ xuất hiện khi:

- có ngày kế tiếp trong tuần hiện tại;
- ngày kế tiếp có ít nhất một món với `PrepAheadGuide`;
- có ít nhất một bước scope `previous-evening`.

Priority `today`, deep link `/week`. Evidence gồm số món hỗ trợ và chưa hỗ trợ. Không tạo task riêng cho từng bước để tránh làm agenda quá dài.

`prepare-frozen` vẫn là task riêng vì dựa trên lot thật. `prep-ahead` không được lặp hướng dẫn rã đông.

## 4. Yêu cầu chức năng

| ID | Yêu cầu |
|---|---|
| KE8-001 | Có vocabulary `PrepAheadGuide` thuần và source registry riêng. |
| KE8-002 | Registry phủ 12/12 món cooking guide hiện tại, có integrity test. |
| KE8-003 | Mọi safety-bearing step có source; không có source URL HTTP hoặc ngày review thiếu. |
| KE8-004 | Không có bước rửa thịt/gia cầm sống, nấu sơ để cất, ướp ngoài tủ lạnh hoặc tái dùng nước ướp thiếu cảnh báo. |
| KE8-005 | Resolver theo plan/day stable, dedupe, immutable và honest unsupported. |
| KE8-006 | Trang Week có nút “Chuẩn bị cho ngày mai” khi có guide hỗ trợ. |
| KE8-007 | Sheet hiển thị theo món, từng bước, nơi bảo quản và provenance. |
| KE8-008 | Người dùng có thể đổi số người để xem lượng nguyên liệu qua recipe hiện hữu; không tự suy ra lượng ở registry prep. |
| KE8-009 | Agenda có task `prep-ahead` gộp, không trùng `prepare-frozen`. |
| KE8-010 | Assistant đọc được task/guide đã cấu trúc nhưng không tự thêm bước hoặc mutation. |
| KE8-011 | Không có trạng thái “đã sơ chế” giả hoặc tự cập nhật tồn kho. |
| KE8-012 | Việt/Anh, mobile 390px, focus/Escape, reduced-motion và full regression xanh. |

## 5. Nội dung cho 12 món

Phạm vi nội dung:

- `com_trang`
- `thit_kho_trung`
- `ga_kho_gung`
- `ca_kho_to`
- `ca_chien_sot_ca`
- `tom_rang`
- `trung_chien`
- `rau_muong_xao_toi`
- `cai_ngot_luoc`
- `bi_xanh_luoc`
- `canh_bi_dao_tom`
- `canh_rau_ngot_thit`

Không bắt buộc món nào cũng có bước ướp. Nếu lợi ích chuẩn bị trước không đủ căn cứ, dùng `gather`, `measure`, `separate` hoặc `defer-until-cooking` trung thực.

Ví dụ:

- rau lá có thể nhặt và tổ chức dụng cụ, nhưng copy bảo quản phải theo nguồn;
- thịt/cá/tôm chỉ ướp trước khi guide món và source cho phép, luôn ghi trong tủ lạnh;
- trứng giữ nguyên vỏ đến lúc nấu nếu không có lý do kiểm duyệt để đập trước;
- nguyên liệu đông lạnh chỉ trỏ sang task/hướng dẫn rã đông hiện hữu.

## 6. UX

### Week

- CTA xuất hiện ở ngày có kế hoạch cho ngày mai.
- Sheet heading “Chuẩn bị cho ngày mai”.
- Nhóm theo món, giữ thứ tự slot.
- Mỗi step có loại việc, instruction và storage instruction nếu có.
- Có disclosure “Nguồn đã rà soát”.
- Unsupported hiển thị: “Chưa có hướng dẫn chuẩn bị trước cho…”.
- Không checkbox hoặc nút hoàn tất.

### Agenda

- Task reason: số món có guide và số món chưa hỗ trợ.
- Action mở `/week`.
- Provenance: “thực đơn ngày mai và hướng dẫn chuẩn bị đã rà soát”.

## 7. Assistant boundary

Mở rộng tool read-only hoặc thêm tool `prep_ahead_guide`:

- model chỉ truyền `dishId` từ enum/catalog được server kiểm tra, hoặc tool tự resolve ngày mai;
- output chỉ là registry steps đã kiểm duyệt;
- nếu thiếu guide trả `supported: false`;
- không cho model sinh hoặc sửa step;
- không có action mutation;
- câu trả lời phải nói “theo hướng dẫn đã rà soát”.

## 8. Ngoài phạm vi

- Notification tối hôm trước.
- Timer ướp/rã đông.
- Camera hoặc cảm biến tủ lạnh.
- Lưu trạng thái đã sơ chế.
- Tự trừ/tăng tồn kho.
- Tự tạo hộp meal prep hay hạn dùng mới.
- Mở rộng ngoài 12 món trong TIP này.

## 9. Kiểm thử bắt buộc

### Domain/content

- 12/12 coverage và unique dish ID;
- source integrity;
- banned-pattern scan cho hành vi nguy hiểm;
- resolver đúng ngày, thứ tự, dedupe, unsupported;
- input/registry immutable;
- ngày cuối tuần không tạo task ngày mai sai;
- prep task không chứa từ hoặc evidence về số giờ rã đông.

### UI/E2E

1. Week → mở chuẩn bị ngày mai → thấy guide theo món và source.
2. Món unsupported được nêu trung thực.
3. Mobile 390px không tràn; focus và Escape đúng.
4. Agenda xuất hiện `prep-ahead`, deep link Week.
5. Không có checkbox/done và không đổi pantry sau khi xem.
6. Assistant hermetic trả registry content, không gọi mạng.

### Gates

```bash
npx prisma validate
npx tsc --noEmit
npm run lint
npm test
npm run build
npm run test:e2e
git diff --check
```

## 10. Tiêu chí nghiệm thu

- 12/12 yêu cầu KE8 đạt.
- Registry 12/12, có source và banned-pattern tests.
- Không schema/migration mới.
- Không inventory mutation hoặc done state.
- AI không sinh nội dung prep.
- Full gates xanh.
- Có `design/COMPLETION-KE-008.md`.

## 11. Điểm dừng

Thợ phải báo Chủ thầu nếu:

- cần thêm số giờ ướp/rã đông chưa có nguồn món-specific;
- muốn lưu trạng thái prep;
- muốn tự sửa inventory;
- nguồn mâu thuẫn;
- muốn mở rộng ngoài 12 món;
- cần thêm schema, notification hoặc background job.
