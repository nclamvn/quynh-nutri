"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { Dish } from "@/domain/types";
import { dishPhoto, dishSvg } from "@/ui/dish-image";

type ThumbDish = Pick<Dish, "id" | "slot" | "proteinType" | "method">;

/**
 * Rounded dish image. Real photo primary; falls back to the internal SVG on
 * error (missing photo) → never a broken/empty cell. `shape` = circle (grids,
 * rail) or rounded (cards, detail – shows more of the photo, more premium).
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

  if (!dish) {
    return <span className={`inline-block shrink-0 bg-surface ${radius} ${className}`} style={{ width: size, height: size }} aria-hidden />;
  }
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden bg-surface ring-1 ring-hairline/70 ${radius} ${className}`}
      style={{ width: size, height: size }}
    >
      <DishImage key={photo} dish={dish} photo={photo} />
    </span>
  );
}

function DishImage({ dish, photo }: { dish: ThumbDish; photo: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed ? dishSvg(dish) : photo}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.06] dark:brightness-[0.92]"
    />
  );
}
