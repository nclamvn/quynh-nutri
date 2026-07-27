import { describe, it, expect } from "vitest";
import { detectCrisis, moodSuggestions, advise } from "./index";
import type { Dish } from "@/domain/types";

const dish = (id: string, over: Partial<Dish> = {}): Dish => ({
  id,
  vnName: id,
  proteinType: "rau",
  method: "xao",
  slot: "MAN",
  quick: false,
  baseServings: 4,
  lines: [],
  origin: "B0",
  ...over,
});

const DISHES: Dish[] = [
  dish("d_quick", { quick: true }),
  dish("d_fast", { cookTimeMin: 15 }),
  dish("d_slow", { cookTimeMin: 60 }),
  dish("d_canh", { slot: "CANH", method: "luoc" }),
  dish("d_luoc", { method: "luoc" }),
  dish("d_thanh", { tags: ["thanh"], cookTimeMin: 40 }),
  dish("d_banned", { quick: true }),
];
const allowAll = () => true;

describe("detectCrisis — deterministic safety gate", () => {
  it("flags self-harm / suicide intent as severity=crisis (with or without dấu)", () => {
    for (const t of ["mình muốn chết", "muon chet qua", "tôi muốn tự tử", "I want to die", "kill myself"]) {
      expect(detectCrisis(t)).toEqual({ crisis: true, severity: "crisis" });
    }
  });

  it("flags distress-beyond-tired as severity=watch", () => {
    for (const t of ["mọi thứ thật vô vọng", "tôi thấy vô giá trị", "mất ngủ nhiều ngày rồi", "hopeless"]) {
      expect(detectCrisis(t).crisis).toBe(true);
      expect(detectCrisis(t).severity).toBe("watch");
    }
  });

  it("does NOT false-trigger on everyday venting or morbid idioms", () => {
    for (const t of ["đang stress quá", "mệt muốn xỉu", "đói chết được", "chán cơm quá", "buồn ngủ", "hôm nay hơi buồn", ""]) {
      expect(detectCrisis(t).crisis).toBe(false);
    }
  });

  it("postpartum lowers the threshold for a few specific phrases", () => {
    expect(detectCrisis("mình ghét con", { postpartum: false }).crisis).toBe(false);
    expect(detectCrisis("mình ghét con", { postpartum: true }).crisis).toBe(true);
  });
});

describe("moodSuggestions — real dishes, tiered", () => {
  it("stress → only quick/fast dishes, tier practical", () => {
    const s = moodSuggestions("stress", DISHES, allowAll);
    expect(s.length).toBeGreaterThan(0);
    expect(s.every((x) => x.tier === "practical")).toBe(true);
    expect(s.map((x) => x.dishId)).not.toContain("d_slow");
  });

  it("sleepless → light dishes only (luoc/hap/canh/thanh)", () => {
    const ids = moodSuggestions("sleepless", DISHES, allowAll).map((x) => x.dishId);
    expect(ids).toEqual(expect.arrayContaining(["d_canh"]));
    expect(ids).not.toContain("d_slow");
  });

  it("low → comfort tier", () => {
    const s = moodSuggestions("low", DISHES, allowAll);
    expect(s.every((x) => x.tier === "comfort")).toBe(true);
  });

  it("returns only allowed dishes and caps at max", () => {
    const isAllowed = (d: Dish) => d.id !== "d_banned";
    const s = moodSuggestions("stress", DISHES, isAllowed, 2);
    expect(s.length).toBeLessThanOrEqual(2);
    expect(s.map((x) => x.dishId)).not.toContain("d_banned");
  });
});

describe("advise — gate FIRST", () => {
  it("a crisis input never yields a food suggestion", () => {
    const r = advise({ text: "tôi muốn chết", mood: "stress" }, DISHES, allowAll);
    expect(r.mode).toBe("crisis");
    expect((r as { suggestions?: unknown }).suggestions).toBeUndefined();
  });

  it("a benign mood yields tiered suggestions + a practical note", () => {
    const r = advise({ text: "đang stress, ít thời gian", mood: "stress" }, DISHES, allowAll);
    expect(r.mode).toBe("suggest");
    if (r.mode === "suggest") {
      expect(r.suggestions.length).toBeGreaterThan(0);
      expect(r.practicalNote.length).toBeGreaterThan(0);
    }
  });

  it("postpartum crisis phrase routes to crisis, not food", () => {
    const r = advise({ text: "mình ghét con", mood: "low", postpartum: true }, DISHES, allowAll);
    expect(r.mode).toBe("crisis");
  });
});
