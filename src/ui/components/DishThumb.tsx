/* eslint-disable @next/next/no-img-element */
import type { Dish } from "@/domain/types";
import { dishImage } from "@/ui/dish-image";

/** Rounded dish illustration (internal SVG). Decorative → empty alt. */
export function DishThumb({
  dish,
  size = 44,
  className = "",
}: {
  dish: Pick<Dish, "id" | "slot" | "proteinType"> | undefined;
  size?: number;
  className?: string;
}) {
  if (!dish) {
    return (
      <span
        className={`inline-block shrink-0 rounded-full bg-surface ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }
  return (
    <img
      src={dishImage(dish)}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-full bg-surface object-cover ring-1 ring-hairline dark:brightness-[0.9] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
