# TIP-KE-017 — Confirmed Assistant Proposals

## HEADER

- TIP-ID: TIP-KE-017
- Project: Q's Kitchen / quynh-nutri
- Module: Assistant, canonical week plan and proposal review UI
- Depends on: TIP-KE-016
- Priority: P0
- Date: 2026-07-30

## CONTEXT

The assistant is currently read-only. It can describe a generated week preview,
but the chat surface has no structured distinction between advice and a change
that can be applied. The canonical plan already has server validation,
household ownership and optimistic concurrency control.

The only assistant-proposable persisted aggregate in this package is the
canonical current-week plan. Shopping, pantry, purchases, leftovers, settings
and completion states remain outside assistant mutation scope.

## DECISIONS LOG

| ID | Decision | Rationale |
|---|---|---|
| D17-01 | Proposal generation is server-side and deterministic | Nutrition, restrictions and allergy constraints stay in trusted engines |
| D17-02 | A proposal contains a complete before/after diff and base plan version | The user can review every change and stale proposals cannot silently overwrite |
| D17-03 | Applying uses a dedicated confirmation action with `confirmedByUser: true` | The mutation boundary is explicit and independently testable |
| D17-04 | No proposal table is added | Unconfirmed suggestions are transient, not household truth |
| D17-05 | The approved Phase 1 blueprint and this explicit user instruction replace another approval checkpoint | No new architecture, data domain or business choice is introduced |

## TASK

Replace text-only week-plan generation in the assistant with a structured
proposal protocol:

1. classify requests to create, refresh or optimize the week plan;
2. build a candidate from the canonical plan and household constraints;
3. return a typed proposal without writing;
4. show every changed day/slot as before → after;
5. require a separate explicit confirmation;
6. reject stale proposals through the existing plan version contract.

## REQUIREMENTS

| ID | Requirement | Priority |
|---|---|---:|
| KE17-001 | Plan-change requests return a typed proposal, not a text-only mutation claim | P0 |
| KE17-002 | Proposal generation performs zero persisted writes | P0 |
| KE17-003 | Diff identifies every changed day/slot and before/after dish | P0 |
| KE17-004 | Locked plan slots remain unchanged | P0 |
| KE17-005 | Candidate respects current household restrictions and allergies | P0 |
| KE17-006 | UI states clearly that nothing is applied before confirmation | P0 |
| KE17-007 | Only the explicit confirm control calls the mutation boundary | P0 |
| KE17-008 | Discarding or closing a proposal performs no write | P0 |
| KE17-009 | Applying validates auth, input, current week and plan version server-side | P0 |
| KE17-010 | A stale proposal is rejected and never automatically rebased | P0 |
| KE17-011 | Double confirmation is safe and cannot create divergent writes | P1 |
| KE17-012 | Existing non-mutating assistant capabilities continue to work | P0 |
| KE17-013 | Assistant has no pantry, shopping, purchase, leftover, settings or task mutation tool | P0 |
| KE17-014 | Full lint, unit, build and Playwright regression passes | P0 |

## ACCEPTANCE CRITERIA

1. Asking “Lên thực đơn tuần cho nhà mình” renders a proposal card.
2. The card lists all changed slots with day, meal slot, old dish and new dish.
3. Reloading or discarding before confirmation leaves the canonical plan equal
   to its original version and slots.
4. Clicking “Xác nhận áp dụng” once persists exactly the displayed candidate.
5. A concurrent plan edit after proposal generation makes confirmation return a
   conflict; the proposal is not silently regenerated or applied.
6. Locked slots are absent from the diff and identical in the candidate.
7. “Thực đơn nhà tôi là gì?” remains a read-only assistant query.
8. No assistant tool imports a household mutation repository/action.

## CONSTRAINTS

- No database migration or proposal persistence.
- No automatic application, timer-based acceptance or default confirmation.
- No AI-authored nutrition values, safety rules, task state or inventory truth.
- Reuse canonical week plan validation and optimistic concurrency.
- Do not broaden assistant mutation scope beyond the current week plan.
- Do not let the model emit a text-only replacement week as an actionable change.

## QUALITY GATES

```text
npm run lint
npm test
npm run build
npm run test:e2e
git diff --check
```

## REPORT FORMAT

Submit `design/COMPLETION-KE-017.md` and `design/VERIFY-KE-017.md`.
