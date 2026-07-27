import { describe, it, expect } from "vitest";
import { LANDING_MEDIA } from "./landing-media";

// Provenance gate (blueprint §25): no marketing image without a real credit.
describe("landing media manifest", () => {
  const assets = Object.values(LANDING_MEDIA);

  it("every asset carries author + sourceUrl + alt (no bare/uncredited image)", () => {
    for (const a of assets) {
      expect(a.author.trim().length).toBeGreaterThan(0);
      expect(a.sourceUrl).toMatch(/^https:\/\/unsplash\.com\/photos\//);
      expect(a.alt.trim().length).toBeGreaterThan(8);
    }
  });

  it("images are local (downloaded, not hotlinked)", () => {
    for (const a of assets) {
      expect(a.src).toMatch(/^\/landing\//);
      expect(a.src).not.toMatch(/^https?:/);
    }
  });
});
