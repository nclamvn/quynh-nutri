# COMPLETION REPORT — TIP-KE-021

**STATUS:** PRODUCTION RELEASED

## OUTCOME

Q's Kitchen now closes the Phase 1 kitchen feedback loop on the Reports page:

- planned shopping remains a B0 reference-price estimate;
- confirmed purchases produce actual spend with explicit price coverage;
- purchased quantity variance uses the same paid rate for both sides;
- pantry use and discard are traced to the exact purchased lot;
- cooked-leftover reuse and discard are estimated per serving with ingredient
  price coverage;
- actual spend, paid ingredient waste and estimated leftover value remain
  separate;
- missing evidence renders as a named partial state rather than a fabricated
  zero or blank report.

The report is derived read-only from existing canonical events. It adds no
mutation, task state, completion flag or AI action.

## IMPLEMENTATION

### Created

- `design/TIP-KE-021.md`
- `src/domain/feedback/index.ts`
- `src/domain/feedback/feedback.test.ts`
- `e2e/reports-feedback.spec.ts`
- `design/COMPLETION-KE-021.md`
- `design/VERIFY-KE-021.md`

### Modified

- `src/app/(tabs)/reports/page.tsx`
- `src/ui/store.tsx`
- `src/i18n/vn.json`
- `src/i18n/en.json`

## ACCEPTANCE RESULTS

1. Planned reference cost retains honest line-price coverage: Pass.
2. Actual spend includes only confirmed paid values for the selected week:
   Pass.
3. Quantity variance compares planned and actual quantity at one paid rate:
   Pass.
4. Linked paid pantry discard gets a value; missing/incompatible evidence does
   not: Pass.
5. Pantry consumption and discard remain separate: Pass.
6. Leftover reuse is an explicit serving estimate with ingredient coverage:
   Pass.
7. Estimated leftover discard is not merged with paid commodity waste: Pass.
8. Balance corrections are excluded from use, discard and savings: Pass.
9. Partial weeks render useful stages and exact missing-input explanations:
   Pass.
10. Reports remains read-only with no AI/task/synthetic `done`: Pass.
11. Unit, E2E, responsive, lint and production build gates: Pass.

## TEST EVIDENCE

- Feedback domain: 8/8 tests passed.
- Full Vitest: 49 files, 290 tests passed.
- Full Playwright: 67/67 tests passed.
- Responsive report guard:
  - all four stages render at 390 px;
  - no horizontal document overflow;
  - the evidence-basis disclaimer remains visible.
- Existing app-shell alignment suite: 7/7 passed.
- ESLint: passed.
- Prisma generate: passed.
- Next.js 16 production build and TypeScript: passed.
- `git diff --check`: passed.
- Vercel production build: passed.
- GitHub CI run `30522914049`: quality and E2E jobs passed.

## PRODUCTION RELEASE

- Application commit: `9eaa403b031f06b034cbbb2974ad6b1ec6987a7e`.
- Vercel deployment: `dpl_2mXT2t8ML9dvtLaKut95dE9cZE7C`.
- Production alias: `https://anngon.io`.
- GitHub CI run: `30522914049`.
- Smoke: landing returned HTTP 200; protected `/reports` returned the expected
  Clerk HTTP 307 redirect to sign-in while signed out.

## DATA AND PROVENANCE REVIEW

- `ShoppingFulfillment.weekRef` scopes confirmed purchases.
- `pricePaid` is the only source of actual spend.
- Pantry money requires an exact fulfillment-to-lot link and matching unit.
- Pantry movement quantities remain visible when money cannot be derived.
- Leftover activity requires a Meal Run reference containing the current week.
- Latest usable B1 purchase price known by preparation time takes precedence;
  B0 reference price is the declared fallback.
- Edible yield is applied before deriving dish cost per serving.
- Unsupported or unpriced ingredients lower coverage.
- Correction movements remain historical evidence but do not enter use or
  discard totals.

## DATA CHANGE

No database migration or new persistent aggregate was required. The only store
surface change exposes already-hydrated fulfillments to the read-only report.

## DEVIATIONS

None.

GitHub emitted one non-blocking infrastructure annotation that
`actions/checkout@v4` and `actions/setup-node@v4` still target the deprecated
Node.js 20 action runtime and were forced onto Node.js 24. Both jobs completed
successfully; the workflow already requests Node.js 24 for application steps.

## RELEASE NOTE

KE-021 is live on `anngon.io`.
