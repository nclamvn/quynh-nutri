"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import type { Dish } from "@/domain/types";
import { dishPhoto, dishSvg } from "@/ui/dish-image";

type ThumbDish = Pick<Dish, "id" | "slot" | "proteinType" | "method">;

/**
 * Rounded dish image. Real photo primary; falls back to the internal SVG on
 * error (missing photo) → never a broken/empty cell. `shape` = circle (grids,
 * rail) or rounded (cards, detail — shows more of the photo, more premium).
 */
export function DishThumb({
  dish,
  size = 44,
  shape = "circle",
  className = "",
}: {
  dish: ThumbDish | undefined;
  size?: number;
  shape?: "circle" | "rounded";
  className?: string;
}) {
  const radius = shape === "circle" ? "rounded-full" : "rounded-[14px]";
  const photo = dish ? dishPhoto(dish) : "";
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photo]); // reset fallback when the dish changes

  if (!dish) {
    return <span className={`inline-block shrink-0 bg-surface ${radius} ${className}`} style={{ width: size, height: size }} aria-hidden />;
  }
  return (
    <img
      src={failed ? dishSvg(dish) : photo}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`shrink-0 bg-surface object-cover ring-1 ring-hairline/70 dark:brightness-[0.92] ${radius} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
