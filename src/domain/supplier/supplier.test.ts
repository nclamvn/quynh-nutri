import { describe, it, expect } from "vitest";
import { hasMapPin, directionsUrl, supplierTone } from "./index";

describe("hasMapPin", () => {
  it("true only for a real finite coordinate", () => {
    expect(hasMapPin({ location: { lat: 10.76, lng: 106.66 } })).toBe(true);
    expect(hasMapPin({ location: undefined })).toBe(false);
    expect(hasMapPin({ location: { lat: NaN, lng: 106.66 } })).toBe(false);
  });
});

describe("directionsUrl", () => {
  it("uses lat,lng when pinned", () => {
    const u = directionsUrl({ location: { lat: 10.76, lng: 106.66 }, address: "bỏ qua" });
    expect(u).toBe("https://www.google.com/maps/dir/?api=1&destination=10.76,106.66");
  });
  it("falls back to the address (encoded) when no pin", () => {
    const u = directionsUrl({ address: "12 Nguyễn Trãi, Q5" });
    expect(u).toContain("destination=12%20Nguy");
    expect(u).not.toContain(",106"); // not a coordinate
  });
  it("returns null when there is neither pin nor address (button hidden)", () => {
    expect(directionsUrl({})).toBeNull();
    expect(directionsUrl({ address: "   " })).toBeNull();
  });
  it("never carries the user's own location — only the shop destination", () => {
    const u = directionsUrl({ location: { lat: 10.76, lng: 106.66 } })!;
    expect(u).not.toContain("origin="); // maps app supplies the user's location
  });
});

describe("supplierTone (honesty palette)", () => {
  it("amber when flagged needs-verify, even if sourced", () => {
    expect(supplierTone({ needsVerify: true, sources: ["a", "b"] })).toBe("amber");
  });
  it("accent (green) when sourced and not flagged", () => {
    expect(supplierTone({ sources: ["bachhoaxanh.com", "vnexpress"] })).toBe("accent");
  });
  it("muted (gray) when there are no sources", () => {
    expect(supplierTone({})).toBe("muted");
    expect(supplierTone({ sources: [] })).toBe("muted");
  });
});
