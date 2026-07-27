import type { Supplier } from "@/domain/types";

/** Provenance/confidence tone — same triple the ProvenanceChip renders
 *  (green corroborated · amber estimate/verify · gray null). Kept in the domain
 *  so this module stays UI-free; the UI maps it to colours. */
export type SupplierTone = "accent" | "amber" | "muted";

// Supplier geo/location helpers. The honesty rule: a map pin is only ever a real,
// user-set coordinate (household shop). Multi-branch chains never get a fabricated
// pin — they carry a `storeLocatorUrl` instead. These helpers encode that split.

/** True when the supplier has a real map pin (household shop the user located). */
export function hasMapPin(s: Pick<Supplier, "location">): boolean {
  return !!s.location && Number.isFinite(s.location.lat) && Number.isFinite(s.location.lng);
}

/**
 * A Google Maps *directions* deep-link to the shop — opens the device's maps app
 * for real turn-by-turn. Privacy: only the SHOP destination goes in the URL; the
 * user's own location is supplied by the maps app, never by us.
 * - pinned  → destination = "lat,lng"
 * - address → destination = the address string (maps geocodes it)
 * - neither → null (the caller hides the button)
 */
export function directionsUrl(s: Pick<Supplier, "location" | "address">): string | null {
  if (hasMapPin(s)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${s.location!.lat},${s.location!.lng}`;
  }
  const addr = s.address?.trim();
  if (addr) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
  return null;
}

/** Honesty tone for a supplier's data confidence, reusing the provenance palette:
 *  amber when the record is flagged `needsVerify` ("cần xác minh"); otherwise green
 *  when at least one source backs it; gray when we have no sources at all. */
export function supplierTone(s: Pick<Supplier, "needsVerify" | "sources">): SupplierTone {
  if (s.needsVerify) return "amber";
  return s.sources && s.sources.length > 0 ? "accent" : "muted";
}
