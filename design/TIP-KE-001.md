# TIP-KE-001 — Chọn mua và bảo quản từ danh sách chợ

## Header

- Priority: P0
- Depends on: none
- Module: Kitchen Execution
- Working directory: `/Users/os/quynh-nutri`

## Requirements

| ID | Yêu cầu |
|---|---|
| KE-001 | Người dùng mở được hướng dẫn từ từng mặt hàng trong danh sách chợ. |
| KE-002 | Hướng dẫn tách rõ: nên chọn, nên tránh, mang về, bảo quản, sơ chế. |
| KE-003 | Nội dung hiển thị được nguồn và ngày rà soát. |
| KE-004 | Hướng dẫn cấp nhóm phải được ghi rõ, không giả là hướng dẫn đặc thù. |
| KE-005 | Nội dung an toàn có tiếng Việt và tiếng Anh. |
| KE-006 | Tác vụ đánh dấu đã mua vẫn hoạt động độc lập với việc mở hướng dẫn. |
| KE-007 | Resolver là domain thuần và có unit test cho fallback/provenance. |

## Acceptance criteria

- Given một mặt hàng tươi có hướng dẫn đặc thù, when người dùng chạm tên hàng,
  then Bottom Sheet hiển thị đủ năm nhóm nội dung và nguồn.
- Given một mặt hàng chỉ có hướng dẫn theo nhóm, when mở hướng dẫn, then UI ghi
  rõ “hướng dẫn chung cho nhóm”.
- Given người dùng bấm ô kiểm, when trạng thái thay đổi, then Bottom Sheet không
  bị mở ngoài ý muốn.
- Given registry có nguồn không phải HTTPS hoặc hướng dẫn thiếu nguồn, when chạy
  unit test, then test thất bại.

## Constraints

- Reuse `BottomSheet`, `useStore`, i18n và hệ thống token hiện có.
- Không thay schema hay persistence contract.
- Không suy diễn nội dung ngoài nguồn đã lưu.
- Giữ các thay đổi chưa commit hiện có của chủ dự án.
