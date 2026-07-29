# TIP-KE-015 — Complete Landing Editorial Recomposition

## HEADER

- TIP-ID: TIP-KE-015
- Project: Q's Kitchen / quynh-nutri
- Module: Public landing from Manifesto through Footer
- Depends on: TIP-KE-014
- Priority: P0
- Date: 2026-07-29

## CONTEXT

KE-014 successfully unified the brand system and hero, but the Homeowner
correctly rejected the remaining landing sections as insufficiently redesigned.
Mobile evidence at 390px shows structural—not cosmetic—problems:

1. Manifesto places the full image before the headline, lets the botanical line
   and kicker drift across the photo, and leaves a large empty interval.
2. Product Stage keeps the app frame absolute on mobile, covering nearly all
   meal photography and clipping the beginning of the interface.
3. Memory starts with image before thesis and can render its heading/rows nearly
   invisible while entrance animations are at their zero-opacity keyframe.
4. Data Truth can show a long empty field because the three confidence rows are
   temporarily hidden by scroll animation.
5. Final CTA can appear as an entirely blank dark viewport for the same reason
   and still relies on absolute image placement near the text.
6. Footer has not received a mobile-specific information hierarchy.

The Homeowner explicitly authorizes a comprehensive refinement. The locked
section order, editorial direction, real media, semantic palette and product
claims remain unchanged.

## ART DIRECTION

### Concept

**A composed family meal folio, not a stack of marketing sections.** Each region
uses one deliberate editorial device: a full-bleed meal plate, a readable weekly
ledger, three memory lines, a confidence scale, a rose interlude, and a final
table invitation.

### Mobile rule

Mobile is a linear reading edition. Image, heading, body and controls all remain
in normal document flow. No marketing text, interface frame or CTA may be
absolutely positioned over photography.

### Signature

Product Stage becomes the single layered composition on desktop. On mobile the
same layers unfold into a premium sequence—thesis, full-width meal photograph,
then the complete app folio—so no information is sacrificed for effect.

## REQUIREMENTS

| ID | Requirement | Priority |
|---|---|---:|
| KE15-001 | Recompose Manifesto so headline precedes media on mobile and all text stays outside the photograph | P0 |
| KE15-002 | Make Manifesto and Memory media use the complete section content width without decorative misalignment | P0 |
| KE15-003 | Keep Product Stage layered on desktop but move its app frame into normal flow on mobile | P0 |
| KE15-004 | Ensure the complete Product Stage photo, app frame and copy remain visible at 390px | P0 |
| KE15-005 | Recompose Memory with thesis before media and three continuously visible full-width rows | P0 |
| KE15-006 | Keep Data Truth confidence scale visible immediately; no blank interval caused by animation | P0 |
| KE15-007 | Refine Quote as a deliberate rose interlude with controlled mobile measure | P1 |
| KE15-008 | Move Final CTA image and content into a non-overlapping mobile sequence | P0 |
| KE15-009 | Give Footer a clear mobile hierarchy, divider rhythm and wrapping links | P1 |
| KE15-010 | Entrance motion may translate but must never make meaningful content invisible | P0 |
| KE15-011 | Preserve 20px mobile gutters, full-width media intent and zero horizontal overflow | P0 |
| KE15-012 | Add regression checks for mobile visibility, overlap, ordering and footer geometry | P0 |

## ACCEPTANCE CRITERIA

1. At 390px, Manifesto order is label → headline → image → body/seal.
2. At 390px, Product Stage order is copy → photo → app frame; app frame has
   `position: static` or `relative`, width equals available content width and no
   edge is clipped.
3. At 390px, Memory headline is visible before its image and all three rows have
   non-zero height and opacity 1 immediately after navigation.
4. At 390px, all three Data Truth articles are visible and their y ranges do not
   overlap.
5. At 390px, Final CTA photograph, headline, description and controls are all in
   normal flow and have zero pairwise overlap.
6. Footer links wrap without overflow and footer starts after Final CTA.
7. Meaningful landing text computes opacity 1 before and after intersection
   reveals.
8. No supported viewport has horizontal document overflow.
9. Desktop retains editorial asymmetry and the single layered Product Stage.
10. Lint, unit tests, production build and complete Playwright suite pass.

## CONSTRAINTS

- No hero redesign in this TIP.
- No new dependency, generated image, testimonial or product claim.
- No database, API, AI, auth or household-state changes.
- Keep the locked section order.
- Preserve real media attribution and semantic color meanings.
