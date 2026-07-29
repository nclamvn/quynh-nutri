"use client";

import { useState, useEffect } from "react";
import { BottomSheet } from "./BottomSheet";
import { HealthDisclaimer } from "./HealthDisclaimer";
import { useStore, type MemberBaseInput } from "@/ui/store";
import type { Member, LifeStage, Allergen, MemberRole } from "@/domain/types";

// The member DECLARATION editor — "kê khai một người trong nhà". Base layer:
// name, role, sex/age, allergies (the hard-safety layer), standing conditions,
// dislikes. Warm, machine-invisible (no tier/constraint jargon). Allergies show
// HONEY/AMBER "cần tránh" — safety, never alarming red.

const ALLERGENS: Allergen[] = ["shellfish", "fish", "egg", "soy", "dairy", "gluten", "peanut"];
const ALLERGEN_VN: Record<Allergen, string> = {
  shellfish: "Hải sản", fish: "Cá", egg: "Trứng", soy: "Đậu nành", dairy: "Sữa", gluten: "Gluten", peanut: "Đậu phộng",
};
const AGE_BANDS = ["0-2", "3-5", "6-10", "11-14", "15-18"];
const MATERNAL: { v: LifeStage; label: string }[] = [
  { v: "none", label: "Không" },
  { v: "pregnant_t1", label: "Mang thai · 3 tháng đầu" },
  { v: "pregnant_t2", label: "Mang thai · 3 tháng giữa" },
  { v: "pregnant_t3", label: "Mang thai · 3 tháng cuối" },
  { v: "lactating_0_6", label: "Cho con bú · 0–6 tháng" },
  { v: "lactating_7_12", label: "Cho con bú · 7–12 tháng" },
];

export type MemberSubject = Member | "new" | null;

export function MemberSheet({ subject, onClose }: { subject: MemberSubject; onClose: () => void }) {
  const { addMember, editMember, removeMember, updateMemberHealthProfile } = useStore();
  const isNew = subject === "new";
  const m = subject && subject !== "new" ? subject : null;

  const [name, setName] = useState("");
  const [role, setRole] = useState<MemberRole>("adult");
  const [sex, setSex] = useState<"M" | "F">("F");
  const [ageBand, setAgeBand] = useState("6-10");
  const [allergies, setAllergies] = useState<Allergen[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [stage, setStage] = useState<LifeStage>("none");
  const [condInput, setCondInput] = useState("");
  const [disInput, setDisInput] = useState("");

  useEffect(() => {
    if (!subject) return;
    const s = subject === "new" ? null : subject;
    // Controlled sheet draft must reset when its subject changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(s?.name ?? "");
    setRole(s?.role ?? "adult");
    setSex(s?.sex ?? "F");
    setAgeBand(s?.ageBand ?? "6-10");
    setAllergies(s?.allergies ?? []);
    setConditions(s?.conditions ?? []);
    setDislikes(s?.dislikes ?? []);
    setStage(s?.healthProfile?.lifeStage ?? "none");
    setCondInput(""); setDisInput("");
  }, [subject]);

  if (!subject) return null;
  const maternal = role === "adult" && sex === "F";
  const toggleAllergen = (a: Allergen) => setAllergies((xs) => (xs.includes(a) ? xs.filter((x) => x !== a) : [...xs, a]));
  const addTag = (v: string, set: React.Dispatch<React.SetStateAction<string[]>>, clear: () => void) => {
    const t = v.trim(); if (!t) return;
    set((xs) => (xs.includes(t) ? xs : [...xs, t])); clear();
  };

  const base: MemberBaseInput = {
    name: name.trim() || undefined,
    role,
    sex: role === "adult" ? sex : undefined,
    ageBand: role === "child" ? ageBand : undefined,
    allergies,
    conditions,
    dislikes,
  };

  const save = () => {
    if (isNew) {
      addMember(base);
    } else if (m) {
      editMember(m.id, base);
      updateMemberHealthProfile(m.id, stage === "none" ? null : { lifeStage: stage, mode: "wellness" });
    }
    onClose();
  };
  const del = () => { if (m) { removeMember(m.id); onClose(); } };

  return (
    <BottomSheet open={!!subject} onClose={onClose} title={isNew ? "Thêm thành viên" : "Sửa thành viên"}>
      <div className="space-y-5">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Tên gọi trong nhà</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bố, Mẹ, bé Na…"
            className="w-full rounded-[12px] border border-hairline bg-surface/40 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>

        {/* Role + sex/age */}
        <div className="flex flex-wrap gap-2">
          {(["adult", "child"] as MemberRole[]).map((r) => (
            <button key={r} onClick={() => setRole(r)} aria-pressed={role === r}
              className={`rounded-full border px-3.5 py-1.5 text-sm ${role === r ? "border-brand bg-brand-weak text-brand-ink" : "border-hairline text-muted"}`}>
              {r === "adult" ? "Người lớn" : "Trẻ em"}
            </button>
          ))}
          {role === "adult"
            ? (["F", "M"] as const).map((s) => (
                <button key={s} onClick={() => setSex(s)} aria-pressed={sex === s}
                  className={`rounded-full border px-3.5 py-1.5 text-sm ${sex === s ? "border-brand bg-brand-weak text-brand-ink" : "border-hairline text-muted"}`}>
                  {s === "F" ? "Nữ" : "Nam"}
                </button>
              ))
            : AGE_BANDS.map((a) => (
                <button key={a} onClick={() => setAgeBand(a)} aria-pressed={ageBand === a}
                  className={`rounded-full border px-3 py-1.5 text-sm ${ageBand === a ? "border-brand bg-brand-weak text-brand-ink" : "border-hairline text-muted"}`}>
                  {a} tuổi
                </button>
              ))}
        </div>

        {/* Allergies — the safety layer. Amber "cần tránh", never red. */}
        <div>
          <p className="mb-2 text-sm font-medium">Dị ứng · cần tránh</p>
          <div className="flex flex-wrap gap-1.5">
            {ALLERGENS.map((a) => {
              const on = allergies.includes(a);
              return (
                <button key={a} onClick={() => toggleAllergen(a)} aria-pressed={on}
                  className={`rounded-full border px-3 py-1.5 text-xs ${on ? "border-amber bg-amber-weak font-medium text-amber" : "border-hairline text-muted"}`}>
                  {on ? "✓ " : ""}{ALLERGEN_VN[a]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conditions (free chips) */}
        <TagField label="Bệnh nền (nếu có)" placeholder="tiểu đường, cao huyết áp…"
          tags={conditions} input={condInput} setInput={setCondInput}
          onAdd={() => addTag(condInput, setConditions, () => setCondInput(""))}
          onRemove={(t) => setConditions((xs) => xs.filter((x) => x !== t))} />

        {/* Dislikes (free chips) */}
        <TagField label="Món không thích" placeholder="mướp đắng, cà pháo…"
          tags={dislikes} input={disInput} setInput={setDisInput}
          onAdd={() => addTag(disInput, setDislikes, () => setDisInput(""))}
          onRemove={(t) => setDislikes((xs) => xs.filter((x) => x !== t))} />

        {/* Maternal life stage — adult females, edit mode (set after the person exists) */}
        {maternal && !isNew && (
          <div>
            <p className="mb-2 text-sm font-medium">Giai đoạn</p>
            <div className="flex flex-col gap-1.5">
              {MATERNAL.map(({ v, label }) => (
                <button key={v} onClick={() => setStage(v)} aria-pressed={stage === v}
                  className={`flex items-center justify-between rounded-[12px] border px-3.5 py-2.5 text-left text-sm ${stage === v ? "border-brand bg-brand-weak text-brand-ink" : "border-hairline text-ink"}`}>
                  <span>{label}</span>{stage === v && <span className="text-brand">✓</span>}
                </button>
              ))}
            </div>
            {stage !== "none" && <HealthDisclaimer className="mt-2" />}
          </div>
        )}

        <button onClick={save} className="cta-primary w-full rounded-full py-2.5 text-sm font-medium text-white">
          {isNew ? "Thêm vào nhà" : "Lưu"}
        </button>
        {m && (
          <button onClick={del} className="w-full py-1 text-center text-xs text-tertiary hover:text-danger">
            Xoá khỏi nhà
          </button>
        )}
      </div>
    </BottomSheet>
  );
}

function TagField({ label, placeholder, tags, input, setInput, onAdd, onRemove }: {
  label: string; placeholder: string; tags: string[]; input: string;
  setInput: (v: string) => void; onAdd: () => void; onRemove: (t: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <button key={t} onClick={() => onRemove(t)} className="flex items-center gap-1 rounded-full bg-brand-weak px-2.5 py-1 text-xs text-brand-ink">
              {t}<span aria-hidden className="opacity-50">×</span>
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-[12px] border border-hairline bg-surface/40 px-3 py-2 text-sm outline-none focus:border-brand" />
        <button onClick={onAdd} className="shrink-0 rounded-[12px] border border-hairline px-3 text-sm text-muted">Thêm</button>
      </div>
    </div>
  );
}
