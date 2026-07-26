"use client";

/**
 * Single-value ring. The filled fraction is a REAL metric (e.g. % of core food
 * groups present) — no fabricated multi-segment breakdown (L-1). Colour carries
 * adequacy meaning: accent (botanical) when good, honey when short (never red).
 */
export function Donut({
  value,
  label,
  sublabel,
  tone = "accent",
  size = 92,
  stroke = 9,
}: {
  value: number; // 0..100
  label: string;
  sublabel?: string;
  tone?: "accent" | "amber";
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;
  const color = tone === "accent" ? "var(--accent)" : "var(--amber)";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="tnum text-lg font-semibold" style={{ color }}>
          {label}
        </span>
        {sublabel && <span className="mt-0.5 text-[9px] text-muted">{sublabel}</span>}
      </div>
    </div>
  );
}
