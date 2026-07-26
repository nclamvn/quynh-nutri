import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Server-only. The key is wired at E2E (ANTHROPIC_API_KEY); in dev without a key
// the AI touchpoints fall back to a deterministic mock so the app stays runnable.
export const hasClaude = () => Boolean(process.env.ANTHROPIC_API_KEY);

let client: Anthropic | null = null;
export function claude(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

// Cheap, fast extraction model for the two narrow touchpoints.
export const EXTRACTION_MODEL = "claude-haiku-4-5-20251001";

/** Strip Vietnamese diacritics for fuzzy commodity matching. */
export function normalizeVn(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
