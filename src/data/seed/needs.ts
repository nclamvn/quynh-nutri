import type { Member } from "@/domain/types";
import { lifeStageUplift } from "./lifestage";

// Nhu cầu Dinh dưỡng Khuyến nghị 2016 (QĐ 2615/QĐ-BYT) – P2 canonical.
// Daily requirement per member, keyed by role/sex/age-band/activity.
// Representative seed values; the full RNI table is a data-seed refinery item.
// Lactating members use HD 2017 (P3) uplift, applied in adequacy.

export interface DailyNeed {
  kcal: number;
  proteinG: number;
}

// Physical Activity Level multipliers vs "moderate".
const PAL: Record<Member["activity"], number> = {
  light: 0.9,
  moderate: 1.0,
  heavy: 1.15,
};

export function dailyNeed(member: Member, lactating = false): DailyNeed {
  let base: DailyNeed;

  if (member.role === "adult") {
    base = member.sex === "M" ? { kcal: 2700, proteinG: 70 } : { kcal: 2200, proteinG: 60 };
  } else {
    // child by age band
    switch (member.ageBand) {
      case "0-2":
      case "1-3":
        base = { kcal: 1180, proteinG: 20 };
        break;
      case "3-5":
        base = { kcal: 1320, proteinG: 25 };
        break;
      case "6-10":
        base = { kcal: 1740, proteinG: 35 };
        break;
      default: // 11-14
        base = { kcal: 2050, proteinG: 50 };
    }
  }

  const pal = PAL[member.activity];
  let kcal = base.kcal * pal;
  let proteinG = base.proteinG;

  // Life-stage uplift – per-member profile wins; household `lactating` flag is a
  // legacy fallback. Only SOURCED stages add a number (lactating 0–6 = P3); an
  // unsourced stage (e.g. a pregnancy trimester) adds nothing here, and the UI
  // shows honest_null rather than a fabricated value.
  const uplift = lifeStageUplift(member, lactating);
  kcal += uplift.kcal;
  proteinG += uplift.proteinG;

  return { kcal: Math.round(kcal), proteinG: Math.round(proteinG) };
}
