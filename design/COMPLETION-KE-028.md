# COMPLETION-KE-028 – Today Meal Stewardship

**STATUS:** PRODUCTION RELEASED

## Scope delivered

KE-028 closes the daily meal execution loop without introducing a generic task
table, an AI-authored job, or a mutable local done flag.

The implementation now reads today’s canonical plan and recorded inventory,
opens reviewed cooking guidance for one to five dishes, keeps the server kitchen
session until a final closeout confirmation, and writes one immutable meal fact
with only the inventory movements the household explicitly selected.

## Canonical data and transaction

- Added household-owned `MealCompletion`, unique by household idempotency key
  and by household, week, day, and source session creation time.
- Added nullable provenance from `InventoryMovement` and `LeftoverLot` to the
  meal completion.
- Added one serializable transaction that validates the canonical session,
  creates the completion, decrements selected lots, creates exact before-to-after
  movements, records the privacy-minimal product event, and deletes the kitchen
  session.
- A repeated idempotency key replays the original result. A concurrent closeout
  of the same source session returns the canonical completion.
- Any invalid selected lot aborts before a completion or movement is retained.

## Product behavior

- Added the compact Overview handoff “Bữa nhà mình hôm nay”.
- Ingredient state is limited to “có ghi” and “chưa thấy”; the interface states
  explicitly that recorded presence does not prove sufficient quantity.
- Unsupported dishes remain visible and never receive generated cooking steps.
- Meal coordination now supports one through five reviewed dishes.
- Finishing manual cooking progress opens a review sheet without deleting the
  canonical session.
- Inventory lots are all unselected by default. Selected lots show the exact
  `before → after` balance before confirmation.
- Cancelling the review writes nothing and returns to the resumable session.
- Successful confirmation opens the existing leftover flow and links newly
  recorded leftovers to the completion.
- Today’s agenda removes only confirmed dish references. A later canonical plan
  change leaves a new dish actionable without rewriting history.

## Assistant and measurement boundaries

- Added a read-only `today_meal_readiness` assistant tool.
- The assistant can explain only the deterministic projection and cannot
  confirm a meal, consume inventory, create leftovers, or repair data.
- Added `meal_completed` with only dish count, inventory movement count, and
  whether the leftover continuation was offered. No food names, commodity ids,
  quantities, notes, health data, or member data enter product events.

## Files central to KE-028

- `prisma/migrations/20260730203000_meal_completion/migration.sql`
- `src/domain/kitchen-execution/meal-readiness.ts`
- `src/data/repo/meal-completion.ts`
- `src/ui/components/TodayMealCard.tsx`
- `src/ui/components/MealCloseoutSheet.tsx`
- `src/ui/components/MealCoordinatorSheet.tsx`
- `src/lib/assistant/kitchen-agenda.ts`
- `e2e/meal-closeout.spec.ts`

## Production release

- Application commit: `2b498037c015fb58b18c8b8c0c3b804eb6242fc0`.
- GitHub CI run: `30547302239`, completed successfully.
- Neon main: all 8 migrations applied and Prisma reported the schema up to
  date.
- `20260730180000_product_events` already existed with the expected structure;
  its failed migration record was reconciled as applied without recreating or
  deleting the table.
- `20260730203000_meal_completion` applied successfully.
- Vercel deployment: `dpl_89zLpXEQHmacAR4CpvbzKqfKsUQQ`, status `READY`.
- Production aliases: `https://anngon.io` and `https://www.anngon.io`.
- Production smoke: landing returned HTTP 200; protected `/overview` returned
  the expected Clerk HTTP 307 redirect while signed out.

## Delivery result

KE-028 is committed, migrated, deployed, verified by CI, and live on
`anngon.io`.
