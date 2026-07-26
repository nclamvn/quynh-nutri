"use client";

import { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef } from "react";
import type { Dish, Household, PlannedSlot, Slot, WeekPlan, PantryItem, HealthProfile, Allergen } from "@/domain/types";
import { COMMODITY_BY_ID } from "@/data/seed/commodity";
import { REPERTOIRE, REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import { DEFAULT_HOUSEHOLD } from "@/data/seed/household";
import { generateWeek } from "@/domain/rotation";
import { aggregateShopping, type ShoppingItem } from "@/domain/shopping";
import { resolveSlot, resolveDish, dietaryRepertoire, dishAllowed } from "@/domain/dish";
import { getHouseholdState, persistState } from "@/app/actions";
import { toast } from "@/ui/toast";

const SYNC_FAIL_MSG = "Không tải được dữ liệu — đang dùng bản mặc định.";
const SAVE_FAIL_MSG = "Chưa lưu được thay đổi. Kiểm tra kết nối.";

/** Persist without swallowing failures — surface them as a toast. */
const safePersist = (patch: Parameters<typeof persistState>[0]) =>
  persistState(patch).catch(() => toast(SAVE_FAIL_MSG, "error"));

// Phase 1 data source: the typed seed, in-memory. When Postgres is wired the
// repo layer swaps in here without touching domain or UI.
const commodities = (id: string) => COMMODITY_BY_ID[id];
// B0 baseline; household B1 forks + imports live in state and override via resolveDish.
const repertoire: Dish[] = REPERTOIRE;
const B1_KEY = "qk-b1-dishes";

interface StoreValue {
  hydrated: boolean;
  household: Household;
  plan: WeekPlan;
  notes: string[];
  shopping: ShoppingItem[];
  reroll: () => void;
  changeSlot: (day: number, slot: Slot, dishId: string) => void;
  toggleLock: (day: number, slot: Slot) => void;
  toggleShopping: (commodityId: string, vendor: string) => void;
  optionsFor: (slot: Slot) => Dish[];
  dish: (id: string) => Dish | undefined;
  commodity: typeof commodities;
  updateHousehold: (patch: Partial<Household>) => void;
  updateMemberHealthProfile: (memberId: string, profile: HealthProfile | null) => void;
  updateMemberAllergies: (memberId: string, allergies: Allergen[]) => void;
  // UI-3/5: favorites + fork (B1)
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  favoriteDishes: Dish[];
  forkDish: (id: string) => void;
  addB1Dish: (dish: Dish) => void;
  isForked: (id: string) => boolean;
  // UI-7: quick notes (THẬT-nhẹ)
  userNotes: { id: number; text: string }[];
  addNote: (text: string) => void;
  deleteNote: (id: number) => void;
  // PA-Pantry
  pantry: PantryItem[];
  addPantry: (commodityId: string, qty: number, unit: string) => void;
  removePantry: (commodityId: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [household, setHousehold] = useState<Household>(DEFAULT_HOUSEHOLD);
  // Per-piece "touched" flags so late-arriving DB hydration never clobbers an
  // optimistic edit the user made before it resolved.
  const touched = useRef({ household: false, favorites: false, notes: false, pantry: false });
  const [hydrated, setHydrated] = useState(false);
  const [seed, setSeed] = useState(1);
  const [manualPlan, setManualPlan] = useState<WeekPlan | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [b1, setB1] = useState<Dish[]>([]); // household forks + imports (B1 ⊳ B0)
  const [userNotes, setUserNotes] = useState<{ id: number; text: string }[]>([]);
  const noteId = useRef(1);
  const [pantry, setPantry] = useState<PantryItem[]>([]);

  // Resolve a dish id through the override: B1 fork wins over B0 (Blueprint §2).
  const resolve = useCallback((id: string) => resolveDish(id, REPERTOIRE, b1) ?? REPERTOIRE_BY_ID[id], [b1]);

  // Hydrate from Neon on mount (persistence). Falls back to in-memory defaults.
  useEffect(() => {
    getHouseholdState()
      .then((s) => {
        const tp = touched.current;
        if (!tp.household) setHousehold(s.household);
        if (!tp.favorites) setFavorites(Object.fromEntries(s.favorites.map((id) => [id, true])));
        if (!tp.notes) {
          setUserNotes(s.notes);
          noteId.current = s.notes.reduce((m, n) => Math.max(m, n.id), 0) + 1;
        }
        if (!tp.pantry) setPantry(s.pantry);
      })
      .catch(() => toast(SYNC_FAIL_MSG, "error")) // surface, don't swallow
      .finally(() => setHydrated(true));
  }, []);

  // B1 dishes (forks + imports) persist on-device. DB-persist is a later migration.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(B1_KEY);
      if (raw) setB1(JSON.parse(raw) as Dish[]);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(B1_KEY, JSON.stringify(b1)); } catch {}
  }, [b1]);

  // Dishes the household is actually allowed to eat (allergies + diet restrictions).
  const allowedRepertoire = useMemo(() => dietaryRepertoire(repertoire, household, commodities), [household]);

  // Generate a plan from the seed unless the user hand-edited slots.
  const generated = useMemo(() => {
    const locked = manualPlan?.slots.filter((s) => s.locked);
    const res = generateWeek({ household, repertoire: allowedRepertoire, weekStart: "2026-07-27", seed, locked });
    return res;
  }, [household, seed, manualPlan, allowedRepertoire]);

  const plan = manualPlan ?? generated.plan;

  useEffect(() => {
    setNotes(generated.notes);
  }, [generated]);

  // Derive shopping from the plan, carrying checked ticks over.
  const shopping = useMemo(() => {
    const prev: ShoppingItem[] = Object.entries(checked)
      .filter(([, v]) => v)
      .map(([key]) => {
        const [commodityId, vendor] = key.split("|");
        return { commodityId, vendor, checked: true } as ShoppingItem;
      });
    return aggregateShopping(plan, resolve, commodities, household, prev, pantry);
  }, [plan, household, checked, resolve, pantry]);

  const reroll = useCallback(() => {
    // Keep locked slots, drop manual edits, advance the seed.
    setManualPlan((prev) => {
      const locked = (prev ?? generated.plan).slots.filter((s) => s.locked);
      if (locked.length === 0) return null;
      return { ...(prev ?? generated.plan), slots: locked };
    });
    setSeed((s) => s + 1);
  }, [generated.plan]);

  const editPlan = useCallback(
    (mut: (slots: PlannedSlot[]) => PlannedSlot[]) => {
      setManualPlan((prev) => {
        const base = prev ?? plan;
        return { ...base, slots: mut(base.slots.map((s) => ({ ...s }))) };
      });
    },
    [plan],
  );

  const changeSlot = useCallback(
    (day: number, slot: Slot, dishId: string) => {
      editPlan((slots) => {
        const idx = slots.findIndex((s) => s.day === day && s.slot === slot);
        if (idx >= 0) slots[idx] = { ...slots[idx], dishId };
        else slots.push({ day, slot, dishId, locked: false });
        return slots;
      });
    },
    [editPlan],
  );

  const toggleLock = useCallback(
    (day: number, slot: Slot) => {
      editPlan((slots) => {
        const idx = slots.findIndex((s) => s.day === day && s.slot === slot);
        if (idx >= 0) slots[idx] = { ...slots[idx], locked: !slots[idx].locked };
        return slots;
      });
    },
    [editPlan],
  );

  const toggleShopping = useCallback((commodityId: string, vendor: string) => {
    const key = `${commodityId}|${vendor}`;
    setChecked((c) => ({ ...c, [key]: !c[key] }));
  }, []);

  const optionsFor = useCallback(
    (slot: Slot) => resolveSlot(slot, repertoire, b1).filter((d) => dishAllowed(d, household, commodities)),
    [b1, household],
  );

  const updateHousehold = useCallback((patch: Partial<Household>) => {
    touched.current.household = true;
    setHousehold((h) => ({ ...h, ...patch }));
    safePersist({
      size: patch.size,
      marketMode: patch.marketMode,
      busyDays: patch.busyDays,
      lactatingMember: patch.lactatingMember,
      restrictions: patch.restrictions,
    });
  }, []);

  const updateMemberHealthProfile = useCallback((memberId: string, profile: HealthProfile | null) => {
    touched.current.household = true;
    setHousehold((h) => ({
      ...h,
      members: h.members.map((m) => (m.id === memberId ? { ...m, healthProfile: profile ?? undefined } : m)),
    }));
    import("@/app/actions").then(({ persistMemberHealthProfile }) => persistMemberHealthProfile(memberId, profile)).catch(() => toast(SAVE_FAIL_MSG, "error"));
  }, []);

  const updateMemberAllergies = useCallback((memberId: string, allergies: Allergen[]) => {
    touched.current.household = true;
    setHousehold((h) => ({
      ...h,
      members: h.members.map((m) => (m.id === memberId ? { ...m, allergies } : m)),
    }));
    import("@/app/actions").then(({ persistMemberAllergies }) => persistMemberAllergies(memberId, allergies)).catch(() => toast(SAVE_FAIL_MSG, "error"));
  }, []);

  const addNote = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    touched.current.notes = true;
    const next = [{ id: noteId.current++, text: t }, ...userNotes];
    setUserNotes(next);
    safePersist({ notes: next });
  }, [userNotes]);
  const deleteNote = useCallback((id: number) => {
    touched.current.notes = true;
    const next = userNotes.filter((x) => x.id !== id);
    setUserNotes(next);
    safePersist({ notes: next });
  }, [userNotes]);

  const addPantry = useCallback((commodityId: string, qty: number, unit: string) => {
    if (!commodityId || qty <= 0) return;
    touched.current.pantry = true;
    const i = pantry.findIndex((x) => x.commodityId === commodityId);
    const next = i >= 0 ? pantry.map((x, j) => (j === i ? { ...x, qty: x.qty + qty } : x)) : [...pantry, { commodityId, qty, unit }];
    setPantry(next);
    safePersist({ pantry: next });
  }, [pantry]);
  const removePantry = useCallback((commodityId: string) => {
    touched.current.pantry = true;
    const next = pantry.filter((x) => x.commodityId !== commodityId);
    setPantry(next);
    safePersist({ pantry: next });
  }, [pantry]);

  // ── Favorites (B1-lite): keyed by dish id shown on the card ──
  const isFavorite = useCallback((id: string) => Boolean(favorites[id]), [favorites]);
  const toggleFavorite = useCallback((id: string) => {
    touched.current.favorites = true;
    const next = { ...favorites, [id]: !favorites[id] };
    setFavorites(next);
    safePersist({ favorites: Object.keys(next).filter((k) => next[k]) });
  }, [favorites]);
  const favoriteDishes = useMemo(
    () => Object.keys(favorites).filter((id) => favorites[id]).map(resolve).filter((d): d is Dish => Boolean(d)),
    [favorites, resolve],
  );

  // ── Fork (B1): copy-to-override. Same lines → macros/adequacy unchanged
  // (denominator precedent stays intact; fork never re-computes nutrition). ──
  const isForked = useCallback((id: string) => b1.some((d) => d.sourceRepertoireId === id || d.id === id), [b1]);
  const forkDish = useCallback((id: string) => {
    setB1((prev) => {
      if (prev.some((d) => d.sourceRepertoireId === id)) return prev;
      const base = REPERTOIRE_BY_ID[id];
      if (!base) return prev;
      const fork: Dish = {
        ...base,
        id: `hh_${id}`,
        origin: "B1",
        sourceRepertoireId: id,
        isFavorite: base.isFavorite,
        lines: base.lines.map((l) => ({ ...l })),
      };
      return [...prev, fork];
    });
  }, []);

  // Add an imported dish as a B1 (household) dish. Nutrition is NOT taken on faith
  // from the source — it is computed downstream from the mapped commodity lines,
  // exactly like any B0 dish, so an import can never smuggle in a fabricated number.
  const addB1Dish = useCallback((dish: Dish) => {
    setB1((prev) => (prev.some((d) => d.id === dish.id) ? prev : [...prev, dish]));
  }, []);

  const value: StoreValue = {
    hydrated,
    household,
    plan,
    notes,
    shopping,
    reroll,
    changeSlot,
    toggleLock,
    toggleShopping,
    optionsFor,
    dish: resolve,
    commodity: commodities,
    updateHousehold,
    updateMemberHealthProfile,
    updateMemberAllergies,
    isFavorite,
    toggleFavorite,
    favoriteDishes,
    forkDish,
    addB1Dish,
    isForked,
    userNotes,
    addNote,
    deleteNote,
    pantry,
    addPantry,
    removePantry,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
