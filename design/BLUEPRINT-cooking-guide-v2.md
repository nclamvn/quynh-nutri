# BLUEPRINT — Cooking Guide Detail V2

## PROJECT INFO

| Field | Value |
|---|---|
| Project | Q's Kitchen / Bữa cơm nhà |
| Module | Reviewed recipe detail and active cooking |
| Date | 2026-07-30 |
| Status | Approved by Homeowner: “triển khai theo đề xuất” |

## GOAL

Give the household cook one trustworthy page for every reviewed repertoire dish,
from quantity and preparation through ordered cooking, doneness cues, safety
checks and the existing persisted Cooking Mode.

The page is a finite reviewed cookbook, not an AI recipe generator.

## CURRENT BASELINE

- 49/49 B0 dishes have a reviewed bilingual cooking guide.
- Each guide currently has 3–5 ordered steps, mise en place, total time and
  reviewed food-safety sources.
- Dish cards open a compact bottom sheet.
- Full steps appear only after starting Cooking Mode.
- The guide contract has no per-step timing, sensory cue or equipment list.

## INFORMATION ARCHITECTURE

```text
Dish card / Favorite / direct URL
               |
               v
       /dishes/[dishId]
               |
       +-------+--------+
       |                |
  Read recipe      Start / resume cooking
       |                |
  Serving scaler    Existing canonical session
  Ingredients       User-controlled progress
  Equipment         No inventory inference
  Preparation
  Ordered rhythm
  Nutrition/sources
```

## DETAIL PAGE

1. Back navigation, title and household/sample status.
2. Dish atmosphere image, method, estimated total time and serving control.
3. Ingredient amounts for the selected serving count.
4. Equipment and mise en place.
5. “Nhịp bếp” — every ordered step with estimated time, instruction, sensory
   cue and any reviewed safety check.
6. Nutrition/provenance summary.
7. Reviewed source ledger.
8. Start/resume Cooking Mode.

## VISUAL DIRECTION

The distinctive element is a quiet household recipe ledger:

- a sticky ingredient folio on desktop;
- a continuous “Nhịp bếp” spine for the real ordered sequence;
- step numbers live in the page margin, not decorative floating circles;
- one sticky mobile cooking action that clears the bottom navigation;
- hairlines and typographic hierarchy replace a wall of generic cards.

The page reuses the signed-in design system:

- canvas `#fffdfc`;
- ink `#272327`;
- rose action `#ef5775`;
- botanical corroboration `#469b75`;
- honey estimate/attention `#c58a21`;
- Lora used sparingly for the dish masthead, Inter for operational content.

Dark-mode semantic tokens remain authoritative.

## DATA CONTRACT

Extend reviewed guide content without adding persistence:

```ts
CookingStep {
  estimatedMin?: number
  sensoryCue?: LocalizedText
}

CookingGuide {
  summary: LocalizedText
  equipment: LocalizedText[]
}
```

- Step minutes are estimates and always labelled as such.
- Sensory cues help the cook observe the food; they do not replace a
  source-backed temperature check where one exists.
- Existing ingredients remain the canonical edible-quantity lines.
- Seasoning without a canonical quantity remains “to taste”; no quantity is
  invented.

## B1 POLICY

- An untouched household fork may show its B0 source guide with an explicit
  inherited label.
- A changed/imported B1 dish without reviewed guidance remains unsupported.
- Runtime AI cannot generate, repair or promote guidance into this registry.

## TASK GRAPH

| Order | Package | Outcome |
|---:|---|---|
| 1 | TIP-KE-023 | Detail contract, 49-guide enrichment, dedicated route and entry-point integration |
| 2 | TIP-KE-024 | Optional exact-dish photo registry; excluded from KE-023 because current images are category atmosphere |

`TIP-KE-022` remains reserved for the approved production-hardening package and
is not overwritten by this feature phase.

## EXIT CRITERIA

- Every one of the 49 B0 dishes has a direct detail route and enriched guide.
- Invalid IDs and unsupported B1 content fail honestly.
- Reading the recipe performs no mutation.
- Starting and progressing a cooking session reuses the canonical existing flow.
- Mobile and desktop layouts pass responsive, accessibility and regression
  gates.

## DECISIONS LOG

| Decision | Chosen | Reason |
|---|---|---|
| URL model | Dedicated dynamic route | Supports deep link, refresh and a full information hierarchy |
| Content source | Finite reviewed registry | Safety-sensitive guidance cannot be generated at runtime |
| Detail vs Cooking Mode | Read page plus reused active mode | Reading and executing are different user intents |
| Images | Existing category atmosphere | Exact-dish image production is a separate reviewable content package |
| Persistence | No new table | Detail fields are reviewed system content; session persistence already exists |
| Approval | Homeowner approved proposed diff | Satisfies KE-017 before mutation |
