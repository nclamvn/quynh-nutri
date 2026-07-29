import type { ReactNode } from "react";

/** Shared title, action and filter grammar for every signed-in route. */
export function PageHeader({
  title,
  subtitle,
  actions,
  children,
  sticky = false,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children?: ReactNode;
  sticky?: boolean;
}) {
  const stickyCls = sticky
    ? "sticky top-0 z-10 -mx-5 border-b border-hairline bg-bg/90 px-5 py-3 backdrop-blur-xl lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none "
    : "";
  return (
    <header className={`${stickyCls}mb-6 lg:mb-8`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[26px] font-semibold leading-none -tracking-[0.035em] lg:text-[32px]">
            {title}
          </h1>
          {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{subtitle}</p>}
        </div>
        {actions && (
          <div data-page-actions className="page-actions flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {actions}
          </div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}
