# TIP-KE-024 — Marketing Readiness, Security and Load Gates

## HEADER

- TIP-ID: TIP-KE-024
- Project: Q's Kitchen / quynh-nutri
- Module: Release engineering, public landing and API boundaries
- Depends on: TIP-KE-017, TIP-KE-023
- Priority: P0
- Date: 2026-07-30

## CONTEXT

The application is live at `anngon.io` and the owner is preparing marketing.
The existing suite covers product behavior but does not yet enforce public-page
performance budgets, response security headers, bounded local load scenarios or
search-engine metadata.

KE-017 applies: the complete proposed diff was shown before implementation and
the Homeowner explicitly approved it with “duyệt diff KE-024”.

## REQUIREMENTS

| ID | Requirement | Priority |
|---|---|---:|
| KE24-001 | Add production-compatible browser security headers without breaking Clerk | P0 |
| KE24-002 | Remove framework disclosure and prevent framing, MIME sniffing and broad browser capabilities | P0 |
| KE24-003 | Verify malformed and oversized API payloads fail closed | P0 |
| KE24-004 | Verify the substitute endpoint enforces its published per-instance rate limit | P0 |
| KE24-005 | Add an isolated production-build marketing performance gate | P0 |
| KE24-006 | Enforce landing LCP, CLS, resource-count, transfer and JavaScript budgets | P0 |
| KE24-007 | Reduce the two large CSS-background landing assets without visual or provenance changes | P1 |
| KE24-008 | Add canonical, Open Graph, Twitter, robots and sitemap metadata for the public landing only | P1 |
| KE24-009 | Add bounded average, stress and spike scenarios against localhost | P0 |
| KE24-010 | Refuse remote stress targets unless an explicit unsafe override is supplied | P0 |
| KE24-011 | Resolve high package advisories where compatible with the pinned stable Next.js version | P0 |
| KE24-012 | Run the new readiness gates in CI after existing quality and E2E gates | P0 |
| KE24-013 | Preserve hermetic E2E: no real Clerk, Neon, AI, geocode or hotline calls | P0 |
| KE24-014 | Submit quantitative completion and verification evidence before release | P0 |

## ACCEPTANCE CRITERIA

1. Landing, authenticated shell and API responses carry the expected headers;
   production responses do not expose `X-Powered-By`.
2. Clerk sign-in renders with no CSP violation that blocks authentication UI.
3. Invalid JSON returns 400, oversized declared and actual payloads return 413.
4. At most 60 substitute requests succeed in the fixed window and later calls
   return 429.
5. The local production landing has no uncaught page error, no relevant console
   error and meets its committed performance budgets.
6. Optimized hero and stage assets preserve the approved dimensions, crop,
   authorship and source links while materially reducing bytes.
7. Only the public landing is listed in the sitemap; private application and
   API routes are disallowed for crawlers.
8. Average, stress and spike localhost scenarios meet explicit error-rate and
   p95 thresholds.
9. A non-loopback stress target exits before sending any request unless
   `ALLOW_REMOTE_STRESS=1`.
10. `npm audit --omit=dev --audit-level=high`, lint, unit, build, full E2E and
    readiness suites pass, or an upstream-only advisory is documented honestly.

## CONSTRAINTS

- Do not stress `anngon.io` or any remote service during automated testing.
- Do not add k6 or another load-testing runtime; use bounded native Node fetch.
- Do not weaken authentication or reuse production credentials in hermetic E2E.
- Do not change nutritional, shopping, inventory or cooking business behavior.
- Do not create tasks or synthetic `done` state.
- Runtime AI cannot author or repair the gates or their evidence.

## REPORT FORMAT

Submit `design/COMPLETION-KE-024.md` and `design/VERIFY-KE-024.md` after all
quality and production smoke gates.
