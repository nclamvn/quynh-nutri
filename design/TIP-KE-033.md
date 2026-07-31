# TIP-KE-033 – Phát hành production KE-031/032

## HEADER

- TIP-ID: TIP-KE-033
- Project: Q's Kitchen / quynh-nutri
- Module: Production release and operator activation
- Depends on: TIP-KE-031, TIP-KE-031-PERF-01, TIP-KE-032
- Priority: P0
- Working directory: `/Users/os/quynh-nutri`
- Status: APPROVED BY HOMEOWNER – production release authorized 2026-07-31

## OBJECTIVE

Phát hành chuỗi KE-031/032 đã nghiệm thu lên `anngon.io`, cấu hình production
operator allowlist theo đúng Clerk identity của Homeowner và xác minh các alias
production. Đây là gói release, không phải gói feature.

## RELEASE INPUT

- Source branch trước release: `codex/ke-032-preview`.
- Last verified source commit: `049efc5`.
- Runtime implementation commit: `93634d8`.
- Verified preview: `dpl_5WTHWvvA3yLyYKdP3HaJhSRutDqh`.
- Current production rollback deployment:
  `dpl_CC7ZRVqroqP5RvoxxXL4vxixsT4U`.
- Neon migration required: none.
- Neon main write required: none.

## REQUIREMENTS

| ID | Requirement | Priority |
|---|---|---:|
| KE33-001 | Preserve all KE-017 confirmation boundaries and non-mutating AI rules | P0 |
| KE33-002 | Add no feature, schema, migration, dependency or ProductEvent | P0 |
| KE33-003 | Configure production `OPS_USER_IDS` with exactly one current Clerk/Homeowner ID | P0 |
| KE33-004 | Derive the allowlist without committing or printing personal identifiers | P0 |
| KE33-005 | Keep operator authorization fail-closed and server-only | P0 |
| KE33-006 | Use existing production Neon and Clerk variables, never preview overrides | P0 |
| KE33-007 | Run final build, lint, tests, security, marketing, stress and audit gates | P0 |
| KE33-008 | Commit and push the release source before production deployment | P0 |
| KE33-009 | Deploy the verified source to Vercel production in `iad1` | P0 |
| KE33-010 | Confirm `anngon.io`, `www.anngon.io` and `quynh-nutri.vercel.app` point to the new READY deployment | P0 |
| KE33-011 | Smoke public landing, canonical redirect, authenticated-family redirect and operator route | P0 |
| KE33-012 | Authenticate the operator route and confirm aggregate-only main data renders | P0 |
| KE33-013 | Check production error logs after smoke and retain the old deployment as rollback evidence | P0 |
| KE33-014 | Fast-forward GitHub main only after production verification | P0 |
| KE33-015 | Close Completion and Verify artifacts with exact deployment evidence | P0 |

## RELEASE PROCEDURE

1. Verify the worktree and source ancestry.
2. Resolve the single operator identity by intersecting Clerk users with
   non-null main Household owners.
3. Add `OPS_USER_IDS` to Vercel Production only.
4. Run final local release gates.
5. Commit and push the KE-033 release source.
6. Deploy with `vercel deploy --prod --regions iad1` and no database override.
7. Inspect Vercel until the deployment is READY and production aliases attach.
8. Run signed-out and authenticated smoke checks.
9. Check error logs.
10. Write Completion and Verify, commit with `[skip ci]`, fast-forward and push
    `main`.

## ACCEPTANCE CRITERIA

### AC-01 – Production environment

Given existing production variables  
When KE-033 configures operator access  
Then exactly one server-only `OPS_USER_IDS` value is present in Production and
no identifier appears in Git or release output.

### AC-02 – Production deployment

Given release gates pass  
When the verified source is deployed  
Then Vercel returns READY and all three production aliases point to that exact
deployment.

### AC-03 – Public and family smoke

Given the new production deployment  
When requesting `/`, `www`, and signed-out family routes  
Then landing returns 200, `www` redirects canonically and protected routes
redirect to same-origin Clerk sign-in.

### AC-04 – Operator smoke

Given the Homeowner signs in  
When opening `/ops/activation?window=90`  
Then aggregate-only main data renders, the `ke031-v1` contract remains visible
and no unavailable state or household identifier is exposed.

### AC-05 – Release safety

Given smoke testing completes  
When reviewing logs and database boundaries  
Then no production runtime error appears, Neon main has no write and the prior
production deployment remains documented for rollback.

### AC-06 – Source alignment

Given production is verified  
When the release closes  
Then the release branch and GitHub `main` contain the exact released code and
auditable Completion/Verify artifacts.

## CONSTRAINTS

- Không sửa sản phẩm trong release TIP.
- Không dùng temporary Neon branch cho production.
- Không in Clerk user ID, email, secret hoặc connection string.
- Không tạo task, trạng thái done hoặc dữ liệu gia đình.
- Không cho AI tự áp dụng đề xuất.
- Không dùng em dash trong product copy.

## DECISIONS LOG

- Homeowner đã trực tiếp cấp quyền production bằng yêu cầu cập nhật
  `anngon.io`; không cần checkpoint bổ sung.
- Release dùng Vercel production variables hiện có. Chỉ thêm allowlist còn
  thiếu.
- GitHub main chỉ được fast-forward sau smoke để không biến Git thành tuyên bố
  release trước khi website thật sự READY.

## REPORT FORMAT

Tạo `design/COMPLETION-KE-033.md` và `design/VERIFY-KE-033.md`.
