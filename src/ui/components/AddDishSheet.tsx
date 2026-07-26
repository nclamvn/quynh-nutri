"use client";

import { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { useI18n } from "@/i18n/context";

interface ParsedDish {
  vnName: string;
  slot: string;
  method: string;
  proteinType: string;
  lines: { commodityId: string; qtyBase: number; unit: string; matched: boolean }[];
  notes?: string[];
}

export function AddDishSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedDish | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setParsed(null);
    try {
      const res = await fetch("/api/import-dish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "parse failed");
      setParsed(data.dish);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={t("dishes.add")}>
      <div className="space-y-3">
        <p className="text-xs text-muted">
          Mô tả món bằng lời — máy tách nguyên liệu & định lượng, ánh xạ về kho commodity. Số nào chưa khớp sẽ đánh dấu để bạn xác nhận.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="VD: Cá diêu hồng 500g kho tộ với nước dừa, nước mắm, đường…"
          className="h-24 w-full resize-none rounded-lg border border-hairline bg-bg p-3 text-sm outline-none focus:border-brand"
        />
        <button
          onClick={submit}
          disabled={loading || text.trim().length < 4}
          className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white active:bg-brand-hover disabled:opacity-40"
        >
          {loading ? "Đang tách…" : "Tách món"}
        </button>

        {error && <p className="text-xs text-danger">⚠ {error}</p>}

        {parsed && (
          <div className="rounded-lg border border-hairline bg-surface/40 p-3">
            <h3 className="text-sm font-semibold">{parsed.vnName}</h3>
            <p className="text-[11px] text-muted">
              {parsed.slot} · {parsed.method} · {parsed.proteinType}
            </p>
            <ul className="mt-2 space-y-1">
              {parsed.lines.map((l, i) => (
                <li key={i} className="flex items-center justify-between text-xs">
                  <span className={l.matched ? "" : "text-amber"}>
                    {l.matched ? "" : "＊"} {l.commodityId}
                  </span>
                  <span className="tnum text-muted">
                    {l.qtyBase} {l.unit}
                  </span>
                </li>
              ))}
            </ul>
            {parsed.notes?.map((n, i) => (
              <p key={i} className="mt-1 text-[11px] text-amber">
                {n}
              </p>
            ))}
            <p className="mt-2 text-[11px] text-muted">＊ = chưa khớp commodity, cần xác nhận.</p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
