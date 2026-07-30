# TIP-KE-028 – Today Meal Stewardship

## HEADER

- TIP-ID: TIP-KE-028
- Project: Q's Kitchen / quynh-nutri
- Module: Daily meal execution and canonical closeout
- Depends on: TIP-KE-017, TIP-KE-021, TIP-KE-027
- Priority: P0
- Working directory: `/Users/os/quynh-nutri`
- Status: IMPLEMENTED LOCALLY – ready for Homeowner release approval

## OBJECTIVE

Turn the KE-027 answer “what should I do today?” into one complete and honest
meal execution loop:

1. Read today's dishes from the canonical meal plan.
2. Compare their recorded ingredients with real inventory.
3. Open the reviewed cooking and coordination flow.
4. Ask the household to review an exact closeout diff.
5. Record the meal, ingredient consumption, and leftovers only after explicit
   confirmation.
6. Feed those confirmed facts back into inventory and the next daily brief.

## CURRENT GAP

The project already has reviewed cooking guides, a multi-dish timeline,
cross-device kitchen sessions, inventory movements, and leftover capture.
However, completing a meal currently deletes the active kitchen session before
opening leftover capture. There is no canonical fact that the planned meal was
actually cooked.

Consequences:

- Today's `cook` or `coordinate-meal` agenda signal can return after a session
  has been completed.
- Inventory consumption is not connected to meal closeout.
- A meal with no leftovers leaves no durable execution evidence.
- Overview can open the meal plan but cannot show an honest ingredient
  readiness handoff.

## REQUIREMENTS

| ID | Requirement | Priority |
|---|---|---:|
| KE28-001 | Build one deterministic today-meal projection from the canonical plan, household dishes, inventory, reviewed guides, and confirmed meal completions | P0 |
| KE28-002 | Show planned dishes and ingredient presence as recorded, not-recorded, or unsupported without claiming quantity sufficiency | P0 |
| KE28-003 | Add a canonical household-scoped meal completion fact; it must not become a generated task or mutable local done flag | P0 |
| KE28-004 | Support one to five reviewed dishes in the existing coordinated meal session | P0 |
| KE28-005 | Keep unsupported dishes visible and never generate substitute cooking steps | P0 |
| KE28-006 | Before closeout, show the exact meal completion and inventory before/after diff | P0 |
| KE28-007 | Record only inventory lots and quantities explicitly selected by the household | P0 |
| KE28-008 | Commit meal completion and selected inventory movements in one idempotent server transaction | P0 |
| KE28-009 | Open the existing leftover capture after canonical completion and link new leftover lots to that completion | P0 |
| KE28-010 | Remove only confirmed dish IDs from today's cook/coordination signal; a newly changed planned dish must remain actionable | P0 |
| KE28-011 | Handle retry and multi-device conflicts without duplicate completion or inventory movement | P0 |
| KE28-012 | AI may explain readiness and open the canonical flow but may not confirm, consume inventory, create leftovers, or repair data | P0 |
| KE28-013 | Add a compact Overview entry point that fits 375 px, follows shared app geometry, and obeys the typography rules | P1 |
| KE28-014 | Add product measurement for explicit meal completion without storing food or health details in event properties | P1 |

## BLUEPRINT

### 1. Canonical completion fact

Add `MealCompletion` as a household-owned execution record:

```text
MealCompletion
  id
  householdId
  idempotencyKey
  weekRef
  day
  dishRefs
  sourceSessionCreatedAt
  completedAt
  createdByUserId
  createdAt
  updatedAt
```

Constraints:

- Indexed by household, week, and day for agenda projection.
- Unique by household, week, day, and source session creation time.
- Unique idempotency key inside the household.
- `dishRefs` stores only the explicitly completed reviewed dishes.
- This row is evidence that cooking was confirmed. It is not a task record and
  has no generic `done` state.
- A plan change does not rewrite historical dish references.
- A changed plan may create a later completion from a new kitchen session on
  the same day.

Add nullable provenance links:

- `InventoryMovement.sourceMealCompletionId`
- `LeftoverLot.mealCompletionId`

Existing inventory and leftover rows remain valid when those fields are null.

### 2. Pure readiness projection

Add `buildTodayMealReadiness` with no persistence and no AI:

```text
TodayMealReadiness
  calendarDate
  weekRef
  day
  plannedDishes[]
  supportedDishes[]
  unsupportedDishes[]
  ingredientPresence[]
  completedDishIds[]
  pendingDishIds[]
```

Ingredient presence uses cautious language:

- `recorded`: at least one positive canonical inventory lot exists.
- `not-recorded`: a reviewed recipe references the commodity but no positive
  inventory lot is recorded.
- `unsupported`: the dish or ingredient source is not sufficient for this
  comparison.

The projection never says an amount is sufficient unless units and quantities
are explicitly comparable. KE-028 does not introduce automatic unit
conversion.

### 3. Overview handoff

Add one compact “Bữa nhà mình hôm nay” card below the KE-027 daily brief:

```text
┌─ Bữa nhà mình hôm nay ─────────────────────┐
│ 5 món trong thực đơn · 4 có hướng dẫn      │
│ Kho đã ghi 8 · Chưa thấy 3 · Chưa hỗ trợ 1 │
│ [Xem đối chiếu]          [Mở phiên bữa ăn] │
└────────────────────────────────────────────┘
```

- The card follows the shared page canvas and card tokens.
- Counts describe recorded evidence, never real-world certainty.
- The detail sheet lists dish and commodity sources.
- Loading, unsynced, conflict, and already-confirmed states are visually
  distinct.
- One button opens the existing meal coordinator with today's canonical day
  and dishes.

### 4. Meal session and closeout

Extend the current coordinator from a minimum of two reviewed dishes to one
through five.

When all supported dishes have been manually marked finished:

1. Keep the canonical `KitchenSession`; do not delete it yet.
2. Open `MealCloseoutSheet`.
3. Show completed dish references.
4. Suggest relevant inventory lots for review, but select none by default.
5. The household explicitly selects a lot and enters the consumed quantity.
6. Show each selected lot as `before → after`.
7. Require one final confirmation.
8. In one transaction, create `MealCompletion` and selected
   `InventoryMovement` rows.
9. Only after success, clear the canonical kitchen session.
10. Open the existing leftover capture with the completion ID.

Closing or cancelling the review writes nothing and preserves the active
session.

### 5. Agenda and assistant integration

- `KitchenAgendaInput` receives confirmed meal completions.
- `cook` and `coordinate-meal` use only reviewed planned dishes not present in
  the canonical completion.
- Unsupported signals stay visible.
- KE-027 automatically reflects the new agenda result.
- The assistant receives the readiness projection as read-only evidence.
- Any meal-plan change remains governed by the KE-017 diff and explicit
  confirmation flow.

### 6. Product measurement

Add `meal_completed` with privacy-minimal properties:

```text
{
  dishCount: number,
  inventoryMovementCount: number,
  openedLeftoverCapture: boolean
}
```

Do not store dish names, commodity IDs, quantities, health data, notes, or
household member data in product event properties.

## PROPOSED PRODUCT DIFF

### Added

- Canonical `MealCompletion` record and migration.
- Nullable provenance from inventory movements and leftovers.
- Pure today-meal readiness engine.
- Compact Overview meal handoff and evidence sheet.
- Explicit meal closeout review with inventory before/after diff.
- `meal_completed` product event.

### Changed

- Meal coordination supports one reviewed dish.
- Finishing a session opens review before any destructive write.
- The kitchen agenda excludes only canonically completed dish IDs.
- Leftover capture links to a canonical meal completion.
- AI can read the projection but gains no mutation tool.

### Unchanged

- Meal-plan changes still require the KE-017 proposal diff and confirmation.
- Cooking steps still come only from reviewed guides.
- Shopping receipt, inventory lots, inventory movements, and leftover safety
  remain their own canonical workflows.
- No generic task table, local completion ledger, or automatic consumption is
  introduced.

## EXPECTED FILE SCOPE

### New

- `prisma/migrations/<timestamp>_meal_completion/migration.sql`
- `src/domain/kitchen-execution/meal-readiness.ts`
- `src/domain/kitchen-execution/meal-readiness.test.ts`
- `src/data/repo/meal-completion.ts`
- `src/data/repo/meal-completion.test.ts`
- `src/ui/components/TodayMealCard.tsx`
- `src/ui/components/MealCloseoutSheet.tsx`
- `e2e/meal-closeout.spec.ts`
- `design/COMPLETION-KE-028.md`
- `design/VERIFY-KE-028.md`

### Modified

- `prisma/schema.prisma`
- `src/domain/types.ts`
- `src/domain/kitchen-execution/kitchen-agenda.ts`
- `src/domain/kitchen-execution/kitchen-agenda.test.ts`
- `src/app/actions.ts`
- `src/data/repo/household.ts`
- `src/ui/store.tsx`
- `src/ui/components/MealCoordinatorSheet.tsx`
- `src/ui/components/MealRunMode.tsx`
- `src/ui/components/LeftoverCaptureSheet.tsx`
- `src/ui/hooks/useKitchenAgenda.ts`
- `src/app/(tabs)/overview/page.tsx`
- `src/lib/assistant/kitchen-agenda.ts`
- `src/lib/assistant/tools.ts`
- `src/domain/product-events.ts`
- `src/i18n/vn.json`
- `src/i18n/en.json`
- Related unit and E2E tests

## ACCEPTANCE CRITERIA

### AC-01 – Honest readiness

Given today's canonical plan references a reviewed ingredient
When a positive inventory lot exists
Then the UI says the ingredient is recorded in inventory
And it does not claim the recorded quantity is sufficient

### AC-02 – Unsupported source

Given a planned dish has no reviewed cooking guide
When readiness is built
Then the dish remains visible as unsupported
And no cooking steps are generated

### AC-03 – Cancelled closeout

Given all session dishes have been manually marked finished
When the household closes the closeout review
Then no meal completion or inventory movement is written
And the active kitchen session remains resumable

### AC-04 – Explicit inventory diff

Given a household selects an inventory lot and enters a valid quantity
When closeout is reviewed
Then the exact lot quantity before and after is displayed
And no unselected lot is included

### AC-05 – Atomic confirmation

Given a valid closeout diff
When the household confirms once
Then one meal completion and the selected inventory movements are committed in
one transaction
And a retry with the same idempotency key creates no duplicate

### AC-06 – Failed confirmation

Given the transaction fails
When the server returns an error
Then no partial completion or movement remains
And the active kitchen session stays available

### AC-07 – Daily brief feedback

Given the current planned reviewed dishes are canonically completed
When KE-027 is rebuilt
Then today's cook or coordination item disappears
And shopping, inventory, and leftover signals remain independently derived

### AC-08 – Changed plan after completion

Given the household completed dish A
When today's canonical plan is explicitly changed to dish B
Then dish B remains pending
And historical completion of dish A is not rewritten

### AC-09 – Leftover provenance

Given closeout succeeds
When the household records a leftover
Then the leftover lot links to the meal completion
And cancelling leftover capture does not undo the confirmed meal

### AC-10 – Multi-device safety

Given two devices review the same meal session
When the first confirms closeout
Then the second receives the canonical completion
And cannot duplicate consumption or overwrite it silently

### AC-11 – AI boundary

Given the assistant reads today's readiness
When asked to finish the meal or consume ingredients
Then it explains that household confirmation is required
And performs no write

### AC-12 – Responsive interface

Given a 375 px viewport in light and dark themes
When the card and closeout sheet render with long Vietnamese labels
Then there is no horizontal overflow, clipped control, em dash, or avoidable
single orphan word

## QUALITY GATES

- Prisma migration applies to a clean database and the connected Neon branch.
- TypeScript, lint, typography, unit, production build, full E2E, onboarding,
  security, marketing, and stress gates pass.
- Repository tests prove household isolation, transaction rollback,
  idempotency, and multi-device conflict behavior.
- Production migration, commit, push, and deployment require separate explicit
  authorization after local verification.

## CONSTRAINTS

- Read the relevant Next.js 16.2 local guides before writing implementation
  code.
- Do not create or mutate work through AI.
- Do not preselect inventory lots or infer consumed quantities.
- Do not remove unsupported dishes from the UI.
- Do not delete the active session before canonical closeout succeeds.
- Do not use analytics events as operational source of truth.
- Do not use an em dash in product copy.
- Reuse the existing app canvas, card geometry, bottom sheet, reviewed guide,
  kitchen session, inventory movement, and leftover safety patterns.

## DECISIONS LOG

1. KE-028 is one vertically complete feature, not separate “readiness” and
   “completion” products, because either half alone leaves the household loop
   misleading.
2. A canonical meal completion is approved architecture only after Homeowner
   review. It is a recorded household fact, not a task or a generic done flag.
3. Inventory presence is intentionally weaker than inventory sufficiency.
4. Inventory suggestions start unselected to preserve explicit consent.
5. Meal completion and inventory consumption share one transaction; leftover
   capture remains separate because cooling and storage facts may be recorded
   later.
6. RRI is shortened because authentication, database ownership, design system,
   cooking guides, conflict handling, and KE-017 boundaries are already
   established in the repository.
7. The required Blueprint checkpoint is retained because KE-028 adds one
   canonical table and changes the meal completion lifecycle.
8. After approval, the Homeowner approved replacing day-level uniqueness with
   source-session uniqueness. This resolves AC-08 without rewriting history:
   agenda reads the union of completed dish references for that day, while each
   confirmed kitchen session remains immutable.

## APPROVAL CHECKPOINT

The Homeowner approved KE-028 and the source-session uniqueness correction.
The TIP is handed from Contractor to Builder.
