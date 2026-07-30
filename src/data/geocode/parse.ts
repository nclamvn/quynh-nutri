// Pure geocode helpers – no `server-only`, no fetch, so they're unit-testable.
// The fetch providers + throttle/cache live in ./index (server-only).

export interface GeocodeResult {
  lat: number;
  lng: number;
  confidence: number; // 0..1, provider-reported (never asserted as truth)
  source: "nominatim" | "goong";
  label?: string;
}

export interface GeocodeProvider {
  name: GeocodeResult["source"];
  geocode(address: string): Promise<GeocodeResult | null>;
}

/** Normalize an address into a stable cache key (repeat queries must hit cache). */
export function cacheKey(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Parse a Nominatim search response (array) into our result, or null. */
export function parseNominatim(json: unknown): GeocodeResult | null {
  if (!Array.isArray(json) || json.length === 0) return null;
  const r = json[0] as { lat?: string; lon?: string; importance?: number; display_name?: string };
  const lat = Number(r.lat), lng = Number(r.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, confidence: typeof r.importance === "number" ? r.importance : 0.5, source: "nominatim", label: r.display_name };
}

/** Parse a Goong geocode response into our result, or null. */
export function parseGoong(json: unknown): GeocodeResult | null {
  const results = (json as { results?: unknown[] })?.results;
  if (!Array.isArray(results) || results.length === 0) return null;
  const r = results[0] as { geometry?: { location?: { lat?: number; lng?: number } }; formatted_address?: string };
  const lat = r.geometry?.location?.lat, lng = r.geometry?.location?.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat: lat as number, lng: lng as number, confidence: 0.7, source: "goong", label: r.formatted_address };
}

/** Which provider to use: Goong when a key is present (better VN addresses), else
 *  the free, policy-compliant Nominatim default. Pure – selection only. */
export function providerNameForEnv(env: Record<string, string | undefined>): GeocodeResult["source"] {
  return env.GOONG_API_KEY ? "goong" : "nominatim";
}
