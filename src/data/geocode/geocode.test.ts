import { describe, it, expect } from "vitest";
import { cacheKey, parseNominatim, parseGoong, providerNameForEnv } from "./parse";

describe("cacheKey", () => {
  it("normalizes whitespace + case so repeat queries hit cache", () => {
    expect(cacheKey("  12  Nguyễn  Trãi ")).toBe("12 nguyễn trãi");
    expect(cacheKey("12 Nguyễn Trãi")).toBe(cacheKey("12 nguyễn trãi "));
  });
});

describe("parseNominatim", () => {
  it("reads lat/lon + importance from the first hit", () => {
    const r = parseNominatim([{ lat: "10.762", lon: "106.66", importance: 0.42, display_name: "Q5, HCM" }]);
    expect(r).toMatchObject({ lat: 10.762, lng: 106.66, source: "nominatim", confidence: 0.42 });
  });
  it("returns null on empty / malformed", () => {
    expect(parseNominatim([])).toBeNull();
    expect(parseNominatim([{ lat: "x", lon: "y" }])).toBeNull();
    expect(parseNominatim({})).toBeNull();
  });
});

describe("parseGoong", () => {
  it("reads geometry.location from results[0]", () => {
    const r = parseGoong({ results: [{ geometry: { location: { lat: 10.77, lng: 106.7 } }, formatted_address: "Q1" }] });
    expect(r).toMatchObject({ lat: 10.77, lng: 106.7, source: "goong" });
  });
  it("returns null when no results", () => {
    expect(parseGoong({ results: [] })).toBeNull();
    expect(parseGoong({})).toBeNull();
  });
});

describe("provider selection — swap without touching domain/UI", () => {
  it("defaults to Nominatim (free, policy-compliant)", () => {
    expect(providerNameForEnv({})).toBe("nominatim");
  });
  it("uses Goong when a key is present", () => {
    expect(providerNameForEnv({ GOONG_API_KEY: "k" })).toBe("goong");
  });
});
