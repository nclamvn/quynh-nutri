# TIP-KE-020 — Confirmed Receipt, Label and Voice Capture

## HEADER

- TIP-ID: TIP-KE-020
- Project: Bữa cơm nhà / Q's Kitchen
- Module: Household capture inbox and shopping receipt confirmation
- Depends on: KE-019
- Priority: P0
- Approved source: `design/BLUEPRINT-housekeeper-phase1.md`

## CONTEXT

The household can already confirm one planned shopping line, record the actual
quantity and price, and optionally create a pantry lot with a printed label
date. Those mutations are explicit, authenticated and idempotent, but entering
the values by hand is slow on a phone.

Phase 1 requires photos and speech to reduce that friction without granting AI
authority over household records. Capture output is untrusted input: it may be
incomplete or wrong and must remain a transient proposal until the homeowner
reviews the complete change and presses the existing confirmation action.

## TASK

Add one global capture inbox for receipt photos, package-label photos and voice
notes. Extract bounded structured candidates, match them conservatively to the
current shopping list, show the proposed before/after values, and hand one
selected candidate to the existing receive-shopping confirmation transaction.

## SPECIFICATIONS

### Capture boundary

- The global “Ghi nhanh” entry is available from the mobile centre action and
  the desktop app shell.
- Receipt and label capture accept camera/gallery images. Voice capture uses
  browser speech recognition when available and always retains an editable text
  fallback.
- The authenticated route accepts only supported source kinds, bounded text and
  bounded JPEG/PNG/WebP images. It re-authenticates and rate-limits every request.
- Images and transcripts are processed transiently. This package adds no upload
  store, capture table or long-lived raw document.
- AI returns a schema-validated candidate only. Unknown values stay absent and
  every returned field is labelled as needing human review; model confidence is
  not represented as objective certainty.

### Proposal and diff

- A candidate can contain a raw item name, quantity, unit, paid price, vendor
  text and a date printed on the label.
- Candidate-to-shopping matching is deterministic and conservative. AI cannot
  choose a canonical commodity or household record ID.
- The review screen shows the original captured wording, the planned line and
  every proposed value before any mutation.
- The user may edit values, choose a different current shopping line or exclude
  a candidate. An unmatched candidate cannot be applied silently.
- Printed dates are described only as dates read from the label. The app does
  not infer shelf life, expiry or food-safety guidance from capture.

### Confirmation

- “Đọc ảnh/giọng nói” only creates an in-memory proposal.
- “Kiểm tra & xác nhận” opens the existing receive-shopping form prefilled with
  proposal values. The form remains editable.
- Only the final explicit “Xác nhận đã mua” action calls the existing
  authenticated, idempotent receive transaction.
- Each receipt line is confirmed separately. A failed or cancelled confirmation
  leaves all unconfirmed lines unchanged.
- AI has no import path to any mutation action and cannot confirm on the user's
  behalf.

## ACCEPTANCE CRITERIA

1. A receipt photo produces review-only candidate lines and no household state
   changes before explicit confirmation.
2. A label photo can propose a printed date but never invents a shelf-life date.
3. Voice recognition is optional; editable text capture still works when the
   browser does not support speech recognition.
4. Candidate matching uses only current client-visible shopping lines and a
   deterministic commodity-name matcher.
5. The complete planned-versus-captured diff is visible before the existing
   receive form is opened.
6. Unmatched candidates remain blocked until the user maps or excludes them.
7. Final confirmation uses the existing receive transaction and survives
   reload; cancel does not mutate data.
8. Unsupported file types, oversized bodies, unauthenticated requests and rate
   excess fail closed.
9. No capture document, synthetic task, fake completion or AI-triggered
   mutation is introduced.
10. Unit, route, E2E, accessibility, lint and production build gates pass.

## CONSTRAINTS

- Reuse the existing Clerk, AI Gateway, request-security, BottomSheet,
  receive-shopping and toast patterns.
- Do not add a dependency or database migration.
- Do not persist raw receipt/label images or voice transcripts.
- Do not create a batch mutation; partial receipt confirmation must remain
  visible and user-controlled one line at a time.
- Do not alter reviewed cooking, storage or food-safety content.

## DECISIONS LOG

- KE-020 proceeds without a new homeowner checkpoint because the approved Phase
  1 blueprint explicitly fixes the package outcome and KE-017 already fixes the
  proposal/diff/confirmation policy.
- Capture proposals remain in memory. Persistence would create unnecessary
  privacy and retention obligations for household receipts and voices.
- Candidate matching stays deterministic outside the model so AI never selects
  a canonical household target.
- Self-reported numeric model confidence is omitted because it could be mistaken
  for calibrated certainty. The UI marks the entire extraction as needing human
  review and keeps missing fields visibly empty.
- Confirmation remains one line at a time through the existing transaction,
  preventing a partially failed batch from being represented as complete.

## REPORT FORMAT

Create `design/COMPLETION-KE-020.md` and `design/VERIFY-KE-020.md` with actual
evidence after all gates complete.
