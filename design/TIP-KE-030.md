# TIP-KE-030 – Nhịp ăn cả ngày có nguồn sự thật

## HEADER

- TIP-ID: TIP-KE-030
- Project: Q's Kitchen / quynh-nutri
- Module: Weekly planning, daily nutrition, shopping, kitchen execution, and
  meal completion
- Depends on: TIP-KE-017, TIP-KE-021, TIP-KE-025, TIP-KE-028, TIP-KE-029
- Priority: P0
- Working directory: `/Users/os/quynh-nutri`
- Status: APPROVED – handed to Builder on 2026-07-30

## OBJECTIVE

Evolve the current one-family-meal-per-day model into an explicit daily eating
rhythm with four meal occasions:

```text
breakfast | lunch | dinner | snack
```

The household can plan, shop, cook, close, and review any occasion that it
explicitly fills. Existing plans and completed meals remain `dinner`. Empty
occasions remain empty. Neither the rotation engine nor AI may invent breakfast,
lunch, or snack content.

KE-030 is the canonical foundation for managing a whole day of eating. It is
not permission to fabricate a new recipe catalogue, infer what a household ate,
or silently multiply the current dinner plan into four meals.

## CURRENT GAP

The current canonical model identifies a planned item only by:

```text
week + day + food slot
```

`COM`, `MAN`, `RAU`, `CANH`, and `TRANGMIENG` describe a dish's role in a meal.
They do not identify breakfast, lunch, dinner, or snack. Consequently:

- one day can contain only one dish per food slot;
- cooking sessions and meal completions are scoped only by week and day;
- nutrition can describe the current family meal but cannot distinguish a
  complete day;
- shopping cannot explain which meal occasion created demand;
- meal feedback knows the completed dish but not the occasion;
- adding all-day planning by overloading `slot` would corrupt existing domain
  meaning.

## REQUIREMENTS

| ID | Requirement | Priority |
|---|---|---:|
| KE30-001 | Add one canonical `MealOccasion` dimension independent of the existing food `Slot` | P0 |
| KE30-002 | Backfill every existing planned slot and meal completion as `dinner` without changing dish, lock, version, or timestamp meaning | P0 |
| KE30-003 | Keep week-plan uniqueness at occasion granularity: one food slot per day and occasion | P0 |
| KE30-004 | Permit a household to add, replace, lock, unlock, or explicitly remove a reviewed dish in any occasion | P0 |
| KE30-005 | Generate and regenerate only `dinner` in KE-030; never auto-fill the other three occasions | P0 |
| KE30-006 | Show all four occasions on the Week page with a compact mobile-safe selector and an honest empty state | P0 |
| KE30-007 | Aggregate shopping and daily nutrition from every explicitly planned occasion exactly once | P0 |
| KE30-008 | Scope meal-run sessions, closeout, completion, inventory consumption, leftovers, and feedback to the selected occasion | P0 |
| KE30-009 | Preserve existing dinner sessions through a deterministic scope-key migration | P0 |
| KE30-010 | Keep KE-017 proposal diffs and memory-guided regeneration dinner-only until an occasion-specific reviewed repertoire is approved | P0 |
| KE30-011 | Allow AI to read and explain occasion-labelled facts but never fill, remove, move, complete, or repair an occasion | P0 |
| KE30-012 | Keep completion, feedback, inventory, and product events household scoped, idempotent, and privacy minimal | P0 |
| KE30-013 | Do not reinterpret a missing occasion as skipped, completed, unhealthy, or forgotten | P0 |
| KE30-014 | Preserve current dinner behavior and URLs for households that do not use the new occasions | P0 |
| KE30-015 | Keep desktop sentence-style copy on one line where space allows and prevent overflow or orphan words at 375 px | P1 |
| KE30-016 | Apply no Neon main migration, commit, push, or production deployment without a separate release instruction after verification | P0 |

## BLUEPRINT

### 1. Domain vocabulary

Add one shared type:

```ts
type MealOccasion = "breakfast" | "lunch" | "dinner" | "snack";
```

Canonical labels:

```text
breakfast  Bữa sáng
lunch      Bữa trưa
dinner     Bữa tối
snack      Bữa phụ
```

The existing `Slot` type remains unchanged. Its meaning is still a dish's role:
rice, main, vegetable, soup, or fruit/dessert.

Extend `PlannedSlot`:

```text
day
occasion
slot
dishId
locked
```

The canonical key becomes:

```text
day + occasion + slot
```

Sorting is deterministic by day, occasion order, food-slot order, then dish ID.

### 2. Additive and reversible data migration

Add a PostgreSQL and Prisma enum `MealOccasion`, then add:

```text
DaySlot.occasion         MealOccasion default dinner
MealCompletion.occasion MealOccasion default dinner
```

Migration rules:

1. Add the enum and nullable columns.
2. Backfill every existing row to `dinner`.
3. Make both columns non-null with database default `dinner`.
4. Replace `DaySlot(weekPlanId, day, slot)` uniqueness with
   `DaySlot(weekPlanId, day, occasion, slot)`.
5. Extend the meal-completion source uniqueness and household index with
   `occasion`.
6. Rewrite only `KitchenSession.kind = "meal-run"` scope keys from
   `week:day` to `week:day:dinner`.
7. Leave dish-specific `cooking` sessions unchanged.
8. Add a migration guard that fails on an unrecognized or colliding legacy
   meal-run scope instead of deleting or choosing one.

The database default exists for migration safety. Application writes must
always send `occasion` explicitly.

Rollback SQL may remove only the new non-dinner rows after an explicit operator
decision. It must never silently collapse four occasions back into one food
slot.

### 3. Week-plan persistence and validation

Update repository mapping, E2E memory storage, optimistic version comparison,
and validation to include `occasion`.

Rules:

- At most 140 canonical entries are possible: 7 days × 4 occasions × 5 food
  slots.
- A duplicate `day + occasion + slot` is rejected.
- Dish ownership, dish-slot match, allergies, restrictions, and health safety
  remain mandatory.
- Removing a slot is an explicit confirmed user action.
- Removing a locked slot requires unlocking it first.
- Saving one occasion still uses the canonical week-plan version, so a stale
  device receives the newer canonical plan and cannot overwrite it.
- A retry of the same accepted state produces no extra write.

### 4. Honest generation boundary

The existing rotation engine and memory-guided proposal engine remain dinner
engines in KE-030.

Generation behavior:

- Initial week creation produces the same seven dinner plans as today.
- “Đổi cả tuần” proposes changes to dinner only.
- Existing locks on dinner remain effective.
- Existing breakfast, lunch, and snack rows remain byte-for-byte identical in
  the proposed candidate.
- The diff includes the occasion label on every changed row.
- Confirmation still passes through KE-017 canonical version validation.
- Closing, cancelling, or discarding a proposal writes nothing.

No current B0 or B1 dish receives an inferred meal-occasion eligibility label.
The household may explicitly select any owned and safety-valid reviewed dish
for an occasion. Automatic occasion-specific recommendations are deferred until
the repertoire is reviewed for that purpose.

### 5. Week-page experience

Keep the current Week page canvas and add one compact occasion selector below
the day selector:

```text
[Sáng] [Trưa] [Tối] [Bữa phụ]
```

Behavior:

- Default selection is `dinner` for backward continuity, not the current clock
  time.
- The selected occasion renders the five existing food roles.
- An absent role renders a compact add control, not a generated placeholder
  dish.
- Dish selection uses the existing household-safe catalogue and cooking-guide
  coverage.
- An explicit remove control appears only for a present, unlocked item.
- The page summary distinguishes planned occasions from dish count.
- Mobile selectors scroll horizontally inside their own region without
  clipping the page or creating document-level horizontal overflow.
- Occasion controls share the established app height, radius, alignment,
  padding, typography, light theme, and dark theme tokens.

Empty-state copy must say that the household has not planned this occasion. It
must not say the meal was skipped or that the app will fill it automatically.

### 6. Shopping and nutrition projections

Shopping aggregation consumes all canonical planned slots. The same dish
planned in two occasions contributes twice because it represents two explicit
meal uses.

Add occasion provenance to internal shopping calculation rows so tests and
operator diagnostics can trace demand. Do not expose sensitive dish-level
provenance in product events.

Nutrition behavior:

- day totals include every explicitly planned occasion;
- occasion totals are separately calculable and displayable;
- coverage describes planned data only;
- an empty occasion contributes zero and is labelled not planned;
- current confidence, honest-null, macro, micro, and source rules remain
  unchanged;
- the app must not claim a complete-day nutrition assessment when one or more
  occasions are empty.

### 7. Cooking, completion, leftovers, and feedback

Meal-run scope becomes:

```text
weekRef:day:occasion
```

Extend all relevant inputs and canonical results with `occasion`:

- load, save, and clear meal-run session;
- meal-run payload validation;
- closeout confirmation;
- `MealCompletion`;
- completion repository mapping and idempotent replay;
- dashboard readiness and recent completion projections;
- leftover capture source context;
- meal reflection and household memory explanation.

Closeout rules:

- only reviewed dishes planned for the exact day and occasion are allowed;
- inventory consumption and leftover creation remain explicit;
- completing lunch cannot close dinner or delete its active session;
- completing one occasion creates no completion for another occasion;
- retry and two-device conflict behavior remain canonical;
- feedback stays tied to an immutable completed dish and inherits the
  completion's occasion for display only.

Existing standalone per-dish cooking-guide sessions keep their current dish ID
scope because they are not evidence that a meal occasion occurred.

### 8. Overview, reports, and daily housekeeper brief

Update deterministic projections rather than adding a task or status table.

Overview:

- the daily rhythm shows the four occasions and their factual state:
  `not_planned`, `planned`, `in_kitchen`, or `completed`;
- those states are derived from the canonical plan, active session, and
  immutable completion;
- no stored `done` flag is introduced;
- the primary action opens the selected factual occasion.

Daily housekeeper brief:

- groups preparation, shopping demand, cooking readiness, and completion by
  occasion;
- does not create work items;
- does not call an empty occasion overdue;
- preserves the current source explanation.

Reports and memory:

- completed-meal labels include occasion;
- counts remain exact household evidence;
- historical dinner rows display as dinner after migration;
- no preference is inferred from occasion choice or absence.

### 9. Assistant and KE-017 boundary

Read tools may include `occasion` in:

- current week-plan facts;
- shopping explanations;
- kitchen readiness;
- daily housekeeper brief;
- meal completion and household memory summaries.

The assistant may explain:

- what is planned for a named occasion;
- which occasions are still unplanned;
- how an explicitly planned occasion affects shopping or nutrition;
- why the current automatic proposal changes dinner only.

The assistant may not:

- infer what the household ate from time of day;
- add, remove, copy, move, complete, or repair an occasion;
- mark an unplanned occasion as skipped;
- generate an occasion-specific repertoire classification;
- apply a plan or bypass the visible proposal diff;
- reinterpret dinner feedback as breakfast or lunch preference.

Any later AI proposal that changes occasions must receive its own approved
blueprint and must still show a before → after diff before confirmation.

### 10. Privacy-minimal measurement

Extend only bounded aggregate events:

```text
meal_run_started
  occasion: breakfast | lunch | dinner | snack
  dishCount: 1..5

meal_completed
  occasion: breakfast | lunch | dinner | snack
  dishCount: 1..5
  inventoryMovementCount: 0..100
  openedLeftoverCapture: boolean

meal_occasion_edited
  occasion: breakfast | lunch | dinner | snack
  action: add | replace | remove
```

Do not emit dish IDs, dish names, food slots, nutrition values, health data,
member data, notes, completion IDs, session IDs, or full plan contents.

Page views and time of day do not prove meal activity and must not create these
events.

## PROPOSED PRODUCT DIFF

### Added

- Four explicit meal occasions in the canonical week plan.
- Occasion-aware cooking sessions and immutable meal completions.
- Compact all-day selector and honest empty states on the Week page.
- Occasion-level daily nutrition and factual overview rhythm.
- Occasion provenance through shopping, leftovers, reports, and memory.
- Privacy-minimal occasion lifecycle measurement.

### Changed

- Canonical plan identity changes from `day + slot` to
  `day + occasion + slot`.
- Existing plans, sessions, and completions are migrated to `dinner`.
- Shopping and daily nutrition aggregate all explicitly planned occasions.
- Dashboard and housekeeper brief distinguish factual occasion states.
- Existing plan proposal rows display an occasion label.

### Unchanged

- The five food-slot meanings and the 49 reviewed dishes.
- Existing household restrictions, allergies, health safeguards, confidence,
  provenance, and honest-null behavior.
- Automatic generation and memory-guided regeneration remain dinner-only.
- AI remains read-only for household facts and cannot mutate plans or
  completions.
- All proposal writes still require the KE-017 visible diff and explicit
  confirmation.
- No generic task table, stored `done` flag, inferred meal, or fabricated
  recipe is added.

## EXPECTED FILE SCOPE

### New

- `prisma/migrations/<timestamp>_meal_occasions/migration.sql`
- `src/domain/planning/meal-occasion.ts`
- `src/domain/planning/meal-occasion.test.ts`
- `e2e/meal-occasions.spec.ts`
- `design/COMPLETION-KE-030.md`
- `design/VERIFY-KE-030.md`

### Modified

- `prisma/schema.prisma`
- `src/domain/types.ts`
- `src/domain/planning/persisted-week-plan.ts`
- `src/domain/rotation/engine.ts`
- `src/domain/assistant/week-plan-proposal.ts`
- `src/domain/shopping/aggregator.ts`
- `src/domain/nutrition/*`
- `src/domain/kitchen-execution/*`
- `src/data/repo/week-plan.ts`
- `src/data/repo/kitchen-session.ts`
- `src/data/repo/meal-completion.ts`
- `src/data/repo/household.ts`
- `src/domain/product-events.ts`
- `src/app/actions.ts`
- `src/ui/store.tsx`
- `src/app/(tabs)/week/page.tsx`
- `src/app/(tabs)/overview/page.tsx`
- `src/app/(tabs)/reports/page.tsx`
- Relevant assistant read projections and UI components
- `src/i18n/vn.json`
- `src/i18n/en.json`
- Related unit, repository, and E2E tests

The Builder may narrow this list when an existing abstraction already owns the
behavior. Expanding the architecture or introducing a new dependency requires a
Contractor conflict report and a new approval.

## ACCEPTANCE CRITERIA

### AC-01 – Lossless dinner migration

Given canonical data exists before KE-030
When the migration is applied
Then every planned slot and meal completion is labelled `dinner`
And dish references, locks, versions, timestamps, feedback, movements, and
leftovers are unchanged

### AC-02 – Independent canonical keys

Given breakfast and dinner both contain a `MAN` dish on the same day
When the plan is saved
Then both rows persist independently
And a duplicate food slot within the same occasion is rejected

### AC-03 – No invented meals

Given only dinner exists after migration
When the household opens Week, Overview, nutrition, shopping, and the assistant
Then breakfast, lunch, and snack remain explicitly unplanned
And no dish, completion, warning, or shopping demand is generated for them

### AC-04 – Explicit occasion editing

Given an empty unlocked occasion slot
When the household explicitly selects a safety-valid reviewed dish
Then the visible plan diff identifies day, occasion, food role, and dish
And only confirmation writes the canonical change

### AC-05 – Explicit removal

Given an unlocked planned dish
When the household confirms removal
Then only that day, occasion, and food slot is removed
And closing the confirmation writes nothing

### AC-06 – Locked-slot safety

Given a planned occasion slot is locked
When replace or remove is attempted
Then the mutation is rejected until the household explicitly unlocks it

### AC-07 – Dinner-only regeneration

Given breakfast, lunch, or snack contains explicit dishes
When “Đổi cả tuần” creates a proposal
Then those rows are unchanged
And every proposed change is labelled dinner with the existing before → after
diff

### AC-08 – Exact shopping aggregation

Given one ingredient is needed by two explicitly planned occasions
When shopping is calculated
Then both uses contribute exactly once
And an empty occasion contributes nothing

### AC-09 – Honest daily nutrition

Given only some occasions are planned
When daily nutrition is shown
Then occasion and day totals equal only the planned dishes
And the interface does not claim complete-day coverage

### AC-10 – Isolated meal-run sessions

Given lunch and dinner both have active kitchen sessions
When lunch is saved, completed, or cleared
Then the dinner session and version remain unchanged

### AC-11 – Exact completion scope

Given lunch is selected
When closeout is confirmed
Then only reviewed lunch dishes can enter the immutable completion
And inventory movements, leftovers, and feedback reference that completion

### AC-12 – Idempotency and stale-device safety

Given a completion or plan mutation has already succeeded
When it is retried or submitted from a stale device
Then no duplicate is created
And the stale request cannot overwrite canonical state

### AC-13 – Derived overview only

Given plans, active sessions, and completions change
When Overview is loaded
Then each occasion state is derived from those canonical facts
And no task row or mutable `done` state exists

### AC-14 – AI read-only boundary

Given the assistant can read occasion-labelled facts
When asked to fill, copy, remove, complete, or repair an occasion
Then it explains that the household must perform and confirm the action
And no write occurs

### AC-15 – Tenant and event privacy

Given two households use different occasions
When either reads, edits, completes, reports, or emits product events
Then it can access only its own canonical data
And no event contains dish, member, health, nutrition, note, or plan content

### AC-16 – Responsive and typographic integrity

Given 375 px and desktop viewports in light and dark themes
When selectors, empty states, long Vietnamese labels, and proposal diffs render
Then there is no document-level horizontal overflow, clipped control, em dash,
or avoidable single orphan word

## QUALITY GATES

- Before implementation, read the relevant Next.js 16.2 local guides under
  `node_modules/next/dist/docs/` for Server Actions, data mutation, caching,
  authentication, and security.
- Prisma schema validates.
- Migration applies to a fresh database and a temporary Neon branch containing
  the current nine migrations.
- A migration verification test proves the old uniqueness key is replaced,
  dinner backfill is explicit, and meal-run scope migration is guarded.
- `npx tsc --noEmit` passes.
- `npm run lint` and the typography policy pass.
- Unit tests cover occasion ordering, plan validation, dinner-only generation,
  aggregation, nutrition honesty, readiness, and assistant boundaries.
- Repository tests cover tenant isolation, optimistic concurrency, idempotency,
  exact completion scope, and independent sessions.
- Focused E2E covers add, replace, remove, lock, proposal cancel and confirm,
  shopping, nutrition, cooking, completion, leftovers, feedback, and AI refusal.
- Responsive E2E covers 375 px and desktop in light and dark themes.
- `npm test` passes.
- `npm run build` passes.
- Full `npm run test:e2e`, onboarding, security, marketing, stress, and
  production audit gates pass.
- `git diff --check` passes.
- Builder submits `design/COMPLETION-KE-030.md` with commands and evidence.
- Contractor independently submits `design/VERIFY-KE-030.md` before any release.
- Neon main, commit, push, and production deployment remain separate,
  explicitly approved release actions.

## CONSTRAINTS

- Do not overload the existing food `Slot` enum with time-of-day meaning.
- Do not auto-copy dinner into any other occasion.
- Do not add or classify recipes without a separately reviewed source package.
- Do not infer a meal from time, app activity, shopping, inventory, or
  leftovers.
- Do not create a generic task table, mutable `done` state, or parallel source
  of truth.
- Do not allow AI to create, edit, delete, complete, or repair an occasion.
- Do not let occasion support bypass restrictions, allergies, health safety,
  reviewed cooking guides, locks, or canonical plan validation.
- Do not change the approved dinner rotation or memory ranking rules.
- Reuse the current week plan, shopping, nutrition, kitchen session, immutable
  completion, leftovers, feedback, assistant-read, and product-event patterns.
- Use en dash in product copy and preserve meaningful one-line interface copy
  whenever the container has room.
- No dependency or platform change is approved by this TIP.

## DECISIONS LOG

1. `MealOccasion` is a new axis because food role and eating time are different
   domain concepts.
2. Four occasions are used: breakfast, lunch, dinner, and snack. This is enough
   for phase-one family rhythm without introducing configurable clinical meal
   schedules.
3. Existing data becomes dinner because that is the current product's explicit
   family-meal contract, not a time-of-day inference from user behavior.
4. Automatic generation remains dinner-only because the 49 reviewed dishes
   have not been audited as an occasion-specific breakfast or snack repertoire.
5. Manual selection is allowed from the current safety-valid reviewed catalogue;
   the household, not AI, chooses whether a dish fits an occasion.
6. The existing food slots remain unchanged to protect nutrition, shopping,
   guide, and B1 override semantics.
7. Overview occasion state is a deterministic projection, not stored workflow
   state.
8. Meal completion gains occasion because immutable execution evidence must
   distinguish lunch from dinner on the same day.
9. Cooking-guide sessions remain dish scoped; meal-run sessions become occasion
   scoped.
10. Product measurement remains bounded and content-free.
11. Occasion-specific AI proposals and new recipe catalogue work are deferred
    because each requires its own evidence, UX, and approval boundary.
12. Marketing observability beyond the current activation script is deferred to
    KE-031 so KE-030 does not combine a canonical meal migration with a separate
    operator-analytics architecture.
13. One Homeowner approval checkpoint is mandatory because KE-030 changes
    canonical keys, migration behavior, and all meal execution paths.

## APPROVAL CHECKPOINT

The Homeowner approved the frozen blueprint with:

```text
DUYỆT BLUEPRINT KE-030
```

The Contractor handed the approved scope to the Builder. Release remains a
separate approval boundary.
