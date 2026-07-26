"use client";

import { ThemeProvider } from "./theme";
import { I18nProvider } from "@/i18n/context";
import { StoreProvider } from "./store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <StoreProvider>{children}</StoreProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
