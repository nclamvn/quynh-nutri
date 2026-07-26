import type { ReactNode } from "react";

/**
 * One shared page header. Mobile: the familiar sticky bordered bar (so filter /
 * selector chips stay pinned while scrolling long lists). Desktop (lg+): Overview's
 * airy, borderless title block with an optional live-context subtitle. Pass `sticky`
 * only on list-heavy pages; `children` holds filter/segment rows.
 */
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
    ? "sticky top-0 z-10 -mx-4 border-b border-hairline bg-bg/85 px-4 py-3 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none "
    : "";
  return (
    <header className={`${stickyCls}mb-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold -tracking-[0.02em] lg:text-[28px]">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </header>
  );
}
