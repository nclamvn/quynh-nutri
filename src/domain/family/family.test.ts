import { describe, it, expect } from "vitest";
import { activeStates, familySpace, hasActiveState } from "./index";
import type { Member, MemberState } from "@/domain/types";

const st = (over: Partial<MemberState>): MemberState => ({
  id: "s", kind: "illness", value: "sốt", validFrom: "2026-01-01", ...over,
});

const member = (over: Partial<Member>): Member => ({
  id: "m", role: "adult", activity: "moderate", ...over,
});

describe("activeStates – self-expiry", () => {
  const now = "2026-07-10";

  it("keeps a state that started and hasn't expired", () => {
    const s = st({ validFrom: "2026-07-09", validUntil: "2026-07-11" });
    expect(activeStates([s], now)).toHaveLength(1);
  });

  it("drops a state whose validUntil is in the past (auto-expire)", () => {
    const s = st({ validFrom: "2026-07-01", validUntil: "2026-07-05" });
    expect(activeStates([s], now)).toHaveLength(0);
  });

  it("drops a state that hasn't started yet", () => {
    const s = st({ validFrom: "2026-07-20", validUntil: "2026-07-21" });
    expect(activeStates([s], now)).toHaveLength(0);
  });

  it("keeps an open-ended state (no validUntil)", () => {
    const s = st({ validFrom: "2026-06-01", validUntil: undefined });
    expect(activeStates([s], now)).toHaveLength(1);
  });

  it("expires exactly on the boundary sensibly (until === now still active)", () => {
    expect(activeStates([st({ validUntil: "2026-07-10" })], now)).toHaveLength(1);
    expect(activeStates([st({ validUntil: "2026-07-09" })], now)).toHaveLength(0);
  });
});

describe("familySpace – one frame for the whole family", () => {
  const now = "2026-07-10";

  it("unions every member's allergens (hard-safety set)", () => {
    const fam = [
      member({ id: "a", allergies: ["shellfish"] }),
      member({ id: "b", role: "child", allergies: ["peanut", "egg"] }),
      member({ id: "c" }),
    ];
    const fs = familySpace(fam, now);
    expect(fs.allergens.sort()).toEqual(["egg", "peanut", "shellfish"]);
  });

  it("surfaces a child's allergen at the household level (TIP-B reads this)", () => {
    const fs = familySpace([member({ id: "kid", role: "child", allergies: ["fish"] })], now);
    expect(fs.allergens).toContain("fish");
    expect(fs.needs[0].allergies).toContain("fish");
  });

  it("shows only ACTIVE states – an expired 'ốm' does not leak into the frame", () => {
    const m = member({
      id: "x",
      states: [
        st({ id: "old", value: "sốt", validFrom: "2026-06-01", validUntil: "2026-06-02" }),
        st({ id: "new", kind: "mood", value: "mệt", validFrom: "2026-07-09", validUntil: "2026-07-11" }),
      ],
    });
    const fs = familySpace([m], now);
    expect(fs.needs[0].activeStates.map((s) => s.id)).toEqual(["new"]);
    expect(fs.anyActiveState).toBe(true);
    expect(hasActiveState(m, now)).toBe(true);
  });

  it("anyActiveState is false when every state has expired", () => {
    const m = member({ states: [st({ validFrom: "2026-06-01", validUntil: "2026-06-02" })] });
    expect(familySpace([m], now).anyActiveState).toBe(false);
  });

  it("falls back to a warm name when none is set", () => {
    const fs = familySpace([member({ id: "k", role: "child" })], now);
    expect(fs.needs[0].name).toBe("Bé");
  });
});
