# BLUEPRINT – Product Activation Foundation

Date: 2026-07-30

## SCOPE DECISION

The Homeowner approved implementation of the previously proposed product
sequence. This package covers only KE-025 and KE-026. Later daily brief,
closed-loop execution, content review, operations and beta packages remain
outside this build.

## REQUIREMENTS MATRIX

| ID | Requirement | Priority |
|---|---|---:|
| ACT-001 | Record a small, versioned and allowlisted lifecycle event set | P0 |
| ACT-002 | Never record names, health details, free text or Clerk user IDs | P0 |
| ACT-003 | Scope events to the server-resolved household | P0 |
| ACT-004 | Keep E2E isolated from Neon | P0 |
| ONB-001 | Show setup only after hydration and only for a household with no members | P0 |
| ONB-002 | Finish the minimum setup in three short steps | P0 |
| ONB-003 | Persist members and household settings atomically | P0 |
| ONB-004 | Be safe to retry and reject invalid or oversized input | P0 |
| ONB-005 | Do not create, apply or mark a meal plan as completed | P0 |
| ONB-006 | Send users to the existing proposal flow, where KE-017 diff and confirmation remain mandatory | P0 |
| ONB-007 | Work at 375 px, keyboard-only and reduced motion | P1 |

## ARCHITECTURE

```text
Authenticated shell
  → Store hydration
  → Onboarding gate when members = 0
  → validated Server Action
  → household-scoped transaction
      → generic member declarations
      → rhythm and restriction settings
      → onboarding completion event
  → overview handoff
  → existing AI proposal
  → full diff
  → explicit user confirmation
```

`ProductEvent` is append-only measurement data, not a task ledger and not a
source of product truth. Canonical meal, shopping, pantry and cooking state
remain in their existing models.

## EVENT CONTRACT

- `onboarding_started`
- `onboarding_completed`
- `week_proposal_confirmed`
- `shopping_item_received`
- `cooking_started`
- `meal_run_started`
- `leftover_recorded`

Properties are allowlisted per event and limited to booleans, bounded numbers
and short enums. The browser cannot send household identity.

## DESIGN DIRECTION

Subject: a Vietnamese family declaring the minimum facts a capable household
manager needs before planning food.

- Palette: existing Q's Kitchen rose, warm raised surface, botanical success,
  honey attention and ink neutrals.
- Type: existing Inter utility/body and restrained Lora display accent.
- Layout: one focused ledger card over the authenticated canvas, with one
  question per step and a stable footer.
- Signature: a live place-setting line that adds or removes simple family
  places as adult and child counts change.
- Mobile: full-height sheet with compact top progress; desktop: centered
  720 px ledger card. No horizontal scroll.

The initial idea used decorative numbered panels. It was rejected because it
resembled a generic onboarding template. The place-setting line is specific to
family meal planning and carries actual information.

## DECISIONS LOG

1. The approved product sequence is treated as Blueprint approval, so no
   duplicate approval pause is added.
2. Completion is inferred from declared members, avoiding another household
   status field.
3. The onboarding collects no names and no health detail. Those remain
   optional in Settings after activation.
4. No AI output is generated inside onboarding. Its final action opens the
   existing assistant, which preserves KE-017.

