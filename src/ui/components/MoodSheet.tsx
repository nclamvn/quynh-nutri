"use client";

import { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { DishThumb } from "./DishThumb";
import { useStore } from "@/ui/store";
import { toast } from "@/ui/toast";
import { advise, type MoodKey, type Advisory } from "@/domain/mood";
import { SUPPORT_RESOURCES, SUPPORT_GUIDANCE, POSTPARTUM_SUPPORT_NOTE } from "@/data/mood/resources";
import { REPERTOIRE } from "@/data/seed/repertoire";
import { COMMODITY_BY_ID } from "@/data/seed/commodity";
import { dishAllowed } from "@/domain/dish";
import type { Dish } from "@/domain/types";

// SAFETY: the crisis gate + dish picking run HERE (client), so the raw feeling text
// never leaves the device and a crisis input never reaches the LLM. The API is only
// called for a warm intro sentence, with the picked dish NAMES (no feeling text).

const MOODS: { key: MoodKey; label: string }[] = [
  { key: "stress", label: "Căng thẳng" },
  { key: "tired", label: "Mệt" },
  { key: "sleepless", label: "Khó ngủ" },
  { key: "low", label: "Buồn nhẹ" },
  { key: "normal", label: "Bình thường" },
];

const TIER: Record<string, { label: string; cls: string }> = {
  practical: { label: "Thực dụng", cls: "border-accent/40 bg-accent-weak text-accent" },
  comfort: { label: "An ủi", cls: "border-amber/40 bg-amber-weak text-amber" },
  research: { label: "Liên hệ nghiên cứu", cls: "border-hairline text-muted" },
};

const DISCLAIMER = "Gợi ý mang tính chăm sóc, không thay tư vấn y tế/tâm lý.";

export function MoodSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { household, dish, changeSlot } = useStore();
  const [mood, setMood] = useState<MoodKey>("stress");
  const [text, setText] = useState("");
  const [result, setResult] = useState<Advisory | null>(null);
  const [warmth, setWarmth] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSupport, setShowSupport] = useState(false); // voluntary parallel path

  const postpartum =
    household.lactatingMember ||
    (household.members ?? []).some(
      (m) => m.healthProfile?.lifeStage === "lactating_0_6" || m.healthProfile?.lifeStage === "lactating_7_12",
    );
  const isAllowed = (d: Dish) => dishAllowed(d, household, (id) => COMMODITY_BY_ID[id]);

  const run = async () => {
    const r = advise({ text, mood, postpartum }, REPERTOIRE, isAllowed);
    setResult(r);
    setWarmth(null);
    // Warm intro only for the suggest branch; NEVER on crisis (no network at all then).
    if (r.mode === "suggest" && r.suggestions.length > 0) {
      setLoading(true);
      try {
        const res = await fetch("/api/mood-advisory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mood: r.mood, dishes: r.suggestions.map((s) => ({ name: dish(s.dishId)?.vnName })) }),
        });
        const j = await res.json();
        setWarmth(typeof j.warmth === "string" ? j.warmth : null);
      } catch {
        setWarmth(null); // fall back to the rule-based note
      } finally {
        setLoading(false);
      }
    }
  };

  const reset = () => { setResult(null); setWarmth(null); setShowSupport(false); };
  const close = () => { reset(); setText(""); onClose(); };

  const addToPlan = (dishId: string) => {
    const d = dish(dishId);
    if (!d) return;
    changeSlot(0, d.slot, dishId);
    toast("Đã thêm vào thực đơn tuần – chỉnh lại trong Thực đơn nếu cần.", "info");
  };

  return (
    <BottomSheet open={open} onClose={close} title="Hôm nay bạn cần gì?">
      <div className="space-y-4">
        {!result && (
          <>
            <p className="text-sm leading-relaxed text-muted">
              Chọn tâm trạng – gợi ý bữa mang tính chăm sóc, thực dụng. {DISCLAIMER}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMood(m.key)}
                  aria-pressed={mood === m.key}
                  className={`rounded-full border px-3 py-1.5 text-sm ${mood === m.key ? "border-brand bg-brand-weak text-brand-ink" : "border-hairline text-muted"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              placeholder="Muốn nói thêm? (không bắt buộc)"
              className="w-full resize-none rounded-[12px] border border-hairline bg-raised px-3.5 py-2.5 text-sm outline-none focus:border-brand"
            />
            <button onClick={run} className="cta-primary w-full rounded-full py-2.5 text-sm font-medium text-white">
              Gợi ý bữa
            </button>
          </>
        )}

        {result?.mode === "crisis" && <CrisisCare postpartum={postpartum} onBack={reset} />}

        {result?.mode === "suggest" && showSupport && (
          <div className="space-y-3">
            <button onClick={() => setShowSupport(false)} className="text-xs text-muted hover:text-ink">← Quay lại gợi ý</button>
            <p className="text-[15px] font-medium text-ink">Nếu hôm nay nặng hơn “hơi mệt”, nói với ai đó là điều nên làm.</p>
            <ResourceList postpartum={postpartum} />
          </div>
        )}

        {result?.mode === "suggest" && !showSupport && (
          <div className="space-y-3">
            <button onClick={reset} className="text-xs text-muted hover:text-ink">← Chọn lại</button>
            <p className="text-sm leading-relaxed text-ink">{loading ? result.practicalNote : warmth ?? result.practicalNote}</p>

            {result.suggestions.length === 0 ? (
              <p className="text-sm text-muted">Chưa tìm được món hợp trong kho món – thử tâm trạng khác nhé.</p>
            ) : (
              <ul className="space-y-2">
                {result.suggestions.map((s) => {
                  const d = dish(s.dishId);
                  if (!d) return null;
                  const tier = TIER[s.tier];
                  return (
                    <li key={s.dishId} className="card flex items-center gap-3 p-3">
                      <DishThumb dish={d} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{d.vnName}</span>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${tier.cls}`}>{tier.label}</span>
                        </div>
                        <p className="text-xs text-muted">{s.why}</p>
                      </div>
                      <button onClick={() => addToPlan(s.dishId)} className="shrink-0 rounded-full border border-hairline px-3 py-1.5 text-xs text-ink hover:bg-surface">
                        Đưa vào tuần
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {result.researchNote && (
              <div className="rounded-[12px] border border-hairline bg-surface/40 p-3">
                <span className="mb-1 inline-block rounded-full border border-hairline px-2 py-0.5 text-[10px] text-muted">Liên hệ nghiên cứu</span>
                <p className="text-xs leading-relaxed text-muted">{result.researchNote}</p>
              </div>
            )}
            {result.caffeineNote && <p className="text-xs text-muted">Nếu khó ngủ, hạn chế cà phê/trà từ chiều.</p>}
            <p className="text-[11px] text-tertiary">{DISCLAIMER}</p>
            {/* Parallel, quiet path to support – catches an indirect distress the gate
                may not have flagged. Never harms; a missed signal would. */}
            <button onClick={() => setShowSupport(true)} className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline">
              Cần người lắng nghe? Xem nguồn hỗ trợ
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

function ResourceList({ postpartum }: { postpartum: boolean }) {
  return (
    <>
      {postpartum && (
        <p className="rounded-[12px] border border-amber/30 bg-amber-weak p-3 text-sm leading-relaxed text-amber">{POSTPARTUM_SUPPORT_NOTE}</p>
      )}
      <ul className="space-y-2">
        {SUPPORT_RESOURCES.map((r) => (
          <li key={r.name} className="card p-3">
            <p className="text-sm font-medium text-ink">{r.name}</p>
            <p className="text-sm">
              <span className="font-medium text-brand-ink">{r.detail}</span>
              {r.hours ? <span className="text-muted"> · {r.hours}</span> : null}
            </p>
            {r.url && (
              <a href={r.url} target="_blank" rel="noopener" className="text-xs text-muted underline-offset-2 hover:underline">
                {r.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            )}
          </li>
        ))}
      </ul>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
        {SUPPORT_GUIDANCE.map((g, i) => (
          <li key={i}>{g}</li>
        ))}
      </ul>
    </>
  );
}

function CrisisCare({ postpartum, onBack }: { postpartum: boolean; onBack: () => void }) {
  return (
    <div className="space-y-3">
      <p className="text-[15px] font-medium text-ink">Nghe như hôm nay thật sự nặng nề. Bạn không phải đối mặt một mình.</p>
      <p className="text-sm leading-relaxed text-muted">
        Mình xin phép không gợi ý món lúc này – điều đáng làm hơn là tìm một người để nói cùng.
      </p>
      <ResourceList postpartum={postpartum} />
      <button onClick={onBack} className="text-xs text-muted hover:text-ink">← Quay lại</button>
    </div>
  );
}
