"use client";

import { useEffect, useRef, useState } from "react";

/** Fires once when the element scrolls into view – for landing reveal effects.
 *  Content is visible by default (the class only ADDS an entrance), so if JS never
 *  runs nothing is hidden. */
export function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}
