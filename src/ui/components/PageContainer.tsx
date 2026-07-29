import type { ReactNode } from "react";

/**
 * One outer frame owns every route's left origin and gutter. Width variants
 * constrain the inner content only; they never re-center the page.
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
  const max =
    size === "full"
      ? "max-w-[1280px]"
      : size === "narrow"
        ? "max-w-[760px]"
        : "max-w-[1184px]";

  return (
    <div data-page-frame className="w-full px-5 pb-28 pt-5 lg:px-8 lg:pb-12 lg:pt-7 2xl:px-10">
      <div data-page-content className={`w-full ${max} ${className}`}>
        {children}
      </div>
    </div>
  );
}
