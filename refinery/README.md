# Refinery — AI làm giàu SOT (Phase C)

Pipeline dùng AI **tăng tốc** việc mở rộng kho món, nhưng **giữ nguyên DNA honesty**: số dinh
dưỡng không do LLM bịa — mọi con số vẫn tính từ engine + commodity qua D3. AI chỉ *đề xuất
cấu trúc món* (tên, slot, đạm, cách nấu, nguyên liệu + định lượng), việc còn lại là máy tính số
thật và con người duyệt.

## Vòng lặp

```
1. SINH     npx tsx scripts/refine-dishes.mjs [N]
   → AI (claude-sonnet-4.6) sinh N món cơm nhà, ưu tiên DÙNG LẠI commodity đang có.
   → validate: map nguyên liệu → commodityId thật, tính COVERAGE = %khối-lượng phủ bởi
     commodity 'corroborated'. D3: ≥85% number · ≥60% anchored · <60% range.
   → REVIEW.md: bảng coverage + cờ. Món dựa commodity 'disputed' bị cờ "cần nguồn thứ 2".

2. DUYỆT    (người) mở refinery/approved.txt, bỏ dấu # trước tên món chấp nhận.

3. MERGE    npx tsx scripts/refine-merge.mjs
   → chuyển món đã duyệt thành lệnh dish(...) (refinery/approved-dishes.ts) để DÁN tay vào
     src/data/seed/repertoire.ts. Món có nguyên liệu chưa có trong SOT bị TỪ CHỐI (phải
     sourcing commodity trước — không bịa số).
```

## Bất biến honesty (giữ xuyên suốt)

- **AI không tạo số dinh dưỡng.** Coverage/kcal tính từ commodity thật; món phủ bởi commodity
  `disputed` hiện **KHOẢNG** ("ước lượng"), không hiện số điểm.
- **Số chỉ lên `corroborated` khi ≥2 nguồn khớp.** Refinery chỉ *phát hiện* món cần đối chiếu
  (cờ "cần nguồn thứ 2"); việc nâng `disputed→corroborated` là bước sourcing riêng, có người.
- **Không auto-insert.** Máy sinh + tính; người duyệt (approved.txt) + review TS trước khi commit.
- **Từ chối trung thực.** Commodity mới ngoài SOT không được đoán macro — món bị chặn tới khi
  có dữ liệu commodity.

Các file dữ liệu sinh ra (`candidates-*.json`, `REVIEW.md`, `approved*.txt/.ts`) là artifact
tái tạo được nên không commit — chỉ commit script + README này.
