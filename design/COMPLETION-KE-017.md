# COMPLETION REPORT — TIP-KE-017

**STATUS:** DONE

## OUTCOME

Assistant requests to create, refresh or optimize the canonical current-week
menu now produce a structured proposal instead of a text-only replacement.
Every changed day/slot is rendered as before → after. Nothing is written until
the household presses the separate confirmation control.

The server binds each proposal to the canonical plan version and a deterministic
seed. On confirmation it regenerates the candidate from trusted household data
and compares the complete slot set with the UI payload before saving. A stale or
tampered proposal is never applied or silently rebased.

## FILES CHANGED

### Created

- `design/TIP-KE-017.md`
- `src/domain/assistant/week-plan-proposal.ts`
- `src/domain/assistant/week-plan-proposal.test.ts`
- `src/lib/assistant/week-plan-proposal.ts`
- `src/lib/assistant/week-plan-proposal.test.ts`
- `e2e/assistant-proposal.spec.ts`
- `design/COMPLETION-KE-017.md`
- `design/VERIFY-KE-017.md`

### Modified

- `src/app/api/assistant/route.ts`
- `src/lib/assistant/agent.ts`
- `src/lib/assistant/tools.ts`
- `src/app/actions.ts`
- `src/ui/store.tsx`
- `src/ui/components/AssistantSheet.tsx`
- `e2e/COVERAGE.md`
- `README.md`

## REQUIREMENT COVERAGE

| Requirement | Evidence | Result |
|---|---|---:|
| KE17-001 | Plan-change classifier returns typed JSON proposal before model loop | Pass |
| KE17-002 | Generator imports read repositories only; discard E2E preserves plan | Pass |
| KE17-003 | Pure complete diff plus rendered before/after rows | Pass |
| KE17-004 | Generator carries locked slots; server unit asserts unchanged/no diff | Pass |
| KE17-005 | Candidate repertoire passes existing dietary/allergy filtering and save validation | Pass |
| KE17-006 | Proposal header states no change has been applied | Pass |
| KE17-007 | Dedicated confirmation button is the only proposal mutation caller | Pass |
| KE17-008 | Discard E2E verifies canonical plan remains equal | Pass |
| KE17-009 | Server Action authenticates, Zod-validates, restricts current week and uses OCC | Pass |
| KE17-010 | Two-client E2E verifies stale rejection without rebase | Pass |
| KE17-011 | Full candidate replay is idempotent in canonical plan repository | Pass |
| KE17-012 | Existing read-only assistant persistence E2E remains green | Pass |
| KE17-013 | Text-only `plan_week` tool removed; no assistant mutation tool added | Pass |
| KE17-014 | Full lint, unit, build and Playwright gates pass | Pass |

**Coverage:** 14/14 requirements, 100%.

## TEST RESULTS

- Proposal domain/server target: 9/9 passed.
- Full unit/repository: 42 files, 264 tests passed.
- Proposal + plan persistence Playwright target: 7/7 passed.
- Full Playwright: 60/60 passed.
- ESLint: passed.
- Prisma generate, Next production build and TypeScript: passed.
- Mobile visual inspection at 390×844: passed after correcting proposal
  auto-scroll so the unconfirmed-state header is visible first.
- `git diff --check`: passed before final report.

## ISSUES DISCOVERED AND RESOLVED

- P1 — The initial mobile render auto-scrolled a long proposal to its action
  footer, hiding the “waiting for confirmation” header. The proposal now receives
  explicit start focus after insertion.
- P1 — A local version precheck could become stale during asynchronous hydration.
  It was removed; canonical server OCC is the sole conflict authority.
- P0 hardening — Client-provided proposal slots were structurally valid but not
  originally cryptographically/statically tied to generation. Confirmation now
  regenerates from the server seed and rejects any slot mismatch.

## DEVIATIONS FROM SPEC

- No database audit row is stored for an unconfirmed proposal. This is the
  approved D17-04 behavior: suggestions are transient and only confirmed plan
  state becomes household truth.
- The model no longer owns week-plan generation. The deterministic rotation
  engine creates the proposal while the assistant supplies the interaction
  surface. This keeps allergies, restrictions and plan arithmetic verifiable.

## SUGGESTIONS FOR CHỦ THẦU

- Accept KE-017 as READY.
- Continue with TIP-KE-018: opt-in, timezone-aware, deduplicated reminders.
