"use client";

import { createContext, useContext, useCallback } from "react";
import vn from "./vn.json";
import en from "./en.json";
import { useLocalStorageValue } from "@/ui/hooks/useLocalStorageValue";

export type Lang = "vi" | "en";
type Dict = Record<string, string>;
const DICTS: Record<Lang, Dict> = { vi: vn, en };

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [storedLang, setStoredLang] = useLocalStorageValue("lang", "vi");
  const lang: Lang = storedLang === "en" ? "en" : "vi";

  const setLang = useCallback((l: Lang) => {
    setStoredLang(l);
  }, [setStoredLang]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      // VN is canonical; fall back to VN, then the key itself.
      let s = DICTS[lang][key] ?? DICTS.vi[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
      return s;
    },
    [lang],
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
