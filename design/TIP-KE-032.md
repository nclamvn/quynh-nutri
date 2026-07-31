# TIP-KE-032 – Độ bền lần đọc lạnh cho báo cáo vận hành

## HEADER

- TIP-ID: TIP-KE-032
- Project: Q's Kitchen / quynh-nutri
- Module: Operator activation reliability
- Depends on: TIP-KE-031, TIP-KE-031-PERF-01
- Priority: P0
- Working directory: `/Users/os/quynh-nutri`
- Status: APPROVED BY CONTINUATION MANDATE – handed to Builder on 2026-07-31

## CONTEXT

KE-031 đã vượt cổng TTFB trên replacement preview với p95 299 ms. Tuy nhiên,
lần đọc đầu trên Neon branch lạnh từng vượt trần interactive transaction 2,5
giây, khiến báo cáo trả trạng thái unavailable trước khi lần đọc tiếp theo
phục hồi.

Các câu lệnh PostgreSQL đã có `statement_timeout` 1,5 giây và query plan trên
fixture branch đạt dưới 10 ms. Lỗi phát sinh từ tổng thời gian của năm thao tác
tuần tự trong một transaction, không phải từ một câu lệnh chạy mất kiểm soát.

## OBJECTIVE

Giữ nguyên `ke031-v1`, nguồn dữ liệu, quyền operator và giao diện streaming,
nhưng cho transaction đủ ngân sách để Neon đánh thức compute và hoàn thành các
đọc bounded. Không thêm retry tự động, cache, bảng, migration hoặc dữ liệu suy
diễn.

## REQUIREMENTS

| ID | Requirement | Priority |
|---|---|---:|
| KE32-001 | Giữ `statement_timeout` 1,5 giây cho từng câu lệnh | P0 |
| KE32-002 | Tăng trần interactive transaction lên một hằng số tối đa 10 giây | P0 |
| KE32-003 | Giới hạn thời gian chờ lấy transaction slot ở 2 giây | P0 |
| KE32-004 | Không retry tự động sau lỗi database | P0 |
| KE32-005 | Không đổi query, giới hạn 100.000 sự kiện hoặc cửa sổ báo cáo | P0 |
| KE32-006 | Repository vẫn xác thực operator trước khi chạm database | P0 |
| KE32-007 | DTO và contract `ke031-v1` không đổi | P0 |
| KE32-008 | Thêm unit test kiểm chứng toàn bộ timeout boundary | P0 |
| KE32-009 | Chạy regression, security, E2E và stress gates | P0 |
| KE32-010 | Kiểm chứng preview trên Neon branch mới, không chạm main | P0 |
| KE32-011 | Preview phải render báo cáo thật sau lần đọc đầu và không có lỗi transaction expired | P0 |
| KE32-012 | Commit, push và deploy preview; production giữ nguyên | P0 |

## IMPLEMENTATION CONTRACT

Trong `src/data/repo/ops-metrics.ts`:

1. Tách ba timeout thành hằng số có tên rõ:
   - statement: 1.500 ms;
   - transaction max wait: 2.000 ms;
   - transaction lifetime: 10.000 ms.
2. Truyền `maxWait` và `timeout` cho interactive transaction.
3. Không thay đổi nội dung, thứ tự hoặc số lượng query.
4. Không thêm retry, cache hoặc fallback dữ liệu.

Trong unit test:

1. Giữ adapter E2E hiện tại.
2. Bổ sung đường production giả lập bằng transaction mock.
3. Chứng minh auth chạy trước database.
4. Chứng minh `set_config` giữ 1.500 ms và transaction nhận đúng
   `maxWait`/`timeout`.
5. Chứng minh DTO không chứa household ID.

## ACCEPTANCE CRITERIA

### AC-01 – Bounded cold-read budget

Given repository chạy ngoài E2E  
When operator hợp lệ đọc báo cáo  
Then mỗi statement có trần 1,5 giây, transaction chờ tối đa 2 giây và sống tối
đa 10 giây.

### AC-02 – No behavior expansion

Given KE-032 được triển khai  
When so sánh với `ke031-v1`  
Then event definitions, aggregate DTO, privacy suppression, auth, queries và UI
không đổi.

### AC-03 – Fail closed

Given operator không hợp lệ  
When gọi repository  
Then database không được truy cập.

### AC-04 – Real preview cold read

Given preview dùng Neon copy-on-write branch mới  
When operator xác thực mở cửa sổ 90 ngày lần đầu  
Then shell stream ngay, báo cáo aggregate thật hoàn tất và log không có
`expired transaction`.

### AC-05 – Quality gates

Given thay đổi hoàn tất  
When chạy quality gates  
Then typecheck, lint, unit, build, focused E2E, full E2E, security, marketing,
stress và production audit đều pass.

## CONSTRAINTS

- Không thêm bảng, migration, event hoặc dependency.
- Không chạm Neon main.
- Không cấu hình production `OPS_USER_IDS`.
- Không deploy production.
- Không cho AI tạo, sửa hoặc áp dụng công việc gia đình.
- Không thay đổi KE-017 hoặc bất kỳ mutation contract nào.
- Product copy không dùng em dash.

## DECISIONS LOG

- Blueprint checkpoint được gộp vào chỉ thị tiếp tục của Homeowner vì đây là
  REFINE bounded, không đổi kiến trúc hay business rule.
- Không retry vì retry che giấu lỗi và nhân tải lên database.
- Không tăng statement timeout; chỉ sửa ngân sách transaction đã được chứng
  minh quá ngắn so với chuỗi query hiện hữu.

## REPORT FORMAT

Tạo `design/COMPLETION-KE-032.md` và `design/VERIFY-KE-032.md` theo Vibecode Kit.
