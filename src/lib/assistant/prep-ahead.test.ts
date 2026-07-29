import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { loadHouseholdState } = vi.hoisted(() => ({
  loadHouseholdState: vi.fn(),
}));
vi.mock("@/data/repo/household", () => ({ loadHouseholdState }));

import { getPrepAheadGuideSnapshot } from "./prep-ahead";

describe("assistant prep-ahead adapter", () => {
  it("returns only a reviewed catalog guide and stays read-only", async () => {
    const result = await getPrepAheadGuideSnapshot("ga_kho_gung");
    expect(result).toMatchObject({
      supported: true,
      dish: { id: "ga_kho_gung" },
      guide: { scope: "previous-evening" },
      readOnly: true,
    });
    expect(JSON.stringify(result)).not.toContain("completed");
  });

  it("reports unsupported ids instead of generating a fallback", async () => {
    expect(await getPrepAheadGuideSnapshot("invented-dish")).toEqual({
      supported: false,
      dishId: "invented-dish",
    });
    expect(loadHouseholdState).not.toHaveBeenCalled();
  });
});
