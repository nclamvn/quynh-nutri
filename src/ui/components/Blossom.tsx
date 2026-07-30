/**
 * Cherry-blossom motif – the emotional symbol (authority §2.3). ALLOWED zones
 * only: logo, empty state, hero, page/rail corners. Not scattered, not a
 * pattern. Low opacity so it whispers. Dark → line-art feel via low opacity.
 */
export function Blossom({
  size = 96,
  className = "",
  variant = "soft",
}: {
  size?: number;
  className?: string;
  variant?: "soft" | "line";
}) {
  const petals = [0, 72, 144, 216, 288];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      {/* one large blossom + a small bud for organic asymmetry */}
      <g>
        {petals.map((d) => (
          <ellipse
            key={d}
            cx="32"
            cy="16"
            rx="8.5"
            ry="13"
            transform={`rotate(${d} 32 32)`}
            fill={variant === "soft" ? "currentColor" : "none"}
            stroke={variant === "line" ? "currentColor" : "none"}
            strokeWidth="1.5"
          />
        ))}
        <circle cx="32" cy="32" r="5.5" fill="var(--amber)" opacity="0.55" />
      </g>
      <g transform="translate(46 44) scale(0.5)">
        {petals.map((d) => (
          <ellipse key={d} cx="32" cy="16" rx="8.5" ry="13" transform={`rotate(${d} 32 32)`} fill={variant === "soft" ? "currentColor" : "none"} stroke={variant === "line" ? "currentColor" : "none"} strokeWidth="2" />
        ))}
      </g>
    </svg>
  );
}
