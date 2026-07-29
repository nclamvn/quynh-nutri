# TIP-KE-013 — Full-Width Workspaces & Control Rhythm

## HEADER

- TIP-ID: TIP-KE-013
- Project: Q's Kitchen / quynh-nutri
- Module: Authenticated application layout, controls and nutrition provenance
- Depends on: TIP-KE-012
- Priority: P0
- Date: 2026-07-29

## CONTEXT

The Homeowner supplied five new production screenshots after KE-012. The shared
canvas is centered, but several route-local constraints and inconsistent
control paddings still make the application look unfinished on wide screens.
The request explicitly authorizes a thorough correction, so the separate
Blueprint checkpoint is collapsed into this TIP.

This is a UI-system correction. It must not change household state, nutrition
calculations, AI behavior, Clerk authentication or Neon schemas.

## EVIDENCE AND ROOT CAUSES

1. Notes constrains its complete workspace to `max-w-4xl`, leaving half the
   available desktop canvas unused.
2. Settings constrains all sections to 760px, producing a long left column and
   a large empty right half.
3. Nutrition renders day and household filters as two mandatory rows even when
   both groups fit comfortably on one line.
4. Page-header actions independently choose `py-1.5`, `py-2` or `py-2.5`, so
   status, preparation, primary and navigation controls have different heights.
5. `ProvenanceChip` allows its value, unit and coverage to wrap independently.
   The anchored form `≈point (low–high) kcal · coverage` breaks inelegantly in
   week cards.

## DESIGN SYSTEM DECISION

### Layout

- The 1440px authenticated canvas remains the single route boundary.
- Route workspaces fill that canvas unless a narrower measure is required for
  reading prose; Notes and Settings are operational surfaces, not prose.
- Settings uses a responsive two-column ledger at wide desktop widths instead
  of one narrow column.
- Related filter groups share a single horizontal toolbar when space permits
  and scroll independently only on narrow screens.

### Control rhythm

- Compact chip/filter: 32px.
- Standard page action: 40px.
- Large sheet confirmation remains 48px.
- Page-header actions are single-line and share the 40px standard regardless of
  visual priority.

### Provenance capsule

- Numeric value, unit and coverage never wrap as unrelated fragments.
- In constrained week cards, anchored values use a compact honest form:
  approximate point + unit + coverage. The complete range remains available in
  the accessible label and tooltip.
- Full contexts retain the complete point/range display.

## REQUIREMENTS

| ID | Requirement | Priority |
|---|---|---:|
| KE13-001 | Notes form, list and empty state fill the shared route canvas | P0 |
| KE13-002 | Settings uses the full desktop canvas with a responsive two-column section grid | P0 |
| KE13-003 | Nutrition day and member filters share one desktop toolbar when they fit | P0 |
| KE13-004 | Compact filters use a consistent 32px height and never wrap internally | P0 |
| KE13-005 | Direct PageHeader actions use one 40px height and do not wrap internally | P0 |
| KE13-006 | Week sync, preparation, reroll and shopping actions align to the same height | P0 |
| KE13-007 | Provenance capsules never split value, unit or coverage across arbitrary lines | P0 |
| KE13-008 | Week kcal capsules fit inside all responsive week-card columns | P0 |
| KE13-009 | Preserve mobile overflow behavior, focus visibility and light/dark semantics | P0 |
| KE13-010 | Add regression coverage for full-width workspaces, control heights and kcal overflow | P0 |

## ACCEPTANCE CRITERIA

1. At 2560px, Notes workspace width equals page-content width.
2. At 2560px, Settings uses two visible section columns and its grid width
   equals page-content width.
3. At a 1440px viewport, Nutrition filter groups share one row if their combined
   intrinsic width fits.
4. Every direct week PageHeader control has a 40px rendered height within 1px.
5. Nutrition filters have a 32px rendered height within 1px.
6. Every visible provenance capsule has `white-space: nowrap`; week kcal
   capsules remain within their parent card.
7. 390px pages retain zero horizontal document overflow.
8. Lint, unit tests, production build and the full Playwright suite pass.

## CONSTRAINTS

- No new dependency.
- No database or API changes.
- No change to nutrition arithmetic or provenance tone.
- No task table, fake completion state or AI-authored household data.
- Preserve the existing botanical/rose/honey semantic palette.
