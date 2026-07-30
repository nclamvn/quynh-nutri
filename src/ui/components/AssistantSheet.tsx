"use client";

import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { FlowerLogo } from "./FlowerLogo";
import { RichText } from "./RichText";
import { Skeleton } from "./Skeleton";
import { useStore } from "@/ui/store";
import type {
  AssistantWeekPlanProposal,
} from "@/domain/assistant/week-plan-proposal";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Tôi nên làm gì tiếp trong bếp?",
  "Lên thực đơn tuần cho nhà mình",
  "Bữa Thứ 2 đủ chất chưa?",
  "Nấu gì với đồ đang có?",
  "Hết tôm, thay món gì?",
];
const STORE_KEY = "qk-chat";
const DAY_LABELS = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật",
];
const SLOT_LABELS = {
  COM: "Cơm",
  MAN: "Mặn",
  RAU: "Rau",
  CANH: "Canh",
  TRANGMIENG: "Tráng miệng",
} as const;
const OCCASION_LABELS = {
  breakfast: "Bữa sáng",
  lunch: "Bữa trưa",
  dinner: "Bữa tối",
  snack: "Bữa phụ",
} as const;

/**
 * AI kitchen assistant. Opened via a global 'open-assistant' event. Streams the
 * reply token-by-token (chữ chảy dần). Conversation persists to localStorage so
 * it survives reload (basic memory; DB-backed cross-device is a next step).
 * Numbers come from server-side tools, never the model.
 */
export function AssistantSheet() {
  const {
    household,
    dish,
    applyAssistantWeekPlanProposal,
  } = useStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(false);
  const [proposal, setProposal] =
    useState<AssistantWeekPlanProposal | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const proposalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onOpen = (event: Event) => {
      try {
        const saved = localStorage.getItem(`${STORE_KEY}:${household.id}`);
        setMessages(saved ? JSON.parse(saved) : []);
      } catch {
        setMessages([]);
      }
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt;
      if (prompt) setInput(prompt);
      setOpen(true);
    };
    window.addEventListener("open-assistant", onOpen);
    return () => window.removeEventListener("open-assistant", onOpen);
  }, [household.id]);
  // Persist when an exchange finishes (not on every stream chunk).
  useEffect(() => {
    if (!busy && messages.length) {
      try { localStorage.setItem(`${STORE_KEY}:${household.id}`, JSON.stringify(messages)); } catch {}
    }
  }, [busy, messages, household.id]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy]);

  useEffect(() => {
    if (!proposal) return;
    requestAnimationFrame(() => {
      proposalRef.current?.scrollIntoView({ block: "start" });
    });
  }, [proposal]);

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
      if (!res.ok) throw new Error("assistant");
      if (res.headers.get("content-type")?.includes("application/json")) {
        const payload = await res.json() as {
          type: "week-plan-proposal" | "proposal-unavailable";
          message: string;
          proposal?: AssistantWeekPlanProposal;
        };
        setProposal(
          payload.type === "week-plan-proposal" && payload.proposal
            ? payload.proposal
            : null,
        );
        setMessages((current) => {
          const next = [...current];
          next[next.length - 1] = {
            role: "assistant",
            content: payload.message,
          };
          return next;
        });
        return;
      }
      if (!res.body) throw new Error("stream");
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
    setProposal(null);
    try { localStorage.removeItem(`${STORE_KEY}:${household.id}`); } catch {}
  };

  const discardProposal = () => {
    setProposal(null);
    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content: "Đã bỏ đề xuất. Thực đơn hiện tại không thay đổi.",
      },
    ]);
  };

  const confirmProposal = async () => {
    if (!proposal || applying) return;
    setApplying(true);
    try {
      const result = await applyAssistantWeekPlanProposal({
        proposalId: proposal.id,
        kind: proposal.kind,
        weekStart: proposal.weekStart,
        baseVersion: proposal.baseVersion,
        seed: proposal.seed,
        slots: proposal.slots,
        confirmedByUser: true,
      });
      setProposal(null);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.ok
            ? "Đã áp dụng đúng phương án bạn vừa xác nhận."
            : "Thực đơn đã thay đổi ở nơi khác nên đề xuất này không được áp dụng. Tôi không tự ghi đè.",
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Chưa thể áp dụng đề xuất. Không có thay đổi nào được ghi.",
        },
      ]);
    } finally {
      setApplying(false);
    }
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
              {m.role === "user" ? (
                m.content
              ) : m.content ? (
                <RichText text={m.content} />
              ) : (
                <div className="flex w-40 flex-col gap-1.5 py-0.5">
                  <Skeleton className="h-2.5 w-full" />
                  <Skeleton className="h-2.5 w-4/5" />
                </div>
              )}
            </div>
          </div>
        ))}
        {proposal && (
          <article
            ref={proposalRef}
            data-testid="assistant-week-plan-proposal"
            className="overflow-hidden rounded-[20px] border border-brand/30 bg-surface shadow-[0_18px_50px_rgba(0,0,0,0.16)]"
          >
            <div className="border-b border-hairline px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
                Đề xuất chờ xác nhận
              </p>
              <h3 className="mt-1 text-sm font-semibold">
                Thay đổi thực đơn tuần
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Chưa có thay đổi nào được áp dụng. Kiểm tra từng dòng trước khi
                xác nhận.
              </p>
            </div>
            <div className="max-h-64 divide-y divide-hairline overflow-y-auto">
              {proposal.changes.map((change) => (
                <div
                  key={`${change.day}:${change.occasion}:${change.slot}`}
                  data-day={change.day}
                  data-occasion={change.occasion}
                  data-slot={change.slot}
                  className="px-4 py-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                    {DAY_LABELS[change.day]} · {OCCASION_LABELS[change.occasion]} · {SLOT_LABELS[change.slot]}
                  </p>
                  <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
                    <span
                      data-testid="proposal-before"
                      className="min-w-0 truncate rounded-lg bg-canvas px-2.5 py-2 text-muted line-through"
                    >
                      {change.beforeDishId
                        ? dish(change.beforeDishId)?.vnName
                          ?? change.beforeDishId
                        : "Chưa có món"}
                    </span>
                    <span aria-hidden="true" className="text-brand">→</span>
                    <span
                      data-testid="proposal-after"
                      className="min-w-0 truncate rounded-lg bg-brand-weak px-2.5 py-2 font-medium text-brand"
                    >
                      {change.afterDishId
                        ? dish(change.afterDishId)?.vnName
                          ?? change.afterDishId
                        : "Bỏ món"}
                    </span>
                  </div>
                  {change.memoryReasons && change.memoryReasons.length > 0 && (
                    <p className="mt-2 text-[11px] leading-relaxed text-muted">
                      {change.memoryReasons.map((reason) => {
                        if (reason === "explicit_repeat") {
                          return "Gia đình từng chọn muốn ăn lại";
                        }
                        if (reason === "explicit_avoid") {
                          return "Có phản hồi không hợp nhà, nhưng ràng buộc tuần được ưu tiên";
                        }
                        return "Cân nhắc công chuẩn bị vào ngày bận";
                      }).join(" · ")}
                      {change.memoryEvidenceCount
                        ? ` · ${change.memoryEvidenceCount} phản hồi đã xác nhận`
                        : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {proposal.notes.length > 0 && (
              <div className="border-t border-hairline px-4 py-3 text-[11px] leading-relaxed text-amber">
                {proposal.notes.map((note) => (
                  <p key={note}>Lưu ý: {note}</p>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 border-t border-hairline p-3">
              <button
                type="button"
                onClick={discardProposal}
                disabled={applying}
                className="rounded-full border border-hairline px-3 py-2.5 text-xs font-semibold text-muted disabled:opacity-45"
              >
                Bỏ đề xuất
              </button>
              <button
                type="button"
                onClick={confirmProposal}
                disabled={applying}
                className="cta-primary rounded-full px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-45"
              >
                {applying ? "Đang áp dụng…" : "Xác nhận áp dụng"}
              </button>
            </div>
          </article>
        )}
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
