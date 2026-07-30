import { describe, it, expect } from "vitest";
import { SUPPORT_RESOURCES } from "./resources";

describe("support resources – verified only (§3.4)", () => {
  it("every resource has a name, a detail, and at least one source (no bare/fabricated number)", () => {
    expect(SUPPORT_RESOURCES.length).toBeGreaterThan(0);
    for (const r of SUPPORT_RESOURCES) {
      expect(r.name.trim().length).toBeGreaterThan(0);
      expect(r.detail.trim().length).toBeGreaterThan(0);
      expect(r.sources.length).toBeGreaterThan(0);
    }
  });

  it("includes the verified Ngày Mai hotline with its official source", () => {
    const nm = SUPPORT_RESOURCES.find((r) => r.name.includes("Ngày Mai"));
    expect(nm?.detail).toBe("096 306 1414");
    expect(nm?.sources.some((s) => s.includes("duongdaynongngaymai.vn"))).toBe(true);
  });

  it("uses no placeholder numbers", () => {
    for (const r of SUPPORT_RESOURCES) {
      expect(r.detail).not.toMatch(/x{2,}/i); // e.g. 1800-xxxx
    }
  });
});
