# TIP-KE-011 — App Shell Cohesion & Culinary Folio

## HEADER

- TIP-ID: TIP-KE-011
- Project: Q's Kitchen / quynh-nutri
- Module: Authenticated application UI shell
- Depends on: TIP-KE-010
- Priority: P0
- Date: 2026-07-29

## CONTEXT

- Working directory: `/Users/os/quynh-nutri`
- Stack: Next.js 16.2.12, React 19, Tailwind CSS 4
- Preserve the existing rose / botanical / honey semantic color contract.
- Preserve product behavior, Store data contracts, Clerk auth and Neon schema.
- The Homeowner explicitly requested a thorough UI/UX cohesion pass and direct
  implementation. The separate Blueprint approval checkpoint is therefore
  collapsed into this TIP; the change remains UI-only and reversible.

## SCAN FINDINGS

1. `PageContainer` currently centers three unrelated widths: 768, 1152 and
   1280px.
2. Routes with `RightRail` start at x=272 at 1440px; routes without it start at
   x=296; Settings starts at x=488.
3. Overview, Week and Dishes implement bespoke page headers while other routes
   use `PageHeader`.
4. Notes adds a second centered max-width inside a wide page.
5. Sidebar uses the common “logo + grouped pills + footer avatar” SaaS pattern.
6. The flower mark in desktop and mobile chrome is not a link to `/`.
7. `RightRail` begins at 1280px and compresses several routes at a common
   1440px laptop viewport.

## DESIGN DIRECTION

### Subject and job

Q's Kitchen is a household food steward for Vietnamese families. The signed-in
shell should feel like a carefully kept culinary folio: calm, legible, warm and
operational. Its single job is to make every household workflow feel like part
of the same place.

### Palette

- Rose action: `#EF5775`
- Rose ink: `#962840`
- Botanical truth: `#469B75`
- Honey attention: `#C58A21`
- Warm canvas: `#FFFDFC`
- Ink: `#272327`

No new semantic colors. Dark mode keeps the existing mapped equivalents.

### Type

- Brand lockup: Lora, restrained, to evoke a handwritten household cookbook.
- UI headings/body/data: Inter, existing weights and tabular numerals.
- Group captions: Inter uppercase with wider tracking, used only as structure.

### Layout

```text
desktop
┌── culinary folio 264 ──┬──────── one page origin ───────────────┬─ context ─┐
│ clickable brand         │ x = shell + 32 on every route          │ ≥1536 only│
│ stitched navigation     │ one header grammar                     │           │
│ household seal          │ content width varies only by intent,   │           │
│ collapse control        │ never by centering the page itself     │           │
└─────────────────────────┴─────────────────────────────────────────┴───────────┘

mobile
┌ menu ───── clickable brand ───── theme ┐
│ one 20px page gutter                   │
│ one header grammar                     │
│ content                                │
└──────────── four-tab dock ─────────────┘
```

### Signature

The sidebar is the “gáy sổ bếp”: a quiet vertical stitch line, with the active
route marked by a rose bookmark notch instead of a rounded SaaS pill. The
flower/brand lockup is always a real link back to the public landing page.

## REQUIREMENTS

| ID | Requirement | Priority |
|---|---|---:|
| KE11-001 | Every signed-in route shares one outer page origin and gutter | P0 |
| KE11-002 | `narrow`, `wide`, `full` constrain inner content but never center the page origin | P0 |
| KE11-003 | Overview, Week and Dishes adopt the shared page-header grammar | P0 |
| KE11-004 | Remove route-local accidental centering such as Notes input | P1 |
| KE11-005 | Redesign desktop Sidebar as the culinary-folio system | P0 |
| KE11-006 | Active navigation is distinctive, restrained and non-pill | P1 |
| KE11-007 | Flower/brand links to `/` on expanded, collapsed and mobile chrome | P0 |
| KE11-008 | Collapse mode remains usable, labelled and keyboard accessible | P0 |
| KE11-009 | Right rail does not compress the common 1440px desktop canvas | P1 |
| KE11-010 | Mobile keeps a consistent 20px gutter and no horizontal overflow | P0 |
| KE11-011 | Light/dark, VN/EN and visible focus remain supported | P0 |
| KE11-012 | Automated tests verify cross-route alignment and logo navigation | P0 |

## ACCEPTANCE CRITERIA

1. Given a 1440px viewport, when visiting all main signed-in routes, then every
   visible page `h1` shares the same x coordinate within 1px.
2. Given Settings, when compared with Overview, then the content may be
   narrower but its title and first content column remain left-aligned.
3. Given desktop expanded or collapsed Sidebar, when activating the flower
   brand, then navigation reaches `/`.
4. Given mobile chrome, when activating the flower brand, then navigation
   reaches `/`.
5. Given Sidebar navigation, then active state has a clear semantic indicator
   without a full rounded pill.
6. Given 390px and 1440px visual checks, then there is no horizontal overflow
   and page/header gutters remain consistent.
7. Lint, unit tests, type/build and the full E2E suite pass.

## CONSTRAINTS

- No Prisma schema or migration.
- No business logic, Store mutation or assistant capability change.
- No fake content, status or data.
- No new UI dependency.
- Keep the existing landing page art direction.
- Respect `prefers-reduced-motion` and existing color semantics.
