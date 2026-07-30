# VERIFY-KE-021 — Honest Cost, Waste and Savings Feedback

## COVERAGE

- Acceptance criteria implemented: 11/11.
- Missing implementation items: 0.
- Deferred P0/P1 items: 0.

## VERIFIED SCENARIOS

1. Reference plan and confirmed spend render as different measures: Pass.
2. Incomplete actual-price coverage labels the spend as a lower bound: Pass.
3. A fully priced purchase labels actual spend as confirmed: Pass.
4. Buying less than planned derives avoided spend at the paid rate: Pass.
5. Buying more than planned derives extra spend at the paid rate: Pass.
6. Missing price/quantity excludes a line from the variance denominator: Pass.
7. A same-unit pantry movement linked to a paid lot receives a value: Pass.
8. An incompatible unit remains quantity-only: Pass.
9. An unlinked pantry movement is excluded from this week's report: Pass.
10. Pantry consumed and discarded events are independent: Pass.
11. Leftover value applies reviewed edible yield: Pass.
12. Leftover value prefers a B1 price known by preparation time: Pass.
13. Unsupported leftover ingredient lines lower coverage: Pass.
14. Leftover consumed and discarded servings remain separate: Pass.
15. Correction movements alter neither used nor discarded metrics: Pass.
16. Another week's leftover events are excluded: Pass.
17. A real plan with no remaining shopping still renders the Plan stage: Pass.
18. Four stages render without horizontal overflow at 390 px: Pass.
19. Existing desktop canvas alignment remains intact: Pass.
20. The report exposes navigation to existing truth-capture flows only: Pass.
21. No report action mutates household data: Pass.

## TECHNICAL HEALTH

```text
Vitest                         49 files / 290 tests PASS
Feedback domain                8 / 8 PASS
Playwright                     67 / 67 PASS
Reports mobile overflow        0 px PASS
ESLint                         PASS
Prisma generate               PASS
Next build + TypeScript        PASS
git diff --check               PASS
Database migration             NOT REQUIRED
Vercel production              PENDING RELEASE
GitHub CI                      PENDING RELEASE
```

## TRUST BOUNDARIES

1. The report consumes canonical records but exposes no write method.
2. Planned B0 values are always marked as reference estimates.
3. Actual money is derived only from household-confirmed `pricePaid`.
4. Missing actual prices create a lower bound, never an assumed zero spend.
5. Quantity avoidance compares one line against its own paid rate.
6. Exact lot linkage and unit equality gate pantry valuation.
7. Leftover monetary values remain estimates with ingredient coverage.
8. Paid ingredient and estimated cooked-dish waste are never added together.
9. Corrections are disclosed but excluded from outcome totals.
10. AI cannot generate, repair, confirm or mark any report item complete.

## OVERALL STATUS

READY FOR RELEASE — implementation and all local automated evidence are
verified; production deployment and CI evidence remain to be recorded.
