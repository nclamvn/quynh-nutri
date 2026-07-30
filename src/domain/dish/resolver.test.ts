import { describe, it, expect } from "vitest";
import type { Dish } from "@/domain/types";
import { effectiveRepertoire, resolveDish, resolveSlot, resolveLineQty } from "./resolver";

const b0: Dish[] = [
  { id: "ga_luoc", vnName: "Gà luộc", proteinType: "ga", method: "luoc", slot: "MAN", quick: true, baseServings: 4, lines: [{ commodityId: "thit_ga", qtyBase: 700, unit: "g" }], origin: "B0" },
  { id: "ca_kho_to", vnName: "Cá kho tộ", proteinType: "ca", method: "kho", slot: "MAN", quick: false, baseServings: 4, lines: [{ commodityId: "ca_dieu_hong", qtyBase: 500, unit: "g" }], origin: "B0" },
];

describe("dish tier override – B1 ⊳ B0", () => {
  it("keeps B0 when the household has no forks", () => {
    expect(effectiveRepertoire(b0)).toHaveLength(2);
    expect(resolveDish("ga_luoc", b0)?.origin).toBe("B0");
  });

  it("replaces the forked B0 dish with the household's B1 version", () => {
    const fork: Dish = { ...b0[0], id: "hh_ga_luoc", origin: "B1", sourceRepertoireId: "ga_luoc", lines: [{ commodityId: "thit_ga", qtyBase: 900, unit: "g" }] };
    const eff = effectiveRepertoire(b0, [fork]);
    expect(eff).toHaveLength(2); // ga_luoc replaced, not duplicated
    const resolved = resolveDish("ga_luoc", b0, [fork]);
    expect(resolved?.origin).toBe("B1");
    expect(resolved?.lines[0].qtyBase).toBe(900);
  });

  it("adds custom B1 dishes with no B0 source", () => {
    const custom: Dish = { ...b0[0], id: "hh_special", origin: "B1", vnName: "Món riêng" };
    const eff = effectiveRepertoire(b0, [custom]);
    expect(eff).toHaveLength(3);
  });

  it("filters resolved dishes by slot", () => {
    expect(resolveSlot("MAN", b0)).toHaveLength(2);
    expect(resolveSlot("CANH", b0)).toHaveLength(0);
  });
});

describe("ingredient tier override – B1 qty wins, macro stays in A", () => {
  it("uses the household's adjusted quantity when present", () => {
    const b0Lines = b0[0].lines;
    expect(resolveLineQty("thit_ga", b0Lines, { thit_ga: 900 })).toBe(900);
  });

  it("falls back to the B0 default quantity", () => {
    expect(resolveLineQty("thit_ga", b0[0].lines)).toBe(700);
  });
});
