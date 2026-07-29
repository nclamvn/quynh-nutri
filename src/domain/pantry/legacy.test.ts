import { describe, expect, it } from "vitest";
import { normalizeLegacyPantry } from "./legacy";

describe("normalizeLegacyPantry", () => {
  it("assigns stable ids without inventing storage or expiry", () => {
    const first = normalizeLegacyPantry("hh_1", [{ commodityId: "tom", qty: 200, unit: "g" }]);
    const second = normalizeLegacyPantry("hh_1", [{ commodityId: "tom", qty: 200, unit: "g" }]);

    expect(first).toEqual(second);
    expect(first[0]).toMatchObject({
      id: "legacy:hh_1:tom:0",
      commodityId: "tom",
      legacy: true,
    });
    expect(first[0].storageLocation).toBeUndefined();
    expect(first[0].bestBefore).toBeUndefined();
  });

  it("preserves a user-provided legacy expiry as best-before provenance", () => {
    const result = normalizeLegacyPantry("hh_1", [{
      commodityId: "cam",
      qty: 300,
      unit: "g",
      expiry: "2026-08-01T00:00:00.000Z",
    }]);
    expect(result[0].bestBefore).toBe("2026-08-01T00:00:00.000Z");
  });
});
