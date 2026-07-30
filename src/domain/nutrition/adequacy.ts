import type { Commodity, Dish, Household, Macro, Member } from "@/domain/types";
import { dailyNeed, type DailyNeed } from "@/data/seed/needs";
import { ADEQUACY_MIN } from "./config";
import type { CommoditySource } from "./calculator";

export type AdequacyLabel = "đủ" | "thiếu";

export interface Adequacy {
  kcalRatio: number;
  proteinRatio: number;
  kcalLabel: AdequacyLabel;
  proteinLabel: AdequacyLabel;
}

const label = (ratio: number): AdequacyLabel => (ratio >= ADEQUACY_MIN ? "đủ" : "thiếu");

export function householdNeed(household: Household): DailyNeed {
  return household.members.reduce(
    (acc, m) => {
      const n = dailyNeed(m, household.lactatingMember);
      return { kcal: acc.kcal + n.kcal, proteinG: acc.proteinG + n.proteinG };
    },
    { kcal: 0, proteinG: 0 },
  );
}

/**
 * Adequacy for the whole household on a day: how much of the family's combined
 * need the day's food supplies. Framed as đủ/thiếu (adequacy), never vượt/kiêng
 * (restriction) – safe for a household that may include a lactating mother.
 */
export function householdAdequacy(dayMacro: Macro, household: Household): Adequacy {
  const need = householdNeed(household);
  const kcalRatio = need.kcal > 0 ? dayMacro.kcal / need.kcal : 0;
  const proteinRatio = need.proteinG > 0 ? dayMacro.proteinG / need.proteinG : 0;
  return { kcalRatio, proteinRatio, kcalLabel: label(kcalRatio), proteinLabel: label(proteinRatio) };
}

/** A member's need-weighted share of the day's food, vs their own need. */
export function memberAdequacy(dayMacro: Macro, member: Member, household: Household): Adequacy {
  const need = dailyNeed(member, household.lactatingMember);
  const totalNeed = householdNeed(household);
  const shareKcal = totalNeed.kcal > 0 ? (need.kcal / totalNeed.kcal) * dayMacro.kcal : 0;
  const shareProtein = totalNeed.proteinG > 0 ? (need.proteinG / totalNeed.proteinG) * dayMacro.proteinG : 0;
  const kcalRatio = need.kcal > 0 ? shareKcal / need.kcal : 0;
  const proteinRatio = need.proteinG > 0 ? shareProtein / need.proteinG : 0;
  return { kcalRatio, proteinRatio, kcalLabel: label(kcalRatio), proteinLabel: label(proteinRatio) };
}

// ─── 4-group check (R-NUT-4) ────────────────────────────────────────────
export type FoodGroup = "đạm" | "tinh bột" | "xơ" | "béo" | "trái cây";
const CORE_GROUPS: FoodGroup[] = ["đạm", "tinh bột", "xơ", "béo"];

const DAM_GROUPS = new Set(["thịt", "cá", "hải sản", "trứng", "đậu"]);

function commodityGroups(c: Commodity): FoodGroup[] {
  const g: FoodGroup[] = [];
  if (DAM_GROUPS.has(c.group)) g.push("đạm");
  if (c.group === "ngũ cốc") g.push("tinh bột");
  if (c.group === "rau") g.push("xơ");
  if (c.group === "trái cây") g.push("trái cây", "xơ");
  if (c.fatG >= 3) g.push("béo"); // oils, fatty cuts
  return g;
}

export interface GroupsCheck {
  present: Set<FoodGroup>;
  /** Missing among the 4 core groups (trái cây is a bonus, not core). */
  missingCore: FoodGroup[];
  hasFruit: boolean;
}

/** Qualitative check that a day/meal spans the food groups (R-NUT-4). */
export function groupsCheck(dishes: Dish[], source: CommoditySource): GroupsCheck {
  const present = new Set<FoodGroup>();
  for (const dish of dishes) {
    for (const line of dish.lines) {
      const c = source(line.commodityId);
      if (!c) continue;
      for (const g of commodityGroups(c)) present.add(g);
    }
  }
  return {
    present,
    missingCore: CORE_GROUPS.filter((g) => !present.has(g)),
    hasFruit: present.has("trái cây"),
  };
}
