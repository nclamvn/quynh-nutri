import type { CookMethod, DayName, Dish, Household, PlannedSlot, Slot, WeekPlan } from "@/domain/types";
import { mulberry32, shuffled } from "./rng";

const DAY_NAMES: DayName[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FISH = new Set(["ca"]);
const OTHER_SEAFOOD = new Set(["tom", "cua"]);
const HEAVY_METHODS = new Set<CookMethod>(["kho", "ran"]);
const LIGHT_METHODS = new Set<CookMethod>(["luoc", "hap"]);

export interface RotationInput {
  household: Household;
  /** Available dishes (B1 ∪ B0) already resolved for this household. */
  repertoire: Dish[];
  /** Slots the user pinned; preserved verbatim. */
  locked?: PlannedSlot[];
  /** Previous week (day 6 MẶN) to avoid a Sun→Mon protein repeat. */
  previousWeek?: WeekPlan;
  weekStart: string;
  /** Re-roll seed – same seed ⇒ same plan. */
  seed?: number;
  /** Optional soft household preference. Hard safety and rotation filters run first. */
  dishScore?: (dish: Dish, context: { day: number; busy: boolean }) => number;
}

export interface RotationResult {
  plan: WeekPlan;
  /** Honest record of any constraint relaxed to stay feasible. */
  notes: string[];
}

function bySlot(dishes: Dish[], slot: Slot): Dish[] {
  return dishes.filter((d) => d.slot === slot);
}

/**
 * Rotation engine (Blueprint §4.1). Rule precedence when infeasible (T4 add):
 * HARD – no-repeat-protein (day-to-day) and quick-on-busy-days (experience).
 * SOFT – weekly seafood quota (nutrition) is relaxed FIRST, and the relaxation
 * is recorded in `notes` rather than silently dropped.
 */
export function generateWeek(input: RotationInput): RotationResult {
  const { household, repertoire, weekStart } = input;
  const rand = mulberry32(input.seed ?? 1);
  const notes: string[] = [];
  const lockedByKey = new Map<string, PlannedSlot>();
  for (const l of input.locked ?? []) {
    if (l.occasion === "dinner") lockedByKey.set(`${l.day}:${l.slot}`, l);
  }

  const com = bySlot(repertoire, "COM")[0];
  const manPool = bySlot(repertoire, "MAN");
  const rauPool = bySlot(repertoire, "RAU");
  const canhPool = bySlot(repertoire, "CANH");
  const dessertPool = bySlot(repertoire, "TRANGMIENG");

  const slots: PlannedSlot[] = [];
  const dishById = new Map(repertoire.map((d) => [d.id, d]));

  // Anti-repeat carryover from previous week's last MẶN.
  let prevProtein: string | undefined;
  if (input.previousWeek) {
    const last = input.previousWeek.slots
      .filter((s) => s.slot === "MAN")
      .sort((a, b) => b.day - a.day)[0];
    prevProtein = last ? dishById.get(last.dishId)?.proteinType : undefined;
  }

  let usedRauRecent: string | undefined;
  let usedCanhRecent: string | undefined;

  const pick = (
    pool: Dish[],
    predicate: (d: Dish) => boolean,
    context: { day: number; busy: boolean },
  ): Dish | undefined => {
    const candidates = shuffled(pool, rand).filter(predicate);
    if (input.dishScore) {
      candidates.sort(
        (left, right) =>
          input.dishScore!(right, context) - input.dishScore!(left, context),
      );
    }
    return candidates[0];
  };

  for (let day = 0; day < 7; day++) {
    const dayName = DAY_NAMES[day];
    const busy = household.busyDays.includes(dayName);

    // COM – fixed rice base.
    if (com) slots.push(lockedSlot(day, "COM", com.id, lockedByKey) ?? plain(day, "COM", com.id));

    // MẶN – protein rotation + quick-on-busy (both HARD).
    const lockedMan = lockedByKey.get(`${day}:MAN`);
    let man: Dish | undefined;
    if (lockedMan) {
      man = dishById.get(lockedMan.dishId);
    } else {
      man =
        pick(manPool, (d) => d.proteinType !== prevProtein && (!busy || d.quick), { day, busy }) ??
        // fallback: relax anti-repeat before serving a busy-day non-quick dish
        pick(manPool, (d) => !busy || d.quick, { day, busy }) ??
        pick(manPool, () => true, { day, busy });
    }
    if (man) {
      slots.push(lockedMan ?? plain(day, "MAN", man.id));
      prevProtein = man.proteinType;
    }

    // RAU – balance vs MẶN method (rule 4), avoid repeating yesterday's RAU (rule 5).
    const lockedRau = lockedByKey.get(`${day}:RAU`);
    let rau: Dish | undefined;
    if (lockedRau) {
      rau = dishById.get(lockedRau.dishId);
    } else if (man && HEAVY_METHODS.has(man.method)) {
      rau = pick(rauPool, (d) => d.method === "luoc" && d.id !== usedRauRecent, { day, busy }) ?? pick(rauPool, (d) => d.id !== usedRauRecent, { day, busy });
    } else if (man && LIGHT_METHODS.has(man.method)) {
      rau = pick(rauPool, (d) => d.method === "xao" && d.id !== usedRauRecent, { day, busy }) ?? pick(rauPool, (d) => d.id !== usedRauRecent, { day, busy });
    } else {
      rau = pick(rauPool, (d) => d.id !== usedRauRecent, { day, busy }) ?? pick(rauPool, () => true, { day, busy });
    }
    if (rau) {
      slots.push(lockedRau ?? plain(day, "RAU", rau.id));
      usedRauRecent = rau.id;
    }

    // CANH – prefer 'thanh' when MẶN is heavy; avoid repeating yesterday's canh.
    const lockedCanh = lockedByKey.get(`${day}:CANH`);
    let canh: Dish | undefined;
    if (lockedCanh) {
      canh = dishById.get(lockedCanh.dishId);
    } else if (man && HEAVY_METHODS.has(man.method)) {
      canh =
        pick(canhPool, (d) => d.tags?.includes("thanh") === true && d.id !== usedCanhRecent, { day, busy }) ??
        pick(canhPool, (d) => d.id !== usedCanhRecent, { day, busy });
    } else {
      canh = pick(canhPool, (d) => d.id !== usedCanhRecent, { day, busy }) ?? pick(canhPool, () => true, { day, busy });
    }
    if (canh) {
      slots.push(lockedCanh ?? plain(day, "CANH", canh.id));
      usedCanhRecent = canh.id;
    }

    // TRÁNG MIỆNG – rotate fruit by day.
    if (dessertPool.length) {
      const lockedTm = lockedByKey.get(`${day}:TRANGMIENG`);
      const tm = lockedTm ? dishById.get(lockedTm.dishId) : dessertPool[day % dessertPool.length];
      if (tm) slots.push(lockedTm ?? plain(day, "TRANGMIENG", tm.id));
    }
  }

  // ── Weekly seafood quota (SOFT): ≥2 fish + ≥1 other seafood. ──
  repairSeafood(slots, dishById, manPool, lockedByKey, household, rand, notes);

  return { plan: { householdId: household.id, weekStart, slots }, notes };
}

function plain(day: number, slot: Slot, dishId: string): PlannedSlot {
  return { day, occasion: "dinner", slot, dishId, locked: false };
}
function lockedSlot(day: number, slot: Slot, dishId: string, locked: Map<string, PlannedSlot>): PlannedSlot | undefined {
  return locked.get(`${day}:${slot}`);
}

function countSeafood(slots: PlannedSlot[], dishById: Map<string, Dish>) {
  let fish = 0;
  let other = 0;
  for (const s of slots) {
    if (s.slot !== "MAN") continue;
    const p = dishById.get(s.dishId)?.proteinType;
    if (p && FISH.has(p)) fish++;
    else if (p && OTHER_SEAFOOD.has(p)) other++;
  }
  return { fish, other };
}

function repairSeafood(
  slots: PlannedSlot[],
  dishById: Map<string, Dish>,
  manPool: Dish[],
  lockedByKey: Map<string, PlannedSlot>,
  household: Household,
  rand: () => number,
  notes: string[],
) {
  const need = { fish: 2, other: 1 };
  const manByDay = new Map<number, PlannedSlot>();
  for (const s of slots) if (s.slot === "MAN") manByDay.set(s.day, s);
  const proteinAt = (day: number) => {
    const s = manByDay.get(day);
    return s ? dishById.get(s.dishId)?.proteinType : undefined;
  };

  const trySwap = (want: "fish" | "other") => {
    const wantSet = want === "fish" ? FISH : OTHER_SEAFOOD;
    const candidates = shuffled(manPool, rand).filter((d) => wantSet.has(d.proteinType));
    // Find a non-locked MẶN slot whose quick + anti-repeat constraints hold.
    for (const s of slots) {
      if (s.slot !== "MAN" || s.locked || lockedByKey.has(`${s.day}:MAN`)) continue;
      const busy = household.busyDays.includes(DAY_NAMES[s.day]);
      const cur = dishById.get(s.dishId)?.proteinType;
      if (cur && wantSet.has(cur)) continue; // already this kind
      const prev = proteinAt(s.day - 1);
      const next = proteinAt(s.day + 1);
      // Respect HARD no-repeat-protein against both neighbours.
      const swap = candidates.find(
        (d) => (!busy || d.quick) && d.proteinType !== prev && d.proteinType !== next,
      );
      if (swap) {
        s.dishId = swap.id;
        return true;
      }
    }
    return false;
  };

  let guard = 0;
  while (guard++ < 10) {
    const { fish, other } = countSeafood(slots, dishById);
    if (fish >= need.fish && other >= need.other) return;
    if (fish < need.fish && trySwap("fish")) continue;
    if (other < need.other && trySwap("other")) continue;
    break; // cannot satisfy without touching hard constraints
  }

  const { fish, other } = countSeafood(slots, dishById);
  if (fish < need.fish || other < need.other) {
    notes.push(
      `Nới hạn ngạch hải sản (đạt ${fish} cá / ${other} hải sản khác, mục tiêu ≥2 / ≥1) để giữ luật không-lặp-đạm và món-nhanh-ngày-bận.`,
    );
  }
}
