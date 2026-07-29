# COMPLETION REPORT — TIP-KE-011

**STATUS:** DONE

## 1. Outcome

Authenticated application chrome is now governed by one layout system instead
of route-local centering:

- one outer page origin;
- 20px mobile and 32px desktop gutters;
- `narrow`, `wide`, `full` constrain content without moving its left edge;
- one header grammar for title, subtitle, actions and filters;
- contextual rail delayed to 2xl so 1440px laptops retain the full canvas.

The Sidebar was redesigned as a culinary folio:

- Lora brand lockup and “Sổ bếp nhà mình” context;
- section rules and a quiet recipe-ledger rhythm;
- rose bookmark marker instead of a rounded active pill;
- household sync seal retained at the foot;
- expanded and collapsed brand marks are real links to `/`;
- mobile brand is also a real link to `/`.

## 2. Requirement coverage

| Requirement | Result | Evidence |
|---|---:|---|
| KE11-001 | Pass | all routes use one `data-page-frame` origin |
| KE11-002 | Pass | Settings is 760px but shares x with wide routes |
| KE11-003 | Pass | Overview, Week, Dishes use `PageHeader` |
| KE11-004 | Pass | Notes input no longer uses `mx-auto` |
| KE11-005 | Pass | Sidebar replaced with culinary-folio structure |
| KE11-006 | Pass | `folio-nav-active` bookmark treatment |
| KE11-007 | Pass | desktop/collapsed/mobile brand E2E |
| KE11-008 | Pass | labelled collapse and visible focus retained |
| KE11-009 | Pass | RightRail moves from `xl` to `2xl` |
| KE11-010 | Pass | 390px gutter/overflow E2E |
| KE11-011 | Pass | visual review light/dark, VN/EN JSON and focus |
| KE11-012 | Pass | four new cohesion E2E scenarios |

**Implementation coverage:** 12/12 — 100%.

## 3. Files changed

### Created

- `design/TIP-KE-011.md`
- `e2e/app-shell-cohesion.spec.ts`
- `design/COMPLETION-KE-011.md`
- `design/VERIFY-KE-011.md`

### Modified

- `src/ui/components/PageContainer.tsx`
- `src/ui/components/PageHeader.tsx`
- `src/ui/components/Sidebar.tsx`
- `src/ui/components/MobileTopBar.tsx`
- `src/ui/components/MobileMenu.tsx`
- `src/ui/components/RightRail.tsx`
- `src/app/globals.css`
- `src/app/(tabs)/overview/page.tsx`
- `src/app/(tabs)/week/page.tsx`
- `src/app/(tabs)/dishes/page.tsx`
- `src/app/(tabs)/notes/page.tsx`
- `src/app/(tabs)/suppliers/[id]/page.tsx`
- `src/i18n/vn.json`
- `src/i18n/en.json`
- `e2e/feature-discovery.spec.ts`

## 4. Test results

```text
i18n JSON parse:   pass
git diff check:    pass
TypeScript:        0 errors
ESLint:            0 errors
Unit/repository:   256/256 pass, 40 files
Build:             pass, 22 routes
E2E:               50/50 pass
```

New E2E evidence:

1. Twelve signed-in routes share the same desktop `h1` x coordinate within 1px.
2. Settings remains narrow while its first column stays on the shared origin.
3. Expanded and collapsed Sidebar brands return to `/`.
4. Mobile brand returns to `/`.
5. Mobile frame uses a 20px gutter and has zero document overflow.
6. Active navigation exposes `aria-current` and the non-pill folio treatment.

## 5. Visual review

- `e2e/__screens__/app-shell-1440.png`
- `e2e/__screens__/app-shell-390.png`
- `e2e/__screens__/housekeeper-path-desktop.png`

Review performed in both light and dark themes:

- 1440px: consistent left edge, quiet Sidebar hierarchy, no RightRail squeeze;
- 1600px: contextual RightRail still appears and its navigation flow remains;
- 390px: 20px page gutter, one-line primary CTA, no horizontal overflow;
- Week: hydrated command row fits one line at 1440px and all seven day cards
  retain the available canvas.

## 6. Boundary audit

- No Prisma schema or migration.
- No Store/business-rule change.
- No assistant tool or prompt change.
- No fake data or status.
- No new dependency.
- Landing design is unchanged; only app-chrome links now return to it.

## 7. Deviations

None. The RightRail breakpoint change and removal of Week’s generic gradient
hero are explicit Blueprint decisions in TIP-KE-011, not implementation drift.

## 8. Suggestions for Chủ thầu

The next visual phase, if approved separately, should focus on content-level
primitives (forms, empty states, table/list density) rather than changing the
shell again. The shell now provides a stable alignment contract.
