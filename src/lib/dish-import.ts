import "server-only";
import { z } from "zod";
import { generateObject } from "ai";
import { COMMODITIES } from "@/data/seed/commodity";
import { normalizeVn } from "./claude";

// Extraction runs through the Vercel AI Gateway (OIDC auth in prod + dev), the
// same path as the assistant + refinery — no separate ANTHROPIC_API_KEY needed.
// Uses the same model as the assistant: the Gateway free tier gates cheaper
// models (haiku), but sonnet is available on this account.
const EXTRACT_MODEL = "anthropic/claude-sonnet-4.6";

const SLOTS = ["COM", "MAN", "RAU", "CANH", "TRANGMIENG"] as const;
const METHODS = ["kho", "xao", "luoc", "hap", "nuong", "ran", "song"] as const;
const PROTEINS = ["bo", "ga", "ca", "tom", "heo", "cua", "trung", "dau", "rau"] as const;

const ExtractSchema = z.object({
  vnName: z.string().min(1),
  slot: z.enum(SLOTS),
  method: z.enum(METHODS),
  proteinType: z.enum(PROTEINS),
  ingredients: z.array(z.object({ name: z.string(), qty: z.number().nonnegative(), unit: z.string() })).min(1),
});
type Extract = z.infer<typeof ExtractSchema>;

export interface ImportedLine {
  commodityId: string; // matched id, or the raw name when unmatched
  qtyBase: number;
  unit: string;
  matched: boolean;
}
export interface ImportedDish {
  vnName: string;
  slot: string;
  method: string;
  proteinType: string;
  lines: ImportedLine[];
  notes: string[];
  source: "ai" | "mock";
}

// Pre-normalized commodity index for fuzzy matching.
const INDEX = COMMODITIES.map((c) => ({ id: c.id, norm: normalizeVn(c.canonicalVn) }));

function matchCommodity(name: string): string | null {
  const n = normalizeVn(name);
  // exact-ish containment either direction, longest match wins
  let best: { id: string; len: number } | null = null;
  for (const c of INDEX) {
    if (n.includes(c.norm) || c.norm.includes(n)) {
      if (!best || c.norm.length > best.len) best = { id: c.id, len: c.norm.length };
    }
  }
  return best?.id ?? null;
}

function toLines(ingredients: Extract["ingredients"]): { lines: ImportedLine[]; unmatched: number } {
  let unmatched = 0;
  const lines = ingredients.map((ing) => {
    const id = matchCommodity(ing.name);
    if (!id) unmatched++;
    return { commodityId: id ?? ing.name, qtyBase: ing.qty, unit: ing.unit || "g", matched: Boolean(id) };
  });
  return { lines, unmatched };
}

const SYSTEM = `Bạn tách mô tả hoặc công thức món ăn Việt thành dữ liệu có cấu trúc.
qty là số gram cho 4 người. Nếu công thức có nhiều khẩu phần hoặc không rõ định lượng, quy về khẩu phần 4 người và ước lượng hợp lý. Chỉ lấy nguyên liệu, bỏ phần kể chuyện.`;

async function extractWithAI(text: string): Promise<Extract> {
  const { object } = await generateObject({
    model: EXTRACT_MODEL,
    schema: ExtractSchema,
    system: SYSTEM,
    prompt: text,
  });
  return object; // validated against ExtractSchema by the tool layer
}

/** Deterministic mock: scan text for known commodities + nearby numbers. */
function extractMock(text: string): Extract {
  const norm = normalizeVn(text);
  const found = INDEX.filter((c) => norm.includes(c.norm));
  const ingredients = found.slice(0, 8).map((c) => {
    // grab a number appearing near the commodity name, else default 200g
    const re = new RegExp(`${c.norm}\\D{0,12}(\\d{2,4})`);
    const m = norm.match(re);
    return { name: c.id, qty: m ? Number(m[1]) : 200, unit: "g" };
  });
  return {
    vnName: text.slice(0, 40).trim() || "Món mới",
    slot: "MAN",
    method: "kho",
    proteinType: "heo",
    ingredients: ingredients.length ? ingredients : [{ name: "thịt heo nạc", qty: 300, unit: "g" }],
  };
}

export async function importDish(text: string): Promise<ImportedDish> {
  const notes: string[] = [];
  let extracted: Extract;
  let source: "ai" | "mock";

  try {
    extracted = await extractWithAI(text);
    source = "ai";
  } catch {
    extracted = extractMock(text);
    source = "mock";
    notes.push("Không tách được bằng AI — dùng bản dự phòng theo từ khoá, hãy kiểm lại.");
  }

  const { lines, unmatched } = toLines(extracted.ingredients);
  if (unmatched > 0) notes.push(`${unmatched} nguyên liệu chưa khớp kho commodity — cần xác nhận trước khi lưu (B1).`);

  return { vnName: extracted.vnName, slot: extracted.slot, method: extracted.method, proteinType: extracted.proteinType, lines, notes, source };
}
