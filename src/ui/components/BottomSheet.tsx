"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal>
      <button aria-label="Đóng" className="animate-fade absolute inset-0 bg-[var(--overlay-scrim,rgba(30,21,27,0.42))] backdrop-blur-[2px]" onClick={onClose} />
      <div className="glass animate-sheet relative z-10 w-full max-w-md rounded-t-[26px] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[var(--shadow-lg)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink/20" />
        {title && <h2 className="mb-3 text-base font-semibold">{title}</h2>}
        <div className="max-h-[65dvh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
