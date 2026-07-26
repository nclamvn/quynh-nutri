"use client";

import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { FlowerLogo } from "./FlowerLogo";
import { RichText } from "./RichText";

type Msg = { role: "user" | "assistant"; content: string; tools?: string[] };

const SUGGESTIONS = [
  "Lên thực đơn tuần cho nhà mình",
  "Bữa Thứ 2 đủ chất chưa?",
  "Nấu gì với đồ đang có?",
  "Hết tôm, thay món gì?",
];

/**
 * AI kitchen assistant. Opened via a global 'open-assistant' event (no floating
 * launcher → no collision with the dishes FAB). Non-streaming v1: posts history,
 * appends the reply. Numbers come from tools (server), never the model.
 */
export function AssistantSheet() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("open-assistant", onOpen);
    return () => window.removeEventListener("open-assistant", onOpen);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.text ?? data.error ?? "…", tools: data.toolsUsed }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Xin lỗi, có lỗi kết nối." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={() => setOpen(false)}>
      <div className="flex items-center gap-2 pb-1">
        <span className="text-brand"><FlowerLogo size={20} /></span>
        <h2 className="text-base font-semibold">Trợ lý bếp</h2>
      </div>

      <div ref={listRef} className="max-h-[52dvh] space-y-3 overflow-y-auto py-2">
        {messages.length === 0 && (
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted">Hỏi tôi về thực đơn, dinh dưỡng, đi chợ hay đồ trong kho.</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-hairline px-3 py-1.5 text-xs text-muted active:bg-surface">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm ${m.role === "user" ? "whitespace-pre-wrap bg-brand text-white" : "bg-surface"}`}>
              {m.role === "user" ? m.content : <RichText text={m.content} />}
              {m.tools && m.tools.length > 0 && (
                <p className="mt-2 border-t border-hairline pt-1.5 text-[10px] text-muted">↳ số liệu từ engine: {[...new Set(m.tools)].join(", ")}</p>
              )}
            </div>
          </div>
        ))}
        {busy && <div className="flex gap-1 px-1 text-muted"><Dot /><Dot /><Dot /></div>}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhắn cho trợ lý…"
          className="min-w-0 flex-1 rounded-full border border-hairline bg-surface/40 px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        <button type="submit" disabled={busy || !input.trim()} className="cta-primary shrink-0 rounded-full px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40">
          Gửi
        </button>
      </form>
    </BottomSheet>
  );
}

function Dot() {
  return <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-muted" />;
}
