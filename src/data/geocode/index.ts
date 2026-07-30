import "server-only";
import { cacheKey, parseNominatim, parseGoong, providerNameForEnv, type GeocodeResult, type GeocodeProvider } from "./parse";

export type { GeocodeResult, GeocodeProvider } from "./parse";
export { cacheKey, parseNominatim, parseGoong, providerNameForEnv } from "./parse";

// Geocode runs SERVER-side: Nominatim requires a custom User-Agent, which browsers
// forbid setting. Policy (osmfoundation, corroborated): ≤1 req/s across the app,
// cache results, identify via User-Agent, attribution, NO autocomplete/systematic.
const UA = "BuaComNha/1.0 (+https://anngon.io)";

const NominatimProvider: GeocodeProvider = {
  name: "nominatim",
  async geocode(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=vn&addressdetails=0&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "vi" } });
    if (!res.ok) return null;
    return parseNominatim(await res.json());
  },
};

function goongProvider(key: string): GeocodeProvider {
  return {
    name: "goong",
    async geocode(address) {
      const res = await fetch(`https://rsapi.goong.io/geocode?address=${encodeURIComponent(address)}&api_key=${key}`);
      if (!res.ok) return null;
      return parseGoong(await res.json());
    },
  };
}

// Deterministic mock for E2E/CI – never calls Nominatim (rate limit 1 req/s). Keeps
// the "Bến Thành → confidence ~0" case so the honesty test sees an imprecise suggestion.
const MockProvider: GeocodeProvider = {
  name: "nominatim",
  async geocode(address) {
    const a = address.toLowerCase();
    if (a.includes("bến thành") || a.includes("ben thanh"))
      return { lat: 10.786448, lng: 106.7036312, confidence: 0.00006, source: "nominatim", label: "mock: Bến Thành (imprecise)" };
    if (a.trim().length >= 4) return { lat: 10.7769, lng: 106.7009, confidence: 0.5, source: "nominatim", label: "mock: TP.HCM" };
    return null;
  },
};

/** Provider selection; swapping never touches domain/UI (deviation #1: adapter). */
export function pickProvider(env: Record<string, string | undefined> = process.env): GeocodeProvider {
  if (env.E2E_MOCK_GEOCODE === "1") return MockProvider;
  return providerNameForEnv(env) === "goong" ? goongProvider(env.GOONG_API_KEY as string) : NominatimProvider;
}

// ── Cache + throttle (policy: cache results, ≤1 req/s) ──
const cache = new Map<string, GeocodeResult | null>();
let lastCallAt = 0;

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const key = cacheKey(address);
  if (!key) return null;
  if (cache.has(key)) return cache.get(key) ?? null;

  const wait = 1000 - (Date.now() - lastCallAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait)); // ≤1 req/s
  lastCallAt = Date.now();

  let result: GeocodeResult | null = null;
  try {
    result = await pickProvider().geocode(address);
  } catch {
    result = null;
  }
  cache.set(key, result);
  return result;
}
