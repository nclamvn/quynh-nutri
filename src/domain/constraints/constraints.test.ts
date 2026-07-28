import { describe, it, expect } from "vitest";
import { deriveConstraints, familyConstraints, dishSafety, safetyReason, detectConflicts } from "./index";
import type { Allergen, Commodity, Dish, Household, Member } from "@/domain/types";
import type { CommoditySource } from "@/domain/nutrition/calculator";

// Controlled commodity source — we assert exactly which ingredients carry which
// allergens, and deliberately OMIT one id to exercise the fail-closed path.
const COMS: Record<string, Allergen[]> = {
  tom: ["shellfish"],
  nuoc_mam: ["fish"], // hidden allergen — fish sauce carries fish
  ga: [],
  rau: [],
  // "moi_la" (a B1 fork's new ingredient) intentionally NOT listed → src returns undefined
};
const src: CommoditySource = (id) =>
  id in COMS ? ({ id, group: "x", allergens: COMS[id] } as unknown as Commodity) : undefined;

const dish = (id: string, commodityIds: string[]): Dish => ({
  id, vnName: id, proteinType: "rau", method: "luoc", slot: "dinner",
  quick: true, baseServings: 4, origin: "B0",
  lines: commodityIds.map((c) => ({ commodityId: c, qtyBase: 100, unit: "g" })),
});

const hh = (members: Member[]): Household => ({
  id: "h", name: "Nhà", size: members.length, marketMode: "mixed",
  cookTimeCapMin: 45, busyDays: [], lactatingMember: false, members,
});
const member = (over: Partial<Member>): Member => ({ id: "m", name: "Na", role: "adult", activity: "moderate", ...over });

describe("dishSafety — HARD EXCLUDE allergen (P0 safety)", () => {
  const shellfishHome = hh([member({ id: "kid", name: "bé Na", role: "child", allergies: ["shellfish"] })]);

  it("blocks a dish that directly contains the allergen", () => {
    const s = dishSafety(dish("tom_rang", ["tom", "rau"]), shellfishHome, src);
    expect(s.safe).toBe(false);
    expect(s.blockedBy[0].allergen).toBe("shellfish");
  });

  it("blocks a HIDDEN allergen (fish sauce → fish) for a fish-allergic member", () => {
    const fishHome = hh([member({ allergies: ["fish"] })]);
    const s = dishSafety(dish("ga_kho", ["ga", "nuoc_mam"]), fishHome, src);
    expect(s.safe).toBe(false);
    expect(s.blockedBy[0].allergen).toBe("fish");
  });

  it("blocks a B1 fork that ADDS an allergen ingredient", () => {
    // a safe base dish forked to add tôm — must still be caught
    const fork = dish("canh_forked", ["rau", "tom"]);
    expect(dishSafety(fork, shellfishHome, src).safe).toBe(false);
  });

  it("FAILS CLOSED on an unknown ingredient while an allergen is in play", () => {
    const s = dishSafety(dish("fork_moi", ["ga", "moi_la"]), shellfishHome, src);
    expect(s.safe).toBe(false);        // can't verify → treat as unsafe
    expect(s.uncertain).toBe(true);
  });

  it("does NOT fail closed when the household has no allergens", () => {
    const s = dishSafety(dish("fork_moi", ["ga", "moi_la"]), hh([member({ allergies: [] })]), src);
    expect(s.safe).toBe(true);
    expect(s.uncertain).toBe(false);
  });

  it("allows a genuinely safe dish", () => {
    expect(dishSafety(dish("ga_luoc", ["ga", "rau"]), shellfishHome, src).safe).toBe(true);
  });

  it("a CHILD's allergen blocks the shared dinner (household-wide)", () => {
    // the adult isn't allergic, but the child is → shared plate must exclude it
    const home = hh([member({ id: "a", allergies: [] }), member({ id: "b", name: "bé", role: "child", allergies: ["shellfish"] })]);
    const s = dishSafety(dish("tom", ["tom"]), home, src);
    expect(s.safe).toBe(false);
    expect(s.blockedBy.some((b) => b.memberName === "bé")).toBe(true);
  });

  it("safetyReason names the member + allergen (provenance)", () => {
    const s = dishSafety(dish("tom", ["tom"]), shellfishHome, src);
    expect(safetyReason(s)).toMatch(/bé Na.*hải sản/);
  });
});

describe("deriveConstraints — tiers", () => {
  it("maps allergy→hard_safety, condition→medical, dislike→preference, state→state", () => {
    const now = "2026-07-10";
    const m = member({
      allergies: ["peanut"], conditions: ["tiểu đường"], dislikes: ["mướp đắng"],
      states: [{ id: "s", kind: "mood", value: "mệt", validFrom: "2026-07-09", validUntil: "2026-07-11" }],
    });
    const tiers = deriveConstraints(m, now).map((c) => c.tier).sort();
    expect(tiers).toEqual(["hard_safety", "medical", "preference", "state"]);
  });

  it("an EXPIRED state produces no constraint", () => {
    const m = member({ states: [{ id: "s", kind: "illness", value: "ốm", validFrom: "2026-06-01", validUntil: "2026-06-02" }] });
    expect(familyConstraints([m], "2026-07-10").some((c) => c.tier === "state")).toBe(false);
  });
});

describe("detectConflicts — trade-off, human decides", () => {
  it("surfaces fish-allergy vs pregnancy omega-3 as a trade-off (nấu riêng)", () => {
    const home = [
      member({ id: "kid", name: "bé", role: "child", allergies: ["fish"] }),
      member({ id: "mom", name: "mẹ", healthProfile: { lifeStage: "pregnant_t2", mode: "wellness" } }),
    ];
    const conflicts = detectConflicts(home);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].note).toMatch(/nấu riêng/);
    expect(conflicts[0].avoidedBy).toContain("bé");
    expect(conflicts[0].wantedBy).toContain("mẹ");
  });

  it("no conflict when nobody benefits from the avoided ingredient", () => {
    expect(detectConflicts([member({ allergies: ["fish"] })])).toHaveLength(0);
  });
});
