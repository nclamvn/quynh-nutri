import "server-only";
import { COMMODITY_BY_ID } from "@/data/seed/commodity";
import { REPERTOIRE, REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import type { Slot } from "@/domain/types";

export interface Substitution {
  dishId: string;
  vnName: string;
  reason: string;
}

/**
 * "Hết X" → same-slot dishes that don't need X. Deterministic and honest:
 * ranks dishes sharing the current protein first, then quick ones. Also lifts
 * commodity-level substitutes from A. (AI can enrich the reason later; the core
 * suggestion must not depend on a key being present.)
 */
export function substitute(slot: Slot, missingCommodityId: string, currentDishId?: string): Substitution[] {
  const current = currentDishId ? REPERTOIRE_BY_ID[currentDishId] : undefined;
  const missing = COMMODITY_BY_ID[missingCommodityId];

  const candidates = REPERTOIRE.filter(
    (d) => d.slot === slot && d.id !== currentDishId && !d.lines.some((l) => l.commodityId === missingCommodityId),
  );

  const scored = candidates
    .map((d) => {
      let score = 0;
      const reasons: string[] = [];
      if (current && d.proteinType === current.proteinType) {
        score += 3;
        reasons.push(`cùng nhóm đạm ${d.proteinType}`);
      }
      if (missing?.substitutes?.some((s) => d.lines.some((l) => l.commodityId === s))) {
        score += 2;
        reasons.push(`dùng nguyên liệu thay thế của ${missing.canonicalVn}`);
      }
      if (d.quick) {
        score += 1;
        reasons.push("nấu nhanh");
      }
      return { dishId: d.id, vnName: d.vnName, score, reason: reasons.join(", ") || "cùng slot" };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored.map(({ dishId, vnName, reason }) => ({ dishId, vnName, reason }));
}
