import type { ReactNode } from "react";

/** Shared title, action and filter grammar for every signed-in route. */
export function PageHeader({
  title,
  subtitle,
  actions,
  children,
  sticky = false,
  mobileActions = "below",
  hideSubtitleOnMobile = false,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children?: ReactNode;
  sticky?: boolean;
  mobileActions?: "below" | "inline";
  hideSubtitleOnMobile?: boolean;
}) {
  const stickyCls = sticky
    ? "sticky top-0 z-10 -mx-5 border-b border-hairline bg-bg/90 px-5 py-1.5 backdrop-blur-xl lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none "
    : "";
  const rowClass = mobileActions === "inline"
    ? "flex items-start justify-between gap-3"
    : "flex flex-col gap-3 md:flex-row md:items-end md:justify-between";
  const actionsClass = mobileActions === "inline"
    ? "page-actions flex shrink-0 flex-wrap items-center justify-end gap-2"
    : "page-actions -mx-1 flex w-[calc(100%+0.5rem)] flex-nowrap items-center gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:w-auto md:flex-wrap md:justify-end md:overflow-visible md:px-0 md:pb-0";
  return (
    <header data-page-header className={`${stickyCls}mb-4 lg:mb-8`}>
      <div className={rowClass}>
        <div className="min-w-0">
          <h1
            data-page-title
            className="text-[24px] font-semibold leading-[1.08] -tracking-[0.035em] lg:text-[32px] lg:leading-none"
          >
            {title}
          </h1>
          {subtitle && (
            <p className={`mt-1.5 max-w-2xl text-[13px] leading-snug text-muted lg:mt-2 lg:text-sm lg:leading-relaxed ${
              hideSubtitleOnMobile ? "hidden lg:block" : ""
            }`}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div data-page-actions className={actionsClass}>
            {actions}
          </div>
        )}
      </div>
      {children && <div className="mt-3 lg:mt-4">{children}</div>}
    </header>
  );
}
