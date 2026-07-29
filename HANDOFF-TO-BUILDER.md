# HANDOFF SAU TRIỂN KHAI — Quỳnh Nutri

Ngày đóng gói: 2026-07-29
TIP mới nhất đã hoàn tất: `design/TIP-KE-007.md`
Completion report: `design/COMPLETION-KE-007.md`
Contractor verify: `design/VERIFY-KE-007.md`
Gói lệnh tiếp theo: `design/TIP-KE-008.md`
Lệnh bàn giao tiếp theo: `design/HANDOVER-KE-008.md`

## Bắt đầu kiểm tra

1. Giải nén project.
2. Đọc `AGENTS.md`, `design/TIP-KE-007.md`,
   `design/COMPLETION-KE-007.md` và `design/VERIFY-KE-007.md`.
3. Chạy `npm ci`.
4. Nhận secrets/env qua kênh riêng từ Chủ nhà. ZIP này cố ý không chứa `.env.local`.
5. Chạy verify:

```bash
npx prisma generate
npm run lint
npx tsc --noEmit
npm test
npm run build
npm run test:e2e
```

6. Review migration; không chạy production khi chưa có duyệt và backup.
7. Không reset hoặc bỏ các thay đổi có sẵn trong working tree.

## Trạng thái tại thời điểm đóng gói

- Next.js 16.2.12, React 19.2.8, TypeScript, Prisma 7, Clerk, Neon.
- TIP-KE-001 đến TIP-KE-007 đã hoàn tất và được nghiệm thu.
- TIP-KE-008 đã được Chủ thầu lập lệnh, chưa triển khai.
- Unit/repository: 231/231 pass, 35 test files.
- E2E: 35/35 pass.
- ESLint/TypeScript/build: pass.
- Prisma migrations KE-002/003/006 đã sinh nhưng chưa apply local/production.

## Điều quan trọng

- Working tree trong ZIP là nguồn bàn giao hoàn chỉnh.
- ZIP không chứa lịch sử Git.
- Không chứa `node_modules`, `.next`, `.env*`, Vercel metadata hoặc test output
  tạm (`test-results`, `playwright-report`); ảnh QA đã duyệt trong
  `e2e/__screens__` được giữ làm bằng chứng.
- Không tự chạy migration production.
- Mọi mutation phải auth fail-closed, scope household và có adapter E2E hermetic.
- KE-008 chỉ thêm hướng dẫn chuẩn bị trước cho 12 món đã rà soát; không schema,
  done state, inventory mutation hoặc bước do AI sinh.
