import "server-only";
import { embed } from "ai";
import store from "@/data/seed/dish-embeddings.json";

// Semantic dish search — query embedded at request time (gateway), cosine
// against the committed dish vectors, ranked in-memory. Genuinely semantic:
// "món chua" finds canh chua, "dùng hết cá" ranks fish dishes. pgvector is the
// scale path once the SOT grows (Phase C).
const MODEL = "google/text-multilingual-embedding-002";
const VECTORS = store as Record<string, number[]>;

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

export async function semanticSearch(query: string, k = 8): Promise<{ id: string; score: number }[]> {
  const q = query.trim();
  if (!q) return [];
  const { embedding } = await embed({ model: MODEL, value: q });
  return Object.entries(VECTORS)
    .map(([id, vec]) => ({ id, score: cosine(embedding, vec) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
