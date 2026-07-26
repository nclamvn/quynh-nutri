# Q's Kitchen / Meal SOT — Design Blueprint v1.0

> **Trạng thái:** Design contract để chuyển từ mock cảm xúc sang giao diện có thể build thật.
> **Phạm vi:** web app/PWA, desktop + tablet + mobile, light/dark, tiếng Việt canonical, tiếng Anh là lớp hiển thị.
> **Typeface:** Inter cho toàn bộ text và số liệu. Số dùng `font-variant-numeric: tabular-nums` thay vì thêm một font mono để giữ ADN mềm, thống nhất và cao cấp.

---

## 0. Tuyên ngôn thiết kế

Q's Kitchen không phải một “app recipe màu hồng”. Đây là **hệ điều hành bếp gia đình**: lên mâm, đi chợ, quản lý kho, định lượng và nhìn sức khỏe của cả nhà trong một dòng công việc liền mạch.

Ba thuộc tính phải đồng thời tồn tại:

1. **Nữ tính có chiều sâu** — mềm bằng ánh sáng, khoảng thở, đường cong hữu cơ và ngôn ngữ chăm sóc; không dùng minh họa ngây thơ, gradient kẹo hoặc màu hồng phủ toàn màn hình.
2. **Hiện đại có cấu trúc** — mọi trang đều ưu tiên nhiệm vụ, trạng thái và dữ liệu; UI nhìn nhẹ nhưng logic rõ như công cụ vận hành.
3. **Cao cấp nhờ tiết chế** — ít màu, ít bóng, ít hiệu ứng; chất lượng đến từ typography, nhịp bố cục, ảnh món ăn, chuyển động và độ nhất quán.

### Câu nhắc nội bộ

> “Chăm sóc gia đình bằng một hệ thống đẹp, yên và đáng tin.”

---

## 1. Nền tảng sản phẩm cần phản ánh trong UI

### 1.1 Ba lớp dữ liệu

- **A — Commodity:** nguyên liệu, macro/100g, mùa vụ, cách trữ, substitutes, provenance.
- **B0 — Repertoire phổ dụng:** món mẫu chạy được ngay.
- **B1 — Household:** món, định lượng, khẩu vị, vendor và override của hộ thật.

UI phải giúp người dùng hiểu ba lớp mà không bắt họ học kiến trúc:

- Badge **Món mẫu** = B0.
- Badge **Nhà mình** = B1.
- Chip độ chắc ở số dinh dưỡng = provenance của A.
- Sửa món mẫu tạo bản riêng, không phá dữ liệu hệ thống.

### 1.2 Mô hình mâm cơm

Mỗi ngày được biểu diễn bằng 5 slot:

- MẶN
- RAU
- CANH
- CƠM
- TRÁNG MIỆNG

Slot là đơn vị tương tác cốt lõi. Card món, popup thay món, shopping aggregation và nutrition đều truy nguyên về slot.

### 1.3 Dòng công việc chính

`Tuần → chốt món → sinh danh sách chợ → tick mua → cập nhật kho → nấu → xem dinh dưỡng`

Không thiết kế các module như các đảo rời nhau. Mỗi trang phải có liên kết tự nhiên đến bước trước và bước sau.

---

## 2. ADN thị giác

### 2.1 Từ khóa

- luminous
- tender
- composed
- editorial
- domestic intelligence
- botanical freshness
- quiet confidence

### 2.2 Tránh tuyệt đối

- cream + terracotta kiểu template AI phổ biến
- nền hồng nguyên khối
- gradient tím-xanh công nghệ
- glassmorphism dày đặc
- bo góc 24–32px cho mọi thứ
- icon hoạt hình không cùng hệ
- shadow nặng, card nổi như dashboard fintech
- heading serif “luxury” nhưng body generic
- mọi block đều có badge/chip
- copy ngắn cụt, lạnh hoặc phán xét dinh dưỡng

### 2.3 Hình ảnh thương hiệu

- Hoa 5 cánh mảnh là ký hiệu cảm xúc, chỉ dùng ở logo, empty state, hero hoặc góc trang.
- Ảnh món ăn chụp gần, ánh sáng tự nhiên, bát đĩa Việt hiện đại, không quá studio.
- Rau củ và hoa dùng như texture, không làm wallpaper.
- Ảnh người dùng chỉ xuất hiện ở avatar và thiết lập thành viên.

---

## 3. Design tokens

File nguồn: `design-tokens.css`.

### 3.1 Màu chủ đạo

| Vai trò | Token | Giá trị | Ý nghĩa |
|---|---|---:|---|
| Brand | `--color-brand-primary` | `#EF5775` | năng lượng nữ tính, CTA |
| Brand soft | `--color-brand-soft` | `#FFF4F6` | trạng thái chọn, bề mặt dịu |
| Botanical | `--color-accent-botanical` | `#469B75` | đủ chất, tươi, hoàn tất |
| Honey | `--color-accent-honey` | `#DEA431` | ước lượng, cần chú ý |
| Lilac | `--color-accent-lilac` | `#8D7BD2` | ngân sách, insight thứ cấp |
| Canvas | `--color-bg-canvas` | `#FFFDFC` | nền sạch, ấm rất nhẹ |
| Ink | `--color-text-primary` | `#272327` | gần đen, không xám nâu |

### 3.2 Quy tắc sử dụng màu

- Rose chỉ chiếm 8–12% diện tích nhìn thấy.
- Botanical dùng cho trạng thái tốt, hoàn tất, “đủ”.
- Honey dùng cho ước lượng, thiếu, sắp hết; không dùng đỏ nếu chưa có lỗi.
- Red/danger chỉ dành cho xóa dữ liệu, dị ứng hoặc lỗi thật.
- Neutral giữ 70–80% giao diện.
- Không dùng quá 2 accent trong cùng một card.

### 3.3 Typography

| Role | Size/line | Weight | Dùng cho |
|---|---|---|---|
| Display | 32–48 / 1.12 | 600 | landing, insight hero |
| Page title | 24–28 / 1.28 | 600 | tiêu đề trang |
| Section title | 18–20 / 1.28 | 600 | card/section |
| Body | 15–16 / 1.5 | 400 | nội dung chính |
| Meta | 12–13 / 1.5 | 400/500 | phụ chú |
| Label | 12 / 1.2 | 600 | category, uppercase tiết chế |
| Data | 15–40 | 500/600 | gram, kcal, %, tiền |

Quy tắc:

- Inter hỗ trợ đầy đủ tiếng Việt.
- Heading tracking âm nhẹ, không đậm quá 600.
- Số liệu bật tabular numerals.
- Không viết uppercase cho câu dài.
- Không dùng font script trong sản phẩm. Chữ “Q’s” ở logo có thể là vector riêng.

### 3.4 Spacing

Base 4px. Nhịp chủ đạo 8 / 12 / 16 / 24 / 32.

- khoảng trong control: 8–12px
- khoảng trong card: 16px mobile, 20–24px desktop
- khoảng giữa section: 24px mobile, 32px desktop
- khoảng giữa page title và content: 20–24px

### 3.5 Radius

- control: 10–12px
- card: 16–20px
- modal/sheet: 20–24px
- avatar/chip: pill
- ảnh món: 12–16px

Không bo card nhỏ quá tròn. Radius phải giảm theo kích thước phần tử.

### 3.6 Elevation

- Card thường: border + `shadow-sm`.
- Card quan trọng/hover: `shadow-md`.
- Floating CTA/modal: `shadow-float`.
- Không shadow cho bảng, row, accordion; dùng divider.

### 3.7 Motion

- hover/toggle: 160ms
- đổi tab/card: 240ms
- modal/sheet: 360ms
- easing chính: `cubic-bezier(0.2, 0.8, 0.2, 1)`

Chuyển động mang cảm giác “đặt nhẹ xuống”, không bounce.

---

## 4. Kiến trúc layout

### 4.1 Desktop ≥ 1280px

```
┌──────────────┬──────────────────────────────────────┬───────────────┐
│ Sidebar 240  │ Main fluid                           │ Right rail 292│
│              │ max 1600                             │ contextual    │
└──────────────┴──────────────────────────────────────┴───────────────┘
```

- Sidebar cố định, nền trắng mờ, border phải.
- Main có page header sticky nhẹ.
- Right rail chỉ xuất hiện khi có giá trị theo ngữ cảnh: hôm nay, việc sắp tới, summary.
- Không ép right rail trên mọi trang.

### 4.2 Laptop 1024–1279px

- Sidebar thu còn 84px hoặc drawer.
- Right rail chuyển thành card đầu trang hoặc drawer.
- Week planner cuộn ngang.

### 4.3 Tablet 768–1023px

- Top app bar + navigation rail thu gọn.
- Grid 2 cột.
- Bottom sheet thay modal nhỏ.

### 4.4 Mobile < 768px

- Bottom navigation cố định: **Tuần · Chợ · + · Món · Dinh dưỡng**.
- Các trang phụ đi từ menu “Thêm”.
- Một cột, touch target ≥44px.
- Sticky primary action ở dưới nếu nhiệm vụ có bước kết thúc.
- Không thu nhỏ desktop dashboard vào mobile; phải đổi cấu trúc.

---

## 5. App shell

### 5.1 Sidebar desktop

Các nhóm:

**Chính**
- Tổng quan
- Thực đơn tuần
- Đi chợ & Kho
- Công thức
- Dinh dưỡng

**Theo dõi**
- Báo cáo
- Yêu thích
- Ghi chú

**Hệ thống**
- Cài đặt

Footer sidebar:
- household switcher
- avatar thành viên
- trạng thái sync/offline

### 5.2 Top bar

- Breadcrumb/page title
- tuần/ngày hiện tại
- search hoặc command palette
- CTA theo trang
- notification
- theme toggle
- avatar

### 5.3 Right rail

Có ba kiểu:

1. **Today rail:** bữa hôm nay, uống nước, ghi chú.
2. **Task rail:** danh sách việc phải làm theo workflow.
3. **Insight rail:** dữ liệu provenance, giải thích dinh dưỡng, ngân sách.

Chỉ dùng một kiểu mỗi trang.

---

## 6. Hệ component

### 6.1 Button

**Primary**
- Rose nền đặc, chữ trắng.
- Dùng một CTA chính mỗi vùng nhìn.

**Secondary**
- Nền trắng, border.
- Dùng cho hành động tương đương nhưng không chính.

**Tertiary/Ghost**
- Không nền, hover soft.

**Destructive**
- Chỉ hiện trong context xác nhận.

Trạng thái: default, hover, pressed, focus, disabled, loading.

### 6.2 Icon button

- 40×40 desktop, 44×44 mobile.
- Icon 18–20px, stroke 1.7–1.9.
- Có tooltip desktop, aria-label bắt buộc.

### 6.3 Card

Biến thể:

- `ContentCard`: section thông thường.
- `MetricCard`: một số lớn + trend + provenance.
- `MealCard`: ảnh + tên + slot + thời gian.
- `TaskCard`: row hành động.
- `InsightCard`: câu gợi ý + giải thích ngắn.
- `EmptyCard`: minh họa mềm, CTA rõ.

### 6.4 Meal slot card

Anatomy:

```
[slot label] [lock]
[image 4:3]
[dish name]
[time] [family/seed badge]
[swap action]
```

Trạng thái:

- assigned
- empty
- locked
- suggested
- unavailable ingredient
- substituted

### 6.5 Provenance chip

```
● 82% · đã đối chiếu
● 58% · ước lượng
○ chưa đủ dữ liệu
```

- Green = corroborated.
- Honey = range/estimated.
- Gray = honest null.
- Tooltip giải thích khi hover/tap.
- Không đưa provenance chip vào mọi con số nhỏ; chỉ số ra quyết định.

### 6.6 Status chip

- Món mẫu
- Nhà mình
- Nhanh ≤25 phút
- Yêu thích
- Sắp hết
- Đã mua

Chip cao 24–28px, padding ngang 8–10px, weight 500.

### 6.7 Form controls

- Input 44px, background raised, border subtle.
- Label nằm trên, helper text dưới.
- Search có icon trái, clear phải.
- Select mở popover desktop, sheet mobile.
- Quantity stepper có số tabular, nút ± 36px.

### 6.8 Table/list

- Bảng desktop, list card mobile.
- Header không nền đậm; dùng text tertiary + divider.
- Row hover soft, selected bằng brand-soft + thanh rose 2px bên trái.

### 6.9 Chart

- Donut dùng tối đa 5 nhóm.
- Line chart thin 2px, grid rất nhẹ.
- Tooltip nền raised, shadow-md.
- Màu chart cố định theo nutrient.
- Không dùng 3D, gradient dữ liệu hoặc gauge kiểu ô tô.

### 6.10 Modal / bottom sheet

- Desktop modal max 640px.
- Mobile bottom sheet bo 24px phía trên.
- Header sticky, footer action sticky.
- Esc/click overlay đóng nếu không có dữ liệu chưa lưu.

### 6.11 Toast

- Góc phải dưới desktop, phía trên bottom nav mobile.
- Tối đa 2 dòng.
- Có undo khi đổi món/xóa/tick hàng loạt.

---

## 7. Blueprint từng trang

## 7.1 Tổng quan

**Mục tiêu:** trả lời trong 5 giây: tuần này ăn gì, hôm nay cần mua gì, nhà đang thiếu gì.

### Cấu trúc desktop

1. Page header: “Chào buổi sáng, Quỳnh” + tuần hiện tại.
2. Week matrix 7 ngày × 5 slot.
3. Hàng metric:
   - đủ 4 nhóm
   - số mặt hàng cần mua hôm nay
   - dự toán tuần
   - món nhanh còn lại
4. Suggestion card có ảnh.
5. Right rail “Hôm nay”.

### CTA

- Primary: `AI gợi ý thực đơn`
- Secondary: `Đổi cả tuần`

### Empty state

- Chưa có tuần: “Bắt đầu từ những món nhà mình vẫn yêu thích.”
- CTA: `Tạo thực đơn đầu tiên`.

---

## 7.2 Thực đơn tuần

**Mục tiêu:** tạo, khóa, thay và cân bằng 7 ngày.

### Desktop

- Week switcher.
- Filter: bữa tối/sáng/trưa; thành viên; chế độ bận.
- Grid ngày theo cột, slot theo hàng.
- Sticky toolbar: re-roll, khóa, publish list chợ.

### Mobile

- Date strip ngang.
- Một ngày một màn.
- 5 meal cards xếp dọc.
- Swipe ngày; tap card mở bottom sheet thay món.

### Luồng thay món

1. Tap “Đổi”.
2. Sheet hiển thị món cùng slot.
3. Filter theo nguyên liệu sẵn có, nhanh, yêu thích.
4. Mỗi option nêu lý do tương thích.
5. Chọn → cập nhật nutrition + shopping diff.
6. Toast: “Đã đổi món. 3 mặt hàng trong danh sách chợ được cập nhật.”

### Luồng re-roll

- Các slot locked giữ nguyên.
- Hiện preview diff trước khi áp dụng.
- Có undo.

---

## 7.3 Đi chợ

**Mục tiêu:** mua nhanh, không sót, không phải dịch từ món sang nguyên liệu.

### Cấu trúc

- Tabs: Hôm nay / Chuyến 2 / Cuối tuần / Đồ khô.
- Group theo vendor: hàng thịt cá, hàng rau, tạp hóa, siêu thị.
- Item: checkbox, tên, qty, món sử dụng, trạng thái kho.
- Sticky summary: số món, dự toán, tiến độ.

### Tương tác

- Tick có haptic/animation nhẹ.
- Swipe mobile: đã mua / bỏ qua.
- Long press: đổi lượng, đổi vendor.
- “Chợ hết…” mở substitution flow.

### Offline

- Header chip “Đang dùng danh sách ngoại tuyến”.
- Tick lưu local và sync khi có mạng.

---

## 7.4 Kho & Tủ lạnh

**Mục tiêu:** biết đang có gì, sắp hết gì, ưu tiên món nào.

### Cấu trúc

- Tabs: Tủ lạnh / Tủ đông / Đồ khô.
- Search + filter sắp hết, sắp hết hạn.
- Inventory rows có lượng, đơn vị, mua ngày, dùng cho món.
- “Ưu tiên dùng” section đầu trang.

### Trạng thái

- Đủ dùng: neutral/botanical.
- Sắp hết: honey.
- Quá hạn: danger nhưng không phủ đỏ toàn card.
- Không rõ lượng: gray + CTA cập nhật.

### CTA

- `+ Thêm nguyên liệu`
- `Gợi ý món từ đồ đang có`

---

## 7.5 Công thức / Món

**Mục tiêu:** quản lý repertoire B0∪B1 và biến món phổ dụng thành món nhà mình.

### List view

- Search.
- Filter: protein, slot, method, quick, family/seed.
- Card ảnh 4:3, tên, thời gian, badge.
- Hover action: xem, sửa, yêu thích, thêm vào tuần.

### Detail view

1. Hero image + dish title.
2. B1/B0 state.
3. Serving scaler.
4. Ingredient checklist.
5. Prep ahead.
6. Steps.
7. Nutrition + provenance.
8. Món hợp cùng.
9. Lịch sử chỉnh của gia đình.

### Fork pattern

Khi sửa B0:

> “Bạn đang tạo phiên bản Nhà mình. Món mẫu vẫn được giữ nguyên.”

CTA: `Tạo phiên bản nhà mình`.

### AI import

- Input text hoặc ảnh.
- Preview JSON được dịch thành form, không hiển thị JSON thô.
- Các nguyên liệu chưa map được có badge “Cần xác nhận”.
- Người dùng duyệt trước khi lưu.

---

## 7.6 Dinh dưỡng

**Mục tiêu:** giúp hiểu đủ/thiếu, không tạo cảm giác chấm điểm hay kiêng khem.

### Header

- Scope: ngày / tuần / thành viên.
- Date/member switcher.
- Coverage chip.

### Nội dung

- Score “Đủ 4 nhóm thực phẩm” không gọi là health score.
- 5 nutrient progress bars.
- Meal contribution breakdown.
- Four-groups checklist.
- Source/provenance panel.

### Ngôn ngữ

Dùng:
- “Hôm nay còn thiếu một phần rau.”
- “Dữ liệu món này mới phủ 62%, nên hệ thống hiển thị theo khoảng.”

Không dùng:
- “Bạn ăn vượt carb.”
- “Bữa này xấu.”
- “Phải cắt.”

### Visualization

- Donut overview.
- Bar theo ngày.
- Contribution list.
- Range band khi coverage thấp.

---

## 7.7 Báo cáo

**Mục tiêu:** nhìn xu hướng gia đình theo tuần/tháng.

Các khối:

- độ đa dạng protein
- tỷ lệ món nhanh vs món cầu kỳ
- số lần đổi món
- food waste proxy
- chi tiêu theo nhóm
- coverage dữ liệu dinh dưỡng
- top món cả nhà yêu thích

Không biến thành dashboard KPI lạnh. Mỗi chart có một câu diễn giải người dùng hiểu được.

---

## 7.8 Yêu thích

- Grid món đã yêu thích.
- Collection: “Món các con thích”, “Ngày bận”, “Mời khách”, “Mẹ sau sinh”.
- Drag/drop desktop, reorder sheet mobile.
- CTA thêm collection.

---

## 7.9 Ghi chú

- Quick notes theo ngày/tuần/món.
- Tag: mua, sơ chế, khẩu vị, trẻ em.
- Ghi chú có thể pin vào right rail hôm nay.
- Voice input là phase sau.

---

## 7.10 Cài đặt

Nhóm:

1. Gia đình và thành viên.
2. Khẩu vị, dị ứng, kiêng bắt buộc.
3. Nhịp sinh hoạt, ngày bận.
4. Chợ/vendor.
5. Ngôn ngữ.
6. Giao diện light/dark/system.
7. Dữ liệu và provenance.
8. Offline/sync.
9. Export/delete.

Các cài đặt nhạy cảm phải có mô tả tác động.

---

## 8. Landing/product site nếu thương mại hóa Q's

ADN giữ nguyên nhưng giảm mật độ dashboard.

### Cấu trúc

1. Hero: “Bữa cơm đủ đầy, không còn bắt đầu bằng câu hỏi tối nay ăn gì.”
2. Product preview.
3. 4 lợi ích: lên thực đơn, đi chợ, định lượng, hiểu sức khỏe.
4. Story Q's.
5. Workflow 4 bước.
6. Testimonials.
7. Pricing.
8. FAQ.
9. Final CTA.

Không dùng ảnh stock “mẹ cười cầm salad”. Ưu tiên ảnh bữa cơm thật và UI product.

---

## 9. Responsive behavior matrix

| Element | Desktop | Tablet | Mobile |
|---|---|---|---|
| Sidebar | full | icon rail/drawer | hidden |
| Bottom nav | hidden | optional | fixed |
| Right rail | contextual | inline card | bottom sheet/card |
| Week matrix | full 7 columns | horizontal scroll | one day |
| Recipe grid | 3–4 cols | 2 cols | 1–2 cols |
| Tables | table | compact table | list cards |
| Modal | centered | centered | bottom sheet |
| Primary CTA | header | header | sticky bottom or FAB |

---

## 10. Dark theme

Dark mode không phải đảo màu.

- Nền midnight plum `#141216`.
- Surface `#211E24`, không pure black.
- Rose sáng hơn để đạt contrast.
- Ảnh giảm brightness 4–8% bằng overlay nhẹ.
- Hairline đủ thấy nhưng không phát sáng.
- Chart grid 8% white.
- Shadow giảm, border tăng vai trò.
- Hoa/illustration đổi sang line art 10–15% opacity.

---

## 11. Accessibility

- WCAG AA cho text thường.
- Focus ring rõ, không chỉ đổi màu.
- Touch target ≥44px.
- Không truyền trạng thái chỉ bằng màu; luôn có text/icon.
- Chart có table summary hoặc aria description.
- Checkbox, tabs, dialogs đúng semantic.
- Respect reduced motion.
- Ảnh món có alt mô tả món, không nhồi keyword.
- Font tối thiểu 13px cho UI meta.

---

## 12. Content design

### 12.1 Giọng điệu

- ấm, rõ, có năng lực
- không phán xét
- không quá “chị em” hoặc ngọt hóa
- ưu tiên động từ và kết quả

### 12.2 Từ vựng chuẩn

- `Thực đơn tuần`, không `Meal Plan`
- `Đi chợ`, không `Shopping`
- `Món nhà mình`, không `Custom recipe`
- `Món mẫu`, không `System recipe`
- `Đã đối chiếu`, không `Verified` trong UI VN
- `Ước lượng`, không `Estimated`
- `Đủ / còn thiếu`, không `Pass / fail`

### 12.3 Microcopy mẫu

- “Hôm nay có 18 mặt hàng, chia thành hai điểm mua.”
- “Khóa món cả nhà đã chốt, rồi đổi phần còn lại.”
- “Chợ hết tôm? Hệ thống sẽ đổi món và cập nhật danh sách giúp bạn.”
- “Số liệu này đang được hiển thị theo khoảng vì độ phủ nguồn là 58%.”

---

## 13. States và edge cases

Mỗi trang phải có:

- loading skeleton
- empty
- partial data
- offline
- permission denied
- sync conflict
- error recoverable
- destructive confirmation
- success/undo

### Quy tắc fail-loud

- Không silently bỏ nguyên liệu không map được.
- Không silently reset item đã tick khi đổi món.
- Không hiện số nutrition point estimate dưới D3 gate.
- Không xóa B1 khi B0 được cập nhật.

---

## 14. Component governance

### 14.1 Single source of truth

- Tokens chỉ đến từ `design-tokens.css`.
- Không hardcode hex trong component.
- Không tạo radius/shadow mới tại page.
- Icon chỉ dùng một library hoặc bộ SVG nội bộ.
- Copy canonical ở i18n dictionary.

### 14.2 Component API tối thiểu

```
<Button variant size loading iconLeft iconRight>
<Card tone padding interactive>
<Chip tone icon dismissible>
<MealCard dish slot locked source confidence onSwap>
<ProvenanceChip coverage status sourceCount>
<QuantityStepper value unit min max step>
<EmptyState illustration title body action>
<RightRail mode>
<BottomSheet open title actions>
```

### 14.3 Review gate

Một màn hình chỉ pass khi:

- dùng 100% token
- đủ light/dark
- đủ mobile
- có loading/empty/error
- keyboard usable
- không dùng hơn 2 accent trong một card
- primary CTA duy nhất trong một vùng nhìn
- typography đúng role
- copy không phán xét
- dữ liệu nutrition có provenance state

---

## 15. Mock HTML trong gói này

Prototype `index.html` là SPA tĩnh minh họa:

- app shell desktop/mobile
- dashboard overview
- week planner
- shopping + inventory
- recipe library
- nutrition
- reports
- favorites
- notes
- settings
- dark mode
- responsive behavior
- interactive navigation
- grocery checkbox
- day selection
- toast, modal, quick-add

Đây là mock front-end, chưa kết nối database, AI hoặc nghiệp vụ thật.

---

## 16. Bàn giao cho Vibecode / Claude Code

### Phase UI-0 — Foundation

- import Inter
- install icon set
- implement tokens
- app shell
- Button/Card/Chip/Input/Modal/Sheet/Toast
- Storybook or internal showcase page

### Phase UI-1 — Core workflow

- Overview
- Week planner
- Swap dish sheet
- Shopping list
- Offline states

### Phase UI-2 — Library and nutrition

- Dish list/detail/fork/import
- Nutrition dashboard
- Provenance panels

### Phase UI-3 — Supporting modules

- Inventory
- Reports
- Favorites
- Notes
- Settings

### Phase UI-4 — Quality gate

- dark theme parity
- responsive screenshots
- keyboard and screen reader pass
- visual regression
- empty/error/loading coverage
- token audit

---

## 17. Quyết định đã khóa trong design v1

1. Inter duy nhất cho text và data.
2. Rose là brand, botanical là adequacy/success, honey là uncertainty.
3. Near-white ấm, không cream-paper.
4. Card radius tối đa 20px ở product UI.
5. Light/dark song song.
6. Mobile là cấu trúc riêng, không phải desktop thu nhỏ.
7. Nữ tính đến từ composition và tone, không đến từ trang trí dày.
8. Provenance là thành phần thị giác cốt lõi.
9. Mọi page đều nối vào workflow tuần → chợ → kho → nấu → dinh dưỡng.
10. B0/B1 được diễn giải bằng “Món mẫu / Nhà mình”.

---

*Q's Kitchen / Meal SOT — Design Blueprint v1.0*
