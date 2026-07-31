# VERIFY REPORT – KE-031

## HEADER

- Project: Q's Kitchen / quynh-nutri
- Role: Contractor
- Date: 2026-07-31
- Reviewed blueprint: `design/TIP-KE-031.md`
- Reviewed completion: `design/COMPLETION-KE-031.md`
- Overall status: NEEDS FIXES

“Needs fixes” here means the release evidence is incomplete. The second audit
found no remaining functional, privacy, authorization, retention, build, or
responsive-layout defect after the CLI parsing fix.

## REQUIREMENT COVERAGE

```text
Total requirements: 20
Implemented: 20
Missing: 0
Deferred by blueprint: 0
Requirement coverage: 100%
```

All 20 blueprint requirements have an implementation path and test evidence.
KE31-020 is correctly enforced: no database change, Neon main maintenance,
commit, push, or production deployment occurred.

## ACCEPTANCE SCENARIOS

```text
Passed: 24
Failed: 0
Untestable in the approved local environment: 0
```

The 24 functional acceptance criteria are satisfied. Of the two additional
performance quality gates, one passed and one failed as listed below.

## INDEPENDENT AUDIT

### Source-of-truth and product behavior

- Reporting reads existing ProductEvent evidence and aggregate
  MealCompletion counts.
- No metric writes back to planning, shopping, pantry, cooking, completion,
  leftover, feedback, reminder, nutrition, or AI state.
- No new event name or event schema was introduced.
- Existing non-blocking product-event writes were not changed.
- No task table, mutable completion flag, analytics repair job, or secondary
  product truth was added.

### Authorization and route privacy

- `OPS_USER_IDS` is parsed server-side and matched against the exact
  authenticated Clerk user ID.
- Missing, empty, malformed, and non-matching values fail closed.
- The repository repeats authorization rather than trusting page navigation.
- Family E2E authentication bypass does not independently grant operator
  access.
- Signed-in non-operators receive not found from the page boundary.
- The route is dynamic and carries no-index metadata.
- `/ops/` is excluded from robots and absent from the sitemap and family
  navigation.
- The allowlist is not referenced by client code.

### DTO and tracking scope

- Raw identifiers are used only inside the server-local aggregation input.
- The returned DTO contains no raw identifier, dedupe key, arbitrary
  property, or household content.
- Below-five segmented values use an explicit suppressed state and null value.
- No analytics SDK, pixel, replay, fingerprint, generic client event endpoint,
  chart package, or export path was added.

### Retention

- The authenticated route accepts no caller-controlled cutoff, table,
  household, batch size, or batch count.
- Deletion is limited to ProductEvent rows older than the server-derived
  365-day cutoff.
- One invocation is capped at 5,000 rows.
- Output is aggregate-only.
- Missing or wrong secrets cannot call the repository.
- Neon main received a dry run only and no deletion.

### Responsive and typography review

- Desktop hierarchy, section widths, spacing, and evidence grouping are
  consistent.
- At 390 px the title remains one line, the health badge does not constrain the
  title, controls remain inside the viewport, and the occasion table scrolls
  inside its own region.
- Health states include text and are not communicated by color alone.
- Product copy uses en dash rather than em dash.
- The typography policy passes across 277 source files.

## CONTRACTOR FINDING AND FIX ROUND

### Finding C-031-01 – permissive CLI window parsing

- Severity: medium
- First-audit result: failed
- Evidence: `Number.parseInt` would interpret `7abc` and `7.5` as seven.
- Builder correction: strict shared `parseHistoricalWindow` parser plus
  regression fixtures.
- Reverification: passed; malformed input exits code 2 before database access.

No other actionable code finding remained in the second audit.

## TECHNICAL HEALTH

```text
Build: PASS
Type errors: 0
Lint errors: 0
Typography violations: 0
Unit and integration tests: 354 passed, 0 failed
Focused operator E2E: 2 passed, 0 failed
Full E2E: 81 passed, 0 failed
Security: 3 passed, 0 failed
Marketing: 4 passed, 0 failed
Production vulnerabilities: 0
Git diff check: PASS
```

The Contractor accepts the Builder's recorded onboarding and stress results.
The isolated security rerun is the valid result because the first attempt
collided with an unrelated process on the default port.

## TEMPORARY NEON EVIDENCE

- Verification branch:
  `codex-ke031-verify-20260731` / `br-snowy-bar-augegw53`.
- Fixture volume: 500 households, 10,000 ProductEvents, and 1,500
  MealCompletions.
- Slowest recorded PostgreSQL execution: 9.251 ms.
- Existing indexes are sufficient at this database-side volume.
- Retention dry run: zero eligible rows and zero writes.
- Neon main received no fixture, schema change, migration, or retention write.

## RELEASE PERFORMANCE GATES

### G-031-01 – 90-day aggregation p95

Required: below 500 ms over 20 warm runs, excluding connection establishment.

Authenticated `iad1` preview result:

- minimum: 108.6 ms;
- median: 145.5 ms;
- p95: 255.1 ms;
- maximum: 985.5 ms;
- sample: 20 warm, branch-backed 90-day reports.

Result: passed.

### G-031-02 – branch-backed operator response p95

Required: below 1.5 seconds over 20 warm authenticated requests.

Vercel Observability isolated `Function Invocations → Time to First Byte` for
deployment `dpl_9wL2rrVaHgsTmpa5kBH6PvCaiqjM`, preview environment, route
`/ops/activation`, and `hot` function starts. The exact 09:06–09:07
Asia/Ho_Chi_Minh window covers the 20 authenticated warm reloads and contains
58 hot function invocations with no cold invocation.

Observed TTFB:

- p50: 50 ms;
- p90: 3.57 s;
- p95: 3.7 s;
- required p95: below 1.5 s.

Result: failed.

## CRITICAL ISSUES

1. **Performance gate failed:** G-031-02 exceeded its p95 limit by 2.2 seconds.
2. **Operator identity not configured:** production access will remain closed
   until the exact Homeowner Clerk user ID is deliberately set in the
   server-only `OPS_USER_IDS` environment variable.

## REQUIRED REFINEMENT

Keep production closed. Prepare a narrow performance TIP that reduces the
slow TTFB tail without changing the `ke031-v1` contract, then repeat the same
Observability query on a replacement preview.

## RELEASE VERDICT

```text
Functional implementation: READY
Privacy and security: READY
Neon main safety: READY
Production release: NOT READY
Overall: NEEDS FIXES
```

The protected preview is approved. Neon main maintenance and production
release are not approved by this report.

## POST-VERIFY PREVIEW ADDENDUM

The Homeowner subsequently authorized the preferred preview action. Commit
`d68f19e` was pushed on `codex/ke-031-preview`, and protected Vercel deployment
`dpl_9wL2rrVaHgsTmpa5kBH6PvCaiqjM` passed signed-out smoke testing against the
temporary Neon branch. See `design/RELEASE-KE-031-PREVIEW.md`.

This addendum does not change the production verdict. The two authenticated
p95 gates were then measured: aggregation passed at 255.1 ms p95; isolated hot
server TTFB failed at 3.7 s p95.
