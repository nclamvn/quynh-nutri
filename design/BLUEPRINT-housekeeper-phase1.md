# BLUEPRINT — Phase 1 Household Food Housekeeper

## PROJECT INFO

| Field | Value |
|---|---|
| Project | Bữa cơm nhà / Q's Kitchen |
| Nature | Family meal planning and kitchen execution system |
| Date | 2026-07-30 |
| Status | Approved by Homeowner instruction: “triển khai từng bước đầy đủ” |

## PRIMARY GOAL

Turn the existing application into a confirmation-based household food
housekeeper that covers planning, preparation, shopping, inventory, cooking,
leftovers and reminders without claiming actions that did not happen.

## NON-NEGOTIABLE OPERATING MODEL

1. Deterministic engines own nutrition, safety, inventory and plan state.
2. AI may read, explain and prepare a proposed transaction.
3. A household member must confirm every state-changing AI proposal.
4. No generated cooking, storage, freshness or food-safety claim enters the
   trusted registry without reviewed source evidence.
5. Missing evidence remains visible as unsupported; it is never filled silently.

## DELIVERY GRAPH

| Order | Package | Outcome | Depends on |
|---:|---|---|---|
| 1 | TIP-KE-016 | Reviewed cooking and prep-ahead coverage for all 49 B0 dishes | KE-015 |
| 2 | TIP-KE-017 | AI proposal → diff → explicit confirmation transaction layer | KE-016 |
| 3 | TIP-KE-018 | Opt-in, timezone-aware, deduplicated housekeeper reminders | KE-017 |
| 4 | TIP-KE-019 | Multi-device persistence for B1 library and active kitchen sessions | KE-017 |
| 5 | TIP-KE-020 | Low-friction receipt, label and voice capture with confirmation | KE-019 |
| 6 | TIP-KE-021 | Planned-versus-actual cost, waste and savings feedback loop | KE-020 |
| 7 | TIP-KE-022 | Production hardening: real auth, Neon branch integration and responsive matrix | KE-021 |

## DECISIONS LOG

| Decision | Chosen | Rationale |
|---|---|---|
| Content delivery | Reviewed finite registry | Runtime AI must not invent safety instructions |
| Mutation model | Proposal plus explicit confirmation | Keeps AI useful without granting silent authority |
| Notifications | Opt-in and source-derived | Avoids spam and false tasks |
| External ordering | Deferred beyond Phase 1 | Supplier availability and checkout require external contracts |
| Checkpoint | Verify each TIP before the next | Limits regression radius across safety-sensitive work |

## PHASE 1 EXIT CRITERIA

- All 49 B0 dishes have reviewed cooking and prep-ahead guidance.
- AI can prepare but cannot silently execute mutations.
- Agenda can notify at the right time with opt-in and deduplication.
- Household-critical state survives device changes.
- Captured receipts/labels/voice remain suggestions until confirmed.
- Reports close the planned → purchased → consumed → leftover/discarded loop.
- Real-auth, tenant isolation and production recovery paths are verified.
