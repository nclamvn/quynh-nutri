# COMPLETION-KE-029 – Explicit Family Meal Memory

**STATUS:** PRODUCTION RELEASED

## Scope delivered

KE-029 gives the food housekeeper a durable, explainable memory of what the
household explicitly said after completed meals. It does not infer preference
from clicks, favorites, leftovers, discard, inventory, plan inclusion, or AI
text.

The corrected blueprint is implemented at completed-dish granularity. A
completion containing one to five dishes can therefore receive a different
response for each dish without copying one meal-level answer across all dishes.

## Canonical feedback and concurrency

- Added household-owned `MealFeedback`, unique by completed dish and by
  household idempotency key.
- A source dish must belong to the immutable `dishRefs` of a completion owned by
  the authenticated household.
- Repeat intent, portion fit, and effort fit are optional, but the database and
  Server Action both require at least one explicit answer.
- Create, edit, and delete use optimistic versions. Stale writes return the
  canonical row and never overwrite it.
- Serializable transaction conflicts are converted to a canonical conflict
  response.
- Idempotent retries replay one canonical result.
- Explicit deletion removes only feedback; the meal completion remains intact.

## Product experience

- Added the optional “Phiếu nếm bữa cơm” after the leftover flow.
- The sheet begins with no selected answer, permits skipping any dish, and
  saves only after an explicit control is pressed.
- Reports now includes “Trí nhớ bữa cơm” with recent unanswered dishes, exact
  counts, evidence state, edit, and separately confirmed deletion.
- The interface exposes no opaque preference score and makes the
  explicit-evidence limitation visible.
- The 375 px light and dark paths are covered by browser assertions with no
  horizontal overflow.

## Deterministic memory and proposals

- Added the pure `buildHouseholdMealMemory` projection.
- Evidence remains `single`, `emerging`, `established`, or `mixed` according to
  documented thresholds and exact source counts.
- Mixed repeat evidence contributes no ranking signal.
- Explicit repeat and avoid answers are bounded soft signals. Excessive effort
  is a soft negative signal only on declared busy days.
- Existing dietary filtering, locks, rotation, quick-day rules, seafood repair,
  and canonical proposal verification remain higher-priority boundaries.
- A proposal remains transient and every changed slot keeps the existing
  before-to-after diff.
- Memory-guided changes show a bounded human-readable reason and the exact
  feedback count. Only the existing KE-017 confirmation can save the plan.
- Portion feedback is explanation-only and changes no quantities, nutrition,
  household size, inventory, or shopping calculation.

## Assistant and measurement boundaries

- Added the read-only `household_meal_memory` tool backed by the deterministic
  projection.
- The assistant can report exact counts and evidence state but has no feedback
  mutation tool.
- Added privacy-minimal events for feedback save, feedback delete, and
  memory-guided proposal creation.
- Event validation rejects dish ids, dish names, response values, notes,
  completion ids, proposal contents, member data, and health data.

## Files central to KE-029

- `prisma/migrations/20260730233000_meal_feedback/migration.sql`
- `src/domain/feedback/meal-memory.ts`
- `src/data/repo/meal-feedback.ts`
- `src/ui/components/MealReflectionSheet.tsx`
- `src/ui/components/HouseholdMealMemoryCard.tsx`
- `src/lib/assistant/meal-memory.ts`
- `src/lib/assistant/week-plan-proposal.ts`
- `e2e/meal-memory.spec.ts`

## Release boundary

The migration is additive and the Prisma schema is valid. It was first applied
successfully to temporary Neon branch `codex-ke029-verify-20260730`, which has
an automatic expiry. After explicit release approval, migration
`20260730233000_meal_feedback` was applied successfully to Neon main and Prisma
reported all 9 migrations up to date.

## Production release

- Application commit:
  `81eb805aa8b0c782fed58612cbb965ef80041acc`.
- GitHub CI run: `30553753290`, completed successfully.
- Neon main: migration `20260730233000_meal_feedback` applied and all 9
  migrations reported up to date.
- Vercel deployment: `dpl_7uo41ftqHZDogw2NneTo1vbSJF81`, target production,
  status `READY`.
- Production aliases: `https://anngon.io` and `https://www.anngon.io`.
- Production smoke: landing returned HTTP 200; protected `/overview` returned
  the expected Clerk HTTP 307 redirect while signed out.

## Delivery result

KE-029 is committed, migrated, deployed, verified by CI, and live on
`anngon.io`.
