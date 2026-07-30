# COMPLETION REPORT — TIP-KE-024

**STATUS:** PRODUCTION RELEASED

## OUTCOME

Q's Kitchen now has a repeatable marketing-readiness lane layered on top of the
existing product regression suite:

- global browser security headers and removed framework disclosure;
- production-compatible Clerk CSP, verified on the real sign-in component;
- malformed body, payload-size and rate-limit browser tests;
- isolated production-build performance budgets on mobile and desktop;
- a localhost-only average/stress/spike runner with a remote-target kill switch;
- production dependency audit in the readiness gate;
- public canonical, Open Graph, Twitter, robots and sitemap metadata;
- route-scoped Clerk so the public landing no longer downloads the auth runtime;
- WebP hero and product-stage assets with their original provenance.

No nutrition, meal plan, shopping, inventory, cooking, task or AI mutation
contract changed.

## IMPLEMENTATION

### Created

- `design/TIP-KE-024.md`
- `playwright.marketing.config.ts`
- `readiness/marketing-performance.spec.ts`
- `e2e/security-readiness.spec.ts`
- `scripts/stress-test.mjs`
- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `src/ui/marketing/LandingResourceHints.tsx`
- `public/landing/hero.webp`
- `public/landing/stage-food.webp`
- `design/COMPLETION-KE-024.md`
- `design/VERIFY-KE-024.md`

### Modified

- `next.config.ts`
- `package.json`
- `package-lock.json`
- `.github/workflows/ci.yml`
- `e2e/COVERAGE.md`
- `src/app/layout.tsx`
- `src/app/(tabs)/layout.tsx`
- `src/app/sign-in/[[...sign-in]]/page.tsx`
- `src/app/sign-up/[[...sign-up]]/page.tsx`
- `src/app/page.tsx`
- `src/proxy.ts`
- `src/data/landing-media.ts`

### Replaced

- `public/landing/hero.jpg` → `public/landing/hero.webp`
- `public/landing/stage-food.jpg` → `public/landing/stage-food.webp`

## QUANTITATIVE RESULTS

### Public landing

Warm production server with a cold measured browser cache:

| Metric | Mobile 390-class | Desktop 1280-class | Gate |
|---|---:|---:|---:|
| LCP | 1,216 ms | 704 ms | ≤ 2,500 ms |
| CLS | 0 | 0 | ≤ 0.1 |
| DOMContentLoaded | 1,103 ms | 550 ms | ≤ 2,000 ms |
| Load | 1,219 ms | 705 ms | ≤ 3,000 ms |
| Transfer | 982,466 B | 1,002,335 B | ≤ 1,350,000 B |
| JavaScript | 184,894 B | 184,894 B | ≤ 550,000 B |
| Resources | 30 | 33 | ≤ 55 |

Before KE-024, the live landing baseline transferred about 1.86–1.90 MB and
loaded about 485 KB of JavaScript. The local production gate now records about
0.98–1.00 MB and 185 KB respectively. Environment differences mean this is a
directional comparison; the committed budgets are the regression contract.

### Image payload

| Asset | Before | After | Saving |
|---|---:|---:|---:|
| Hero | 661,738 B | 278,666 B | 57.9% |
| Product stage | 452,173 B | 240,486 B | 46.8% |
| Combined | 1,113,911 B | 519,152 B | 53.4% |

Both optimized files retain the source pixels' dimensions: hero 2400×1920 and
stage 1800×1200. Existing manifest dimensions were corrected to those actual
values; authors and canonical Unsplash links are unchanged.

### Local bounded load

| Scenario | Requests / concurrency | Failures | p95 | Throughput |
|---|---:|---:|---:|---:|
| Average | 100 / 10 | 0 | 15.0 ms | 1,316.4 req/s |
| Stress | 400 / 40 | 0 | 39.5 ms | 2,506.8 req/s |
| Spike | 160 / 80 | 0 | 47.4 ms | 2,909.7 req/s |

The runner sends only bounded requests to the public local landing, robots and
manifest. A remote target exits with code 2 before any request unless
`ALLOW_REMOTE_STRESS=1` is explicitly provided.

## TEST EVIDENCE

- ESLint: passed.
- Vitest: 50 files, 294 tests passed.
- Next.js 16.2.12 production build and TypeScript: passed.
- Static generation: 74 routes, including robots and sitemap.
- Full Playwright regression: 75/75 passed.
- Security readiness: 3/3 passed.
- Marketing readiness: 4/4 passed across mobile and desktop.
- Local load: 660 requests, 0 failures.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities.
- Clerk sign-in production build: HTTP 200, component visible, 0 CSP-blocked
  request and 0 CSP console error.
- `git diff --check`: passed.

## SECURITY REVIEW

- CSP permits the installed Clerk FAPI, Clerk protection hosts and Cloudflare
  challenge while denying objects, framing and foreign base URLs.
- `unsafe-eval` exists only in development; Vercel production adds
  `upgrade-insecure-requests`.
- HSTS, frame denial, MIME sniffing denial, strict referrer, COOP, CORP and a
  narrow browser permissions policy are present.
- API and authenticated redirect responses do not expose permissive ACAO.
  Vercel adds `Access-Control-Allow-Origin: *` to the prerendered public landing;
  that response is intentionally public and contains no household data.
- Invalid JSON returns 400; oversized body returns 413.
- The substitute boundary permits no more than 60 calls per fixed instance
  window and returns 429 thereafter.
- Hermetic E2E still cannot call Clerk, Neon, AI, geocode or hotline services.

## DEVIATIONS AND DEFERRED ITEMS

1. The performance gate exposed that the root layout loaded Clerk on the public
   landing. Clerk was moved to the authenticated and auth route boundaries.
   This is an internal performance correction inside the approved scope; auth
   behavior and URLs are unchanged.
2. `robots.txt` and `sitemap.xml` initially inherited the authentication proxy.
   They were explicitly made public so their generated content is reachable.
3. Full `npm audit` still reports nine high findings in the development-only
   ESLint chain through `minimatch@3` / `brace-expansion`. Production audit is
   clean. GitHub's advisory lists only `brace-expansion@5.0.8` as patched, which
   is API-incompatible with the pinned legacy ESLint chain; npm's offered force
   fix is a breaking/mismatched toolchain change. The leaf was raised to its
   latest compatible 1.x version and the remaining dev-only advisory is
   deferred pending an upstream compatible ESLint/Next toolchain release.
4. The first GitHub readiness run exposed that its intentionally fake Clerk
   keys redirect a production-mode local server before the public landing can
   render. The harness now uses a dedicated proxy bypass that requires all of:
   `READINESS_BYPASS_AUTH=1`, `CI=true`, and `VERCEL!=1`. This keeps the test
   hermetic while making the branch impossible on Vercel.

## RELEASE

- Application commits:
  - `093197c0b8df54bbf8bc93b489eea331838a103f`
  - `28461b33ecc60ba10dc64833b6ad85c6a6709243`
- GitHub CI: run `30529437756`, all quality, E2E and readiness jobs passed.
- Vercel deployment: `dpl_6MQ9V8ADMz51khBZ2BM4gnKWX6JD`.
- Production URL:
  `https://quynh-nutri-h8kav74gx-nclamvn-gmailcoms-projects.vercel.app`.
- Production alias: `https://anngon.io`.
- Live landing:
  - mobile LCP 1,084 ms, CLS 0, transfer 978,796 B, JS 190,554 B;
  - desktop LCP 580 ms, CLS 0, transfer 1,001,278 B, JS 190,554 B;
  - 0 Clerk resources on the landing and 0 browser/page error.
- Live sign-in: HTTP 200, Clerk UI visible, 0 CSP blocked request and 0 CSP
  console error.
- Live crawler routes: HTTP 200, public-only robots and sitemap content.
- Protected `/overview` and `/api/substitute`: expected HTTP 307 to same-origin
  Clerk sign-in; security headers present and no permissive ACAO.

KE-024 is live on `anngon.io`.
