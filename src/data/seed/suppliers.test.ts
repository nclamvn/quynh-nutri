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

  it("only chains with unconfirmed data are flagged needs-verify (post-refinery)", () => {
    // Kept ⚠: order hotline / VinID→WIN transition / no official hotline / single-source CSKH.
    for (const id of ["reg_bhx", "reg_winmart", "reg_grabmart", "reg_familymart"])
      expect(SUPPLIER_REGISTRY_BY_ID[id].needsVerify).toBe(true);
    // Core-corroborated chains carry no flag after the refinery.
    for (const id of ["reg_coopmart", "reg_bigc", "reg_aeon", "reg_circlek", "reg_gs25"])
      expect(SUPPLIER_REGISTRY_BY_ID[id].needsVerify).toBeUndefined();
  });

  it("chains with a corroborated branch finder carry a storeLocatorUrl (not a fake address)", () => {
    for (const id of ["reg_bhx", "reg_coopmart", "reg_bigc", "reg_aeon", "reg_circlek", "reg_gs25", "reg_familymart"]) {
      expect(SUPPLIER_REGISTRY_BY_ID[id].storeLocatorUrl).toMatch(/^https:\/\//);
      expect(SUPPLIER_REGISTRY_BY_ID[id].address).toBeUndefined(); // no fabricated single address
    }
  });

  it("chains are all `their_*`/hotline — the app can't push its order into a chain cart", () => {
    // No seeded chain offers zalo_chat/phone_sms (that's the household's own shop, added via CRUD).
    for (const s of SUPPLIER_REGISTRY)
      for (const c of s.channels) expect(["their_zalo_oa", "their_app_web", "hotline"]).toContain(c.kind);
  });

  it("no chain carries a fabricated map pin — multi-branch chains use storeLocatorUrl, not one coordinate", () => {
    for (const s of SUPPLIER_REGISTRY) expect(s.location).toBeUndefined();
  });

  it("every chain records at least one source (provenance, never bare claims)", () => {
    for (const s of SUPPLIER_REGISTRY) expect((s.sources?.length ?? 0)).toBeGreaterThan(0);
  });
});
