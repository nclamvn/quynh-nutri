"use client";

import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { FlowerLogo } from "./FlowerLogo";
import { RichText } from "./RichText";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Lên thực đơn tuần cho nhà mình",
  "Bữa Thứ 2 đủ chất chưa?",
  "Nấu gì với đồ đang có?",
  "Hết tôm, thay món gì?",
];
const STORE_KEY = "qk-chat";

/**
 * AI kitchen assistant. Opened via a global 'open-assistant' event. Streams the
 * reply token-by-token (chữ chảy dần). Conversation persists to localStorage so
 * it survives reload (basic memory; DB-backed cross-device is a next step).
 * Numbers come from server-side tools, never the model.
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

  // Restore prior conversation on mount.
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORE_KEY);
      if (s) setMessages(JSON.parse(s));
    } catch {}
  }, []);
  // Persist when an exchange finishes (not on every stream chunk).
  useEffect(() => {
    if (!busy && messages.length) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(messages)); } catch {}
    }
  }, [busy, messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const history = [...messages, { role: "user" as const, content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) throw new Error("stream");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((m) => {
          const c = [...m];
          c[c.length - 1] = { role: "assistant", content: acc };
          return c;
        });
      }
    } catch {
      setMessages((m) => {
        const c = [...m];
        c[c.length - 1] = { role: "assistant", content: "Xin lỗi, có lỗi kết nối." };
        return c;
      });
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setMessages([]);
    try { localStorage.removeItem(STORE_KEY); } catch {}
  };

  const lastStreaming = busy && messages[messages.length - 1]?.role === "assistant";

  return (
    <BottomSheet open={open} onClose={() => setOpen(false)}>
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="text-brand"><FlowerLogo size={20} /></span>
          <h2 className="text-base font-semibold">Trợ lý bếp</h2>
        </div>
        {messages.length > 0 && (
          <button onClick={clear} className="text-xs text-muted active:text-danger">Xoá</button>
        )}
      </div>

      <div ref={listRef} className="max-h-[50dvh] space-y-3 overflow-y-auto py-2">
        {messages.length === 0 && (
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted">Hỏi tôi về thực đơn, dinh dưỡng, đi chợ hay đồ trong kho.</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-hairline px-3 py-1.5 text-xs text-muted active:bg-surface">{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm ${m.role === "user" ? "whitespace-pre-wrap bg-brand text-white" : "bg-surface"}`}>
              {m.role === "user" ? m.content : m.content ? <RichText text={m.content} /> : <span className="text-muted">…</span>}
            </div>
          </div>
        ))}
        {lastStreaming && messages[messages.length - 1].content === "" && (
          <p className="px-1 text-[11px] text-muted">⚙ đang tra cứu dữ liệu…</p>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-1 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhắn cho trợ lý…"
          className="min-w-0 flex-1 rounded-full border border-hairline bg-surface/40 px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        <button type="submit" disabled={busy || !input.trim()} className="cta-primary shrink-0 rounded-full px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40">Gửi</button>
      </form>
      <p className="mt-1.5 text-center text-[10px] text-muted">Số liệu dinh dưỡng lấy từ engine của app, không do AI tạo ra.</p>
    </BottomSheet>
  );
}
