type P = { className?: string };
const base = (p: P) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: p.className,
});

export const StoreIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 4h16l1 5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0L3 9Z" />
    <path d="M5 12v7a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7" />
    <path d="M10 20.5v-4.5h4v4.5" />
  </svg>
);

export const HealthIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20.5 8.5a4.5 4.5 0 0 0-8-2.8A4.5 4.5 0 0 0 3.5 8.5c0 4.2 5.6 7.9 8.5 9.9 2.9-2 8.5-5.7 8.5-9.9Z" />
    <path d="M8 11h2.2l1 2 1.6-3.4 1 1.4H16" />
  </svg>
);

export const CalendarIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
  </svg>
);
export const BasketIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 8h14l-1.2 11a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" />
    <path d="M9 8 12 3l3 5M9.5 12v4M14.5 12v4" />
  </svg>
);
export const BowlIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 11h18a9 9 0 0 1-18 0Z" />
    <path d="M12 11c0-3 2-4 2-6M8 11c0-2 1-3 1-4.5" />
  </svg>
);
export const ChartIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20V4M4 20h16" />
    <path d="M8 20v-6M12 20V9M16 20v-9M20 20v-4" />
  </svg>
);
export const GearIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.5v2.5M12 19v2.5M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M2.5 12H5M19 12h2.5M4.5 19.5l1.8-1.8M17.7 6.3l1.8-1.8" />
  </svg>
);
export const OverviewIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </svg>
);
export const ReportIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </svg>
);
export const HeartIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20s-7-4.4-7-9.3A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 7 2.7c0 4.9-7 9.3-7 9.3Z" />
  </svg>
);
export const NoteIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 4h16v13l-4 4H4z" />
    <path d="M20 17h-4v4M8 9h8M8 13h5" />
  </svg>
);
export const SunIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
  </svg>
);
export const MoonIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5Z" />
  </svg>
);
