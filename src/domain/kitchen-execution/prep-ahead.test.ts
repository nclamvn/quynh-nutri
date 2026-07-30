import { describe, expect, it } from "vitest";
import type { Dish, WeekPlan } from "@/domain/types";
import {
  PREP_AHEAD_GUIDES,
  PREP_AHEAD_SOURCES,
  PREP_AHEAD_SOURCE_BY_ID,
  prepAheadGuideFor,
} from "@/data/seed/prep-ahead-guides";
import { REPERTOIRE } from "@/data/seed/repertoire";
import { prepAheadForPlanDay } from "./prep-ahead";

const EXPECTED = REPERTOIRE.map((item) => item.id).sort();

const dish = (id: string, slot: Dish["slot"] = "MAN"): Dish => ({
  id,
  vnName: `Món ${id}`,
  enLabel: `Dish ${id}`,
  proteinType: "rau",
  method: "luoc",
  slot,
  quick: false,
  baseServings: 4,
  origin: "B0",
  lines: [],
});

describe("reviewed prep-ahead registry", () => {
  it("covers every reviewed B0 cooking dish exactly once", () => {
    const ids = PREP_AHEAD_GUIDES.map((guide) => guide.dishId);
    expect(ids.slice().sort()).toEqual(EXPECTED);
    expect(new Set(ids).size).toBe(REPERTOIRE.length);
    expect(PREP_AHEAD_GUIDES.every((guide) => guide.scope === "previous-evening")).toBe(true);
  });

  it("has HTTPS, reviewed, resolvable sources on every safety-bearing step", () => {
    expect(PREP_AHEAD_SOURCES.every((source) =>
      source.url.startsWith("https://") && /^\d{4}-\d{2}-\d{2}$/.test(source.reviewedAt)
    )).toBe(true);
    for (const guide of PREP_AHEAD_GUIDES) {
      expect(guide.steps.length).toBeGreaterThan(0);
      expect(guide.sourceIds.every((id) => PREP_AHEAD_SOURCE_BY_ID[id])).toBe(true);
      for (const step of guide.steps) {
        expect(step.sourceIds.length).toBeGreaterThan(0);
        expect(step.sourceIds.every((id) => PREP_AHEAD_SOURCE_BY_ID[id])).toBe(true);
        expect(step.title.vi.trim()).not.toBe("");
        expect(step.title.en.trim()).not.toBe("");
        expect(step.instruction.vi.trim()).not.toBe("");
        expect(step.instruction.en.trim()).not.toBe("");
      }
    }
  });

  it("blocks unsafe or invented preparation behavior", () => {
    const content = JSON.stringify(PREP_AHEAD_GUIDES).toLowerCase();
    expect(content).not.toMatch(/rửa (kỹ|sạch) (gà|thịt|cá|tôm)|rửa (gà|thịt) dưới vòi/);
    expect(content).not.toMatch(/rinse raw (chicken|meat)|(?<!-)wash raw (chicken|meat)/);
    expect(content).not.toMatch(/room temperature|nhiệt độ phòng|để ngoài/);
    expect(content).not.toMatch(/\d+\s*(giờ|phút|hours?|minutes?)/);
    expect(content).not.toMatch(/rã đông.*\d|thaw.*\d/);
    for (const item of PREP_AHEAD_GUIDES.flatMap((guide) => guide.steps)) {
      if (item.kind === "marinate-refrigerated") {
        expect(`${item.instruction.vi} ${item.storageInstruction?.vi}`).toContain("ngăn mát");
        expect(`${item.instruction.en} ${item.storageInstruction?.en}`).toContain("refrigerator");
      }
    }
  });

  it("resolves a known guide with provenance and rejects unsupported ids", () => {
    expect(prepAheadGuideFor("ga_kho_gung")).toMatchObject({
      guide: { dishId: "ga_kho_gung" },
    });
    expect(prepAheadGuideFor("unknown")).toBeUndefined();
  });
});

describe("prepAheadForPlanDay", () => {
  it("uses slot order, deduplicates dishes and reports unsupported entries", () => {
    const dishes = new Map([
      ["com_trang", dish("com_trang", "COM")],
      ["ga_kho_gung", dish("ga_kho_gung", "MAN")],
      ["unknown", dish("unknown", "RAU")],
    ]);
    const plan: WeekPlan = {
      householdId: "h",
      weekStart: "2026-07-27",
      slots: [
        { day: 3, occasion: "dinner", slot: "RAU", dishId: "unknown", locked: false },
        { day: 3, occasion: "dinner", slot: "MAN", dishId: "ga_kho_gung", locked: false },
        { day: 3, occasion: "dinner", slot: "COM", dishId: "com_trang", locked: false },
        { day: 3, occasion: "dinner", slot: "CANH", dishId: "ga_kho_gung", locked: false },
      ],
    };
    expect(prepAheadForPlanDay(plan, 3, (id) => dishes.get(id), PREP_AHEAD_GUIDES))
      .toMatchObject({
        day: 3,
        supported: [
          { dish: { id: "com_trang" }, slot: "COM" },
          { dish: { id: "ga_kho_gung" }, slot: "MAN" },
        ],
        unsupported: [{ dish: { id: "unknown" }, slot: "RAU" }],
      });
  });

  it("is deterministic and does not mutate the plan", () => {
    const plan: WeekPlan = {
      householdId: "h",
      weekStart: "2026-07-27",
      slots: [{ day: 3, occasion: "dinner", slot: "MAN", dishId: "ga_kho_gung", locked: false }],
    };
    const before = JSON.stringify(plan);
    const resolve = (id: string) => dish(id);
    const first = prepAheadForPlanDay(plan, 3, resolve, PREP_AHEAD_GUIDES);
    expect(prepAheadForPlanDay(plan, 3, resolve, PREP_AHEAD_GUIDES)).toEqual(first);
    expect(JSON.stringify(plan)).toBe(before);
  });
});
