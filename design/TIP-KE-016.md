# TIP-KE-016 — Complete Reviewed Cooking Coverage

## HEADER

- TIP-ID: TIP-KE-016
- Project: Q's Kitchen / quynh-nutri
- Module: Cooking Mode, Meal Coordination, Prep Ahead and Kitchen Agenda
- Depends on: TIP-KE-015
- Priority: P0
- Date: 2026-07-30

## CONTEXT

The execution engine is structurally complete but only 12 of 49 B0 dishes have
reviewed cooking and prep-ahead guides. The other 37 dishes fail honestly. This
prevents the weekly plan from behaving like a complete household housekeeper.

Existing registries, UI, source rendering, scaling, session restore, agenda and
assistant read-only boundaries must be reused.

## TASK

Add reviewed bilingual cooking and previous-evening preparation coverage for
every B0 repertoire dish, including vegetable sides, soups and fresh fruit.

## REQUIREMENTS

| ID | Requirement | Priority |
|---|---|---:|
| KE16-001 | Cooking registry covers exactly every B0 dish once | P0 |
| KE16-002 | Prep-ahead registry covers exactly every B0 dish once | P0 |
| KE16-003 | Every cooking guide has at least three stable steps and a realistic 5–240 minute estimate | P0 |
| KE16-004 | Meat, poultry, fish, egg and shellfish safety checks match reviewed official sources | P0 |
| KE16-005 | Produce instructions require running water and prohibit soap | P0 |
| KE16-006 | Prep-ahead never invents room-temperature holding, thaw time or marinating time | P0 |
| KE16-007 | Raw food remains separated and refrigerated; raw-contact marinade is not reused directly | P0 |
| KE16-008 | Fruit entries remain preparation guides, not fictitious cooking recipes | P1 |
| KE16-009 | Cooking Mode is available for newly covered B0 dishes | P0 |
| KE16-010 | Weekly coordination and prep-ahead no longer report supported B0 dishes as unsupported | P0 |
| KE16-011 | Unknown/B1 dishes without reviewed content still fail honestly | P0 |
| KE16-012 | Full unit, build and Playwright regression passes | P0 |

## ACCEPTANCE CRITERIA

1. Registry ID sets equal the 49-item B0 repertoire ID set.
2. No duplicate dish IDs or step IDs exist.
3. Every safety-bearing step resolves at least one HTTPS reviewed source.
4. Temperature checks use 63°C plus three-minute rest for whole pork/beef,
   71°C for ground meat and egg dishes, and 74°C for poultry/casseroles.
5. Fish uses 63°C or opaque/flaking; shrimp/crab use pearly/white opaque flesh.
6. Every fresh fruit guide describes washing the exterior before cutting or
   peeling and uses clean utensils.
7. Existing 12 guide IDs and semantics remain stable.
8. A newly covered dish opens Cooking Mode in the browser.
9. An unknown dish still has no Start Cooking action.
10. Quality gates pass with zero new P0/P1 issue.

## CONSTRAINTS

- No runtime AI generation or repair of trusted guides.
- No database, migration, notification or AI mutation change.
- No new dependency.
- Keep user-controlled progress; do not auto-complete steps or inventory.
- Use official FoodSafety.gov/FDA sources already exposed by the product.

## SOURCE REVIEW

Reviewed 2026-07-30:

- FoodSafety.gov, Safe Minimum Internal Temperatures.
- FDA, Safe Food Handling.
- FDA, Selecting and Serving Produce Safely.

## REPORT FORMAT

Submit `design/COMPLETION-KE-016.md` and `design/VERIFY-KE-016.md` after all
quality gates.
