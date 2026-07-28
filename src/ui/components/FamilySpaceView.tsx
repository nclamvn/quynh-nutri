"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/ui/store";
import { familySpace } from "@/domain/family";
import { detectConflicts } from "@/domain/constraints";
import { MemberSheet, type MemberSubject } from "./MemberSheet";
import type { Member, MemberState, MemberStateKind } from "@/domain/types";

// "Không gian gia đình sống" — the whole family in ONE frame the cook sees, plus
// a warm way to say "hôm nay bạn ấy thế nào". No technical terms surface: the user
// never sees "constraint / state / tier / provenance" — only "nhà mình" language.

const ALLERGEN_VN: Record<string, string> = {
  shellfish: "hải sản", fish: "cá", egg: "trứng", soy: "đậu nành",
  dairy: "sữa", gluten: "gluten", peanut: "đậu phộng",
};

// Presets for a today-state. kind is app-internal; the chip shows only the label.
const STATE_PRESETS: { label: string; kind: MemberStateKind; value: string }[] = [
  { label: "Mệt", kind: "mood", value: "mệt" },
  { label: "Ốm", kind: "illness", value: "ốm" },
  { label: "Căng thẳng", kind: "mood", value: "stress" },
  { label: "Vui", kind: "mood", value: "vui" },
  { label: "Bận / thi cử", kind: "context", value: "bận" },
];

const DURATIONS: { label: string; days: number }[] = [
  { label: "Hôm nay", days: 1 },
  { label: "Vài ngày", days: 3 },
  { label: "Tuần này", days: 7 },
];

const roleMark = (m: Member) => (m.role === "adult" ? (m.sex === "M" ? "B" : "M") : "T");
const displayName = (m: Member) => m.name?.trim() || (m.role === "child" ? "Bé" : m.sex === "M" ? "Bố" : "Mẹ");

export function FamilySpaceView() {
  const { household, addMemberState, removeMemberState } = useStore();
  // Recompute "active" against now on each render — expired states just drop out.
  const now = useMemo(() => new Date().toISOString(), [household.members]);
  const space = useMemo(() => familySpace(household.members, now), [household.members, now]);
  const conflicts = useMemo(() => detectConflicts(household.members), [household.members]);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [subject, setSubject] = useState<MemberSubject>(null);

  if (household.members.length === 0) {
    return (
      <>
        <div className="card flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm text-tertiary">Chưa có ai trong nhà mình.</p>
          <button onClick={() => setSubject("new")} className="cta-primary rounded-full px-5 py-2.5 text-sm font-medium text-white">
            + Thêm thành viên
          </button>
          <p className="text-[11px] text-tertiary">Kể tôi nghe nhà mình có những ai — thực đơn sẽ theo đó.</p>
        </div>
        <MemberSheet subject={subject} onClose={() => setSubject(null)} />
      </>
    );
  }

  const addState = (memberId: string, preset: (typeof STATE_PRESETS)[number], days: number) => {
    const from = new Date();
    const until = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
    const state: Omit<MemberState, "id"> = {
      kind: preset.kind, value: preset.value,
      validFrom: from.toISOString(), validUntil: until.toISOString(),
    };
    addMemberState(memberId, state);
    setOpenFor(null);
  };

  const stateLabel = (s: MemberState) => STATE_PRESETS.find((p) => p.value === s.value)?.label ?? s.value;

  return (
    <>
      {/* Trade-off — the app doesn't pretend to have a perfect answer; the human
          decides. Honey/amber, warm, never alarming. */}
      {conflicts.map((c, i) => (
        <div key={i} className="mb-3 flex items-start gap-2 rounded-xl border border-amber/25 bg-amber-weak px-3 py-2.5">
          <span aria-hidden className="mt-0.5 text-amber">◆</span>
          <p className="text-[12px] leading-relaxed text-amber">{c.note}</p>
        </div>
      ))}
      <button onClick={() => setSubject("new")} className="mb-3 w-full rounded-xl border border-dashed border-hairline py-2.5 text-sm font-medium text-brand">
        + Thêm thành viên
      </button>
      <ul data-stagger className="grid grid-cols-1 gap-3">
      {space.needs.map((need, i) => {
        const m = household.members.find((x) => x.id === need.memberId)!;
        return (
          <li key={need.memberId} style={{ "--i": i } as React.CSSProperties}>
            <div className="card p-4">
              <button onClick={() => setSubject(m)} className="flex w-full items-center gap-3 text-left">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-weak text-sm font-medium text-brand-ink">{roleMark(m)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{displayName(m)}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {/* Allergies — the safety layer. Honey/amber "cần tránh", never
                        alarming red (một-màu-một-nghĩa). */}
                    {need.allergies.length > 0 && (
                      <span className="rounded-full bg-amber-weak px-2 py-0.5 text-[10px] font-medium text-amber">
                        Cần tránh: {need.allergies.map((a) => ALLERGEN_VN[a] ?? a).join(", ")}
                      </span>
                    )}
                    {need.conditions.map((c) => (
                      <span key={c} className="rounded-full border border-hairline px-2 py-0.5 text-[10px] text-muted">{c}</span>
                    ))}
                    {need.allergies.length === 0 && need.conditions.length === 0 && (
                      <span className="text-[11px] text-tertiary">Không có gì cần tránh</span>
                    )}
                  </div>
                </div>
                <span aria-hidden className="shrink-0 text-[11px] font-medium text-brand">Sửa</span>
              </button>

              {/* Today's states — self-expiring; each removable ("khỏi rồi"). */}
              {need.activeStates.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-hairline pt-3">
                  <span className="text-[11px] text-tertiary">Hôm nay:</span>
                  {need.activeStates.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => removeMemberState(need.memberId, s.id)}
                      className="group flex items-center gap-1 rounded-full bg-brand-weak px-2 py-0.5 text-[11px] text-brand-ink"
                      title="Khỏi rồi — bỏ trạng thái này"
                    >
                      {stateLabel(s)}<span aria-hidden className="opacity-50 group-hover:opacity-100">×</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Add a today-state */}
              {openFor === need.memberId ? (
                <div className="mt-3 border-t border-hairline pt-3">
                  <p className="mb-2 text-[11px] text-tertiary">Hôm nay {displayName(m)} thế nào?</p>
                  <div className="flex flex-col gap-2">
                    {STATE_PRESETS.map((p) => (
                      <div key={p.value} className="flex items-center gap-1.5">
                        <span className="w-24 shrink-0 text-xs font-medium">{p.label}</span>
                        {DURATIONS.map((d) => (
                          <button
                            key={d.label}
                            onClick={() => addState(need.memberId, p, d.days)}
                            className="rounded-full border border-hairline px-2.5 py-1 text-[11px] text-muted transition hover:border-brand hover:text-brand"
                          >{d.label}</button>
                        ))}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setOpenFor(null)} className="mt-2 text-[11px] text-tertiary">Đóng</button>
                </div>
              ) : (
                <button
                  onClick={() => setOpenFor(need.memberId)}
                  className="mt-3 text-[12px] font-medium text-brand"
                >+ Thêm trạng thái hôm nay</button>
              )}
            </div>
          </li>
        );
      })}
      </ul>
      <MemberSheet subject={subject} onClose={() => setSubject(null)} />
    </>
  );
}
