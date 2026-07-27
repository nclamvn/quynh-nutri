"use client";

import { ThemeProvider } from "./theme";
import { I18nProvider } from "@/i18n/context";

// Root-level providers only — theme + i18n wrap EVERY route (incl. the public
// landing / sign-in). StoreProvider (which hydrates household state from Neon) is
// mounted in the (tabs) layout instead, so public pages never fire that server
// action or carry app state.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  );
}
