# RELEASE REPORT – KE-031 PREVIEW

## HEADER

- Project: Q's Kitchen / quynh-nutri
- Release type: Protected Vercel preview
- Date: 2026-07-31
- Git branch: `codex/ke-031-preview`
- Commit: `d68f19e`
- Status: READY FOR HOMEOWNER REVIEW

## DEPLOYMENT

- Preview:
  `https://quynh-nutri-qwq1r288g-nclamvn-gmailcoms-projects.vercel.app`
- Vercel deployment: `dpl_9wL2rrVaHgsTmpa5kBH6PvCaiqjM`
- Runtime region: `iad1`
- Target: preview
- Deployment protection: enabled
- Production aliases: unchanged

The deployment uses values attached only to this preview. It does not change
the shared preview environment or production environment.

## DATA BOUNDARY

- Database branch: `codex-ke031-verify-20260731`
- Neon branch ID: `br-snowy-bar-augegw53`
- Branch expiration: 2026-08-07 18:00 UTC
- Neon main writes: none
- Neon main schema changes: none
- Neon main maintenance: none

The preview uses the existing synthetic verification volume on the temporary
copy-on-write branch. It does not use Neon main for operator measurements.

## OPERATOR ACCESS

- `OPS_USER_IDS` contains exactly one Clerk user.
- The value was derived by intersecting current Clerk users with non-null
  Household owners.
- Only one current Clerk user matched.
- No email address, user ID, or personal field was printed into the release
  report or committed to Git.
- The allowlist exists only in this deployment's server-side environment.

## SMOKE RESULTS

| Check | Result |
|---|---|
| Vercel deployment status | PASS – Ready |
| Public landing through protection bypass | PASS – HTTP 200 |
| Signed-out `/ops/activation?window=90` | PASS – HTTP 307 to same-origin sign-in |
| Retention route without `CRON_SECRET` | PASS – HTTP 503, no repository call |
| Runtime error log after corrected deployment | PASS – no errors found |
| Production alias unchanged | PASS |
| Neon main untouched | PASS |

The first preview attempt did not receive Clerk preview keys and returned 500
from middleware. It was superseded by the deployment listed above, which
received the required Clerk keys only at deployment scope and passed smoke
testing.

## PENDING RELEASE EVIDENCE

The following approved KE-031 gates still require an authenticated browser
session:

1. 20 warm requests to the branch-backed 90-day operator report with p95 below
   1.5 seconds;
2. confirmation that the authenticated operator DTO completes its 90-day
   aggregation without an unavailable state.

The public preview is protected by Vercel authentication before Clerk
authentication. The Homeowner must open the preview while signed in to Vercel,
then sign in to Q's Kitchen with the allowlisted Clerk account. Production
release remains closed until these measurements are recorded.

## RELEASE VERDICT

```text
Git preview branch: RELEASED
Vercel preview: READY
Neon temporary branch: READY
Production: UNCHANGED
Production release approval: NOT GRANTED
```
