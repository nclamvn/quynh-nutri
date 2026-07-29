# COMPLETION-KE-012 — Balanced Canvas & Workspace Alignment

## STATUS

- TIP: `TIP-KE-012`
- Result: Implemented and verified locally
- Date: 2026-07-29
- Scope: Authenticated application UI only
- Database / AI / persisted state: Unchanged

## DELIVERED

1. Removed the solid divider between the Overview housekeeper introduction and
   its process steps. The single dashed connector remains.
2. Removed the top and bottom rules around the desktop flower mark.
3. Increased the desktop flower from 28px to exactly 35px (125%).
4. Replaced route-specific page caps with one centered, maximum-1440px canvas
   while preserving the existing 20px mobile and 32px common-desktop gutters.
5. Prevented the optional contextual right rail from participating in main
   width calculation. It now appears only where the ultra-wide spare margin can
   contain it without shifting or covering the main canvas.
6. Fixed empty Pantry so its form and inventory card use the full workspace
   whenever no recipe rail exists.
7. Bound Notes form, note list and empty state to the same 896px workspace.
8. Bound the empty Suppliers state and its quick suggestions to the same
   centered workspace.
9. Kept Settings content intentionally readable at 760px while its page title
   remains on the shared route origin.
10. Updated stale feature-discovery coverage to assert the current, visible
    “Mở thực đơn” action rather than a removed label.

## FILES

- `src/ui/components/PageContainer.tsx`
- `src/ui/components/AppShell.tsx`
- `src/ui/components/RightRail.tsx`
- `src/ui/components/Sidebar.tsx`
- `src/ui/components/HousekeeperPathCard.tsx`
- `src/app/(tabs)/pantry/page.tsx`
- `src/app/(tabs)/notes/page.tsx`
- `src/app/(tabs)/suppliers/page.tsx`
- `src/app/(tabs)/settings/page.tsx`
- `src/app/(tabs)/dishes/page.tsx`
- `e2e/app-shell-cohesion.spec.ts`
- `e2e/feature-discovery.spec.ts`

## REQUIREMENT EVIDENCE

| Requirement | Evidence | Result |
|---|---|---:|
| KE12-001 | `data-housekeeper-intro` computed bottom border is `0px`; dashed step borders retained | Pass |
| KE12-002 | Desktop brand SVG renders 35×35px; wrapper top/bottom borders are `0px` | Pass |
| KE12-003 | 2560px E2E asserts a centered canvas capped at 1440px | Pass |
| KE12-004 | Twelve signed-in route titles compared at 1440px and 2560px within 1px | Pass |
| KE12-005 | Empty Pantry workspace equals the full page-content width | Pass |
| KE12-006 | Notes form and empty state centers equal their shared workspace center | Pass |
| KE12-007 | Empty Suppliers state and suggestions share `data-suppliers-workspace` | Pass |
| KE12-008 | Existing 390px gutter and horizontal-overflow regression remains green | Pass |
| KE12-009 | Existing complete E2E coverage for app behavior, themes and navigation remains green | Pass |
| KE12-010 | Added feedback-specific and ultra-wide Playwright assertions | Pass |
| KE12-011 | All route title origins remain equal even on routes with contextual rail content | Pass |

## QUALITY GATES

- `git diff --check` — pass
- `npm run lint` — pass
- `npm test` — 40 files, 256 tests passed
- `npm run build` — pass, Next.js 16 production build and TypeScript complete
- `npx playwright test e2e/app-shell-cohesion.spec.ts` — 5/5 passed
- `npm run test:e2e` from a fresh E2E server — 51/51 passed

## VISUAL REVIEW

Reviewed locally in the authenticated application:

- Overview: no competing solid divider; flower mark is larger and unframed.
- Pantry: empty inventory form/card use the full visible page width.
- Notes: input and empty state share one axis.
- Suppliers: empty message and quick suggestions read as one composition.
- Light theme at 1280px and automated dark/mobile/ultra-wide regressions remain
  within the same semantic design system.

## HONESTY

- No task table, synthetic “done” state or AI-authored household data was added.
- No assistant capability or mutation path was changed.
- No database migration was required.
