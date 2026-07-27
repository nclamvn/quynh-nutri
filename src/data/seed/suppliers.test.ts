import { describe, it, expect } from "vitest";
import { SUPPLIER_REGISTRY, SUPPLIER_REGISTRY_BY_ID } from "./suppliers";
import type { ChannelKind } from "@/domain/types";

const KINDS: ChannelKind[] = ["zalo_chat", "hotline", "phone_sms", "their_zalo_oa", "their_app_web"];

describe("supplier registry (seed, provenance-disciplined)", () => {
  it("every channel uses a valid kind", () => {
    for (const s of SUPPLIER_REGISTRY)
      for (const c of s.channels) expect(KINDS).toContain(c.kind);
  });

  it("registry is seed-only — chains are suggestions, not household-owned", () => {
    for (const s of SUPPLIER_REGISTRY) {
      expect(s.seed).toBe(true);
      expect(s.householdId).toBeUndefined();
    }
  });

  it("stale-source chains are flagged needs-verify, not seeded as certain", () => {
    expect(SUPPLIER_REGISTRY_BY_ID.reg_aeon.needsVerify).toBe(true);
    expect(SUPPLIER_REGISTRY_BY_ID.reg_convenience.needsVerify).toBe(true);
    // corroborated chains carry no needs-verify flag
    expect(SUPPLIER_REGISTRY_BY_ID.reg_bhx.needsVerify).toBeUndefined();
    expect(SUPPLIER_REGISTRY_BY_ID.reg_coopmart.needsVerify).toBeUndefined();
  });

  it("chains are all `their_*`/hotline — the app can't push its order into a chain cart", () => {
    // No seeded chain offers zalo_chat/phone_sms (that's the household's own shop, added via CRUD).
    for (const s of SUPPLIER_REGISTRY)
      for (const c of s.channels) expect(["their_zalo_oa", "their_app_web", "hotline"]).toContain(c.kind);
  });
});
