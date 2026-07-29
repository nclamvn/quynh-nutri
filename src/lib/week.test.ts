import { describe, expect, it } from "vitest";
import { currentWeekStartIso } from "./week";

describe("currentWeekStartIso", () => {
  it("returns Monday for a mid-week instant in Vietnam", () => {
    expect(currentWeekStartIso(new Date("2026-07-29T01:00:00Z"))).toBe("2026-07-27");
  });

  it("uses the Vietnam calendar day at the UTC boundary", () => {
    expect(currentWeekStartIso(new Date("2026-08-02T18:30:00Z"))).toBe("2026-08-03");
  });
});
