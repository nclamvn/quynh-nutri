# E2E Manual Checklist — the parts automation can't (or must not) do

Automation covers the rest (see COVERAGE.md). These need a human — declared honestly,
never faked as auto.

## MUST be manual (physically un-automatable)
- [ ] **Zalo Web Share on a real phone.** `navigator.share` needs the OS share sheet.
      On a phone with Zalo: Đi chợ → an order → "Soạn & mở · Zalo" → confirm Zalo appears
      in the share sheet AND the order text arrives intact. (This is the P2-0 spike.)
- [ ] **Geocode pin drag → confirm (B0→B1).** Open a supplier, "Tìm từ địa chỉ" → drag
      the amber pin → it turns rose (confirmed ground truth) and saves. (Amber-suggested
      state is auto-tested; the drag gesture is manual.)

## MUST NOT be automated (would cause real harm)
- [ ] **Hotline numbers — verify visually, NEVER dial.** Auto-dialing a life-saving line
      to run CI is abuse. E2E only asserts the displayed numbers/hours match `resources.ts`.
      Periodically re-verify against the source that these are still current:
      - Ngày Mai **096 306 1414** — 13:00–20:30, **Thứ 4, Thứ 6, Thứ 7, Chủ Nhật** (KHÔNG T5) — duongdaynongngaymai.vn
      - Cấp cứu trầm cảm **1900 1267** — 24/7 — bvtt-tphcm.org.vn
      - Cấp cứu y tế **115** — 24/7

## Separate smoke (real keys — NOT in CI)
- [ ] **AI warmth with the real gateway.** In CI the mood-advisory warmth is mocked
      (`E2E_MOCK_AI`). Once, with the real key, confirm the warmth reads naturally and
      never adds a food/claim/diagnosis. Run locally, not in the hermetic suite.

## To enable the real Clerk auth path (optional upgrade)
- [ ] Create a Clerk test user with a `+clerk_test` email.
- [ ] Set `E2E_CLERK_USER` / `E2E_CLERK_PASSWORD` (+ existing `CLERK_*`).
- [ ] Follow the steps in `e2e/clerk-auth.setup.ts` to add the `setup` project and
      `storageState`, and drop `E2E_BYPASS_AUTH`. Then the suite exercises real sign-in
      (and can run against the production instance via Testing Tokens).
