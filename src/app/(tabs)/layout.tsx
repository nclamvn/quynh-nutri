import { StoreProvider } from "@/ui/store";
import { AppShell } from "@/ui/components/AppShell";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isE2EMode } from "@/lib/auth";

// Household state lives here (not root) — only the authenticated app needs it, so
// the public landing/sign-in never mount it.
export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  if (!isE2EMode()) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
  }
  return (
    <StoreProvider>
      <AppShell>{children}</AppShell>
    </StoreProvider>
  );
}
