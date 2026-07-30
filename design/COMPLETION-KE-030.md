# COMPLETION-KE-030 – Nhịp ăn cả ngày có nguồn sự thật

**STATUS:** BUILT AND LOCALLY VERIFIED – RELEASE NOT PERFORMED

## Scope delivered

KE-030 adds `breakfast`, `lunch`, `dinner`, and `snack` as a canonical
`MealOccasion` axis independent of the existing food-role `Slot`. Existing
plans and meal completions are mapped to dinner. Empty occasions remain empty.

- Week-plan identity is now day, occasion, and slot.
- Meal-run sessions, closeout, immutable completion, leftovers, feedback, and
  kitchen projections carry the selected occasion.
- Shopping and nutrition aggregate every explicitly planned occasion once.
- The generator and memory-guided proposals remain dinner-only and preserve
  breakfast, lunch, and snack exactly.
- Assistant reads are occasion-labelled and remain non-mutating.

## Product experience

- Week exposes four compact occasion selectors with honest empty states.
- Add, replace, and remove show an exact before-to-after diff. Cancel writes
  nothing; only `Xác nhận` applies the displayed change.
- `Đổi cả tuần` no longer mutates the plan directly. It opens the existing
  KE-017 proposal flow, pre-fills the request, shows dinner-labelled diff rows,
  and requires `Xác nhận áp dụng`.
- Overview adds a deterministic daily meal rhythm. An empty occasion is
  described as not planned, never skipped or completed.
- Nutrition explicitly says when the current view is not a complete-day
  assessment.
- Plan-changing controls are disabled while canonical synchronization is not
  complete.

## Persistence and migration

- Added Prisma `MealOccasion`, occasion columns, occasion-aware unique indexes,
  and meal completion indexes.
- Migration `20260731010000_meal_occasions` explicitly backfills legacy rows as
  dinner and rewrites only guarded legacy meal-run scope keys.
- `prisma.config.ts` now gives `MIGRATION_DATABASE_URL` highest precedence so a
  temporary migration target cannot be shadowed by `.env.local`.
- Temporary Neon branch `codex-ke030-verify-20260730`
  (`br-restless-pond-auoxu7xz`) accepted all ten migrations and expires
  automatically on 2026-07-31.

## Main-database exception

During the first temporary-branch verification, the previous Prisma config
selected `.env.local` `POSTGRES_URL_NON_POOLING` ahead of the shell
`DATABASE_URL`. As a result, the additive KE-030 migration was unintentionally
applied to Neon main before the separate release approval.

The incident was disclosed immediately. Read-only checks confirmed:

- the migration finished successfully;
- 175 existing day slots were retained and backfilled as dinner;
- no non-dinner or null legacy day slot was introduced;
- the empty meal-completion table remained empty;
- the live application remained compatible: `/` returned 200 and signed-out
  `/overview` returned the expected 307.

No destructive rollback was attempted. Application code was not committed,
pushed, or deployed.

## Quality evidence

- `npm test` – 61 files and 334 tests passed.
- `npm run lint` – passed.
- Typography policy – passed across 265 source files.
- `npx prisma validate` – passed.
- `npm run build` – Next.js 16.2.12 build passed; 74 routes generated.
- Full `E2E_PORT=43134 npx playwright test` – 79 tests passed.
- Onboarding – 1 test passed.
- Security readiness – 3 tests passed.
- Marketing readiness – 4 tests passed; mobile LCP 172 ms, CLS 0; desktop LCP
  216 ms, CLS 0.
- Stress readiness – 660 requests, 0 failures; average p95 28.4 ms, stress p95
  55.7 ms, spike p95 57.7 ms.
- Production dependency audit – 0 vulnerabilities.
- `git diff --check` – passed.

## Delivery boundary

The Builder has completed the approved implementation and evidence package.
No commit, push, Vercel deployment, or production release claim is included.
