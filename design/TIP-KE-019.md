# TIP-KE-019 — Multi-device Kitchen Continuity

## HEADER

- TIP-ID: TIP-KE-019
- Project: Bữa cơm nhà / Q's Kitchen
- Module: Household dish library and active kitchen execution
- Depends on: KE-017
- Priority: P0
- Approved source: `design/BLUEPRINT-housekeeper-phase1.md`

## CONTEXT

The Phase 1 blueprint requires household-critical state to survive device
changes. Two gaps remain:

- B1 dishes that are not referenced by the current week are stored only in
  browser `localStorage`.
- Cooking progress and coordinated meal runs are stored only in
  `sessionStorage`.

The existing Week Plan repository already establishes the required patterns:
authenticated server boundaries, household ownership, server-side validation,
an E2E in-memory adapter and optimistic concurrency.

## TASK

Make the complete B1 library and active Cooking/Meal Run sessions canonical on
the server, while preserving honest manual completion semantics and recovering
valid browser-only data from earlier releases.

## SPECIFICATIONS

### Household dish library

- Add a dedicated authenticated load/sync boundary for the complete household
  B1 library; persistence must not depend on selection into a Week Plan.
- Validate every dish and ingredient line on the server using the existing
  B1 rules. Reject unknown B0 sources, commodities and cross-household ID
  collisions.
- Server canonical data wins when the same dish ID exists on both server and
  device. Valid device-only dishes from the old household-scoped key are
  uploaded once and then the legacy key is removed only after successful sync.
- New forks/imports remain optimistic in the UI, but must be persisted
  immediately. A failed save must be visible and must not be represented as
  synchronized.

### Active kitchen sessions

- Add one server record per household, session kind and stable scope:
  - Cooking: dish ID.
  - Meal Run: current week start plus day.
- Store only validated user execution state. Do not store a generated task
  ledger or infer completion.
- Cooking payload validation must bind the dish, reviewed guide and valid step
  IDs.
- Meal Run payload validation must bind the current canonical week/day,
  supported planned dish IDs, valid timestamps and duration bounds.
- Each save uses an expected version. On a version conflict, return the
  canonical session; the client adopts it and visibly informs the user that
  another device updated the session.
- Clearing or finishing a session deletes the active record. It must never
  create a synthetic `done` status.
- Valid legacy `sessionStorage` data is uploaded only when no canonical session
  exists. Invalid legacy data fails closed and is removed.
- A network failure keeps the current screen usable, retains a recoverable
  local session and visibly reports that synchronization has not completed.

### Security and boundaries

- Every Server Action re-authenticates. Repositories derive household identity
  server-side and return minimal DTOs.
- The client cannot choose a household ID.
- Runtime AI has no access to these mutation actions. No AI proposal is applied
  by this package.
- Additive schema changes only; no destructive migration.

## ACCEPTANCE CRITERIA

1. A B1 fork/import not present in the current plan appears after signing in on
   another device.
2. Existing valid household-scoped browser B1 data is recovered without
   overwriting a same-ID canonical dish.
3. Cooking step progress resumes on another device and invalid guide/step data
   is rejected.
4. A coordinated Meal Run resumes on another device with the same manual task
   timestamps.
5. Concurrent session writes do not silently overwrite one another; the client
   adopts the canonical conflict result.
6. Finish/cancel removes only the matching active session.
7. Household A cannot read, update or delete household B data.
8. No new UI task table, fake `done` state, automatic task completion or
   AI-triggered mutation is introduced.
9. Unit, repository, E2E, lint and production build gates pass.

## CONSTRAINTS

- Reuse the existing Clerk, Prisma, Neon, Server Action, toast and E2E adapter
  patterns.
- Do not change cooking guidance, food-safety claims, plan generation or
  nutrition calculations.
- Do not add a realtime provider or polling loop; cross-device continuity is
  required on load/resume, with conflict safety on write.
- Do not add a dependency.

## DECISIONS LOG

- KE-019 proceeds without a new homeowner checkpoint because the approved Phase
  1 blueprint explicitly fixes its scope and the implementation does not change
  architecture beyond an additive household-owned persistence aggregate.
- Active sessions use a typed payload in one generic persistence model because
  lifecycle, ownership and concurrency are identical; payload validation stays
  specific at the server boundary.
- Server canonical wins on reconciliation to prevent a stale browser snapshot
  from silently overwriting another device.

## REPORT FORMAT

Create `design/COMPLETION-KE-019.md` and `design/VERIFY-KE-019.md` with actual
evidence after all gates complete.
