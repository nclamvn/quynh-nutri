// AI extraction now runs through the Vercel AI Gateway (see dish-import.ts); this
// module only carries the shared Vietnamese text normaliser used for fuzzy
// commodity matching.

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
