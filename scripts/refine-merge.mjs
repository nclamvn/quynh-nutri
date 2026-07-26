import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { COMMODITIES, COMMODITY_BY_ID } from "../src/data/seed/commodity";
import { REPERTOIRE } from "../src/data/seed/repertoire";

// Phase C — human-in-loop MERGE. Reads the AI-generated candidates + a
// hand-edited approval list, converts each APPROVED dish into a ready-to-paste
// dish(...) call for src/data/seed/repertoire.ts. Nothing is injected into the
// SOT automatically: the human reviews REVIEW.md, ticks names in approved.txt,
// runs this, then eyeballs the emitted TS before committing it. A candidate that
// leans on an unmapped/new commodity is REFUSED here (can't compute honest
// numbers without commodity data) — it must go through commodity sourcing first.

const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const slug = (s) => norm(s).replace(/\s+/g, "_");
const RAW = "refinery/candidates-raw.json";
const APPROVED = "refinery/approved.txt";

if (!existsSync(RAW)) { console.error(`✗ ${RAW} chưa có — chạy refine-dishes.mjs trước.`); process.exit(1); }
const candidates = JSON.parse(readFileSync(RAW, "utf8"));

// First run with no approval file: emit a template (all names, commented out).
if (!existsSync(APPROVED)) {
  const tmpl = [
    "# Duyệt món: bỏ dấu # trước tên món muốn đưa vào SOT, rồi chạy lại refine-merge.mjs.",
    "# Món dựa vào commodity 'disputed' vẫn merge được nhưng sẽ hiện KHOẢNG tới khi có nguồn thứ 2.",
    "",
    ...candidates.map((c) => `# ${c.vnName}`),
  ].join("\n");
  writeFileSync(APPROVED, tmpl + "\n");
  console.log(`✓ Tạo ${APPROVED} — mở ra, bỏ # trước tên món duyệt, rồi chạy lại.`);
  process.exit(0);
}

const approvedNames = new Set(
  readFileSync(APPROVED, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")),
);
const existingIds = new Set(REPERTOIRE.map((d) => d.id));

function matchCommodity(name) {
  const n = norm(name);
  let best = null;
  for (const c of COMMODITIES) { const cn = norm(c.canonicalVn); if (n.includes(cn) || cn.includes(n)) if (!best || cn.length > best.len) best = { id: c.id, len: cn.length }; }
  return best?.id;
}

const emitted = [], refused = [];
for (const c of candidates) {
  if (!approvedNames.has(c.vnName)) continue;
  let id = slug(c.vnName);
  if (existingIds.has(id)) id += "_g";
  const lines = [], missing = [];
  for (const ing of c.ingredients) {
    const cid = matchCommodity(ing.name);
    if (cid) lines.push(`["${cid}", ${Math.round(ing.qtyGrams)}]`);
    else missing.push(ing.name);
  }
  if (missing.length) { refused.push({ name: c.vnName, missing }); continue; }
  const tags = c.tags?.length ? `, tags: ${JSON.stringify(c.tags)}` : "";
  const time = c.cookTimeMin ? `cookTimeMin: ${c.cookTimeMin}, ` : "";
  const quick = c.quick ? "quick: true, " : "";
  emitted.push(
    `dish("${id}", ${JSON.stringify(c.vnName)}, "", "${c.proteinType}", "${c.method}", "${c.slot}", {\n` +
    `  ${quick}${time}lines: [${lines.join(", ")}]${tags},\n})`,
  );
}

const header = [
  "// AI-generated (anthropic/claude-sonnet-4.6), human-approved via refinery/approved.txt.",
  "// Paste these dish(...) calls into REPERTOIRE in src/data/seed/repertoire.ts.",
  "// enLabel left \"\" — fill in on review. Numbers derive from mapped commodities (D3),",
  "// so disputed commodities surface as a RANGE until a 2nd source is added.",
  "",
].join("\n");
writeFileSync("refinery/approved-dishes.ts", header + emitted.join("\n\n") + "\n");

console.log(`✓ ${emitted.length} món duyệt → refinery/approved-dishes.ts (dán vào repertoire.ts).`);
if (refused.length) {
  console.log(`⚠ ${refused.length} bị từ chối (commodity chưa có trong SOT — cần nguồn trước):`);
  for (const r of refused) console.log(`   · ${r.name}: ${r.missing.join(", ")}`);
}
