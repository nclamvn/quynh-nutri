"use client";

import { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef } from "react";
import type { Dish, Household, PlannedSlot, Slot, WeekPlan } from "@/domain/types";
import { COMMODITY_BY_ID } from "@/data/seed/commodity";
import { REPERTOIRE, REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import { DEFAULT_HOUSEHOLD } from "@/data/seed/household";
import { generateWeek } from "@/domain/rotation";
import { aggregateShopping, type ShoppingItem } from "@/domain/shopping";
import { resolveSlot, resolveDish } from "@/domain/dish";

// Phase 1 data source: the typed seed, in-memory. When Postgres is wired the
// repo layer swaps in here without touching domain or UI.
const commodities = (id: string) => COMMODITY_BY_ID[id];
// B0 baseline; household B1 forks live in component state and override via resolveDish.
const repertoire: Dish[] = REPERTOIRE;

interface StoreValue {
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
  // UI-3/5: favorites + fork (B1)
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  favoriteDishes: Dish[];
  forkDish: (id: string) => void;
  isForked: (id: string) => boolean;
  // UI-7: quick notes (THẬT-nhẹ)
  userNotes: { id: number; text: string }[];
  addNote: (text: string) => void;
  deleteNote: (id: number) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [household, setHousehold] = useState<Household>(DEFAULT_HOUSEHOLD);
  const [seed, setSeed] = useState(1);
  const [manualPlan, setManualPlan] = useState<WeekPlan | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [b1, setB1] = useState<Dish[]>([]); // household forks (B1 ⊳ B0)
  const [userNotes, setUserNotes] = useState<{ id: number; text: string }[]>([]);
  const noteId = useRef(1);

  // Resolve a dish id through the override: B1 fork wins over B0 (Blueprint §2).
  const resolve = useCallback((id: string) => resolveDish(id, REPERTOIRE, b1) ?? REPERTOIRE_BY_ID[id], [b1]);

  // Generate a plan from the seed unless the user hand-edited slots.
  const generated = useMemo(() => {
    const locked = manualPlan?.slots.filter((s) => s.locked);
    const res = generateWeek({ household, repertoire, weekStart: "2026-07-27", seed, locked });
    return res;
  }, [household, seed, manualPlan]);

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
    return aggregateShopping(plan, resolve, commodities, household, prev);
  }, [plan, household, checked, resolve]);

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

  const optionsFor = useCallback((slot: Slot) => resolveSlot(slot, repertoire, b1), [b1]);

  const updateHousehold = useCallback((patch: Partial<Household>) => {
    setHousehold((h) => ({ ...h, ...patch }));
  }, []);

  const addNote = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    setUserNotes((n) => [{ id: noteId.current++, text: t }, ...n]);
  }, []);
  const deleteNote = useCallback((id: number) => setUserNotes((n) => n.filter((x) => x.id !== id)), []);

  // ── Favorites (B1-lite): keyed by dish id shown on the card ──
  const isFavorite = useCallback((id: string) => Boolean(favorites[id]), [favorites]);
  const toggleFavorite = useCallback((id: string) => setFavorites((f) => ({ ...f, [id]: !f[id] })), []);
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

  const value: StoreValue = {
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
    isFavorite,
    toggleFavorite,
    favoriteDishes,
    forkDish,
    isForked,
    userNotes,
    addNote,
    deleteNote,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
