import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { generateObject } from "ai";
import { z } from "zod";
import { writeFileSync, mkdirSync } from "node:fs";
import { COMMODITIES, COMMODITY_BY_ID } from "../src/data/seed/commodity";
import { REPERTOIRE } from "../src/data/seed/repertoire";

// Phase C — AI refinery. AI GENERATES candidate dishes; we compute REAL nutrition
// coverage from the existing SOT (D3) and flag any new commodity that would need
// ≥2 sources before it can be trusted. Output is a human-review artifact — nothing
// enters the SOT automatically. Honesty: a number is never fabricated; a dish that
// needs unknown commodity data is flagged, not silently trusted.

const N = Number(process.argv[2] ?? 12);
const MODEL = "anthropic/claude-sonnet-4.6";
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const PROTEINS = ["bo", "ga", "ca", "tom", "cua", "heo", "trung", "dau", "rau"];
const METHODS = ["kho", "xao", "luoc", "hap", "nuong", "ran", "song"];
const SLOTS = ["COM", "MAN", "RAU", "CANH", "TRANGMIENG"];

const schema = z.object({
  dishes: z.array(z.object({
    vnName: z.string(),
    proteinType: z.enum(PROTEINS),
    method: z.enum(METHODS),
    slot: z.enum(SLOTS),
    quick: z.boolean(),
    cookTimeMin: z.number().int(),
    tags: z.array(z.string()).optional(),
    ingredients: z.array(z.object({ name: z.string(), qtyGrams: z.number() })).min(1),
  })),
});

const prompt = `Bạn là chuyên gia ẩm thực gia đình Việt. Sinh ${N} MÓN CƠM NHÀ VIỆT thường ngày, KHÁC hoàn toàn danh sách đã có:
${REPERTOIRE.map((d) => d.vnName).join(", ")}.

Ưu tiên DÙNG LẠI các nguyên liệu này (đúng tên): ${COMMODITIES.map((c) => c.canonicalVn).join(", ")}.
Nếu cần nguyên liệu mới ngoài danh sách, cứ dùng nhưng ít thôi.

Định lượng theo gram ĂN ĐƯỢC cho 4 người (2 lớn + 2 trẻ), theo khẩu phần chuẩn: đạm chính ~350g, rau ~350g, rau canh ~200g, cơm ~640g, trái cây ~580g. Gia vị (nước mắm, đường, dầu) lượng nhỏ.
Đa dạng slot (MẶN/RAU/CANH), đa dạng đạm và cách nấu. Trả JSON đúng schema.`;

console.log(`Generating ${N} candidate dishes with ${MODEL}…`);
const { object } = await generateObject({ model: MODEL, schema, prompt });

function matchCommodity(name) {
  const n = norm(name);
  let best = null;
  for (const c of COMMODITIES) {
    const cn = norm(c.canonicalVn);
    if (n.includes(cn) || cn.includes(n)) if (!best || cn.length > best.len) best = { id: c.id, len: cn.length };
  }
  return best?.id;
}

const MAN_ANCHOR = 352; // portion-model main-protein anchor (edible, 3.2 AE)
const results = object.dishes.map((d) => {
  let total = 0, corroborated = 0, proteinMass = 0;
  const mapped = [], newNeeded = [];
  for (const ing of d.ingredients) {
    total += ing.qtyGrams;
    const id = matchCommodity(ing.name);
    if (id) {
      const c = COMMODITY_BY_ID[id];
      mapped.push({ name: ing.name, id, qtyGrams: ing.qtyGrams, confidence: c.confidence });
      if (c.confidence === "corroborated") corroborated += ing.qtyGrams;
      if (["thịt", "cá", "hải sản", "trứng", "đậu"].includes(c.group)) proteinMass += ing.qtyGrams;
    } else {
      newNeeded.push(ing.name);
    }
  }
  const coverage = total ? corroborated / total : 0;
  const d3 = coverage >= 0.85 ? "number" : coverage >= 0.6 ? "anchored" : "range";
  const disputed = mapped.filter((m) => m.confidence !== "corroborated");
  const flags = [];
  if (newNeeded.length) flags.push(`cần dữ liệu ≥2 nguồn (commodity mới): ${newNeeded.join(", ")}`);
  if (coverage < 0.85 && disputed.length) flags.push(`cần nguồn thứ 2 để lên corroborated: ${disputed.map((m) => m.id).join(", ")}`);
  if (d.slot === "MAN" && (proteinMass < MAN_ANCHOR * 0.65 || proteinMass > MAN_ANCHOR * 1.4)) flags.push(`đạm ${Math.round(proteinMass)}g lệch khẩu phần chuẩn (~${MAN_ANCHOR}g)`);
  return { ...d, coveragePct: Math.round(coverage * 100), d3, mapped, newCommoditiesNeeded: newNeeded, flags };
});

mkdirSync("refinery", { recursive: true });
writeFileSync("refinery/candidates-raw.json", JSON.stringify(object.dishes, null, 2));
writeFileSync("refinery/candidates-generated.json", JSON.stringify(results, null, 2));

const md = [
  "# Refinery — món ứng viên do AI sinh (chờ người duyệt)",
  "",
  `Model: ${MODEL} · ${results.length} món · KHÔNG tự vào SOT. Coverage tính từ commodity hiện có (D3).`,
  "",
  `| # | Món | slot | coverage | D3 | cờ cần xử |`,
  `|---|---|---|---|---|---|`,
  ...results.map((r, i) => `| ${i + 1} | ${r.vnName} | ${r.slot} | ${r.coveragePct}% | ${r.d3} | ${r.flags.length ? r.flags.join("; ") : "—"} |`),
  "",
  "## Chi tiết",
  ...results.flatMap((r) => [
    `### ${r.vnName} (${r.proteinType}·${r.method}·${r.slot}${r.quick ? "·nhanh" : ""})`,
    `Coverage **${r.coveragePct}%** → hiển thị **${r.d3}**${r.flags.length ? ` · ⚑ ${r.flags.join("; ")}` : ""}`,
    "Nguyên liệu: " + r.mapped.map((m) => `${m.name}→${m.id}(${m.confidence}) ${m.qtyGrams}g`).join(", ") + (r.newCommoditiesNeeded.length ? ` · MỚI: ${r.newCommoditiesNeeded.join(", ")}` : ""),
    "",
  ]),
].join("\n");
writeFileSync("refinery/REVIEW.md", md);

const ready = results.filter((r) => !r.flags.length).length;
console.log(`✓ ${results.length} candidates → refinery/REVIEW.md · ${ready} corroborated đủ (merge được ngay), ${results.length - ready} cần đối chiếu nguồn trước khi lên số.`);
