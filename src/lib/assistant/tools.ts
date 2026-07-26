import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { REPERTOIRE, REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import { COMMODITY_BY_ID, COMMODITIES } from "@/data/seed/commodity";
import { loadHouseholdState } from "@/data/repo/household";
import { generateWeek } from "@/domain/rotation";
import { dietaryRepertoire } from "@/domain/dish";
import { cookFromPantry } from "@/domain/pantry";
import { substitute } from "@/lib/substitute";
import { normalizeVn } from "@/lib/claude";
import { dayDishes, dayNutrition } from "@/ui/derive";
import type { Household, Allergen, DietRestriction, Slot } from "@/domain/types";

// Tools wrap the DETERMINISTIC engines — the LLM orchestrates + explains, the
// engines compute the numbers (with provenance). This is the honesty moat: no
// macro is ever produced by the model.

const src = (id: string) => COMMODITY_BY_ID[id];
const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const name = (id: string) => COMMODITIES.find((c) => c.id === id)?.canonicalVn ?? id;

async function household(): Promise<Household> {
  return (await loadHouseholdState()).household;
}
function planFor(hh: Household) {
  return generateWeek({ household: hh, repertoire: dietaryRepertoire(REPERTOIRE, hh, src), weekStart: "2026-07-27", seed: 1 }).plan;
}
function matchCommodity(q: string): string | undefined {
  const n = normalizeVn(q);
  return COMMODITIES.find((c) => normalizeVn(c.canonicalVn) === n || normalizeVn(c.canonicalVn).includes(n) || n.includes(normalizeVn(c.canonicalVn)))?.id;
}

export const tools = {
  plan_week: tool({
    description: "Tạo thực đơn tuần (7 ngày) cho hộ, tôn trọng ngày bận + dị ứng/ăn kiêng. Trả tên món mỗi ngày và ghi chú nếu phải nới luật (vd hết hạn ngạch hải sản).",
    inputSchema: z.object({
      vegetarian: z.boolean().optional().describe("ăn chay"),
      avoidAllergens: z.array(z.enum(["shellfish", "fish", "egg", "soy", "dairy", "gluten", "peanut"])).optional().describe("dị nguyên cần tránh"),
    }),
    execute: async ({ vegetarian, avoidAllergens }) => {
      const base = await household();
      const restrictions = [...(base.restrictions ?? [])];
      if (vegetarian) restrictions.push("vegetarian" as DietRestriction);
      const members = avoidAllergens?.length
        ? base.members.map((m, i) => (i === 0 ? { ...m, allergies: [...(m.allergies ?? []), ...(avoidAllergens as Allergen[])] } : m))
        : base.members;
      const hh: Household = { ...base, restrictions, members };
      const res = generateWeek({ household: hh, repertoire: dietaryRepertoire(REPERTOIRE, hh, src), weekStart: "2026-07-27", seed: 1 });
      return {
        days: Array.from({ length: 7 }, (_, d) => ({
          day: DAYS[d],
          dishes: res.plan.slots.filter((s) => s.day === d).map((s) => REPERTOIRE_BY_ID[s.dishId]?.vnName).filter(Boolean),
        })),
        notes: res.notes,
      };
    },
  }),

  nutrition_report: tool({
    description: "Báo cáo dinh dưỡng của một ngày cho cả hộ (0=Thứ2 … 6=CN). LUÔN nêu coverage (độ phủ). Nếu displayMode='range' thì phải đưa KHOẢNG kcal và nói 'ước lượng' — TUYỆT ĐỐI không bịa số điểm chính xác.",
    inputSchema: z.object({ day: z.number().int().min(0).max(6).default(0) }),
    execute: async ({ day }) => {
      const hh = await household();
      const dishes = dayDishes(planFor(hh), day, (id) => REPERTOIRE_BY_ID[id]);
      const nut = dayNutrition(dishes, hh, src);
      return {
        day: DAYS[day],
        dishes: dishes.map((d) => d.vnName),
        kcal: nut.display.point.kcal,
        proteinG: nut.display.point.proteinG,
        coveragePct: Math.round(nut.display.coverage * 100),
        displayMode: nut.display.mode, // number | anchored | range
        kcalRange: nut.display.range ? [Math.round(nut.display.range.low.kcal), Math.round(nut.display.range.high.kcal)] : null,
        groupsPresent: [...nut.groups.present],
        missingGroups: nut.groups.missingCore,
        pctOfDayNeed: Math.round(nut.adequacy.kcalRatio * 100), // bữa này = ?% nhu cầu NGÀY của hộ
      };
    },
  }),

  cook_from_pantry: tool({
    description: "Gợi ý món nấu được với đồ đang có trong kho. Trả món + độ phủ nguyên liệu (%) + nguyên liệu còn thiếu.",
    inputSchema: z.object({}),
    execute: async () => {
      const { pantry } = await loadHouseholdState();
      if (!pantry.length) return { pantryEmpty: true, matches: [] };
      return {
        pantryEmpty: false,
        matches: cookFromPantry(pantry, REPERTOIRE).filter((m) => m.coverage >= 0.6).slice(0, 6).map((m) => ({
          dish: m.dish.vnName,
          coveragePct: Math.round(m.coverage * 100),
          missing: m.missing.map(name),
        })),
      };
    },
  }),

  suggest_substitute: tool({
    description: "Hết một nguyên liệu → gợi ý món thay cùng slot không cần nguyên liệu đó.",
    inputSchema: z.object({
      missing: z.string().describe("tên nguyên liệu bị hết, vd 'tôm'"),
      slot: z.enum(["MAN", "RAU", "CANH", "COM", "TRANGMIENG"]).default("MAN"),
    }),
    execute: async ({ missing, slot }) => {
      const id = matchCommodity(missing);
      if (!id) return { matched: false, missing, suggestions: [] };
      return { matched: true, ingredient: name(id), suggestions: substitute(slot as Slot, id).slice(0, 5) };
    },
  }),
};
