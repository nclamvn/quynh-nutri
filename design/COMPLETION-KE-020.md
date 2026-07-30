# COMPLETION REPORT — TIP-KE-020

**STATUS:** PRODUCTION RELEASED

## OUTCOME

Q's Kitchen now has one global “Ghi nhanh” inbox for receipt photos, package
labels and voice notes.

- The mobile centre action and desktop sidebar open the same capture flow.
- Camera/gallery images accept only bounded JPEG, PNG or WebP input.
- Voice recognition is a progressive enhancement; editable text remains
  available when the browser cannot listen.
- Extraction creates an in-memory draft with editable raw values.
- Deterministic name matching proposes a current shopping line without giving
  AI access to household IDs.
- The planned value and captured value are shown as a complete diff.
- The existing receive-shopping form is the only final mutation path and still
  requires “Xác nhận đã mua”.
- Images, transcripts and draft proposals are not persisted.

## PRODUCTION RELEASE

- Application commit: `c319be24c38afed5c72f1908aa685f15f16d2978`.
- Vercel deployment: `dpl_3EpRN7qpKtUQmadKeKPgiM7aK55J`.
- Production alias: `https://anngon.io`.
- GitHub CI run `30521742097`: quality and E2E jobs passed.
- Smoke: landing returned HTTP 200; protected `/overview` returned the expected
  Clerk HTTP 307 redirect while signed out.

## IMPLEMENTATION

### Created

- `design/TIP-KE-020.md`
- `src/domain/capture/proposal.ts`
- `src/domain/capture/proposal.test.ts`
- `src/lib/capture/extract.ts`
- `src/app/api/capture/route.ts`
- `src/ui/components/CaptureHub.tsx`
- `e2e/capture-confirmation.spec.ts`
- `design/COMPLETION-KE-020.md`
- `design/VERIFY-KE-020.md`

### Modified

- `src/ui/components/AppShell.tsx`
- `src/ui/components/TabBar.tsx`
- `src/ui/components/Sidebar.tsx`
- `src/ui/components/ReceiveShoppingItemSheet.tsx`

## ACCEPTANCE RESULTS

1. Receipt/photo output is review-only before confirmation: Pass.
2. Label date remains a literal printed date; no shelf life is invented: Pass.
3. Voice text fallback works independently of speech recognition: Pass.
4. Canonical matching is deterministic and outside AI: Pass.
5. Planned-versus-captured diff is visible before mutation: Pass.
6. Unmatched candidates cannot be applied until mapped: Pass.
7. Final mutation reuses the authenticated, idempotent receive transaction:
   Pass.
8. Authentication, rate, body-size and MIME boundaries fail closed: Pass.
9. No capture table, task table, fake completion or AI mutation path: Pass.
10. Unit, E2E, semantic accessibility, lint and production build gates: Pass.

## TEST EVIDENCE

- Capture domain targets: 3/3 passed.
- Full Vitest: 48 files, 282 tests passed.
- Full Playwright: 66/66 tests passed.
- Capture E2E:
  - voice draft → diff → cancel leaves shopping unchanged;
  - label photo → printed date → existing confirmation form;
  - unsupported file → visible error and no proposal.
- Existing receive E2E: explicit confirm → reload → one pantry lot.
- ESLint: passed.
- Prisma generate: passed.
- Next.js production build and TypeScript: passed.
- `git diff --check`: passed.
- Vercel production build: passed.
- GitHub quality and E2E jobs: passed.

## SECURITY, PRIVACY AND HONESTY REVIEW

- The route re-authenticates and rate-limits per authenticated user.
- JSON transcripts are capped at 2,000 characters.
- Multipart requests require a declared bounded body and a maximum 5 MB image.
- Only JPEG, PNG and WebP are accepted.
- Raw images and transcripts are held only for the current request/sheet.
- The model receives no household, shopping, commodity or mutation IDs.
- Schema validation rejects null/fabricated field shapes and out-of-range values.
- Non-label sources have `printedDate` removed server-side even if a model
  returns one.
- Self-reported AI confidence is not displayed as calibrated certainty; all
  extracted values are labelled for review.
- Unit mismatch is shown and is never silently converted.
- AI imports no Server Action and cannot press final confirmation.

## DATA CHANGE

No database migration and no new persistent aggregate were required.

## DEVIATIONS

None. Capture remains a proposal-only convenience layer over the existing
shopping and pantry truth path.

GitHub emitted one non-blocking infrastructure annotation that
`actions/checkout@v4` and `actions/setup-node@v4` still target the deprecated
Node.js 20 action runtime and were forced onto Node.js 24. Both jobs completed
successfully; updating action majors belongs to production-hardening package
KE-022.

## RELEASE NOTE

KE-020 is live on `anngon.io`.

