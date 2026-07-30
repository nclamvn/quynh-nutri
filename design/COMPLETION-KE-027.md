# COMPLETION-KE-027 – Daily Housekeeper Brief

## Scope delivered

KE-027 adds one read-only daily brief derived from the existing canonical
`KitchenAgenda`. It does not add a task table, a completion flag, or any AI
generated work.

The projection always exposes three stable stations:

1. `prepare` – cooking, coordination, freezer preparation, and reviewed
   preparation for tomorrow.
2. `shop` – outstanding shopping and purchase confirmation.
3. `use-soon` – leftovers and inventory lots that need review from recorded
   dates.

## Implementation

- Added the pure `buildDailyHousekeeperBrief` projection with an exhaustive
  mapping for every supported agenda kind.
- Preserved task order, evidence, source references, source actions, unsupported
  signals, calendar date, and generation time.
- Replaced the Overview priority preview with three parallel kitchen stations.
- Kept the full evidence sheet grouped by urgency and linked every item back to
  its canonical workflow.
- Added honest loading, unsynced, and conflict states. A non-canonical meal plan
  pauses the brief instead of presenting draft information as confirmed.
- Changed reminder candidate selection to read the shared daily brief.
- Changed the assistant tool and hermetic assistant path to read the shared
  daily brief.
- Retained KE-017 boundaries: the assistant can explain the brief but cannot
  create, apply, repair, or mark any item complete.

## Acceptance evidence

- KE27-001: one deterministic projection is covered by unit tests.
- KE27-002: all eight supported task kinds are mapped exactly once.
- KE27-003: order, evidence, source references, and actions are preserved.
- KE27-004: Overview renders all three stations, including station-level empty
  answers.
- KE27-005: loading uses a neutral placeholder; unsynced and conflict states
  render explicit hold messages and no stations.
- KE27-006: the existing detail sheet names the recorded source for every task.
- KE27-007: the dispatcher builds the brief before reminder policy selection.
- KE27-008: both the assistant tool and E2E mock use the shared brief snapshot.
- KE27-009: no new persistence model or completion control was added.
- KE27-010: the 375 px E2E assertion confirms no horizontal overflow.

## Files central to KE-027

- `src/domain/kitchen-execution/daily-housekeeper-brief.ts`
- `src/ui/hooks/useKitchenAgenda.ts`
- `src/ui/components/KitchenAgendaCard.tsx`
- `src/lib/assistant/kitchen-agenda.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/reminders/dispatcher.ts`
- `src/domain/reminders/policy.ts`
- `e2e/kitchen-agenda.spec.ts`
- `e2e/week-plan-persistence.spec.ts`

## Delivery boundary

Implementation and local verification are complete. No commit, push, database
migration, or production deployment was performed for KE-027 in this delivery.
