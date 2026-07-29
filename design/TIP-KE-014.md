# TIP-KE-014 — Landing/App Brand Unification

## HEADER

- TIP-ID: TIP-KE-014
- Project: Q's Kitchen / quynh-nutri
- Module: Public marketing landing
- Depends on: TIP-KE-013
- Priority: P0
- Date: 2026-07-29

## CONTEXT

The authenticated app has passed its layout and visual-system review. The public
landing still carries an older parallel identity: a letter-A seal instead of the
flower mark, an unrelated hero marquee, an outdated product frame, saturated
marketing accents that do not map to app semantics, and section widths that do
not share the app's 1440px geometry.

The Homeowner explicitly requested a thorough landing review and upgrade so the
public and authenticated experiences feel like one product. The locked
editorial section order and media-led direction remain authoritative. This TIP
therefore collapses a separate Blueprint checkpoint: it refines the approved
system without changing architecture, product behavior or business rules.

## DESIGN DIRECTION

### Subject and job

- Subject: a calm household meal steward for Vietnamese families.
- Audience: the family member carrying the invisible work of deciding, buying
  and preparing food.
- Single job: demonstrate that one realistic household week can be planned,
  adjusted and trusted, then invite the visitor to start.

### Visual system

- Palette: landing ink `#171214`, paper `#f3eee8`, app canvas `#fffdfc`,
  brand rose `#ef5775`, corroborated green `#469b75`, estimate honey `#c58a21`.
- Typography: Inter for utility/body and Lora for editorial display only.
- Geometry: full-bleed section backgrounds around one 1440px content axis;
  desktop gutters 32px minimum and mobile gutters 20px.
- Controls: primary actions use the app's 48px landing scale, capsule geometry
  and visible focus treatment.
- Signature: a restrained weekly kitchen folio over real meal photography,
  using the same flower, provenance and surface language as the app.

### Deliberate edit

The moving dish conveyor in the hero is removed. It competes with the family
photograph and violates the rule that the ticker is the landing's only marquee.
The hero instead uses one quiet “Tuần mẫu” folio, making the product itself—not
decoration—the memorable motion-free signature.

## REQUIREMENTS

| ID | Requirement | Priority |
|---|---|---:|
| KE14-001 | Preserve the locked ten-part landing section order | P0 |
| KE14-002 | Use the same flower mark and brand lockup as the authenticated app | P0 |
| KE14-003 | Use one centered 1440px content axis with 32px desktop and 20px mobile gutters | P0 |
| KE14-004 | Remove the hero dish marquee and retain only the branded value ticker marquee | P0 |
| KE14-005 | Keep hero copy and primary action legible without collision at short desktop heights | P0 |
| KE14-006 | Make the product-stage interface resemble the current app control, surface and provenance language | P0 |
| KE14-007 | Restore light Data Truth presentation with green/honey/gray semantics and no rose quality signal | P0 |
| KE14-008 | Normalize CTA geometry, focus visibility and responsive touch targets | P0 |
| KE14-009 | Use optimized local images below the fold without fabricated media or credits | P0 |
| KE14-010 | Preserve reduced motion and eliminate horizontal overflow at 390, 768, 1280 and 1440px | P0 |
| KE14-011 | Add automated landing geometry, order, branding and responsive regression coverage | P0 |

## ACCEPTANCE CRITERIA

1. Header, hero, ticker, manifesto, product stage, memory, data truth, quote,
   final CTA and footer remain in the locked order.
2. Landing header and footer render `FlowerLogo`; no letter-A badge remains.
3. At 1440px, major section content origins align within 1px and no content
   exceeds the 1440px axis.
4. At 1280×720, the hero title and primary CTA do not overlap navigation or
   each other; all remain within the hero.
5. Product-stage provenance uses botanical green and the interface exposes the
   same rose action language as the app.
6. Data Truth uses a light neutral background and semantic green/honey/gray.
7. At every target viewport, document horizontal overflow is zero.
8. Interactive links have a visible keyboard focus state and primary landing
   actions are at least 44px high.
9. `prefers-reduced-motion` freezes ticker, drift and reveal animations.
10. Lint, unit tests, production build and complete Playwright suite pass.

## CONSTRAINTS

- No new dependency.
- No database, API, Clerk, AI or household-state change.
- No SaaS feature-card grid, testimonial fabrication or AI-generated imagery.
- Do not alter the locked landing section order.
- Keep all production media local and preserve real attribution.
- Do not use rose as nutrition-confidence semantics.
