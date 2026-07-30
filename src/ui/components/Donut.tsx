"use client";

import { useEffect, useState } from "react";

export interface DonutSegment {
  color: string; // CSS color (chart token)
  on: boolean; // present → full opacity; absent → faded
  label?: string;
}

/**
 * Multi-segment ring – one arc per food group, coloured by its chart token,
 * BRIGHT if that group is present / faded if not. This gives the mock's colourful
 * donut HONESTLY: it's qualitative presence (R-NUT-4), not a fabricated per-group
 * %. Center stays "4/4 · nhóm có mặt" (denominator precedent intact).
 */
export function Donut({
  segments,
  label,
  sublabel,
  size = 96,
  stroke = 10,
}: {
  segments: DonutSegment[];
  label: string;
  sublabel?: string;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const n = segments.length;
  const gapDeg = 6;
  const segDeg = 360 / n - gapDeg;
  const segLen = (segDeg / 360) * c;
  const allOn = segments.every((s) => s.on);
  // Draw arcs in on mount (cosmetic – presence is still shown by opacity).
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {segments.map((s, i) => {
          const rot = (i * 360) / n + gapDeg / 2;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${segLen} ${c - segLen}`}
              strokeDashoffset={drawn ? 0 : segLen}
              transform={`rotate(${rot} ${size / 2} ${size / 2})`}
              style={{
                opacity: s.on ? 1 : 0.16,
                transition: `opacity var(--dur-normal) var(--ease-standard), stroke-dashoffset var(--dur-slow) var(--ease-emphasized) ${i * 80}ms`,
              }}
            />
          );
        })}
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="tnum text-lg font-semibold" style={{ color: allOn ? "var(--accent)" : "var(--ink)" }}>
          {label}
        </span>
        {sublabel && <span className="mt-0.5 text-[9px] text-muted">{sublabel}</span>}
      </div>
    </div>
  );
}
