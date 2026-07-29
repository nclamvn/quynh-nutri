"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "qk-local-storage";

export function useLocalStorageValue(key: string, fallback = ""): [string, (value: string | null) => void] {
  const subscribe = useCallback((notify: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) notify();
    };
    const onLocal = (event: Event) => {
      if ((event as CustomEvent<string>).detail === key) notify();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(EVENT, onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVENT, onLocal);
    };
  }, [key]);

  const getSnapshot = useCallback(() => localStorage.getItem(key) ?? fallback, [key, fallback]);
  const getServerSnapshot = useCallback(() => fallback, [fallback]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback((next: string | null) => {
    try {
      if (next === null) localStorage.removeItem(key);
      else localStorage.setItem(key, next);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
    } catch {}
  }, [key]);

  return [value, setValue];
}
