# TIP-KE-025 – First-party Product Lifecycle Measurement

## HEADER

- TIP-ID: TIP-KE-025
- Project: Q's Kitchen / quynh-nutri
- Module: Product measurement
- Depends on: TIP-KE-024
- Priority: P0
- Date: 2026-07-30

## CONTEXT

Use the architecture and privacy boundaries in
`design/BLUEPRINT-KE-025-026.md`.

## TASK

Add an append-only household-scoped product event contract and instrument the
canonical server mutations that establish the first weekly household loop.

## ACCEPTANCE CRITERIA

1. Events accept only a fixed name and fixed properties for that name.
2. Household ownership is resolved from the authenticated session.
3. Names, free text, health details and Clerk user IDs cannot enter properties.
4. Duplicate retry keys do not create duplicate rows.
5. E2E uses memory and never calls Neon.
6. Existing canonical mutations still have the same user-facing contract.
7. Unit tests cover valid, invalid, privacy-sensitive and duplicate inputs.

## CONSTRAINTS

- Do not add an analytics SDK or third-party tracker.
- Do not create a task, completion flag or second source of truth.
- Do not expose household-level analytics to other households.
- Do not instrument clicks when a canonical server event is available.

## REPORT

Submit `design/COMPLETION-KE-025.md`.

