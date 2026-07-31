# TIP-KE-031 – Quan sát kích hoạt và vận hành trước marketing

## HEADER

- TIP-ID: TIP-KE-031
- Project: Q's Kitchen / quynh-nutri
- Module: First-party product measurement and operator readiness
- Depends on: TIP-KE-017, TIP-KE-021, TIP-KE-027, TIP-KE-028,
  TIP-KE-029, TIP-KE-030
- Priority: P0
- Working directory: `/Users/os/quynh-nutri`
- Status: APPROVED – handed to Builder on 2026-07-31

## OBJECTIVE

Give the product owner one trustworthy, private, operator-only view of whether
real households are reaching the family food-management loop:

```text
thiết lập → tham gia kế hoạch → đi chợ → vào bếp → khép bữa → phản hồi
```

KE-031 must answer three questions before paid marketing begins:

1. Households reach which factual value milestones, and where does evidence
   become sparse?
2. How long does it take to reach a first operational action and a first
   completed meal?
3. Is first-party measurement sufficiently fresh, complete, and internally
   consistent to support product decisions?

The result is an aggregate operational instrument, not a surveillance system.
It must not expose or rank individual households, collect page-view noise, or
turn analytics into a second source of product truth.

## CURRENT STATE AND GAP

The application already has a privacy-minimal `ProductEvent` ledger with strict
schemas, household scoping, deduplication, and canonical mutation boundaries.
It records:

```text
onboarding_started
onboarding_completed
week_proposal_confirmed
meal_occasion_edited
shopping_item_received
cooking_started
meal_run_started
meal_completed
leftover_recorded
meal_feedback_saved
meal_feedback_deleted
memory_guided_proposal_created
```

The current `scripts/product-funnel.mjs` can print six aggregate counts for one
rolling window. It cannot yet:

- distinguish independent milestones from a strict ordered journey;
- measure time to value or return behavior;
- compare current and previous equal windows;
- explain occasion adoption after KE-030;
- identify direct entry and missing instrumentation evidence;
- protect small segmented groups from inference;
- provide a secured operator experience;
- compare key events with canonical completion evidence;
- express release readiness without manually querying Neon.

The application has authentication but no operator role. Runtime error, API
latency, and infrastructure telemetry are not stored in `ProductEvent` and must
not be fabricated from it.

## REQUIREMENTS

| ID | Requirement | Priority |
|---|---|---:|
| KE31-001 | Reuse the existing strict `ProductEvent` ledger as the measurement source and keep canonical product tables authoritative | P0 |
| KE31-002 | Define one versioned metric contract with explicit event sets, cohort rules, ordering, timezone, windows, and denominators | P0 |
| KE31-003 | Show activation milestones independently and show a strict ordered journey separately so direct paths are not mislabeled as failure | P0 |
| KE31-004 | Measure setup-to-first-action and setup-to-first-completed-meal latency with mature cohorts and honest insufficient-sample states | P0 |
| KE31-005 | Measure meaningful return behavior without using page views, dwell time, login, or navigation as household value | P0 |
| KE31-006 | Show aggregate meal-occasion adoption without exposing dish, plan, member, note, nutrition, health, or household content | P0 |
| KE31-007 | Provide a server-rendered operator console with fixed 7, 28, and 90-day windows and a previous-period comparison | P0 |
| KE31-008 | Protect all operator routes and reads with a server-side, fail-closed Clerk user allowlist independent from family membership | P0 |
| KE31-009 | Return not found to signed-in non-operators, omit operator links from the family application, and exclude the surface from indexing | P0 |
| KE31-010 | Send only typed aggregate DTOs to the browser and never serialize raw product-event or canonical household rows into the RSC payload | P0 |
| KE31-011 | Suppress segmented metrics below five households and never provide household drill-down, search, export, or raw-event views | P0 |
| KE31-012 | Add deterministic measurement-health checks for event freshness, unknown schemas, impossible timestamps, ordered-journey gaps, and meal-completion coverage | P0 |
| KE31-013 | Label low-traffic quiet periods separately from instrumentation failures and never claim application uptime from event traffic | P0 |
| KE31-014 | Keep all reporting queries bounded, parameterized, read-only, and measured against a temporary Neon branch before release | P0 |
| KE31-015 | Retain privacy-minimal product events for 365 days, delete only older product-event rows through an authenticated bounded maintenance path, and report aggregate deletion counts only | P1 |
| KE31-016 | Preserve event writes as non-blocking side effects and never make a canonical household mutation fail because analytics failed | P0 |
| KE31-017 | Replace the current activation script with the same shared metric contract used by the operator console so CLI and UI cannot disagree | P0 |
| KE31-018 | Add no third-party analytics SDK, tracking pixel, session replay, ad identifier, fingerprint, or client-side click collector | P0 |
| KE31-019 | Keep operator copy, controls, and charts responsive at 375 px, accessible without color alone, and consistent in light and dark themes | P1 |
| KE31-020 | Apply no database change, Neon main maintenance, commit, push, or production deployment without a separate release instruction after verification | P0 |

## BLUEPRINT

### 1. Source-of-truth boundary

`ProductEvent` remains append-only measurement evidence. It may describe
adoption of a canonical action but may never become:

- a task or completion table;
- a replacement for week plans, shopping receipts, kitchen sessions, meal
  completions, leftovers, or feedback;
- a source used to repair household data;
- an input that changes AI proposals, nutrition, shopping, or reminders;
- proof that a page view or click represents a real meal.

KE-031 adds read models over existing rows. It does not add a generic analytics
event endpoint for browsers. Product events continue to be emitted only at
validated server-side domain boundaries.

One exception is permitted only if verification proves an existing canonical
action has no bounded measurement evidence. Any new event must:

1. correspond to an accepted canonical mutation;
2. use a strict versioned schema;
3. contain no content or persistent entity identifier;
4. have a stable household-scoped dedupe key;
5. pass a separate proposed-event review in the Builder handover.

No new event is currently required by this blueprint.

### 2. Versioned metric contract

Add a pure, server-safe contract:

```ts
type MetricsContractVersion = "ke031-v1";
type ReportingWindowDays = 7 | 28 | 90;
type ReportingZone = "Asia/Ho_Chi_Minh";
```

All calendar-day and cohort boundaries use `Asia/Ho_Chi_Minh`. Database
timestamps remain UTC. A selected window is half-open:

```text
[local start of first day, local start after last day)
```

The comparison window is the immediately preceding equal-length half-open
window. The operator UI and CLI must return:

- contract version;
- selected window and exact UTC boundaries;
- reporting timezone;
- generated-at timestamp;
- metric value, denominator, and sample size where relevant;
- suppression or unavailable reason rather than an invented zero.

The maximum interactive query window is 90 days. The CLI may request up to 365
days for controlled historical inspection but must use the same definitions.

### 3. Activation milestone ladder

The primary view is a milestone ladder, not a mandatory linear funnel.

The acquisition cohort contains households whose first
`onboarding_started` event occurs inside the selected window. For each household
and milestone, only the first qualifying event at or after cohort start counts.

| Milestone | Qualifying evidence |
|---|---|
| `started` | `onboarding_started` |
| `setup_completed` | `onboarding_completed` |
| `plan_participated` | `week_proposal_confirmed`, or `meal_occasion_edited` with `action = add` or `replace` |
| `shopping_received` | `shopping_item_received` |
| `kitchen_started` | `cooking_started` or `meal_run_started` |
| `meal_completed` | `meal_completed` |
| `learning_loop` | `leftover_recorded` or `meal_feedback_saved` |

For every milestone show:

- unique household count;
- percentage of `started`;
- previous equal-window percentage;
- percentage-point delta;
- mature sample count when time is needed to observe the milestone.

Milestone percentages are independent. A household may legitimately cook an
existing generated dinner without confirming a new proposal. The UI must not
call this abandonment.

### 4. Strict ordered journey and direct paths

The secondary view evaluates event order:

```text
started
  < setup_completed
  < plan_participated
  < shopping_received
  < kitchen_started
  < meal_completed
  < learning_loop
```

A household advances only when the next qualifying timestamp is after or equal
to the prior accepted timestamp. Equal timestamps are allowed because related
events may be committed atomically.

The operator view must show separately:

- households following the strict ordered journey;
- direct-path households that reached a later factual milestone without an
  earlier optional milestone;
- households with impossible ordering, such as completion before onboarding
  in the same measured lifecycle;
- households whose first onboarding event predates the window and therefore
  belong to operating-population metrics, not the acquisition cohort.

Direct paths are evidence about the product flow, not automatically defects.
Impossible ordering is a measurement-health signal and never triggers a
household data mutation.

### 5. Time to value

Compute two latency distributions from `onboarding_completed`:

```text
first operational action
  earliest of:
    week_proposal_confirmed
    meal_occasion_edited(add | replace)
    shopping_item_received
    cooking_started
    meal_run_started
    meal_completed

first closed meal
  first meal_completed
```

Rules:

- negative durations are rejected into measurement health;
- only households old enough to observe the configured horizon enter the
  denominator;
- setup-to-action uses a 7-day horizon;
- setup-to-closed-meal uses a 14-day horizon;
- display median and p75, never an average alone;
- publish no distribution if fewer than five households qualify;
- show `chưa đủ mẫu trưởng thành` instead of zero;
- duration values are rounded to the nearest hour for display.

### 6. Meaningful return

Define meaningful operational events:

```text
week_proposal_confirmed
meal_occasion_edited(add | replace | remove)
shopping_item_received
cooking_started
meal_run_started
meal_completed
leftover_recorded
meal_feedback_saved
meal_feedback_deleted
memory_guided_proposal_created
```

Do not count sign-in, route navigation, page view, theme change, search, or time
spent.

Report:

- active operating households in the selected window;
- households active on at least two distinct local calendar days;
- households active on at least two distinct local weeks;
- 7-day return for completed-onboarding cohorts, where a return is any
  meaningful event on local day 2 through day 7 after completion.

Only onboarding cohorts at least seven local days old enter the 7-day-return
denominator. Cohort rates under five households are suppressed.

### 7. Occasion adoption

Use only bounded `occasion` properties from:

```text
meal_occasion_edited
meal_run_started
meal_completed
```

For `breakfast`, `lunch`, `dinner`, and `snack`, show:

- unique households with an explicit plan edit;
- unique households that started a meal run;
- unique households that completed a meal;
- percentage of active operating households.

Do not show dish names, food roles, meal dates, household names, or member
segments. Do not interpret absence as a skipped meal, unhealthy behavior, or
dislike. Each occasion and action cell requires at least five households;
otherwise it is displayed as `dưới ngưỡng riêng tư`.

No segmentation by household size, children, restrictions, allergies, health
conditions, nutrition, or shopping contents is approved. `marketMode` may be
added only in a later blueprint if a real acquisition decision needs it.

### 8. Measurement health

Build a deterministic health projection with states:

```text
healthy | attention | insufficient_traffic | unavailable
```

It includes:

1. **Freshness**
   - most recent known event timestamp;
   - events in the last 24 hours and previous 24 hours;
   - no traffic is `insufficient_traffic`, not an outage.
2. **Schema integrity**
   - count of stored names not present in the current event contract;
   - count of schema versions not supported by the reader;
   - malformed properties are counted and excluded from semantic metrics.
3. **Temporal integrity**
   - future timestamps beyond five minutes of server time;
   - negative time-to-value durations;
   - impossible ordered-journey transitions.
4. **Canonical completion coverage**
   - aggregate `MealCompletion` count versus `meal_completed` event count for
     the same local window;
   - difference and coverage percentage;
   - no completion IDs, household IDs, dishes, or dates at household
     granularity leave the repository.
5. **Query status**
   - bounded aggregation duration measured server-side;
   - generated-at timestamp;
   - an explicit unavailable state if the read fails.

Coverage is healthy at 100%, attention below 99%, and unavailable when the
denominator cannot be read. The threshold is an instrumentation guardrail, not
a claim about product reliability.

`recordProductEventSafely` currently logs write failures without persistent
telemetry. KE-031 must state that this failure rate is unavailable. It must not
infer zero failures from the absence of stored rows.

### 9. Operator authorization

Add a server-only authorization boundary:

```text
OPS_USER_IDS=<comma-separated Clerk user IDs>
```

Rules:

- authenticate with Clerk first;
- trim and validate the allowlist;
- match the exact authenticated Clerk user ID;
- fail closed if the variable is absent, empty, malformed, or the user is not
  listed;
- signed-out users follow the existing sign-in behavior;
- signed-in non-operators receive a 404 response;
- authorization occurs again in every operator repository entry point and
  route handler, not only in navigation or middleware;
- never derive operator rights from household ownership, email domain, client
  state, query parameters, or the family E2E bypass;
- never expose the allowlist to the client bundle.

The operator route is not linked from the family sidebar, mobile navigation,
landing page, or settings. Add `/ops/` to robots exclusions and set route
metadata to `noindex, nofollow`. It remains absent from the sitemap.

Hermetic tests may put `e2e-user` into `OPS_USER_IDS` only in the test process.
The existing production-hard-off E2E auth bypass does not grant operator access
by itself.

This allowlist is the approved phase-one control for one product owner. A
database role model, team console, and delegated operator permissions require a
later blueprint.

### 10. Operator console

Add:

```text
/ops/activation
```

The route is a dynamic, server-rendered surface. It must not statically cache
private metrics. Read the relevant local Next.js 16.2 documentation for
authentication, Server Components, caching, route handlers, and security
before implementation.

The page contains:

1. compact header with contract version, window selector, reporting timezone,
   and refreshed timestamp;
2. current health state and factual limitations;
3. activation milestone ladder;
4. strict journey and direct-path summary;
5. time-to-value median and p75 cards;
6. meaningful-return cohort cards;
7. occasion-adoption matrix;
8. measurement-health details;
9. a small glossary explaining denominators, mature cohorts, suppression, and
   why traffic is not uptime.

Use simple semantic bars, numbers, and tables. Do not add a chart dependency.
Every color state also has a label or icon with accessible text. Tables must
become horizontally safe cards or scroll within their own region at 375 px;
the document itself must not overflow.

The client receives one typed aggregate DTO. It never receives:

- `ProductEvent.id`, `householdId`, or `dedupeKey`;
- raw event rows or arbitrary properties;
- household or member records;
- dish, note, plan, shopping, nutrition, health, inventory, or feedback
  content;
- exact small-segment values hidden by privacy suppression.

### 11. Shared aggregation architecture

Create three layers:

```text
domain/ops-metrics
  pure event normalization, cohort logic, suppression, DTO types

data/repo/ops-metrics
  authorized bounded aggregate reads from Neon and canonical coverage counts

app/ops/activation
  server-rendered presentation of aggregate DTO only
```

The repository may read the minimum event fields needed for the bounded
window, but raw rows must remain server-local and be discarded after
aggregation. At expected phase-one scale, a bounded query plus pure aggregation
is preferred over a materialized view or analytics warehouse.

Database rules:

- parameterize all timestamps and limits;
- reject unsupported window values before querying;
- select only required columns;
- set a statement timeout for operator queries;
- do not lock canonical tables;
- do not write during dashboard reads;
- inspect `EXPLAIN (ANALYZE, BUFFERS)` on a temporary Neon branch with synthetic
  volume;
- add a covering index only if measured evidence shows the existing
  `(name, occurredAt)` and `(householdId, occurredAt)` indexes are insufficient.

No new table, materialized view, warehouse, queue, or dependency is approved
by default.

### 12. CLI parity

Refactor `npm run metrics:activation` to consume the same contract and DTO as
the operator page.

CLI behavior:

- accepts 7, 28, 90, or an explicit 1–365 day historical window;
- outputs structured JSON;
- includes contract version, boundaries, timezone, generated time, suppression
  reasons, and health limitations;
- does not print environment values, connection strings, IDs, names, or raw
  event properties;
- exits nonzero for invalid arguments or an unavailable query;
- does not exit nonzero merely because traffic is low.

The old six-boolean query must be removed so two definitions cannot coexist.

### 13. Retention and bounded maintenance

Privacy-minimal product events are retained for 365 days. Canonical product
data is unaffected.

Add a protected maintenance operation that:

- uses the existing `CRON_SECRET` bearer pattern with timing-safe comparison;
- deletes only `ProductEvent.occurredAt < cutoff`;
- uses a fixed batch size and maximum batches per invocation;
- recomputes the cutoff on the server;
- returns only cutoff, deleted count, remaining-eligible boolean, and duration;
- logs no event, household, or dedupe identifiers;
- is idempotent;
- cannot accept an arbitrary table, household, or cutoff from a request;
- has route tests for missing, wrong, and valid secrets.

Add one daily Vercel cron entry only after temporary-branch verification. A
manual dry-run command must report the eligible aggregate count before the
first production invocation. Deleting canonical household data, recent product
events, or more than the fixed batch limit is out of scope.

### 14. Readiness guardrails

The operator page may assign an `attention` badge only when a factual rule is
met:

- canonical completion coverage is below 99%;
- an unknown event name or unsupported schema version exists;
- a future or negative-duration timestamp exists;
- aggregation is unavailable;
- current activation conversion falls by at least 30% relative and at least 10
  percentage points versus the previous window, with at least 20 started
  households in both windows.

These are dashboard guardrails, not external paging. A quiet period, small
sample, or suppressed segment must not be red.

Active alerts for runtime exceptions, p95 API latency, database saturation,
AI-provider failures, Vercel incidents, or Neon incidents require a real
observability provider and notification channel. They are explicitly deferred;
KE-031 must display `không được đo bởi nguồn này` rather than manufacture these
signals.

## PROPOSED PRODUCT DIFF

### Added

- Private `/ops/activation` console for one allowlisted product operator.
- A single versioned metric contract shared by UI and CLI.
- Activation milestones, strict journey, direct paths, time to value, return,
  and occasion adoption.
- Privacy thresholds and mature-cohort semantics.
- First-party measurement-health and canonical completion-coverage checks.
- A bounded 365-day product-event retention operation.

### Changed

- The existing activation CLI uses the shared KE-031 definitions.
- Robots exclusions include the operator surface.
- Vercel cron configuration gains one daily product-event retention call after
  approval and verification.

### Unchanged

- Canonical week plans, shopping, pantry, kitchen sessions, completions,
  leftovers, feedback, and household memory.
- AI remains read-only and cannot create, repair, or act from analytics.
- Family navigation and landing experience.
- Product-event writes remain server-side, strict, deduplicated, and
  non-blocking.
- No task table, mutable `done` state, tracking SDK, raw household analytics,
  session replay, or advertising identifier is added.

## EXPECTED FILE SCOPE

### New

- `src/domain/ops/metrics-contract.ts`
- `src/domain/ops/metrics-contract.test.ts`
- `src/domain/ops/aggregate-product-events.ts`
- `src/domain/ops/aggregate-product-events.test.ts`
- `src/lib/operator-auth.ts`
- `src/lib/operator-auth.test.ts`
- `src/data/repo/ops-metrics.ts`
- `src/data/repo/ops-metrics.test.ts`
- `src/app/ops/activation/page.tsx`
- `src/app/ops/activation/page.module.css`
- `src/app/api/cron/product-event-retention/route.ts`
- `src/app/api/cron/product-event-retention/route.test.ts`
- `e2e/operator-activation.spec.ts`
- `design/COMPLETION-KE-031.md`
- `design/VERIFY-KE-031.md`

### Modified

- `scripts/product-funnel.mjs`
- `package.json`
- `src/app/robots.ts`
- `vercel.json`
- Relevant shared tokens or operator-only presentational components
- Relevant CI and readiness tests if required for the protected route

The Builder may narrow this list when an existing abstraction already owns the
behavior. A new database model, analytics provider, chart library, role system,
tracking endpoint, or monitoring service requires a Contractor conflict report
and a new Homeowner approval.

## ACCEPTANCE CRITERIA

### AC-01 – One metric contract

Given the same fixture rows and reporting window
When the CLI and operator aggregation are executed
Then both return the same contract version, boundaries, counts, denominators,
suppression states, and health results

### AC-02 – Independent milestones

Given a household completes a meal without confirming a proposal in the window
When activation is aggregated
Then its factual completion milestone is counted
And it is shown as a direct path rather than falsely marked as an invalid
household

### AC-03 – Strict ordering

Given events arrive in canonical order, with optional equal transaction
timestamps
When the strict journey is aggregated
Then each eligible stage advances exactly once
And a retry with the same dedupe key changes no result

### AC-04 – Impossible ordering health

Given a completion timestamp precedes that household's onboarding start
When measurement health is built
Then the row is excluded from ordered conversion
And an aggregate temporal-integrity warning is returned without identifying the
household

### AC-05 – Mature time-to-value cohorts

Given some setup-completed households have not yet had the full observation
horizon
When time to value is calculated
Then immature households are excluded from the denominator
And median and p75 are shown only with at least five qualifying households

### AC-06 – Meaningful return only

Given a household signs in and views pages but performs no canonical action
When return is calculated
Then it is not counted as a meaningful return

### AC-07 – Local calendar boundaries

Given events surround midnight in Vietnam
When reporting days and cohort maturity are calculated
Then boundaries use `Asia/Ho_Chi_Minh`
And stored UTC timestamps are not reinterpreted as local timestamps

### AC-08 – Previous-window comparison

Given current and previous equal windows contain eligible cohorts
When the report is generated
Then percentages use their own stated denominators
And delta is expressed in percentage points without mixing cohort populations

### AC-09 – Occasion privacy

Given an occasion/action segment has fewer than five households
When the operator page and CLI render
Then the exact cell value and percentage are absent
And the output states `dưới ngưỡng riêng tư`

### AC-10 – No sensitive segmentation

Given event properties and canonical data include household-specific facts
When metrics are returned to the browser
Then no household ID, member, dish, note, plan, shopping, nutrition, health,
inventory, feedback value, or raw event property is serialized

### AC-11 – Authorized operator

Given a signed-in Clerk user appears exactly in `OPS_USER_IDS`
When `/ops/activation` is requested
Then the aggregate operator console renders
And the allowlist itself never appears in page output or a client bundle

### AC-12 – Fail-closed authorization

Given the allowlist is absent, empty, malformed, or does not contain the user
When an operator route or repository read is attempted
Then access fails closed
And a signed-in non-operator receives not found rather than aggregate data

### AC-13 – E2E bypass isolation

Given family E2E auth bypass is enabled without an operator allowlist entry
When `/ops/activation` is requested
Then operator access remains denied

### AC-14 – Search exclusion

Given robots, sitemap, family navigation, and route metadata
When the built application is inspected
Then `/ops/` is disallowed and `noindex, nofollow`
And no public or family-facing link exposes the operator route

### AC-15 – Completion coverage

Given canonical meal completions and completion product events exist in a
window
When measurement health is generated
Then their aggregate counts and coverage percentage are exact
And no completion or household identifier is returned

### AC-16 – Honest unavailable signals

Given event-write failure rate, runtime error rate, or API latency is not stored
by the approved sources
When the health panel renders
Then it says the signal is not measured
And it never displays a fabricated zero or healthy badge for that signal

### AC-17 – Quiet traffic is not outage

Given no event arrives during a low-traffic 24-hour period
When freshness is evaluated
Then the state is `insufficient_traffic`
And the interface does not claim application downtime

### AC-18 – Bounded database reads

Given an unsupported window or an attempt to request raw rows
When the operator repository is called
Then the request is rejected before querying
And supported queries use bounded parameters and a statement timeout

### AC-19 – Non-blocking product measurement

Given analytics persistence fails after a successful canonical family mutation
When the action returns
Then the canonical action remains successful
And KE-031 creates no automatic repair or duplicate family mutation

### AC-20 – Retention safety

Given product events older and newer than 365 days exist
When the authenticated retention operation runs
Then only old `ProductEvent` rows up to the fixed batch limit are deleted
And a retry is safe and reports aggregate counts only

### AC-21 – Protected maintenance

Given the retention route receives no secret or a wrong secret
When it is called
Then it returns unauthorized and deletes nothing

### AC-22 – Responsive and accessible console

Given 375 px and desktop viewports in light and dark themes
When long Vietnamese labels, suppressed cells, health states, and comparison
values render
Then there is no document-level overflow, clipped control, em dash, or
avoidable orphan word
And state remains understandable without relying on color

### AC-23 – No analytics expansion

Given the final dependency tree, client bundle, routes, and network requests
When KE-031 is inspected
Then there is no analytics SDK, tracking pixel, session replay, fingerprint,
generic client event endpoint, or chart dependency

### AC-24 – No product behavior mutation

Given the same household canonical inputs before and after KE-031
When planning, shopping, cooking, completion, leftovers, feedback, reminders,
nutrition, and AI reads execute
Then their canonical results remain unchanged

## QUALITY GATES

- Before implementation, read the relevant Next.js 16.2 local guides under
  `node_modules/next/dist/docs/` for authentication, Server Components,
  caching, route handlers, environment variables, and security.
- `npx tsc --noEmit` passes.
- `npm run lint` and the typography policy pass.
- Unit fixtures cover every metric definition, equal timestamps, direct paths,
  impossible ordering, local-midnight boundaries, mature cohorts, percentiles,
  suppression, and comparison windows.
- Repository tests prove authorization is rechecked, queries are bounded,
  canonical coverage is aggregate-only, and errors return no partial raw data.
- Route tests prove missing, wrong, and valid cron secrets and bounded
  retention.
- Security tests prove signed-out, signed-in non-operator, missing-config,
  family-E2E-bypass, and authorized-operator behavior.
- A serialization test rejects all known ID and sensitive-content fields from
  the operator DTO.
- CLI parity tests use the same fixtures as the page aggregation.
- Temporary Neon verification uses at least:
  - 10,000 synthetic privacy-minimal events;
  - 500 synthetic households;
  - current and previous 90-day windows;
  - malformed, future, direct-path, and small-segment fixtures;
  - `EXPLAIN (ANALYZE, BUFFERS)` evidence for the slowest report query.
- At synthetic volume, the complete 90-day aggregation must finish under 500
  ms at p95 over 20 warm runs on the temporary Neon branch, excluding network
  connection establishment.
- Operator page server response must remain under 1.5 seconds p95 over 20 warm
  authenticated local requests backed by that branch.
- Focused E2E covers 7, 28, and 90-day selectors, suppression, direct paths,
  unavailable state, authorization, 375 px, desktop, light, and dark themes.
- `npm test`, `npm run build`, full `npm run test:e2e`, onboarding, security,
  marketing, stress, and production audit gates pass.
- Build inspection confirms `/ops/activation` is dynamic, private, absent from
  sitemap, and not linked from family surfaces.
- A retention dry run reports eligible counts on a temporary Neon branch and
  proves the fixed deletion ceiling.
- `git diff --check` passes.
- Builder submits `design/COMPLETION-KE-031.md` with exact commands, fixtures,
  query plans, timings, changed-event review, and limitations.
- Contractor independently submits `design/VERIFY-KE-031.md` before any release.
- Neon main maintenance, commit, push, and production deployment remain
  separate, explicitly approved release actions.

## CONSTRAINTS

- Do not add Google Analytics, Meta Pixel, PostHog, Mixpanel, Amplitude,
  session replay, fingerprinting, or equivalent tracking.
- Do not add client-side page-view, click, dwell-time, scroll, or navigation
  measurement.
- Do not expose a generic product-event ingestion API.
- Do not display or export raw events, household rows, IDs, dedupe keys, or
  arbitrary event properties.
- Do not segment by children, health, restrictions, allergies, nutrition,
  household size, dish, shopping content, notes, or feedback answers.
- Do not infer uptime, error rate, latency, preference, health, skipped meals,
  or household intent from event absence.
- Do not create a task table, `done` flag, analytics repair job, or second
  source of canonical truth.
- Do not let operator analytics mutate plans, shopping, pantry, cooking,
  completions, leftovers, feedback, reminders, or AI context.
- Do not make event persistence a precondition for a successful canonical
  household mutation.
- Do not add a role database, analytics warehouse, materialized view, queue,
  chart library, or monitoring vendor without a new approved blueprint.
- Do not run destructive retention against Neon main before dry-run evidence
  and a separate release instruction.
- Use en dash in product copy and preserve meaningful one-line interface copy
  whenever the container has room.

## RISKS AND MITIGATIONS

| Risk | Impact | Mitigation |
|---|---|---|
| Small early cohorts reveal household behavior | Privacy loss | No household view; segment suppression below five; aggregate DTO only |
| A linear funnel mislabels legitimate direct flows | Wrong product decisions | Separate milestone ladder, strict journey, and direct-path counts |
| Event absence is mistaken for outage | False alarm | Dedicated `insufficient_traffic` state and explicit telemetry limitations |
| Operator route relies only on hidden navigation | Unauthorized disclosure | Server-side allowlist at route and repository boundaries, fail closed |
| CLI and UI drift | Conflicting numbers | One shared versioned metric contract and parity fixtures |
| Analytics changes product behavior | Canonical regression | Read-only repositories and unchanged non-blocking event writes |
| Large event scans slow Neon | Production degradation | Bounded windows, timeout, query-plan evidence, index only if justified |
| Retention deletes the wrong data | Irrecoverable loss | ProductEvent-only predicate, fixed cutoff, fixed batch ceiling, dry run |
| Health badge claims signals not measured | False confidence | Enumerate unavailable runtime and provider telemetry explicitly |
| Tracking scope expands during implementation | Privacy and trust loss | No SDK, client collector, raw view, export, or new event without conflict report |

## DECISIONS LOG

1. KE-031 is first-party measurement because the current canonical server
   boundaries already provide the facts needed for launch decisions.
2. The primary model is a milestone ladder because family journeys may
   legitimately skip proposal or shopping milestones.
3. A strict journey remains visible as diagnostic evidence, but direct paths
   are reported separately rather than treated as household failure.
4. `Asia/Ho_Chi_Minh` is the reporting timezone because household day and meal
   semantics are already local to the target launch market.
5. Time to value has two definitions: first operational action and first
   completed meal. Both use mature cohorts, median, and p75.
6. Page views and sign-ins are excluded because they do not prove that the
   housekeeper delivered food-management value.
7. Occasion adoption is measured only from explicit plan edits, meal runs, and
   completions. Absence receives no behavioral interpretation.
8. Segment suppression begins below five households. Overall headline counts
   may remain exact because they do not expose a segmented household attribute.
9. The phase-one operator is authorized by a server-only Clerk ID allowlist.
   This is smaller and safer than introducing an unneeded role database.
10. Unauthorized signed-in users receive not found so the private surface does
    not advertise its existence.
11. No operator link appears in the family application because operator work is
    not a household feature.
12. Runtime errors, API latency, AI-provider failures, and infrastructure health
    are explicitly unavailable from `ProductEvent`. External observability is
    deferred rather than simulated.
13. Existing ProductEvent indexes are presumed sufficient only until temporary
    Neon query plans prove otherwise. Schema changes require measured evidence.
14. Product-event retention is 365 days to balance launch cohort analysis with
    privacy minimization. Canonical family records are never included.
15. A dashboard attention state is a deterministic guardrail, not an external
    pager or automated decision.
16. No new product event is currently approved. The Builder must report a
    conflict before extending the event contract.
17. One Homeowner approval checkpoint is mandatory because KE-031 establishes
    access control, metric definitions, privacy thresholds, and bounded
    retention.

## APPROVAL CHECKPOINT

The Homeowner approved this exact blueprint by instructing the Contractor to
switch immediately to the Builder role on 2026-07-31. The equivalent approval
checkpoint is:

```text
DUYỆT BLUEPRINT KE-031
```

This approval authorizes the Builder to implement and verify only the scope above.
It does not authorize:

- applying a database change or retention operation to Neon main;
- committing, pushing, or deploying;
- installing an analytics or monitoring provider;
- exposing operator access to another user;
- changing any canonical household behavior.

After approval, the Contractor hands this frozen TIP to the Builder. The
Builder submits `design/COMPLETION-KE-031.md`; the Contractor then performs an
independent audit and submits `design/VERIFY-KE-031.md` before a separate
release decision.
