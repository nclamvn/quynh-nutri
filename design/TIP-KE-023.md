# TIP-KE-023 — Detailed Reviewed Cooking Pages

## HEADER

- TIP-ID: TIP-KE-023
- Project: Q's Kitchen / quynh-nutri
- Module: Dishes, cooking guide registry and Cooking Mode
- Depends on: TIP-KE-016, TIP-KE-019
- Priority: P0
- Date: 2026-07-30

## CONTEXT

All 49 B0 dishes have reviewed guide coverage, but the product exposes only a
compact preview and a full-screen execution mode. It does not provide a
complete readable recipe page, direct URL, per-step timing, sensory cues or
equipment.

The Homeowner approved `design/BLUEPRINT-cooking-guide-v2.md` and its proposed
file diff before implementation, satisfying KE-017.

## TASK

Create a dedicated, premium and responsive cooking-guide page for every reviewed
B0 dish. Enrich the finite guide registry and reuse the existing canonical
Cooking Mode for active progress.

## REQUIREMENTS

| ID | Requirement | Priority |
|---|---|---:|
| KE23-001 | `/dishes/[dishId]` resolves every 49 B0 dish and handles invalid IDs honestly | P0 |
| KE23-002 | Every B0 guide has bilingual summary and at least one equipment item | P0 |
| KE23-003 | Every guide step has a positive estimated minute and bilingual sensory cue | P0 |
| KE23-004 | Step totals remain plausible relative to reviewed total time and are labelled estimates | P0 |
| KE23-005 | Serving control supports 1–12 people without changing household settings | P0 |
| KE23-006 | Ingredients scale from canonical dish lines and state that quantities are edible portions | P0 |
| KE23-007 | Page shows preparation, ordered steps, safety checks and reviewed sources before Cooking Mode starts | P0 |
| KE23-008 | Start/resume reuses current Cooking Mode and its canonical multi-device session | P0 |
| KE23-009 | Dish and Favorite entry points navigate to the dedicated route | P0 |
| KE23-010 | Compact detail sheet, where retained, links to full detail rather than duplicating the page | P1 |
| KE23-011 | Untouched B1 forks may inherit the source guide with explicit disclosure; custom/changed B1 fails honestly | P0 |
| KE23-012 | Reading, scaling and navigation create no mutation, task, inventory deduction or synthetic completion | P0 |
| KE23-013 | Mobile 390 px, desktop 1440 px, dark mode, keyboard focus and reduced motion pass | P0 |
| KE23-014 | Full lint, unit, build and Playwright regression passes | P0 |

## CONTENT RULES

- Preserve the reviewed 63/71/74°C safety profiles and three-minute rest rules.
- Sensory cues supplement but never override a temperature check.
- Produce is rinsed under plain running water; no soap or produce wash.
- Raw and cooked utensils remain separated.
- No exact seasoning quantity is created unless already canonical.
- Fruit remains clean preparation rather than fictional cooking.
- Runtime AI cannot write or repair trusted content.

## UI RULES

- Use one centered page canvas shared with the signed-in app.
- Use the existing semantic palette; no new color language.
- Use a true ordered “Nhịp bếp” spine rather than decorative process circles.
- Touch targets are at least 44 px.
- Mobile sticky action clears the app bottom navigation and does not obscure the
  final step or source ledger.
- Unknown and unsupported states explain what is missing and offer a route back
  to the recipe library.

## CONSTRAINTS

- No database migration or dependency.
- Do not alter inventory, shopping, leftovers or meal-run semantics.
- Do not infer that a step is complete.
- Do not create exact-dish imagery in this package.
- Keep existing cooking guide and session IDs stable.

## ACCEPTANCE CRITERIA

1. Registry integrity proves 49/49 summaries, equipment, timed steps and cues.
2. A B0 card opens its direct URL and all guide content is readable before start.
3. Scaling from 4 to 2 people halves visible ingredient quantities and persists
   only within the page view.
4. Starting Cooking Mode uses the selected serving count without changing the
   Household profile.
5. Reload/resume retains canonical completed steps.
6. A valid untouched B1 fork displays inherited-source disclosure.
7. A custom B1 dish does not receive generated guidance.
8. Invalid dish ID renders an honest not-found state.
9. Page has no horizontal overflow at 390, 768, 1440 and 2560 px.
10. Full quality gates pass with no new P0/P1 issue.

## SOURCE REVIEW

Rechecked 2026-07-30:

- FoodSafety.gov, Safe Minimum Internal Temperatures.
- FDA, safe food handling.
- FDA, cleaning fruits and vegetables.

## REPORT FORMAT

Submit `design/COMPLETION-KE-023.md` and `design/VERIFY-KE-023.md` after all
quality gates.
