# COMPLETION REPORT — TIP-KE-018

**STATUS:** DONE

## OUTCOME

The household can explicitly enable a daily Web Push reminder from Settings,
choose its IANA timezone and local hour, and disable the channel again. The
browser permission prompt is called only from the enable button.

A protected Vercel cron now invokes a server dispatcher every 15 minutes. The
dispatcher checks each household's local clock, derives the canonical kitchen
agenda, claims each subscription/task pair before network delivery, and sends
at most three `now`/`today` items. It never creates a task, completion state or
assistant mutation path.

## PRODUCTION CHANGES

- Applied Neon migration `20260730090000_housekeeper_reminders`.
- Added Vercel Production variables `VAPID_PUBLIC_KEY`,
  `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` and `CRON_SECRET`.
- Added the production cron schedule `*/15 * * * *`.

## FILES CHANGED

### Created

- `design/TIP-KE-018.md`
- `prisma/migrations/20260730090000_housekeeper_reminders/migration.sql`
- `src/domain/reminders/policy.ts`
- `src/domain/reminders/policy.test.ts`
- `src/data/repo/reminders.ts`
- `src/data/repo/reminders.test.ts`
- `src/lib/reminders/web-push.ts`
- `src/lib/reminders/dispatcher.ts`
- `src/lib/reminders/dispatcher.test.ts`
- `src/app/api/cron/reminders/route.ts`
- `src/app/api/cron/reminders/route.test.ts`
- `src/ui/components/ReminderSettings.tsx`
- `e2e/reminders.spec.ts`
- `vercel.json`
- `design/COMPLETION-KE-018.md`
- `design/VERIFY-KE-018.md`

### Modified

- `prisma/schema.prisma`
- `src/app/actions.ts`
- `src/app/(tabs)/settings/page.tsx`
- `src/data/repo/household.ts`
- `src/data/repo/week-plan.ts`
- `src/lib/assistant/kitchen-agenda.ts`
- `src/lib/week.ts`
- `src/i18n/vn.json`
- `src/i18n/en.json`
- `public/sw.js`
- `playwright.config.ts`
- `e2e/COVERAGE.md`
- `e2e/MANUAL-CHECKLIST.md`
- `README.md`
- `package.json`
- `package-lock.json`

## REQUIREMENT COVERAGE

| Requirement | Evidence | Result |
|---|---|---:|
| KE18-001 | Database default and E2E initial state are disabled | Pass |
| KE18-002 | Permission call exists only inside enable click handler; Playwright call counter | Pass |
| KE18-003 | UI states for unsupported, denied, missing config and error | Pass |
| KE18-004 | Clerk-scoped Server Actions and household-owned subscription relation | Pass |
| KE18-005 | IANA validation, hour Zod validation and database check constraint | Pass |
| KE18-006 | Timezone policy test proves local first-15-minute window | Pass |
| KE18-007 | Dispatcher calls the existing canonical agenda builder | Pass |
| KE18-008 | Unique `(subscriptionId, taskId)` database key and repository test | Pass |
| KE18-009 | Claim-before-send and unique-conflict behavior | Pass |
| KE18-010 | Dispatcher test removes HTTP 404/410 subscriptions | Pass |
| KE18-011 | Transient failure releases the claim and increments failed count | Pass |
| KE18-012 | Constant-time bearer check and route tests | Pass |
| KE18-013 | Server and service worker both allow-list internal app paths | Pass |
| KE18-014 | Disable unsubscribes the browser and deletes household subscriptions | Pass |
| KE18-015 | No task/done model or assistant write capability added | Pass |
| KE18-016 | Full quality gates pass | Pass |

**Coverage:** 16/16 requirements, 100%.

## TEST RESULTS

- Reminder policy/repository/dispatcher/route targets: 12/12 passed.
- Full Vitest: 46 files, 276 tests passed.
- Full Playwright: 61/61 passed from a clean dedicated dev server.
- ESLint: passed.
- Prisma generate, Next production build and TypeScript: passed.
- Desktop and 390×844 visual review: passed.
- `git diff --check`: passed.

## ISSUES DISCOVERED AND RESOLVED

- The first full Playwright invocation reused a stale local server and produced
  connection-refused noise. CI mode now always starts a dedicated server; the
  clean rerun passed 61/61.
- Removing the last expired push subscription originally left the household
  preference visually enabled. Cleanup now atomically disables the channel when
  no subscriptions remain.
- The agenda builder previously resolved only B0 dishes. It now accepts
  household B1 dishes for both shopping derivation and task support.

## SECURITY AND HONESTY NOTES

- Push capability URLs and encryption keys never return to the UI after save.
- The VAPID private key and cron secret are sensitive Production variables.
- Notification payloads contain display copy and an internal path only.
- A sender crash after a successful network request but before receipt update
  favors at-most-once behavior: the existing claim suppresses a duplicate.
- `npm audit --omit=dev` reports three high transitive advisories under the
  current latest Next `16.2.12` (`postcss`/`sharp`). No advisory is introduced
  by `web-push`; npm offers no non-breaking upgrade from the installed latest
  Next version.

## MANUAL RELEASE OBSERVATION

Actual OS-level delivery while a real phone/browser is closed cannot be proven
by CI. The exact production smoke is recorded in
`e2e/MANUAL-CHECKLIST.md`; automated tests cover permission timing, payload
policy, delivery claims, retries, expiry cleanup and cron authentication.

## SUGGESTIONS FOR CHỦ THẦU

- Accept KE-018 as READY after production deployment.
- Perform the one-device OS push smoke during the household's selected window.
- Continue with the next approved Phase 1 package only after that observation.
