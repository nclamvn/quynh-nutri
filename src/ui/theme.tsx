"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";
interface ThemeValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    // Mirror whatever the pre-paint script already applied.
    setThemeState(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const apply = useCallback((t: Theme) => {
    setThemeState(t);
    const root = document.documentElement;
    root.classList.toggle("dark", t === "dark");
    try {
      localStorage.setItem("theme", t);
    } catch {}
  }, []);

  const toggle = useCallback(() => apply(theme === "dark" ? "light" : "dark"), [theme, apply]);

  return <ThemeContext.Provider value={{ theme, toggle, setTheme: apply }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
