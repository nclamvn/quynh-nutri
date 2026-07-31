# COMPLETION REPORT – TIP-KE-031

## HEADER

- Project: Q's Kitchen / quynh-nutri
- Role: Builder
- Date: 2026-07-31
- Blueprint: `design/TIP-KE-031.md`
- Status: PARTIAL

KE-031 is implemented and all functional, security, regression, build, visual,
stress, and privacy gates pass. Release readiness remains partial because the
approved branch-backed latency gate cannot yet be certified from the local
runtime: PostgreSQL executes the measured synthetic queries in under 10 ms,
but transferring 10,000 raw rows from the Neon US branch to the local runtime
in Vietnam takes about 2.7–3.8 seconds. A colocated Vercel preview or a compact
database projection is required before the Contractor may mark the release
fully ready.

## FILES CHANGED

### Created

- `src/domain/ops/metrics-contract.ts` – versioned, pure KE-031 metric contract,
  reporting boundaries, suppression, milestone, journey, time-to-value, return,
  occasion, and health projections.
- `src/domain/ops/metrics-contract.test.ts` – deterministic contract fixtures.
- `src/lib/operator-auth.ts` – exact, fail-closed Clerk operator allowlist.
- `src/lib/operator-auth.test.ts` – allowlist and bypass-isolation tests.
- `src/data/repo/ops-metrics.ts` – authorized, bounded, read-only metric input
  repository and aggregate DTO boundary.
- `src/data/repo/ops-metrics.test.ts` – authorization, bounds, serialization,
  and error-boundary tests.
- `src/data/repo/product-event-retention.ts` – ProductEvent-only 365-day
  retention with a fixed batch ceiling.
- `src/data/repo/product-event-retention.test.ts` – cutoff, ceiling, retry, and
  aggregate-only result tests.
- `src/app/ops/activation/page.tsx` – dynamic operator-only activation console.
- `src/app/ops/activation/page.module.css` – responsive evidence-ledger UI for
  light and dark themes.
- `src/app/api/cron/product-event-retention/route.ts` – protected maintenance
  route using the existing timing-safe cron-secret pattern.
- `src/app/api/cron/product-event-retention/route.test.ts` – missing, wrong, and
  valid-secret tests.
- `e2e/operator-activation.spec.ts` – privacy, authorization, responsive,
  selector, and theme coverage.
- `scripts/product-funnel.ts` – shared-contract JSON CLI.
- `scripts/product-event-retention-dry-run.mjs` – aggregate-only dry run.
- `design/TIP-KE-031.md` – approved and frozen blueprint.

### Modified

- `package.json` – switches the activation command to the shared TypeScript
  contract and adds the retention dry-run command.
- `playwright.config.ts` – supplies the operator allowlist only inside the
  hermetic E2E process.
- `src/app/robots.ts` – excludes `/ops/`.
- `src/proxy.ts` – permits Vercel cron transport while the handler still
  authenticates `CRON_SECRET`.
- `vercel.json` – schedules one bounded daily retention invocation.

### Removed

- `scripts/product-funnel.mjs` – removes the obsolete six-boolean metric
  definition so CLI and console cannot drift.

## IMPLEMENTATION NOTES

### Metric contract

- Contract version: `ke031-v1`.
- Reporting timezone: `Asia/Ho_Chi_Minh`.
- Interactive windows: 7, 28, and 90 local calendar days.
- CLI windows: 1–365 days.
- Current and previous periods are half-open and independently denominated.
- Milestones remain independent from the strict ordered journey.
- Direct paths are factual paths, not failures.
- Time to first action uses a 7-day mature horizon.
- Time to first completed meal uses a 14-day mature horizon.
- Median and p75 are suppressed below five households.
- Occasion cells are suppressed below five households.
- Meaningful return excludes login, navigation, dwell time, and page views.

### Privacy and access

- No raw event, household, member, dish, note, plan, shopping, nutrition,
  health, inventory, or feedback content enters the browser DTO.
- No household drill-down, search, export, client collector, tracking SDK,
  pixel, session replay, fingerprint, ad identifier, or chart dependency was
  added.
- `/ops/activation` is dynamic, absent from family navigation, excluded from
  robots, and marked `noindex`, `nofollow`, and `nocache`.
- Operator authorization is repeated at page and repository boundaries.
- Missing, empty, malformed, or non-matching `OPS_USER_IDS` fails closed.
- Family E2E authentication bypass alone grants no operator access.

### Retention

- Cutoff is recomputed by the server at 365 days.
- Only `ProductEvent.occurredAt < cutoff` is eligible.
- Maximum deletion per invocation is five batches of 1,000 rows.
- The request cannot supply a table, household, cutoff, or batch size.
- The response contains only cutoff, deletion count, remaining eligibility,
  and duration.
- No retention write was executed against Neon main.

## ACCEPTANCE RESULTS

| Acceptance criterion | Result | Evidence |
|---|---|---|
| AC-01 One metric contract | PASS | UI repository and CLI call `buildOpsMetrics` |
| AC-02 Independent milestones | PASS | Direct-path fixture |
| AC-03 Strict ordering | PASS | Ordered and equal-timestamp fixtures |
| AC-04 Impossible ordering | PASS | Aggregate temporal warning fixture |
| AC-05 Mature cohorts | PASS | 7-day, 14-day, percentile, and suppression fixtures |
| AC-06 Meaningful return only | PASS | Canonical meaningful-event set |
| AC-07 Local boundaries | PASS | Vietnam-midnight fixtures |
| AC-08 Previous comparison | PASS | Independent denominator fixtures |
| AC-09 Occasion privacy | PASS | Below-five suppression fixture and E2E |
| AC-10 No sensitive segmentation | PASS | DTO serialization rejection test |
| AC-11 Authorized operator | PASS | Unit and focused E2E |
| AC-12 Fail-closed authorization | PASS | Missing, malformed, and mismatch tests |
| AC-13 E2E bypass isolation | PASS | Operator auth unit test |
| AC-14 Search exclusion | PASS | Build, robots, metadata, and link inspection |
| AC-15 Completion coverage | PASS | Aggregate canonical/event count fixture |
| AC-16 Honest unavailable signals | PASS | Health limitations and UI copy |
| AC-17 Quiet traffic | PASS | `insufficient_traffic` fixture |
| AC-18 Bounded reads | PASS | Window validation, take limit, timeout, repository tests |
| AC-19 Non-blocking measurement | PASS | Existing write path unchanged |
| AC-20 Retention safety | PASS | Repository ceiling and retry tests |
| AC-21 Protected maintenance | PASS | Route-secret tests |
| AC-22 Responsive and accessible | PASS | 375 px, desktop, light, dark, overflow E2E and visual review |
| AC-23 No analytics expansion | PASS | Dependency, route, and source inspection |
| AC-24 No behavior mutation | PASS | Full regression suite |

Acceptance criteria tested: 24/24 passed.

## QUALITY-GATE RESULTS

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| Typography policy | PASS – 277 source files |
| `npm test` | PASS – 66 files, 354 tests |
| `npm run build` | PASS – 74 routes |
| Focused operator E2E | PASS – 2 tests |
| Full `npm run test:e2e` | PASS – 81 tests |
| Onboarding gate | PASS – 1 test |
| Security gate | PASS – 3 tests on isolated port |
| Marketing gate | PASS – 4 tests |
| Stress gate | PASS – 0 failures in average, stress, and spike profiles |
| Production audit | PASS – 0 vulnerabilities |
| `git diff --check` | PASS |
| Neon main CLI read | PASS – read-only, `ke031-v1` |
| Neon main retention dry run | PASS – zero eligible, no deletion |
| Temporary Neon fixture volume | PASS – 500 households, 10,000 ProductEvents, 1,500 MealCompletions |
| Temporary Neon query plan | PASS – slowest measured server execution 9.251 ms |
| Temporary Neon retention dry run | PASS – zero eligible, no deletion |
| 90-day aggregate p95 below 500 ms | NOT CERTIFIED – local raw-row transfer is 2.7–3.8 s |
| Branch-backed page p95 below 1.5 s | NOT CERTIFIED – requires an authenticated colocated preview |

### Performance details

- ProductEvent range scan and ordering over 10,013 rows:
  `EXPLAIN (ANALYZE, BUFFERS)` execution 9.251 ms, 215 shared buffer hits,
  2 MB in-memory quicksort.
- Earliest onboarding cohort projection: 0.446 ms using the existing
  `ProductEvent_name_occurredAt_idx`.
- Canonical completion count: 0.829 ms.
- No new index is justified by the server-side plans.
- A direct local timing probe observed approximately 2,106 ms for raw events,
  304 ms for cohorts, and 275 ms for completion counts, or 2,685 ms total.
- The shared CLI observed approximately 3.8 seconds end to end on the same
  remote branch.
- A 20-run E2E-fixture page probe is intentionally not reported as branch
  evidence because E2E mode uses deterministic in-process fixtures.

### Marketing and stress details

- Mobile landing LCP: 164 ms; CLS: 0; JavaScript: 185,865 bytes.
- Desktop landing LCP: 208 ms; CLS: 0.
- Average profile: 100 requests, 0 failures, p95 15.3 ms.
- Stress profile: 400 requests, 0 failures, p95 41.4 ms.
- Spike profile: 160 requests, 0 failures, p95 52.3 ms.

## NEON VERIFICATION

- Strategy: temporary copy-on-write branch only.
- Branch: `codex-ke031-verify-20260731`
- Branch ID: `br-snowy-bar-augegw53`
- Scheduled expiry: 2026-08-01 18:00 UTC.
- Neon main remained selected in the project context and received no schema
  change, synthetic fixture, or retention write.
- The initial synthetic transaction failed on a missing fixture timestamp and
  rolled back completely; the corrected transaction then loaded successfully.
- No migration or schema change was required.

## CHANGED-EVENT REVIEW

- New product event names: none.
- Changed event schemas: none.
- Client-side event ingestion: none.
- Canonical mutation behavior: unchanged.
- Existing event writes remain non-blocking side effects.

## ISSUES DISCOVERED

1. **Release gate – medium:** the current repository intentionally reads raw,
   bounded event rows and aggregates in application memory. Database work is
   fast, but a geographically remote local runtime cannot meet the approved
   end-to-end latency target at the 10,000-row fixture volume.
2. **Deployment prerequisite – high:** production must receive a deliberate
   server-only `OPS_USER_IDS` value containing the Homeowner's exact Clerk user
   ID. Without it, the route correctly returns not found.
3. **Environment coverage – low:** runtime exception rate, API p95,
   AI-provider failures, Vercel health, and Neon incidents are not measured by
   ProductEvent and remain explicitly unavailable.

## CONTRACTOR FIX ROUND

The first Contractor audit found that the CLI used permissive integer parsing,
so values such as `7abc` could be accepted as seven days. The Builder added
`parseHistoricalWindow` to the shared metric contract, covered valid bounds and
malformed values, and verified that an invalid CLI argument exits with code 2
before connecting to the database. The full suite then passed with 354 tests.

## DEVIATIONS FROM SPEC

1. `aggregate-product-events.ts` was folded into
   `src/domain/ops/metrics-contract.ts` because the pure contract already owns
   normalization and aggregation. This removes an unnecessary second
   definition and does not change behavior.
2. The old JavaScript CLI was replaced by `scripts/product-funnel.ts` rather
   than modified in place so it can import the typed shared contract directly.
3. Retention logic has its own repository and tests to keep destructive scope
   isolated from read-only reporting.
4. The branch-backed latency gates remain uncertified pending a colocated
   runtime. No result is marked passed from fixture-only E2E timing.

## BUILDER HANDOVER TO CONTRACTOR

The implementation is ready for independent functional and security review.
Release must remain closed until the Contractor either:

1. verifies the temporary Neon branch through a Vercel preview colocated with
   the database and records both p95 gates; or
2. issues a new approved optimization TIP for a compact server-side facts
   projection if the colocated preview still misses either target.

No commit, push, Neon main maintenance, or production deployment is included
in this handover.
