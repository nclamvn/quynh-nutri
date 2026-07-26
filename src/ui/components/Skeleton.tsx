/** Shimmer placeholder for load states so first paint feels premium, not empty. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-[12px] bg-surface/60 ${className}`} aria-hidden />;
}
