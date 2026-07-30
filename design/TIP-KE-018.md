# TIP-KE-018 — Opt-in Housekeeper Reminders

## HEADER

- TIP-ID: TIP-KE-018
- Project: Q's Kitchen / quynh-nutri
- Module: Kitchen agenda, Web Push, household settings and scheduled dispatch
- Depends on: TIP-KE-017
- Priority: P0
- Date: 2026-07-30

## CONTEXT

The kitchen agenda is a deterministic, read-only projection of the household's
canonical meal plan, purchases, stored lots and confirmed leftovers. It does
not yet reach a household member when the app is closed.

KE-018 adds an explicitly enabled Web Push channel. It does not add a task
table, completion state, AI-authored task, or a new source of household truth.

## DECISIONS LOG

| ID | Decision | Rationale |
|---|---|---|
| D18-01 | Browser notification permission is requested only inside the user's enable-button gesture | Permission prompts must be contextual and opt-in |
| D18-02 | Each household stores an IANA timezone and a local reminder hour | Dispatch is based on the household's wall clock, not the server clock |
| D18-03 | A Vercel cron invokes the dispatcher every 15 minutes | The verified production project is on Vercel Pro and supports per-minute schedules |
| D18-04 | Only existing kitchen-agenda tasks may become notifications | Reminders remain deterministic projections of confirmed data |
| D18-05 | Delivery uniqueness is `(subscriptionId, taskId)` | One task reaches each opted-in device at most once |
| D18-06 | Delivery is claimed before the network send | Concurrent cron invocations cannot double-send |
| D18-07 | A failed transient send releases its claim; HTTP 404/410 removes the expired subscription | Temporary outages can retry while dead capability URLs are not retained |
| D18-08 | Notification payloads contain only display copy and an allow-listed internal path | No household records or arbitrary external navigation leave the server |
| D18-09 | The approved Phase 1 blueprint and explicit instruction to continue KE-018 replace another approval checkpoint | The package is already approved in sequence |

## TASK

Add a production reminder channel around the canonical kitchen agenda:

1. let a signed-in household explicitly enable or disable Web Push;
2. store the browser subscription and household schedule;
3. invoke a protected dispatcher on a fixed UTC cron;
4. compare UTC now with each household's IANA local schedule;
5. derive the current agenda from canonical data;
6. send eligible tasks once per opted-in device;
7. deep-link the notification back to the task's source flow.

## REQUIREMENTS

| ID | Requirement | Priority |
|---|---|---:|
| KE18-001 | Reminders are disabled by default | P0 |
| KE18-002 | Permission is requested only after an explicit enable action | P0 |
| KE18-003 | Unsupported, denied and blocked browser states are shown honestly | P0 |
| KE18-004 | Subscription endpoints and keys are stored server-side and household-scoped | P0 |
| KE18-005 | Timezone is a validated IANA zone and reminder hour is 0–23 | P0 |
| KE18-006 | Dispatcher sends only inside the household's local 15-minute window | P0 |
| KE18-007 | Only canonical kitchen-agenda tasks can be sent | P0 |
| KE18-008 | Every subscription/task pair is sent at most once | P0 |
| KE18-009 | Concurrent dispatcher calls cannot double-send | P0 |
| KE18-010 | Expired push subscriptions are removed on HTTP 404/410 | P1 |
| KE18-011 | Transient failures remain retryable and are reported without false success | P1 |
| KE18-012 | Cron endpoint rejects missing or incorrect bearer secret | P0 |
| KE18-013 | Notification clicks open only an allow-listed same-origin app route | P0 |
| KE18-014 | Disabling removes the device subscription and stops future sends | P0 |
| KE18-015 | No task table, done state or assistant mutation capability is added | P0 |
| KE18-016 | Full lint, unit, build and Playwright regression passes | P0 |

## ACCEPTANCE CRITERIA

1. A fresh household sees reminders off and no permission prompt occurs on page
   load.
2. Pressing enable requests permission, creates a Push subscription and stores
   the selected local schedule.
3. Denying permission leaves reminders off and shows a recovery explanation.
4. A valid cron request outside the household window sends nothing.
5. A valid cron request inside the window derives the agenda and sends its
   eligible tasks.
6. Repeating or racing that request does not resend the same task to the same
   subscription.
7. A transient push error can be retried by a later invocation.
8. A 404/410 response deletes the expired subscription.
9. Disabling unsubscribes the browser and deletes its server record.
10. Clicking a notification opens the relevant `/week`, `/shopping` or
    `/pantry` source flow.

## CONSTRAINTS

- No notification before opt-in.
- No AI-generated notification task or silent household mutation.
- No task completion state or parallel task truth.
- No VAPID private key in client code or logs.
- No arbitrary URL in a push payload.
- No medical, food-safety or expiry assertion beyond the reviewed agenda copy.

## QUALITY GATES

```text
npm run lint
npm test
npm run build
npm run test:e2e
git diff --check
```

## REPORT FORMAT

Submit `design/COMPLETION-KE-018.md` and `design/VERIFY-KE-018.md`.
