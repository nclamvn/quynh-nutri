"use client";

import { useState } from "react";
import { useStore } from "@/ui/store";

/** Favorite toggle. Filled rose when on, with a "pop" when you favourite. Stops
 *  propagation so it works inside clickable cards without opening the card. */
export function HeartButton({ dishId, size = 20 }: { dishId: string; size?: number }) {
  const { isFavorite, toggleFavorite } = useStore();
  const on = isFavorite(dishId);
  const [pop, setPop] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!on) { setPop(false); requestAnimationFrame(() => setPop(true)); }
        toggleFavorite(dishId);
      }}
      aria-label={on ? "Bỏ yêu thích" : "Yêu thích"}
      aria-pressed={on}
      className="shrink-0 rounded-full p-1.5 text-brand transition-transform active:scale-90"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={on ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.7"
        className={pop ? "animate-pop" : ""}
        onAnimationEnd={() => setPop(false)}
      >
        <path d="M12 20s-7-4.4-7-9.3A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 7 2.7c0 4.9-7 9.3-7 9.3Z" />
      </svg>
    </button>
  );
}
