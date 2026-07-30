# TIP-KE-029 – Explicit Family Meal Memory

## HEADER

- TIP-ID: TIP-KE-029
- Project: Q's Kitchen / quynh-nutri
- Module: Post-meal reflection, household memory, and memory-guided week
  proposals
- Depends on: TIP-KE-017, TIP-KE-021, TIP-KE-025, TIP-KE-028
- Priority: P0
- Working directory: `/Users/os/quynh-nutri`
- Status: APPROVED – handed to Builder

## OBJECTIVE

Give the food housekeeper an explainable memory of what the household explicitly
said about completed meals, then use that memory as one transparent input to
future week-plan proposals.

The product must learn only from direct household feedback. It must not infer a
preference from opening a page, finishing a meal, leaving food, discarding food,
or accepting an earlier proposal.

## CURRENT GAP

The application can now plan, shop, coordinate cooking, close a meal, update
inventory, record leftovers, and report cost and waste. It still cannot answer
these household questions from durable evidence:

- Which dishes does this household want to repeat?
- Which meals usually feel too laborious?
- Which completed meals were perceived as too little or too much?
- Why did a future week proposal prefer one reviewed dish over another?

Existing favorites are manual bookmarks, not post-meal evidence. Existing meal
completions prove that cooking was confirmed, not that the household liked the
meal. Leftover and discard records must remain inventory evidence and must never
be converted silently into preference.

## REQUIREMENTS

| ID | Requirement | Priority |
|---|---|---:|
| KE29-001 | Capture household feedback only for a canonical household-owned `MealCompletion` | P0 |
| KE29-002 | Support three optional explicit dimensions: repeat intent, portion fit, and effort fit | P0 |
| KE29-003 | Require at least one dimension before saving and select no answer by default | P0 |
| KE29-004 | Allow the household to edit or explicitly delete its feedback with optimistic concurrency | P0 |
| KE29-005 | Never infer feedback from leftovers, inventory movement, completion, dwell time, clicks, favorites, or AI text | P0 |
| KE29-006 | Build one deterministic, read-only household meal-memory projection with exact evidence counts | P0 |
| KE29-007 | Keep low-evidence and conflicting feedback visible instead of collapsing it into a confident label | P0 |
| KE29-008 | Show memory on Reports and provide an optional post-meal reflection entry point without blocking leftover capture | P1 |
| KE29-009 | Use memory only as a soft ranking input to a transient week-plan proposal | P0 |
| KE29-010 | Preserve dietary restrictions, allergies, reviewed-guide coverage, locked slots, rotation rules, and canonical plan validation as higher-priority constraints | P0 |
| KE29-011 | Show every memory-guided plan change as the existing before → after diff with a human-readable evidence reason | P0 |
| KE29-012 | Apply no plan change before the existing KE-017 explicit confirmation action succeeds | P0 |
| KE29-013 | AI may read and explain meal memory but may not create, edit, delete, or reinterpret feedback | P0 |
| KE29-014 | Portion feedback must not automatically change shopping quantities, nutrition values, or household size | P0 |
| KE29-015 | Product events remain aggregate and contain no dish names, response values, notes, or member data | P1 |
| KE29-016 | All feedback and memory reads are household scoped, retry safe, and covered for two-device conflicts | P0 |
| KE29-017 | The reflection and memory UI remain usable without horizontal overflow at 375 px in light and dark themes | P1 |

## BLUEPRINT

### 1. Canonical explicit feedback

Add one household-owned feedback row per completed dish:

```text
MealFeedback
  id
  householdId
  mealCompletionId
  dishRef
  idempotencyKey
  repeatIntent      repeat | neutral | avoid | null
  portionFit        too_little | right | too_much | null
  effortFit         easy | manageable | too_much | null
  version
  createdByUserId
  updatedByUserId
  createdAt
  updatedAt
```

Constraints:

- Unique by `mealCompletionId` and `dishRef`.
- Unique by household and `idempotencyKey`.
- The referenced completion must belong to the authenticated household.
- `dishRef` must be present in that completion's immutable `dishRefs`.
- At least one feedback dimension must be non-null.
- No dimension is selected by default.
- Create and update validate an expected version.
- A stale update returns the canonical feedback and never silently overwrites
  it.
- Explicit deletion requires the current version and a separate confirmation
  control.
- Deleted feedback contributes no future memory or proposal evidence.
- No free-text note is added in KE-029.

This row records what the household said. It does not record whether the
statement is objectively true and it does not become a nutrition or safety
fact.

### 2. Deterministic memory projection

Add a pure `buildHouseholdMealMemory` projection from:

- household-owned completed meals;
- explicit, non-deleted feedback;
- resolved household and B0 dish labels;
- canonical busy-day settings for explanation only.

For every dish with feedback, expose exact aggregates:

```text
DishMealMemory
  dishId
  feedbackCount
  repeatCount
  neutralCount
  avoidCount
  tooLittleCount
  rightPortionCount
  tooMuchCount
  easyCount
  manageableCount
  tooMuchEffortCount
  evidenceState       single | emerging | established | mixed
  latestFeedbackAt
```

Evidence semantics:

- `single`: one explicit feedback record.
- `emerging`: two or three records without a strong conflict.
- `established`: at least four records with one repeat-intent answer holding a
  strict majority.
- `mixed`: at least two repeat-intent answers exist and no answer holds a strict
  majority.

The projection exposes counts and state. It must not produce psychological,
medical, or family-member-level conclusions.

### 3. Reflection experience

Add an optional “Nhà mình thấy từng món thế nào?” entry point:

- after the leftover flow is closed;
- on the recent completed-meal section of Reports;
- never as a blocking requirement to finish cooking or record leftovers.

The review sheet groups completed dishes as compact accordions. Each dish has
three compact question groups:

1. Muốn ăn lại: `Muốn lặp lại`, `Tạm ổn`, `Không ưu tiên`.
2. Khẩu phần: `Hơi thiếu`, `Vừa`, `Hơi dư`.
3. Công chuẩn bị: `Nhẹ nhàng`, `Vừa sức`, `Quá mất công`.

The household may answer one or more dishes and leave the rest untouched. The
final review shows only the options explicitly selected for each dish. Saving
requires one explicit confirmation. Closing or cancelling writes nothing.

Existing feedback opens in edit mode. Deletion uses a separate destructive
confirmation and does not occur from clearing an individual option.

### 4. Household memory on Reports

Add one read-only “Nhà mình đang ghi nhớ” section to Reports:

- recent completed meals that still have no feedback;
- dishes with exact repeat-intent counts;
- portion and effort patterns as counts;
- evidence-state label and limitation copy;
- a clear empty state when there is not enough explicit feedback.

Do not rank family members, display health claims, or present a single opaque
score.

### 5. Memory-guided week proposal

Extend the existing deterministic week proposal builder, not the model:

- current hard safety and household constraints run first;
- locked slots remain identical;
- reviewed dish coverage remains mandatory for cooking claims;
- explicit `repeat` is a soft positive signal;
- explicit `avoid` is a soft negative signal, never a hard exclusion;
- `too_much` effort is a soft negative signal on declared busy days;
- portion feedback is explanation-only in KE-029;
- mixed evidence adds no ranking preference;
- no feedback keeps the existing rotation behavior unchanged.

Each changed slot may carry one or more bounded reason codes:

```text
explicit_repeat
explicit_avoid
busy_day_effort
rotation
household_constraint
insufficient_memory
```

The proposal card renders exact before → after dishes and a plain-language
reason based on those codes and evidence counts. The proposal stays transient.
The existing KE-017 confirmation boundary remains the only plan mutation path.

### 6. Assistant boundary

Add a read-only `household_meal_memory` tool that returns the deterministic
projection.

The assistant may:

- explain exact feedback counts;
- state when evidence is single, emerging, established, or mixed;
- open the existing proposal flow when the user asks for a new week.

The assistant may not:

- create or edit feedback;
- infer that leftovers mean dislike;
- turn favorites into post-meal feedback;
- choose a family member’s opinion;
- emit an actionable replacement week outside the proposal diff;
- apply a proposal.

### 7. Privacy-minimal measurement

If product measurement is added, allow only aggregate events:

```text
meal_feedback_saved
  dimensionsAnswered: 1 | 2 | 3
  isEdit: boolean

meal_feedback_deleted
  hadAllDimensions: boolean

memory_guided_proposal_created
  changedSlotCount: number
  reasonCategoryCount: number
  evidenceState: none | single | emerging | established | mixed
```

Do not store dish IDs, dish names, selected response values, notes, member data,
health data, completion IDs, or proposal contents in product event properties.

## PROPOSED PRODUCT DIFF

### Added

- Canonical `MealFeedback` with optimistic concurrency.
- Optional post-meal reflection for completed meals.
- Deterministic household meal-memory projection.
- Read-only memory section on Reports.
- Privacy-minimal feedback lifecycle measurement.
- Read-only assistant memory tool.

### Changed

- Week-plan proposal ranking may use explicit memory as a soft input.
- Proposal changes include bounded, explainable reason codes.
- The existing plan diff explains when explicit feedback affected a candidate.

### Unchanged

- Meal completion remains evidence of cooking, not preference.
- Leftovers, discard, favorites, clicks, and dwell time never become feedback.
- Nutrition, safety, restrictions, allergies, locks, and reviewed guides remain
  higher-priority deterministic constraints.
- Portion feedback does not change quantities.
- AI receives no feedback or plan mutation tool.
- Unconfirmed proposals remain transient and write nothing.
- The canonical week plan changes only through KE-017 explicit confirmation.

## EXPECTED FILE SCOPE

### New

- `prisma/migrations/<timestamp>_meal_feedback/migration.sql`
- `src/domain/feedback/meal-memory.ts`
- `src/domain/feedback/meal-memory.test.ts`
- `src/data/repo/meal-feedback.ts`
- `src/data/repo/meal-feedback.test.ts`
- `src/ui/components/MealReflectionSheet.tsx`
- `src/ui/components/HouseholdMealMemoryCard.tsx`
- `e2e/meal-memory.spec.ts`
- `design/COMPLETION-KE-029.md`
- `design/VERIFY-KE-029.md`

### Modified

- `prisma/schema.prisma`
- `src/domain/types.ts`
- `src/domain/assistant/week-plan-proposal.ts`
- `src/lib/assistant/week-plan-proposal.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/agent.ts`
- `src/app/actions.ts`
- `src/data/repo/household.ts`
- `src/ui/store.tsx`
- `src/ui/components/AssistantSheet.tsx`
- `src/ui/components/LeftoverCaptureSheet.tsx`
- `src/app/(tabs)/reports/page.tsx`
- `src/domain/product-events.ts`
- `src/i18n/vn.json`
- `src/i18n/en.json`
- Related unit, repository, and E2E tests

## ACCEPTANCE CRITERIA

### AC-01 – Explicit evidence only

Given a completed meal has leftovers, discard, favorites, or page activity
When no household feedback was saved
Then the memory projection contains no preference evidence for that meal

### AC-02 – Optional reflection

Given a canonical completed meal
When the reflection sheet first opens
Then no answer is selected
And closing the sheet writes nothing

### AC-03 – Valid feedback

Given the household selected at least one feedback dimension
When it confirms the review
Then one household-scoped feedback row is saved
And retrying the same idempotency key creates no duplicate

### AC-04 – Empty feedback rejected

Given no feedback dimension is selected
When the household views the final control
Then save remains disabled
And no empty canonical feedback row can be created through the server action

### AC-05 – Safe edit

Given feedback exists at version N
When the household confirms an edit using version N
Then the canonical row advances once
And a stale device receives the newer canonical feedback without overwrite

### AC-06 – Explicit deletion

Given feedback exists
When the household confirms deletion with the current version
Then the feedback no longer contributes to memory
And the associated meal completion remains unchanged

### AC-07 – Explainable memory

Given multiple feedback rows for one dish
When memory is built
Then every displayed count equals the explicit source rows
And the evidence state follows the documented deterministic thresholds

### AC-08 – Conflicting evidence

Given repeat and avoid answers exist without a strict majority
When memory is built
Then the state is `mixed`
And proposal ranking applies no preference signal from that dish

### AC-09 – Hard constraints win

Given a highly repeated dish conflicts with a current restriction, allergy, lock,
or reviewed-guide requirement
When a proposal is generated
Then the hard constraint wins
And the proposal does not use preference to bypass it

### AC-10 – Explainable diff

Given explicit memory affects a candidate
When the week proposal is shown
Then every changed slot still displays before → after
And the proposal names a bounded reason with the exact evidence count

### AC-11 – No silent plan write

Given a memory-guided proposal exists
When the household closes or discards it
Then the canonical plan version and slots remain unchanged

### AC-12 – Stale plan safety

Given the canonical plan changes after proposal creation
When the household confirms the stale proposal
Then KE-017 rejects it
And memory does not silently regenerate or rebase the candidate

### AC-13 – Portion boundary

Given the household reports that a meal was too little or too much
When memory and shopping are rebuilt
Then the feedback appears as an explicit count
And shopping quantities, nutrition values, and household size remain unchanged

### AC-14 – AI read-only boundary

Given the assistant reads household memory
When asked to mark a dish liked, delete feedback, or apply a plan
Then it explains that explicit household confirmation is required
And performs no write

### AC-15 – Tenant isolation

Given two households have completed meals and feedback
When either household loads, edits, deletes, or proposes
Then it can access only its own feedback and memory

### AC-16 – Responsive interface

Given a 375 px viewport in light and dark themes
When reflection, memory, and proposal reasons render with long Vietnamese labels
Then there is no horizontal overflow, clipped control, em dash, or avoidable
single orphan word

## QUALITY GATES

- Prisma migration validates and applies to a clean database branch.
- TypeScript and ESLint pass.
- Typography policy passes.
- Unit tests cover aggregation thresholds, mixed evidence, ranking boundaries,
  and unchanged quantities.
- Repository tests cover idempotency, household isolation, stale edit, and
  explicit deletion.
- E2E covers cancel, save, edit conflict, delete, memory display, proposal diff,
  stale proposal, AI read-only behavior, and 375 px layout.
- Production build passes.
- Full existing E2E, onboarding, security, marketing, and stress gates pass.
- Neon main migration, commit, push, and production deploy require a separate
  explicit release instruction after local verification.

## CONSTRAINTS

- Read the relevant Next.js 16.2 local data mutation and security guides before
  implementation.
- Do not derive preference from behavior or operational kitchen facts.
- Do not add free-text feedback in KE-029.
- Do not add a generic task table or local done ledger.
- Do not let AI create, edit, delete, or repair feedback.
- Do not let preference bypass health, safety, restriction, allergy, lock,
  reviewed-guide, or canonical plan validation.
- Do not change portion, nutrition, inventory, or shopping quantities from
  feedback.
- Reuse the existing meal completion, Reports canvas, product-event allowlist,
  household repository, optimistic concurrency, and KE-017 proposal diff.
- Use en dash in product copy and preserve meaningful one-line interface copy
  when the container has room.

## DECISIONS LOG

1. KE-029 stores direct post-meal household feedback, not inferred preference.
2. One aggregate household response per completed dish is used in this package;
   per-member voting is deferred because it changes identity, consent, and
   conflict semantics.
3. No free text is accepted, keeping projection and assistant interpretation
   bounded.
4. Feedback is editable because it is a household statement, not an immutable
   operational fact. Meal completion remains immutable.
5. Explicit deletion removes feedback from memory while preserving the
   completed meal.
6. Preference is a soft ranking input only. Hard safety and household
   constraints always win.
7. Portion feedback is collected but does not alter quantities in this package.
8. Mixed evidence remains mixed and neutral in ranking.
9. The existing transient proposal and confirmation boundary is extended rather
   than adding a proposal table.
10. One Blueprint approval checkpoint is retained because KE-029 adds a
    canonical table and changes week-candidate ranking.
11. The Homeowner approved correcting feedback granularity from one row per
    completion to one row per completed dish. This prevents a meal-level answer
    from being copied silently to every dish in a 1–5 dish completion.

## APPROVAL CHECKPOINT

The Homeowner approved KE-029 and the per-dish feedback correction. The TIP is
handed from Contractor to Builder.
