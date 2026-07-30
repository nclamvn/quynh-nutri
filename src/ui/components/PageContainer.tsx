import type { ReactNode } from "react";

/** One balanced canvas owns every authenticated route's origin and gutter. */
export function PageContainer({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div data-page-frame className="w-full px-5 pb-28 pt-4 lg:px-8 lg:pb-12 lg:pt-7 2xl:px-10">
      <div data-page-content className={`mx-auto w-full max-w-[1440px] ${className}`}>
        {children}
      </div>
    </div>
  );
}
