import {
  CalendarIcon, BasketIcon, BowlIcon, ChartIcon, GearIcon,
  OverviewIcon, ReportIcon, HeartIcon, NoteIcon, HealthIcon, StoreIcon,
  PantryIcon,
} from "./components/icons";

export type NavItem = { href: string; key: string; icon: (p: { className?: string }) => React.ReactElement };

/**
 * Single source of nav — Sidebar (desktop) and MobileMenu (bottom sheet) both
 * render from this, so the two never drift. Every app area is reachable here;
 * the four-item mobile TabBar remains the compact daily-use shortcut.
 */
export const NAV_GROUPS: { group: string; items: NavItem[] }[] = [
  {
    group: "group.main",
    items: [
      { href: "/overview", key: "nav.overview", icon: OverviewIcon },
      { href: "/health", key: "nav.health", icon: HealthIcon },
      { href: "/week", key: "nav.week", icon: CalendarIcon },
      { href: "/shopping", key: "nav.shopping", icon: BasketIcon },
      { href: "/pantry", key: "nav.pantry", icon: PantryIcon },
      { href: "/suppliers", key: "nav.suppliers", icon: StoreIcon },
      { href: "/dishes", key: "nav.dishes", icon: BowlIcon },
      { href: "/nutrition", key: "nav.nutrition", icon: ChartIcon },
    ],
  },
  {
    group: "group.track",
    items: [
      { href: "/reports", key: "nav.reports", icon: ReportIcon },
      { href: "/favorites", key: "nav.favorites", icon: HeartIcon },
      { href: "/notes", key: "nav.notes", icon: NoteIcon },
    ],
  },
  { group: "group.system", items: [{ href: "/settings", key: "nav.settings", icon: GearIcon }] },
];
