import { Sidebar } from "./Sidebar";
import { RightRail } from "./RightRail";
import { TabBar } from "./TabBar";
import { SWRegister } from "./SWRegister";
import { MobileTopBar } from "./MobileTopBar";
import { AssistantSheet } from "./AssistantSheet";
import { AmbientBackground } from "./AmbientBackground";

/**
 * Responsive app shell (Blueprint §4–5).
 *   ≥1280px: Sidebar 240 │ Main (centered column) │ contextual Right rail 292
 *   <1024px: single column + bottom TabBar (mobile-first preserved)
 * Global chrome (brand, household, sync, theme) lives in the sidebar so it never
 * duplicates the per-page sticky headers.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <AmbientBackground />
      <SWRegister />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 flex-1">
          <main className="min-w-0 flex-1">
            <MobileTopBar />
            {children}
          </main>
          <RightRail />
        </div>
        <TabBar />
      </div>
      <AssistantSheet />
    </div>
  );
}
