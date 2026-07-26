import type { ReactNode } from "react";

/**
 * One shared page container so every screen shares Overview's width + padding
 * rhythm instead of the old cramped `max-w-2xl` (448px). `wide` matches Overview.
 */
export function PageContainer({
  size = "wide",
  className = "",
  children,
}: {
  size?: "wide" | "full" | "narrow";
  className?: string;
  children: ReactNode;
}) {
  const max = size === "full" ? "max-w-7xl" : size === "narrow" ? "max-w-3xl" : "max-w-6xl";
  return <div className={`mx-auto w-full ${max} px-4 py-4 lg:px-8 lg:py-6 ${className}`}>{children}</div>;
}
