# BLUEPRINT LANDING PAGE & ADN THIẾT KẾ TOÀN UI

**Sản phẩm:** Bữa cơm nhà / Quỳnh Nutri  
**Phiên bản:** UI Blueprint v1.0  
**Trạng thái:** FOUNDATION LOCKED  
**Đối tượng sử dụng:** Product Owner, UI/UX Designer, Frontend, QA, Content, AI Agent  
**Mục tiêu triển khai:** Next.js 16, React 19, Tailwind CSS 4, responsive PWA, light/dark mode

---

## 0. TUYÊN NGÔN KHÓA

Bữa cơm nhà không được thiết kế như một ứng dụng đếm calo, một dashboard y tế lạnh lẽo, một chatbot nấu ăn hay một landing page SaaS dùng lại template.

Sản phẩm phải tạo cảm giác đây là **một hệ điều hành nhỏ cho bữa cơm gia đình Việt**: ấm, gần gũi, có trí nhớ, có trật tự và trung thực với dữ liệu.

Toàn hệ thống dùng chung một ADN nhưng có hai cường độ biểu đạt:

- **Landing page:** giàu cảm xúc, giàu media, quy mô typography lớn, tạo khác biệt thương hiệu.
- **Ứng dụng:** bình tĩnh, rõ ràng, dễ thao tác hằng ngày, ưu tiên thông tin và nhiệm vụ.

Landing có thể giống một bìa tạp chí sống. Ứng dụng phải giống một căn bếp được tổ chức tốt. Hai phần không được biến thành hai thương hiệu khác nhau.

---

# PHẦN I — NỀN TẢNG SẢN PHẨM

## 1. Định vị

### 1.1 Sản phẩm là gì

Bữa cơm nhà giúp một gia đình:

- Lập kế hoạch ăn trong tuần dựa trên số người, nhịp sống và khẩu vị thực tế.
- Xoay món mà không làm mất tính nhất quán của thực đơn.
- Tính lại định lượng khi món ăn hoặc số người thay đổi.
- Gộp nguyên liệu thành danh sách đi chợ có thể thực hiện.
- Theo dõi dinh dưỡng mà không giả vờ mọi số liệu đều chính xác tuyệt đối.
- Tích lũy trí nhớ của riêng từng gia đình theo thời gian.

### 1.2 Sản phẩm không phải là gì

- Không phải ứng dụng giảm cân đại trà.
- Không phải công cụ ép người dùng đạt một chuẩn cơ thể duy nhất.
- Không phải kho công thức nấu ăn vô tận.
- Không phải chatbot trả lời mọi thứ bằng đoạn văn dài.
- Không phải giao diện “wellness” màu pastel vô nghĩa.
- Không dùng hình bát salad, quả bơ hoặc người mẫu phương Tây như hình ảnh mặc định của ăn uống lành mạnh.
- Không dùng từ “AI” để thay thế cho lợi ích thật của sản phẩm.

## 2. Lời hứa thương hiệu

> Một tuần ăn ngon, vừa sức và có căn cứ.

Ba lớp giá trị phải luôn hiện diện:

1. **Sống được:** kế hoạch phù hợp thời gian, công sức và bối cảnh gia đình.
2. **Nhớ được:** hệ thống học từ lựa chọn thật của nhà mình.
3. **Tin được:** số liệu tự khai mức độ chắc chắn và nguồn gốc.

## 3. Tính cách thương hiệu

| Trục | Phải có | Không được trở thành |
|---|---|---|
| Ấm áp | Gần gũi, có chất gia đình | Sến, ngọt quá mức |
| Cao cấp | Tinh tế, có chủ đích, nhiều khoảng thở | Xa cách, thời trang vô dụng |
| Khoa học | Có nguồn, có giới hạn, có cấu trúc | Lâm sàng, hù dọa |
| Việt Nam | Mâm cơm, chợ, nhịp sống thật | Minh họa dân gian rập khuôn |
| Thông minh | Thích nghi, nối dữ liệu, giảm thao tác | Khoe AI, nói như máy |
| Nữ tính | Mềm, duyên, có cảm xúc | Màu hồng phủ toàn bộ giao diện |

---

# PHẦN II — BLUEPRINT LANDING PAGE

## 4. Vai trò của landing page

Landing page không chỉ giới thiệu tính năng. Nó phải hoàn thành bốn nhiệm vụ theo đúng thứ tự:

1. **Tạo dừng:** khiến người xem dừng lại bằng media và hook đủ mạnh.
2. **Tạo nhận diện:** người xem hiểu ngay đây không phải app meal planner thông thường.
3. **Tạo niềm tin:** giải thích trí nhớ gia đình và nguyên tắc trung thực dữ liệu.
4. **Tạo hành động:** đưa người dùng vào đăng ký hoặc mở ứng dụng mà không gây áp lực bán hàng.

## 5. Cấu trúc landing đã khóa

Thứ tự section không được đổi tùy tiện:

1. Header trên nền hero
2. Hero media toàn màn hình
3. Ticker thương hiệu
4. Manifesto
5. Product stage
6. Household memory
7. Data truth / provenance
8. Brand quote
9. Final CTA
10. Footer

Mỗi section phải làm một nhiệm vụ riêng. Không chèn thêm các block “Features”, “Testimonials”, “FAQ” dạng card chỉ vì landing page khác thường có chúng.

---

## 6. Header

### Mục tiêu

Xác lập thương hiệu, cho phép điều hướng nhanh và đưa ra một CTA duy nhất.

### Bố cục desktop

- Cao khoảng 72–80 px.
- Nằm tuyệt đối trên hero.
- Trái: biểu tượng Q hoặc logo hoa + “Bữa cơm nhà”.
- Giữa: tối đa ba anchor link.
- Phải: CTA dạng capsule có viền mảnh.
- Khoảng cách biên ngang 32–40 px.

### Nội dung đề xuất

- Cách hoạt động
- Dữ liệu
- Đăng nhập
- CTA: “Bắt đầu một tuần”

### Quy tắc

- Không đặt hai nút CTA chính cạnh nhau.
- Không dùng header nền trắng ngay từ đầu.
- Không đặt menu hamburger trên desktop.
- Không thêm badge “Powered by AI”.
- Mobile chỉ giữ brand và CTA; navigation phụ đưa vào menu gọn khi thật sự cần.

---

## 7. Hero media

### Mục tiêu

Tạo khác biệt thương hiệu trong ba giây đầu và truyền đạt rằng sản phẩm xoay quanh đời sống gia đình thật.

### Kích thước

- Desktop: `min-height: 100svh`, tối thiểu khoảng 820 px.
- Mobile: tối thiểu khoảng 820–920 px để hình và chữ không tranh nhau.
- Media phủ toàn bộ viewport.

### Media

Ưu tiên theo thứ tự:

1. Video ngắn 8–15 giây, loop kín, không âm thanh, cảnh gia đình Việt chuẩn bị hoặc dùng bữa.
2. Ảnh thật gia đình Việt hoặc châu Á có bối cảnh gần Việt Nam.
3. Ảnh mâm cơm, căn bếp, bàn tay chuẩn bị món ăn.

Không dùng:

- Hình AI tạo sinh.
- Ảnh stock cười nhìn thẳng máy ảnh.
- Ảnh bàn ăn phương Tây không liên quan.
- Hình “healthy lifestyle” sáo mòn.
- Hình quá hoàn hảo, sạch như showroom.

### Xử lý hình

- Giảm saturation nhẹ, tăng contrast rất ít.
- Dùng overlay đen có hướng để chữ đọc rõ nhưng vẫn giữ texture ảnh.
- Không blur toàn ảnh.
- Crop phải giữ được người, bàn ăn hoặc hành động chính.
- Production phải lưu ảnh/video trong hệ thống hoặc CDN của dự án; không hotlink trực tiếp.
- Luôn lưu tác giả, URL nguồn và alt text.

### Hook đã khóa

**Mỗi bữa cơm đều có một lý do.**

Cấu trúc typography:

- Dòng mở có serif italic, mềm và nhỏ hơn.
- Từ khóa chính dùng Inter rất lớn, nặng, gần như poster.
- Cụm cuối dùng rose + serif italic để tạo nhịp cảm xúc.
- Không dùng gradient text.
- Không dùng nhiều hơn hai màu chữ trong hook.

### Supporting copy

> Một hệ thống lập bữa cho gia đình Việt, biết xoay món, cân lượng, gộp chợ và nói thật độ chắc của từng con số.

Copy tối đa ba dòng trên desktop, bốn đến năm dòng trên mobile.

### CTA

- Primary: “Lập tuần đầu tiên”
- Secondary: “Mở ứng dụng”

Primary dùng rose solid. Secondary là text link có underline tinh tế. Không dùng hai nút đặc ngang nhau.

### Micro-data

Hero được phép có một proof badge như “92% độ phủ dữ liệu” với điều kiện:

- Số phải lấy từ dữ liệu thật của trạng thái đang trình bày; hoặc
- Phải ghi rõ là “minh họa” nếu dùng demo.

Không được biến một con số giả thành bằng chứng marketing.

### Motion

- Media zoom rất chậm, biên độ 1.5–5% trong 15–20 giây.
- Một status dot được phép pulse nhẹ.
- Rail hoặc line scroll được phép animate.
- Không parallax mạnh.
- Không làm chữ bay vào từ nhiều hướng.
- Khi `prefers-reduced-motion`, toàn bộ loop phải dừng.

---

## 8. Ticker thương hiệu

### Mục tiêu

Chuyển nhịp từ hero sang nội dung và đóng bốn thông điệp sản phẩm.

### Nội dung

- Xoay món thông minh
- Định lượng có nguồn
- Đi chợ một lần, dùng cả tuần
- Không phán số chính xác giả

### Visual

- Nền rose toàn chiều ngang.
- Chữ uppercase nhỏ, tracking rộng.
- Dấu phân cách hình sao hoặc chấm, dùng lime signal ở mức rất tiết chế.
- Tốc độ 28–36 giây cho một vòng.

Không dùng marquee ở bất kỳ vị trí nào khác trên trang.

---

## 9. Manifesto

### Mục tiêu

Chuyển từ cảm xúc sang luận điểm sản phẩm.

### Copy chính

- Kicker: “Không phải thêm một app đếm calo.”
- Headline: “Chúng tôi thiết kế một tuần có thể sống được.”

### Bố cục

- Desktop dùng lưới bất đối xứng 25/75 hoặc 30/70.
- Số section nằm trái.
- Headline chiếm phần lớn chiều ngang.
- Đoạn giải thích thụt vào 20–30% để tạo nhịp editorial.
- Có thể dùng một seal tròn Q nhưng không biến thành logo thứ hai.

### Quy tắc

- Không thêm icon minh họa cho từng câu.
- Không biến manifesto thành ba card lợi ích.
- Không đặt background gradient.

---

## 10. Product stage

### Mục tiêu

Cho người xem thấy sản phẩm thật nhưng không rơi vào cách trình bày screenshot trong laptop mockup quen thuộc.

### Bố cục

- Nền warm stone trung tính.
- Một ảnh mâm cơm hoặc thao tác bếp đặt lệch trục và xoay 1–3 độ.
- Một interface frame của sản phẩm chồng lên ảnh.
- Copy mô tả nằm ở vùng trống thứ ba, không đóng trong card.
- Typographic watermark lớn phía nền được phép dùng nhưng opacity dưới 30%.

### Nội dung interface frame

- Tuần hoặc ngày đang chọn.
- Số người ăn.
- Ba đến năm món.
- Định lượng.
- Thời gian hoặc trạng thái chuẩn bị.
- Provenance / coverage.
- CTA mở danh sách chợ.

### Quy tắc

- Interface mock phải giống sản phẩm thật, không phải ảnh marketing giả.
- Không dùng browser chrome hoặc laptop frame.
- Không render giao diện quá nhỏ đến mức không đọc được.
- Không phủ glass trong suốt lên toàn bộ nội dung; nền phải đủ đục để đọc.

---

## 11. Household memory

### Mục tiêu

Trình bày điểm khác biệt lớn nhất: ứng dụng có trí nhớ của từng gia đình.

### Ba ý khóa

1. Nhớ khẩu vị.
2. Hiểu nhịp tuần.
3. Nói thật về dữ liệu.

### Bố cục

- Nền ink gần đen.
- Headline lớn bằng ivory và rose.
- Ba hàng full-width, mỗi hàng gồm số, tên, mô tả và arrow.
- Hover desktop đổi nền hàng sang rose; mobile không phụ thuộc hover.

### Quy tắc

- Không dùng ba card bo tròn ngang hàng.
- Nội dung phải nói hành vi cụ thể, không dùng các cụm “cá nhân hóa thông minh” chung chung.

---

## 12. Data truth / provenance

### Mục tiêu

Biến tính trung thực dữ liệu thành một lợi thế sản phẩm nhìn thấy được.

### Headline

**Con số nào cũng phải biết mình chắc đến đâu.**

### Ba cấp hiển thị

1. **Đã đối chiếu:** hiển thị số.
2. **Còn dao động:** hiển thị số neo trong khoảng.
3. **Chưa đủ chắc:** chỉ hiển thị khoảng hoặc honest null.

### Hợp đồng D3

- Coverage từ 85%: được phép hiển thị số cùng coverage.
- Coverage từ 60% đến dưới 85%: hiển thị giá trị neo trong khoảng.
- Coverage dưới 60%: không trình bày một con số đơn lẻ như sự thật.
- Thiếu dữ liệu dùng màu xám, không dùng đỏ.
- Màu đỏ chỉ dành cho nguy cơ, lỗi hoặc tình trạng cần hành động thật.

### Visual

- Nền ivory sáng.
- Ba cột lớn, đường chia mảnh.
- Typography của giá trị dùng serif hoặc số tabular lớn.
- Botanical green = corroborated.
- Honey = estimate/attention.
- Gray = missing/unknown.
- Rose không dùng để biểu thị chất lượng dữ liệu.

---

## 13. Brand quote

### Mục tiêu

Tạo một khoảng nghỉ cảm xúc trước CTA cuối.

### Quote

> Ăn ngon không bắt đầu từ ý chí. Nó bắt đầu từ một kế hoạch đủ thực tế để cả nhà cùng theo.

### Visual

- Nền rose.
- Quote serif italic rất lớn.
- Một dấu ngoặc kép khổng lồ ở nền, opacity thấp.
- Không thêm chân dung khách hàng giả hoặc logo báo chí giả.

---

## 14. Final CTA

### Mục tiêu

Đưa người dùng về câu hỏi đời thường và tạo hành động tự nhiên.

### Headline

**Tối nay ăn gì?**

### Visual

- Nền ink.
- Vòng halo hình học rất nhẹ, không dùng 3D blob.
- CTA rose dạng capsule lớn.
- Secondary link dưới hoặc cạnh CTA.

### Copy CTA

- “Để Bữa cơm nhà lên tuần đầu tiên”
- “Tôi đã có tài khoản”

---

## 15. Footer

Footer phải tối giản:

- Logo và một dòng mô tả.
- Copyright.
- Ba link chính.
- Credit media hoặc đường dẫn đến trang media credits.

Không đặt newsletter, sitemap dài hoặc mạng xã hội nếu chưa có kênh thật.

---

# PHẦN III — ADN THIẾT KẾ TOÀN UI

## 16. Bảy gene thiết kế

### Gene 1 — Editorial, không template

Dùng quy mô, khoảng thở, nhịp typography và bố cục bất đối xứng để tạo nhận diện. Không dùng card grid như cấu trúc mặc định cho mọi trang.

### Gene 2 — Warm utility

Ứng dụng phải ấm nhưng vẫn là công cụ. Sự thân thiện đến từ ngôn ngữ, media, khoảng cách và màu nền; không đến từ emoji hoặc minh họa hoạt hình ở mọi nơi.

### Gene 3 — Data tự khai độ chắc

Mọi số liệu dinh dưỡng quan trọng phải gắn với trạng thái provenance. Giao diện không được làm cho dữ liệu ước lượng trông chắc chắn ngang dữ liệu đã đối chiếu.

### Gene 4 — One color, one meaning

Một màu chỉ mang một nhóm ý nghĩa ổn định trong toàn hệ thống. Không dùng rose để vừa là CTA, vừa là thành công, vừa là cảnh báo.

### Gene 5 — Household first

Đơn vị trung tâm không phải “user” trừu tượng mà là “nhà mình”: thành viên, khẩu vị, lịch bận, món quen, nơi mua và ghi chú thật.

### Gene 6 — Quiet intelligence

Sự thông minh được thể hiện bằng kết quả nối liền và giảm thao tác, không bằng ngôn ngữ khoe mô hình AI hoặc hiệu ứng tương lai.

### Gene 7 — Motion có lý do

Chuyển động phải chỉ ra thay đổi trạng thái, quan hệ hoặc sự ưu tiên. Motion không được dùng để che một bố cục yếu.

---

## 17. Kiến trúc trải nghiệm

### Public layer

- `/` Landing page
- `/sign-in`
- `/sign-up`

### Product layer

- `/overview`
- `/week`
- `/shopping`
- `/dishes`
- `/nutrition`
- `/health`
- `/reports`
- `/favorites`
- `/notes`
- `/settings`

### Shell desktop

- Từ 1280 px: Sidebar 240 px hoặc collapsed 64 px + main + contextual right rail khoảng 288 px.
- Từ 1024 đến dưới 1280 px: Sidebar + main; ẩn right rail.
- Dưới 1024 px: Mobile top bar + main một cột + bottom navigation.

### Quy tắc shell

- Navigation là single source of truth.
- Right rail chỉ xuất hiện khi có nội dung ngữ cảnh thật.
- Không đặt cùng một thông tin ở cả page header và right rail.
- Assistant tồn tại dưới dạng sheet/contextual action, không phải chat bubble luôn nổi giữa màn hình.

---

## 18. Hệ màu

### 18.1 Brand và neutral

| Token | Light | Dark | Vai trò |
|---|---:|---:|---|
| `bg` | `#FFFDFC` | `#141216` | Canvas ứng dụng |
| `surface` | `#F6F1F2` | `#211E24` | Inset, group, row hover |
| `raised` | `#FFFFFF` | `#2A262F` | Card và sheet |
| `ink` | `#272327` | `#F4EFF2` | Nội dung chính |
| `muted` | `#6E686C` | `#C0B8BD` | Nội dung phụ |
| `tertiary` | `#989195` | `#8F878C` | Metadata |
| `hairline` | `#E2DADE` | `#3A343D` | Divider và viền |
| `brand` | `#EF5775` | `#FB758F` | CTA, active navigation, brand chrome |
| `brand-hover` | `#D93F60` | `#FF8CA2` | Hover/pressed |
| `brand-weak` | `#FFF4F6` | `#332027` | Selection background |

Landing được phép dùng các neutral đậm hơn:

- `landing-ink: #171214`
- `landing-paper: #F3EEE8`
- `landing-ivory: #FFFAF4`
- `landing-display-rose: #F35D7D`
- `landing-wine: #8C1F3B`

`landing-display-rose` chỉ dùng cho mảng lớn, typography hoặc background marketing. Controls trong app vẫn dùng `brand` chuẩn.

### 18.2 Màu semantic

| Token | Light | Dark | Ý nghĩa duy nhất |
|---|---:|---:|---|
| `accent` | `#469B75` | `#73C79D` | Corroborated, đủ, completed |
| `amber` | `#C58A21` | `#E6B75E` | Estimated, thiếu, cần chú ý |
| `danger` | `#C4485D` | `#F18194` | Nguy cơ thật, lỗi, destructive |
| `unknown` | `#989195` | `#8F878C` | Missing, null, chưa biết |
| `signal-lime` | `#C7FF62` | `#C7FF62` | Accent marketing nhỏ trên nền tối |

`signal-lime` không được dùng làm màu “success” trong ứng dụng vì sẽ phá semantic của botanical green.

---

## 19. Typography

### Font family

- **UI và body:** Inter Variable, có Vietnamese subset.
- **Display marketing và quote:** Lora Variable hoặc serif được phê duyệt có đủ dấu tiếng Việt; fallback Georgia.
- **Số liệu:** Inter với `font-variant-numeric: tabular-nums lining-nums`.
- Không dùng monospace cho số liệu chỉ để tạo cảm giác kỹ thuật.

### Cấp chữ landing

| Cấp | Desktop | Mobile | Dùng cho |
|---|---:|---:|---|
| Display XL | 112–160 px | 60–76 px | Hero hook |
| Display L | 72–120 px | 48–64 px | Manifesto, final CTA |
| Display M | 44–72 px | 36–48 px | Product stage, quote phụ |
| Lead | 18–22 px | 16–18 px | Supporting copy |
| Meta | 10–12 px | 10–11 px | Labels, captions |

### Cấp chữ ứng dụng

| Cấp | Kích thước | Line-height | Dùng cho |
|---|---:|---:|---|
| App H1 | 28–36 px | 1.08–1.2 | Tên trang |
| App H2 | 22–28 px | 1.2 | Section chính |
| App H3 | 16–20 px | 1.3 | Card/rail title |
| Body | 14–16 px | 1.5–1.65 | Nội dung |
| Small | 12–13 px | 1.45 | Secondary text |
| Meta | 10–11 px | 1.3 | Status, provenance label |

### Quy tắc

- Sentence case cho label và button.
- Uppercase chỉ dành cho metadata ngắn dưới 24 ký tự.
- Không dùng bold cho cả đoạn.
- Hero có thể tracking rất âm; body không thấp hơn `-0.01em`.
- Không dùng ba font family trong cùng một trang.

---

## 20. Grid, spacing và kích thước

### Grid

- Base grid: 8 px.
- Micro spacing: 4 px chỉ dùng trong icon, badge hoặc nhóm metadata.
- Landing desktop: 12 cột, outer margin 32–64 px, content tối đa khoảng 1500 px.
- App content:
  - Wide: tối đa 1152 px.
  - Full: tối đa 1280 px.
  - Narrow: tối đa 768 px.
  - Padding mobile 16 px; desktop 32 px.

### Khoảng cách chuẩn

`4, 8, 12, 16, 24, 32, 48, 64, 96, 128`

Không tạo spacing tùy hứng như 19, 27 hoặc 43 px trừ trường hợp optical adjustment đã được ghi chú.

### Radius hierarchy

| Token | Giá trị | Dùng cho |
|---|---:|---|
| `radius-sm` | 8 px | Input, icon button |
| `radius-md` | 12 px | Row, small panel |
| `radius-lg` | 16–18 px | Card |
| `radius-xl` | 24 px | Hero panel, sheet |
| `radius-pill` | 999 px | CTA, status chip, segmented control |

Pill không dùng cho mọi control. Card không mặc định bo 24–32 px.

---

## 21. Surface và elevation

### Quy tắc chung

- Canvas là lớp 0.
- Content group hoặc inset là lớp 1.
- Card/sheet là lớp 2.
- Floating action/modal là lớp 3.
- Một viewport không nên có quá hai cấp shadow cạnh tranh nhau.

### Glass

Glass chỉ dùng cho:

- Header hoặc badge trên ảnh.
- Floating chrome.
- Modal/sheet có nền phía sau phức tạp.
- CTA đặc biệt trên hero.

Glass không dùng làm nền mặc định cho card dữ liệu, list, form hoặc bảng. Những nội dung cần đọc lâu phải có nền đục từ 90–100%.

### Hover

- Card lift tối đa 2 px.
- Không scale card lên 1.05.
- Không dùng glow neon.
- Hover phải có focus state tương đương cho keyboard.

---

## 22. Iconography và illustration

- Dùng một hệ icon line thống nhất, ưu tiên Lucide-style.
- Stroke khoảng 1.75–2 px.
- Kích thước chuẩn 16, 18, 20, 24 px.
- Icon action phải có tooltip hoặc label khi chỉ hiển thị biểu tượng.
- Không dùng emoji làm icon chức năng cho lock, warning, reroll hoặc settings.
- Logo hoa/blossom chỉ xuất hiện ở brand zone, hero corner hoặc empty state quan trọng; không rải ở mọi card.
- Không dùng icon robot, sparkle hoặc magic wand để đại diện AI mặc định.

---

## 23. Component DNA

### 23.1 Page header

Mỗi trang có:

- Eyebrow hoặc context ngắn khi cần.
- H1.
- Một dòng mô tả trạng thái thật.
- Tối đa một primary action và một secondary action.

Page header không phải card mặc định. Hero panel chỉ dùng khi trang cần context mạnh như Overview hoặc Week.

### 23.2 Card

Card chỉ dùng khi nội dung cần biên riêng hoặc có thể tái sắp xếp độc lập.

Một card chuẩn gồm:

- Header ngắn.
- Body.
- Optional footer/action.

Không bọc mọi hàng dữ liệu trong card. Dùng divider và list row khi các item thuộc cùng một tập.

### 23.3 Row

Row là primitive quan trọng nhất của app:

- Chiều cao 48–72 px tùy density.
- Có vùng media/icon, title, metadata, trailing action.
- Hover dùng surface tint.
- Không shadow.

### 23.4 Status chip

- Cao 22–28 px.
- Padding ngang 8–10 px.
- Không viết toàn uppercase nếu có từ tiếng Việt dài.
- Màu theo semantic, không theo sở thích từng trang.

### 23.5 Provenance chip

Provenance chip là signature component của sản phẩm.

Phải hỗ trợ:

- Corroborated.
- Anchored range.
- Estimated.
- Honest null.
- Coverage có thể bật/tắt.
- Tooltip hoặc sheet giải thích nguồn.

Không dùng rose trong provenance chip.

### 23.6 Adequacy strip

- Là dải thông tin, không phải progress bar gamification.
- Không dùng nhãn “tốt/xấu” cho người dùng.
- Dùng “đủ”, “thiếu”, “chưa có dữ liệu”.
- Thiếu dữ liệu không được render giống cảnh báo sức khỏe.

### 23.7 Bottom sheet và assistant sheet

- Mobile dùng bottom sheet cho chọn món, lọc và contextual assistant.
- Desktop dùng side sheet hoặc modal tùy độ phức tạp.
- Sheet phải giữ nguyên context của trang phía sau.
- Assistant luôn hiển thị đây là “gợi ý”, không tự biến đổi dữ liệu mà không có xác nhận.

### 23.8 Form

- Label nằm trên control.
- Helper text rõ ràng.
- Input cao tối thiểu 44 px.
- Validation xuất hiện gần trường lỗi.
- Form dài chia theo section bằng heading và divider, không bắt buộc dùng card.

---

## 24. Blueprint từng khu vực ứng dụng

### 24.1 Overview

**Vai trò:** tóm tắt “nhà mình hôm nay”.

Cấu trúc:

1. Hero trạng thái bữa tối hoặc ngày hiện tại.
2. Các việc cần làm.
3. Preview tuần.
4. Dinh dưỡng có provenance.
5. Notes hoặc thay đổi gần nhất.
6. Right rail: bữa hôm nay, nước nếu có dữ liệu thật, ghi chú nhanh.

Không biến Overview thành lưới KPI doanh nghiệp.

### 24.2 Week

**Vai trò:** planning canvas trung tâm.

- Desktop hiển thị 3–4 ngày mỗi hàng hoặc chế độ tuần rộng khi đủ chỗ.
- Mobile dùng một ngày active + horizontal day selector, không ép bảy card dài liên tiếp nếu thao tác khó.
- Mỗi ngày có món theo slot, lock, đổi món, quick status, pregnancy/health warning khi có căn cứ.
- Slot được phân biệt bằng stripe nhỏ hoặc label; không tô cả card theo màu slot.
- Primary action: tạo lại phần chưa khóa.
- Secondary: mở danh sách chợ.

### 24.3 Shopping

**Vai trò:** hoàn thành nhiệm vụ ngoài đời.

- Group theo vendor hoặc khu vực mua.
- Checkbox lớn, vùng chạm tối thiểu 44 px.
- Hiển thị purchased gross quantity, không nhập nhằng với edible quantity.
- Sticky summary trên mobile.
- Share/export là action thật, không đặt trong menu sâu.
- Right rail: số item còn lại và tiến độ.

### 24.4 Dishes

**Vai trò:** thư viện món của nhà mình.

- Media-led nhưng không giống Pinterest.
- Kết hợp list và grid theo viewport.
- Ảnh món tỷ lệ ổn định 4:3 hoặc 1:1.
- Filter theo slot, thời gian, yêu thích, nguồn, phù hợp sức khỏe.
- Món hệ thống và món gia đình phải phân biệt bằng label tinh tế.
- Detail page ưu tiên ingredient, portion, provenance và lịch sử dùng.

### 24.5 Nutrition

**Vai trò:** giải thích chứ không phán xét.

- Data-first, ít ảnh.
- Biểu đồ phải có legend và trạng thái provenance.
- Hiển thị nhu cầu so với kế hoạch bằng ngôn ngữ đủ/thiếu.
- Không dùng vòng tròn completion kiểu fitness app cho mọi chỉ số.
- Right rail giữ provenance legend.
- Chart colors cố định theo nutrient group.

### 24.6 Health

**Vai trò:** điều kiện ăn uống đặc biệt và cảnh báo có trách nhiệm.

- Tone bình tĩnh, không gây sợ hãi.
- Cảnh báo phân cấp: thông tin, cần chú ý, tránh hoặc tham vấn chuyên môn.
- Màu đỏ chỉ dùng khi thật sự có nguy cơ.
- Luôn cho biết cảnh báo áp dụng cho thành viên nào.
- Không dùng copy chẩn đoán bệnh.

### 24.7 Reports

**Vai trò:** nhìn lại xu hướng và tạo tài liệu chia sẻ.

- Narrative report thay cho dashboard dày KPI.
- Section rõ ràng, có ngày và phạm vi dữ liệu.
- Mọi biểu đồ ghi coverage hoặc limitation.
- Có print/export layout sạch.

### 24.8 Favorites

**Vai trò:** truy cập nhanh món đã được gia đình xác nhận.

- Ưu tiên ảnh món và lần dùng gần nhất.
- Có filter theo thành viên hoặc meal slot.
- Empty state giải thích cách thêm yêu thích.

### 24.9 Notes

**Vai trò:** trí nhớ không cấu trúc của gia đình.

- Giao diện gần notebook, không trang trí quá mức.
- Tìm kiếm, tag và liên kết món/ngày khi có.
- Quick add luôn dễ thấy.

### 24.10 Settings

**Vai trò:** cấu hình hộ gia đình và hệ thống.

- Dùng form section và divider.
- Nhóm: gia đình, khẩu phần, sức khỏe, ngôn ngữ, theme, dữ liệu, tài khoản.
- Destructive action tách riêng cuối trang.
- Không dùng card cho từng toggle.

---

## 25. Media DNA

### Chủ đề ưu tiên

- Gia đình Việt ăn cơm.
- Người chuẩn bị món trong căn bếp thật.
- Mâm cơm Việt nhìn từ góc người dùng.
- Chợ truyền thống hoặc siêu thị Việt Nam.
- Rau, thịt, gia vị quen thuộc.
- Bàn tay, thao tác, hơi nước, bề mặt vật liệu.

### Chất ảnh

- Ánh sáng tự nhiên hoặc warm practical light.
- Có texture, không quá sạch.
- Màu trung tính, hơi trầm.
- Người trong ảnh không cần nhìn máy ảnh.
- Ưu tiên khoảnh khắc hơn tạo dáng.

### Tỷ lệ

- Hero: 16:9 đến 21:9 hoặc video cover.
- Feature/editorial: 4:5, 3:4.
- Dish thumb: 1:1 hoặc 4:3.
- Report/empty state: hạn chế dùng ảnh nếu không tăng hiểu biết.

### Bản quyền và credit

- Chỉ dùng media có quyền sử dụng rõ ràng.
- Unsplash được dùng theo license của nền tảng, không gọi là “không còn bản quyền”.
- Lưu `author`, `sourceUrl`, `assetUrl`, `alt`, `cropFocus` trong media manifest.
- Production ưu tiên tải về và tối ưu, không hotlink.

---

## 26. Motion DNA

### Timing app

- Instant: 90 ms.
- Fast: 160 ms.
- Normal: 240 ms.
- Slow: 360 ms.
- Easing chuẩn: `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Easing nhấn mạnh: `cubic-bezier(0.16, 1, 0.3, 1)`.

### Timing landing

- Reveal: 500–800 ms.
- Media drift: 15–20 giây.
- Ticker: 28–36 giây.
- Không dùng spring/bounce.

### Quy tắc

- Motion vào trang tối đa một sequence chính.
- List stagger dưới 40 ms mỗi item và không quá tám item.
- Không animate số liệu từ 0 nếu người dùng cần đọc ngay.
- Khi đổi món, chỉ animate khu vực bị thay đổi.
- Tôn trọng `prefers-reduced-motion`.

---

## 27. Voice và microcopy

### Giọng nói

- Tự nhiên, bình tĩnh, gần người Việt.
- Nói cụ thể, tránh khẩu hiệu rỗng.
- Không nói như chuyên gia đang phán xét gia đình.
- Không dùng quá nhiều dấu chấm than.
- Dùng “nhà mình” ở nơi tạo sự gần gũi; dùng “gia đình” ở phần cấu hình chính thức.

### Tốt

- “Tuần này có hai ngày bận. Kế hoạch ưu tiên món nhanh.”
- “Số này dựa trên 72% khối lượng nguyên liệu đã được đối chiếu.”
- “Chưa đủ dữ liệu để đưa ra một con số đáng tin.”
- “Đổi món này sẽ cập nhật lại danh sách chợ.”

### Không tốt

- “AI đã tối ưu thực đơn hoàn hảo cho bạn!”
- “Bạn đã ăn không lành mạnh.”
- “100% chính xác.”
- “Hãy đạt mục tiêu ngay hôm nay!”

### Button

Button phải bắt đầu bằng động từ rõ ràng:

- Lập tuần
- Đổi món
- Khóa món
- Xem danh sách chợ
- Đánh dấu đã mua
- Lưu thay đổi
- Xem nguồn

Tránh button mơ hồ như “Tiếp tục”, “Khám phá”, “Bắt đầu ngay” khi không rõ hành động.

---

## 28. AI trong giao diện

AI là cơ chế phía sau, không phải art direction.

### Quy tắc

- Không dùng nền tím-xanh, sparkle, robot hoặc hologram để báo có AI.
- AI suggestion dùng label “Gợi ý” hoặc “Đề xuất”, không dùng “Thông minh”.
- Mọi đề xuất ảnh hưởng kế hoạch phải cho người dùng xem thay đổi trước khi áp dụng.
- Gợi ý phải kèm lý do ngắn: thời gian, khẩu vị, nguyên liệu hoặc sức khỏe.
- Nội dung do AI trích xuất phải có trạng thái xác nhận.
- Assistant không được tự xóa, thay toàn tuần hoặc gửi đơn hàng mà thiếu xác nhận.
- Khi AI không chắc, giao diện phải cho phép nói “chưa xác định”.

---

## 29. Accessibility

- Text và control đạt tương phản WCAG AA.
- Focus ring luôn nhìn thấy.
- Tất cả action dùng được bằng keyboard.
- Touch target tối thiểu 44 × 44 px.
- Không truyền nghĩa chỉ bằng màu.
- Provenance có text/tooltip bên cạnh màu.
- Ảnh có alt text theo chức năng, không mô tả thừa.
- Video hero có poster, muted, không âm thanh tự động.
- Modal và sheet phải quản lý focus và đóng bằng Escape.
- Chart có summary dạng text.
- Dark mode không giảm độ đọc của muted text dưới mức cần thiết.

---

## 30. Responsive contract

### 1440 px trở lên

- Full shell ba cột.
- Landing dùng typography cực lớn và bố cục bất đối xứng đầy đủ.
- Right rail hoạt động.

### 1024–1439 px

- Sidebar + main.
- Right rail ẩn.
- Landing giảm lệch trục và scale chữ nhưng không biến thành card stack.

### 768–1023 px

- Mobile/tablet shell một cột.
- Bottom navigation.
- Product stage vẫn giữ chồng lớp nhưng giảm xoay.

### Dưới 768 px

- Một cột.
- Hero copy chuyển xuống vùng tối phía dưới ảnh.
- CTA primary full-width khi cần.
- Các section list thay cho grid ba cột.
- Không dùng horizontal overflow ngoài các control có chủ đích.
- Bottom sheet là pattern chính cho lựa chọn.

### Width kiểm thử bắt buộc

`390, 768, 1024, 1280, 1440 px`

---

## 31. Dark mode

- Dark mode là theme đầy đủ, không chỉ đảo màu.
- Surface phải phân biệt rõ với canvas.
- Shadow tối hơn, không dùng viền sáng dày.
- Brand rose sáng hơn một bậc.
- Botanical, honey và danger cần giữ semantic và đủ tương phản.
- Ảnh không tự động invert.
- Chart không được phụ thuộc vào saturation quá thấp.
- Landing giữ art direction section-by-section; không bắt buộc có một bản đảo màu hoàn toàn riêng vì bản gốc đã dùng cả section sáng và tối.

---

## 32. Quy tắc chống AI slop

Một màn hình bị xem là lệch ADN nếu có từ ba dấu hiệu sau:

- Gradient tím, xanh dương hoặc teal không có lý do semantic.
- Hero có blob 3D, orb hoặc lưới hologram chung chung.
- Mọi section đều là card bo tròn giống nhau.
- Icon nằm trong ô vuông gradient cho từng feature.
- Copy dùng “revolutionize”, “unlock”, “powered by AI”, “seamless”.
- Dashboard có nhiều KPI không giúp quyết định.
- Nút dùng gradient bóng.
- Glassmorphism phủ lên nội dung đọc dài.
- Hình stock phương Tây không liên quan bữa cơm Việt.
- Hàng loạt animation bay, glow hoặc bounce.
- Mọi khoảng trống đều bị lấp bằng decoration.

---

# PHẦN IV — HỢP ĐỒNG TRIỂN KHAI

## 33. Token governance

- Toàn bộ màu phải đi qua CSS variables hoặc Tailwind semantic tokens.
- Không dùng hex trực tiếp trong component, trừ media overlay đã được duyệt.
- Không tạo tên token theo màu vật lý như `pinkButton`; dùng tên vai trò như `brand`, `danger`, `estimated`.
- Component không được tự định nghĩa shadow và radius mới nếu primitive đã có.
- Chart color nằm trong một nguồn duy nhất.

## 34. Cấu trúc component đề xuất

```text
src/ui/
  foundations/
    tokens.css
    typography.css
    motion.css
  primitives/
    Button
    IconButton
    Input
    Select
    Checkbox
    Chip
    Divider
    Surface
  patterns/
    PageHeader
    HeroPanel
    DataRow
    MediaRow
    ProvenanceChip
    AdequacyStrip
    MealCard
    DayCard
    EmptyState
    BottomSheet
    SideSheet
  shell/
    AppShell
    Sidebar
    MobileTopBar
    BottomNav
    RightRail
    AssistantSheet
  marketing/
    LandingHero
    Ticker
    Manifesto
    ProductStage
    MemoryRows
    DataTruth
    FinalCTA
```

Tên folder có thể thích nghi với code hiện tại, nhưng ranh giới foundations, primitives, patterns, shell và marketing phải được giữ.

## 35. Gate nghiệm thu

### G0 — Structure

- Đúng thứ tự landing đã khóa.
- Route app giữ nguyên.
- Navigation desktop và mobile không drift.

### G1 — Visual DNA

- Không có AI slop pattern.
- Landing giữ editorial hierarchy.
- App giữ warm utility.
- Màu semantic không bị trộn.

### G2 — Data honesty

- Provenance xuất hiện ở số liệu cần thiết.
- Ngưỡng D3 hiển thị đúng.
- Missing data không bị tô đỏ.
- Demo data được ghi rõ.

### G3 — Responsive

- Pass tại 390, 768, 1024, 1280 và 1440 px.
- Không overflow ngoài chủ đích.
- Touch target đạt tối thiểu.

### G4 — Accessibility

- Keyboard, focus, contrast, alt text và reduced motion pass.
- Sheet/modal quản lý focus đúng.

### G5 — Performance

- Hero có responsive source và poster.
- Ảnh dưới fold lazy-load.
- Font được subset và preload hợp lý.
- Không hotlink media production.
- Không có layout shift đáng kể do ảnh hoặc font.

### G6 — Consistency

- Không có local token lạ.
- Không có component gần giống nhau nhưng khác tên.
- Không có hơn hai primary CTA trong một viewport.
- Không có card chỉ để tạo khoảng cách.

---

## 36. Checklist trước khi merge một màn hình mới

1. Màn hình này giúp người dùng quyết định hoặc hoàn thành việc gì?
2. Primary object của trang là gì?
3. Có cần card thật không, hay row/divider là đủ?
4. Có số liệu nào cần provenance?
5. Màu đang dùng có đúng semantic không?
6. Mobile có thao tác được bằng một tay không?
7. Empty, loading, error và partial-data state đã có chưa?
8. Copy có nói quá khả năng dữ liệu hoặc AI không?
9. Motion có mang thông tin không?
10. Màn hình có còn nhận ra là Bữa cơm nhà khi bỏ logo không?

Nếu câu 10 là “không”, màn hình chưa đạt ADN.

---

# PHẦN V — QUYẾT ĐỊNH ĐÃ KHÓA

1. Landing page giữ khung editorial media-led đã duyệt.
2. Không quay lại landing dạng SaaS card grid.
3. Ảnh phải là media thật, có quyền sử dụng rõ ràng, ưu tiên Việt Nam.
4. Inter là font UI chính.
5. Serif chỉ dùng cho display marketing, quote và điểm nhấn có kiểm soát.
6. Rose chỉ là brand/CTA, không phải màu semantic dữ liệu.
7. Botanical green = corroborated/đủ/completed.
8. Honey = estimate/thiếu/cần chú ý.
9. Missing data = gray, không phải danger.
10. Provenance chip là signature component toàn sản phẩm.
11. AI không quyết định art direction và không được đặt ở trung tâm trải nghiệm.
12. Desktop shell giữ sidebar + main + contextual right rail; mobile giữ top bar + bottom navigation.
13. Glass chỉ dùng cho floating layer hoặc overlay media.
14. Card không phải primitive mặc định của mọi nội dung.
15. Mỗi màn hình phải giữ được đồng thời ba phẩm chất: **ấm, rõ và đáng tin**.

---

## Câu khóa cuối

> Landing khiến người dùng muốn bước vào. Ứng dụng khiến họ muốn quay lại mỗi ngày. Dữ liệu khiến họ có lý do để tin.
