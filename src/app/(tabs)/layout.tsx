import { StoreProvider } from "@/ui/store";
import { AppShell } from "@/ui/components/AppShell";

// Household state lives here (not root) — only the authenticated app needs it, so
// the public landing/sign-in never mount it.
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AppShell>{children}</AppShell>
    </StoreProvider>
  );
}
