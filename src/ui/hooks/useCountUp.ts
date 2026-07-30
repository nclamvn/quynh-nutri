"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animate a number counting up to `target` on mount / when it changes. Purely a
 * display flourish – the value passed in is the already-computed honest number;
 * this never rounds, reformats, or invents it (caller formats the returned value).
 * Respects prefers-reduced-motion (jumps straight to target).
 */
export function useCountUp(target: number, durationMs = 750): number {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !Number.isFinite(target) || target === 0) {
      const raf = requestAnimationFrame(() => {
        setValue(target);
        fromRef.current = target;
      });
      return () => cancelAnimationFrame(raf);
    }
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
