/** Q's Kitchen mark — a 5-petal rose blossom. */
export function FlowerLogo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="16"
          cy="9"
          rx="4.6"
          ry="7"
          fill="currentColor"
          opacity="0.9"
          transform={`rotate(${deg} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="4" fill="var(--qs-center, #fff2c2)" />
    </svg>
  );
}
