"use client";

import { createContext, useContext } from "react";
import { ThemeProvider } from "./theme";
import { I18nProvider } from "@/i18n/context";

const RuntimeContext = createContext({ e2e: false });

// Root-level providers only — theme + i18n wrap EVERY route (incl. the public
// landing / sign-in). StoreProvider (which hydrates household state from Neon) is
// mounted in the (tabs) layout instead, so public pages never fire that server
// action or carry app state.
export function Providers({ children, e2e = false }: { children: React.ReactNode; e2e?: boolean }) {
  return (
    <RuntimeContext.Provider value={{ e2e }}>
      <ThemeProvider>
        <I18nProvider>{children}</I18nProvider>
      </ThemeProvider>
    </RuntimeContext.Provider>
  );
}

export function useRuntime() {
  return useContext(RuntimeContext);
}
