import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { embedMany } from "ai";
import { writeFileSync } from "node:fs";
import { REPERTOIRE } from "../src/data/seed/repertoire";
import { COMMODITY_BY_ID } from "../src/data/seed/commodity";

// Phase B: precompute dish embeddings once → commit JSON. Query embeddings happen
// at request time via the gateway; cosine search runs in-memory (49 dishes, no
// pgvector needed until the SOT scales in Phase C). Multilingual model for VN.
const MODEL = "google/text-multilingual-embedding-002";
const SLOT = { COM: "cơm", MAN: "món mặn chính", RAU: "món rau", CANH: "canh", TRANGMIENG: "tráng miệng trái cây" };

function describe(d) {
  const ings = d.lines.map((l) => COMMODITY_BY_ID[l.commodityId]?.canonicalVn).filter(Boolean).join(", ");
  return `${d.vnName}. ${SLOT[d.slot]}, đạm ${d.proteinType}, cách nấu ${d.method}${d.quick ? ", nấu nhanh" : ""}. Nguyên liệu: ${ings}.`;
}

const values = REPERTOIRE.map(describe);
console.log(`embedding ${values.length} dishes with ${MODEL}…`);
const { embeddings } = await embedMany({ model: MODEL, values });

const out = {};
REPERTOIRE.forEach((d, i) => (out[d.id] = embeddings[i]));
writeFileSync("src/data/seed/dish-embeddings.json", JSON.stringify(out));
console.log(`✓ wrote ${Object.keys(out).length} embeddings (dim ${embeddings[0].length}) → src/data/seed/dish-embeddings.json`);
