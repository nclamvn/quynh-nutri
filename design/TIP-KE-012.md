# TIP-KE-012 — Balanced Canvas & Workspace Alignment

## HEADER

- TIP-ID: TIP-KE-012
- Project: Q's Kitchen / quynh-nutri
- Module: Authenticated application layout and navigation brand
- Depends on: TIP-KE-011
- Priority: P0
- Date: 2026-07-29

## CONTEXT

The Homeowner supplied five production screenshots from an ultra-wide desktop
and approved direct implementation. Those screenshots invalidate one KE-011
assumption: keeping a capped page canvas permanently anchored to the left is
balanced at 1440px, but produces a large dead zone at wider viewports.

This change is UI-only. It must preserve product behavior, persisted household
data, Clerk authentication, Neon schemas and the existing botanical palette.

## EVIDENCE AND ROOT CAUSES

1. `PageContainer` caps normal pages at 1184px but never centers that cap.
2. Pantry always declares a two-column grid, even when its right-side recipe
   rail has no items; the only visible child is therefore trapped in the left
   column.
3. Notes caps its input row at 672px while centering the empty state in the
   wider page canvas, creating two unrelated visual axes.
4. The Suppliers empty state and its quick suggestions do not share a bounded
   workspace.
5. `HousekeeperPathCard` places a solid divider immediately above the dashed
   process connector, creating two competing horizontal rules.
6. The desktop flower mark is enclosed by top and bottom borders and renders at
   28px, which reads as a generic framed icon rather than the product signature.
7. The contextual right rail participates in the flex layout on only some
   routes, changing the main area's center by half the rail width.

## DESIGN DECISION

- All authenticated routes share one centered desktop canvas capped at 1440px.
- At common laptop widths the canvas still fills the available shell, so the
  established 20px mobile and 32px desktop gutters remain unchanged.
- Page titles always share the canvas origin. Narrow task content may remain
  intentionally bounded inside that canvas, but its form, results and empty
  state must share the same axis.
- Pantry becomes one column whenever no useful right rail exists.
- The contextual rail becomes an ultra-wide overlay and never participates in
  main-canvas width calculation.
- The flower is presented without decorative rules and grows exactly 125%,
  from 28px to 35px.

## REQUIREMENTS

| ID | Requirement | Priority |
|---|---|---:|
| KE12-001 | Remove the solid divider above the Overview process steps while retaining the dashed connector | P0 |
| KE12-002 | Remove both desktop logo rules and render the flower at exactly 35px | P0 |
| KE12-003 | Center one shared, maximum-1440px page canvas on ultra-wide desktop viewports | P0 |
| KE12-004 | Keep every signed-in page title on the same x origin at a given viewport | P0 |
| KE12-005 | Let Pantry use the full workspace when the recipe rail is absent | P0 |
| KE12-006 | Make Notes form, list and empty state share one bounded workspace | P0 |
| KE12-007 | Make Suppliers empty state and quick suggestions share one bounded workspace | P1 |
| KE12-008 | Preserve 20px mobile gutters, 32px common-desktop gutters and zero horizontal overflow | P0 |
| KE12-009 | Preserve dark/light themes, VN/EN content and keyboard-visible focus | P0 |
| KE12-010 | Add automated regression coverage for logo, divider and ultra-wide alignment | P0 |
| KE12-011 | Prevent the optional contextual rail from shifting the page canvas | P0 |

## ACCEPTANCE CRITERIA

1. At 1440px and 2560px, all main signed-in route titles share one x
   coordinate within 1px.
2. At 2560px, page content is centered within the application main frame and
   never exceeds 1440px.
3. With an empty Pantry, the add form and empty inventory card consume the
   available page workspace rather than only the left grid column.
4. With empty Notes, the input row and empty-state center use the same bounded
   workspace.
5. The desktop flower SVG has a 35×35px rendered box and no top or bottom
   border around it.
6. The Overview introduction has no bottom border; the dashed step connector
   remains visible.
7. Lint, unit tests, production build and the full Playwright suite pass.

## CONSTRAINTS

- No database migration, schema or repository change.
- No AI-generated tasks, content or silent state mutation.
- No new dependency.
- No fake completion status.
- Do not alter the landing-page destination of the brand link.
