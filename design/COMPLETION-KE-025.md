# COMPLETION REPORT – TIP-KE-025

**STATUS:** DONE

## OUTCOME

Q's Kitchen now records a privacy-minimal, first-party lifecycle funnel for the
canonical household food loop. Events are append-only observations, never
tasks, completion state or a second source of product truth.

## FILES CHANGED

### Created

- `src/domain/product-events.ts`
- `src/domain/product-events.test.ts`
- `src/data/repo/product-events.ts`
- `src/data/repo/product-events.test.ts`
- `scripts/product-funnel.mjs`
- `prisma/migrations/20260730180000_product_events/migration.sql`

### Modified

- `prisma/schema.prisma`
- `src/app/actions.ts`
- `src/lib/assistant/week-plan-proposal.ts`
- `package.json`

## IMPLEMENTED CONTRACT

- Seven allowlisted lifecycle events.
- Per-event strict properties with bounded numbers, booleans and enums only.
- Server-resolved household ownership.
- Per-household idempotency keys.
- Best-effort measurement for canonical mutations so analytics failure cannot
  turn a successful user action into a false failure.
- Atomic onboarding completion event inside the onboarding transaction.
- Aggregate-only 28-day funnel command through `npm run metrics:activation`.

## TEST RESULTS

- Acceptance criteria: 7/7 passed.
- Product event privacy and validation: passed.
- E2E repository deduplication and Neon isolation: passed.
- Existing KE-017 confirmed-diff scenarios: 3/3 passed.
- Canonical shopping, cooking, meal and leftover scenarios: passed in the full
  regression suite.

## DATABASE

- A fresh Neon branch was created from `main`.
- The exact committed migration was applied successfully on the branch.
- Branch verification found one table and four indexes including the primary
  key.
- The same migration was applied to Neon `main`.
- Prisma read-only diff after apply: `No difference detected`.
- The temporary verification branch was removed after successful main
  verification; it contained no unique production work.

## ISSUES

- Current aggregate counts are zero because events begin at this release. No
  historic behavior was inferred or backfilled.

## DEVIATIONS

- The Playwright harness gained a configurable E2E port after local Docker was
  found occupying port 3000. This preserves the existing default and removes a
  false 404 test path.

## SUGGESTIONS FOR CHỦ THẦU

- Establish activation targets only after at least two full weekly cohorts.
- Never add free-text event properties to answer an ad hoc product question.

