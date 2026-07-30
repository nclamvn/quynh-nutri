# TIP-KE-027 – Daily Housekeeper Brief

## HEADER

- TIP-ID: TIP-KE-027
- Project: Q's Kitchen / quynh-nutri
- Module: Daily household loop
- Depends on: TIP-KE-025, TIP-KE-026
- Priority: P0

## OBJECTIVE

Turn the existing derived kitchen agenda into one concise daily brief that
answers:

1. What should the household prepare today?
2. What must be bought or received?
3. What should be used soon from pantry or leftovers?

## REQUIREMENTS

| ID | Requirement | Priority |
|---|---|---:|
| KE27-001 | Build one deterministic brief projection from the canonical kitchen agenda | P0 |
| KE27-002 | Group every supported signal into prepare, shop or use-soon | P0 |
| KE27-003 | Keep source references, evidence and canonical actions intact | P0 |
| KE27-004 | Show all three answers on Overview, including honest empty answers | P0 |
| KE27-005 | Loading, unsynced and conflict states must not look canonical | P0 |
| KE27-006 | Expanded evidence must identify the recorded source | P0 |
| KE27-007 | Push reminders must select from the same brief projection | P0 |
| KE27-008 | Assistant must read the same brief and cannot create or mutate an item | P0 |
| KE27-009 | No task table, local done state or inferred completion | P0 |
| KE27-010 | The three answers must fit 375 px without horizontal overflow | P1 |

## DESIGN CONTRACT

The card uses a quiet “three kitchen stations” composition rather than a
generic task list:

```text
┌──────────────── Daily brief ────────────────┐
│ Prepare today │ Buy or receive │ Use soon   │
│ real signal   │ real signal    │ real signal│
│ source action │ source action  │ source action
└─────────────────────────────────────────────┘
```

- Existing rose remains interaction color.
- Honey marks time-sensitive preparation or purchase review.
- Botanical green marks storage and use-soon evidence, not completion.
- Inter remains body and data type; no new font or decoration is introduced.
- The signature is the three real kitchen stations, each tied to its canonical
  source. Numbered steps were rejected because these are parallel household
  concerns, not a fixed sequence.

## REQUIRED BOUNDARIES

- Derive from canonical meal, shopping, inventory and leftover data.
- Never generate tasks, never store a local done flag and never infer work was
  completed.
- AI may explain the brief but cannot add, remove or repair its items.
- Any proposed meal change must use the existing KE-017 diff and confirmation.
- Keep the brief compact on mobile and expandable for evidence or source detail.

## ACCEPTANCE TARGET

- One stable daily brief on Overview.
- Empty, loading, stale and conflict states remain honest.
- Every action links to its canonical workflow.
- Reminder delivery uses the same derived brief rather than a copied task list.
- Unit, 375 px E2E, existing full regression and readiness gates pass.

## DECISIONS LOG

1. The Homeowner explicitly selected KE-027, which serves as Blueprint
   approval; no duplicate approval checkpoint is added.
2. The existing `KitchenAgenda` remains the evidence engine. KE-027 adds a pure
   projection and does not alter persistence.
3. A non-synced plan produces a visible hold state instead of a confident brief.
4. Push keeps per-signal delivery and idempotency, but its candidates must come
   from the shared brief projection.
