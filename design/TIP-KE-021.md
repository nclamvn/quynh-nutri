# TIP-KE-021 — Honest Cost, Waste and Savings Feedback Loop

## HEADER

- TIP-ID: TIP-KE-021
- Project: Bữa cơm nhà / Q's Kitchen
- Module: Household reports and closed-loop kitchen feedback
- Depends on: KE-020
- Priority: P0
- Approved source: `design/BLUEPRINT-housekeeper-phase1.md`

## CONTEXT

The app already holds every confirmed event needed for a Phase 1 feedback loop:

- planned shopping quantities and reference market prices;
- actual purchased quantities and optional prices paid;
- manually confirmed pantry consumption/discard movements;
- manually confirmed cooked-leftover consumption/discard movements.

The current Reports page only estimates the planned basket from reference
prices. It does not distinguish that estimate from actual spend, cannot value
recorded waste or reuse, and can appear empty after the shopping plan changes
even though real household events exist.

## TASK

Create a pure read-only weekly feedback engine and rebuild Reports so the family
can see what was planned, what was actually paid, what was used, what was
discarded, and what value was retained by using leftovers. Every number must
carry its true basis and missing data must remain visible.

## SPECIFICATIONS

### Weekly scope

- Use the canonical current Week Plan `weekStart`.
- Planned basket uses the current derived shopping list.
- Actual purchase lines use `ShoppingFulfillment.weekRef`.
- Pantry movements count only when their lot is linked to a fulfillment from
  that week.
- Leftover movements count only when their lot has a Meal Run source reference
  for that week.
- Corrections adjust canonical balances but are not consumption, waste or
  savings events.

### Cost bases and provenance

- Planned cost is a B0 reference-price estimate. Unsupported units or missing
  reference prices remain unpriced and lower coverage.
- Actual spend is the sum of household-confirmed `pricePaid` values. Missing
  price is honest-null; the known total is explicitly a lower bound.
- For a confirmed purchase with price, derive a same-line paid rate and compare
  actual quantity against the planned quantity captured at confirmation:
  - bought less than planned → “avoided spend by quantity”;
  - bought more than planned → “extra spend by quantity”.
- Do not call a reference-price delta “savings”.
- Do not compare incompatible units and do not convert units silently.

### Consumption and waste

- Pantry movement value uses the confirmed paid rate of the exact linked
  fulfillment. Without that link/price/unit match, show quantity but not money.
- Cooked-leftover value is an ingredient-cost estimate per serving:
  - dish quantities are grossed up by reviewed edible yield;
  - latest household price known at or before preparation is preferred;
  - otherwise B0 reference price is used;
  - unsupported ingredient lines lower coverage instead of being invented.
- “Value reused” means estimated ingredient value of confirmed leftover servings
  consumed. It is not represented as bank-account savings.
- Commodity waste based on paid price and cooked-leftover waste based on an
  estimate remain separately labelled; do not merge them into a falsely exact
  total.

### UI and honesty

- Reports presents four stages: Plan, Bought, Used and Discarded.
- Every percentage states its denominator and every amount states `actual`,
  `reference estimate`, `estimated reused value`, or `known lower bound`.
- Empty and partial states explain exactly which confirmed input is missing and
  link to the existing Shopping/Pantry flows.
- Budget remains the existing optional device preference and must retain its
  scope label; this package adds no new persistence contract.
- Do not create a task table, automatic completion state, recommendation ledger
  or AI mutation.

## ACCEPTANCE CRITERIA

1. Planned reference cost retains honest price coverage and never prices an
   unsupported line.
2. Actual spend includes only confirmed paid amounts for the current week and
   exposes priced/confirmed coverage.
3. Quantity variance uses the same real paid line rate and never compares
   incompatible units.
4. A confirmed pantry discard linked to a priced fulfillment produces a known
   waste value; an unlinked/unpriced discard remains quantity-only.
5. Pantry consumption and discard are reported separately.
6. Confirmed leftover consumption produces an explicitly estimated reused value
   with ingredient-price coverage.
7. Confirmed leftover discard remains separate from paid commodity waste.
8. Corrections never count as used, discarded or saved.
9. A week with partial data renders useful stages and missing-data explanations
   rather than a fabricated zero or a blank page.
10. Reports is read-only: no AI, mutation action, task row or synthetic `done`
    state is introduced.
11. Unit, E2E, responsive, lint and production build gates pass.

## CONSTRAINTS

- Reuse current domain records and store hydration; no database migration.
- Implement calculations as a pure domain module with deterministic tests.
- Do not change purchase, inventory or leftover mutation semantics.
- Do not infer consumption from a shrinking balance; only movement records count.
- Do not add a dependency.

## DECISIONS LOG

- KE-021 proceeds without a new homeowner checkpoint because the approved Phase
  1 blueprint fixes the outcome and the implementation is a read-only projection
  over existing canonical records.
- Paid commodity waste and estimated cooked-leftover waste stay separate because
  their evidence levels differ.
- “Savings” is restricted to same-rate quantity avoidance and “value reused”;
  neither is presented as a guaranteed cash saving.
- The existing device-scoped optional budget is retained and labelled. Making it
  household-canonical would add a persistence contract outside this TIP.
- No snapshot table is added: the report is derived from canonical events on
  every render, preventing stale analytics state.

## REPORT FORMAT

Create `design/COMPLETION-KE-021.md` and `design/VERIFY-KE-021.md` with actual
evidence after all gates complete.
