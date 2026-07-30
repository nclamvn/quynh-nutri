"use client";

import { useEffect, useRef, useState } from "react";
import type { ToastTone } from "@/ui/toast";

interface Item { id: number; message: string; tone: ToastTone }

/** Minimal toast stack – surfaces errors/info that were previously swallowed. */
export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);
  const nextId = useRef(1);

  useEffect(() => {
    const onToast = (e: Event) => {
      const { message, tone } = (e as CustomEvent<{ message: string; tone: ToastTone }>).detail;
      const id = nextId.current++;
      setItems((xs) => [...xs, { id, message, tone }]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4200);
    };
    window.addEventListener("qk-toast", onToast);
    return () => window.removeEventListener("qk-toast", onToast);
  }, []);

  if (items.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6">
      {items.map((it) => (
        <div
          key={it.id}
          role="status"
          className={`glass-modal pointer-events-auto animate-sheet flex max-w-sm items-start gap-2 rounded-[14px] px-4 py-2.5 text-sm shadow-[var(--shadow-lg)] ${
            it.tone === "error" ? "text-danger" : "text-ink"
          }`}
        >
          <span aria-hidden className="mt-px shrink-0">{it.tone === "error" ? "⚠" : "ⓘ"}</span>
          <span>{it.message}</span>
        </div>
      ))}
    </div>
  );
}
