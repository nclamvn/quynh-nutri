# TIP-KE-026 – Three-minute Household Onboarding

## HEADER

- TIP-ID: TIP-KE-026
- Project: Q's Kitchen / quynh-nutri
- Module: Household activation
- Depends on: TIP-KE-025
- Priority: P0
- Date: 2026-07-30

## CONTEXT

New Clerk users already receive a blank Neon household. The onboarding must
turn that blank household into a minimum truthful household profile without
inventing meals, purchases, pantry contents or completed work.

## TASK

Build a three-step authenticated onboarding gate:

1. Declare adult and child counts.
2. Select optional household restrictions.
3. Select busy days and shopping style, review, then confirm.

Persist the result atomically and hand the user to the existing AI proposal
flow. The proposal remains a visible diff until explicit confirmation.

## ACCEPTANCE CRITERIA

1. The gate appears only after hydration and only when there are no members.
2. One to twelve members can be declared; zero-member completion is rejected.
3. A retry cannot duplicate members or completion events.
4. The UI never asks for names or health conditions.
5. The final screen states that no menu or shopping list has been applied.
6. The next action opens the existing assistant proposal flow.
7. Keyboard focus, labels, errors, busy state and reduced motion are supported.
8. The layout fits 375 px and the existing desktop content width.
9. Unit and E2E tests cover completion, retry safety and KE-017 handoff.

## CONSTRAINTS

- Reuse the app design system and shared server validation pattern.
- Do not bypass or weaken KE-017.
- Do not store local fake completion state.
- Do not make health, allergy or special-diet claims.

## REPORT

Submit `design/COMPLETION-KE-026.md`.

