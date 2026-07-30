import { StoreProvider } from "@/ui/store";
import { AppShell } from "@/ui/components/AppShell";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isE2EMode } from "@/lib/auth";

// Household state lives here (not root) – only the authenticated app needs it, so
// the public landing/sign-in never mount it.
export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  const e2e = isE2EMode();
  if (!e2e) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
  }
  const content = (
    <StoreProvider>
      <AppShell>{children}</AppShell>
    </StoreProvider>
  );
  return e2e ? content : (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      {content}
    </ClerkProvider>
  );
}
