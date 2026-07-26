"use client";

import { useEffect, useRef, useId } from "react";

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // lock background scroll

    // Move focus into the sheet.
    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    (focusables()[0] ?? panelRef.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) { e.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevActive?.focus?.(); // restore focus to the trigger
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined}>
      <button aria-label="Đóng" className="animate-fade absolute inset-0 bg-[var(--overlay-scrim,rgba(30,21,27,0.5))] backdrop-blur-md" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="glass-modal animate-sheet relative z-10 w-full max-w-md rounded-t-[26px] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[var(--shadow-lg)] outline-none"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink/20" />
        {title && <h2 id={titleId} className="mb-3 text-base font-semibold">{title}</h2>}
        <div className="max-h-[65dvh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
