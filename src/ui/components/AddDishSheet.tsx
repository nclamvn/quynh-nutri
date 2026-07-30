"use client";

import { useMemo, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { useI18n } from "@/i18n/context";
import { useStore } from "@/ui/store";
import { dishDisplay } from "@/ui/derive";
import { ProvenanceChip } from "./ProvenanceChip";
import type { Dish, Slot, ProteinType, CookMethod } from "@/domain/types";

interface ParsedLine { commodityId: string; qtyBase: number; unit: string; matched: boolean }
interface ParsedDish {
  vnName: string;
  slot: string;
  method: string;
  proteinType: string;
  lines: ParsedLine[];
  notes?: string[];
  source?: "claude" | "mock";
}

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "mon";

export function AddDishSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { commodity, household, addB1Dish } = useStore();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedDish | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setParsed(null);
    setSaved(false);
    const input = text.trim();
    const isUrl = /^https?:\/\//i.test(input);
    try {
      const res = await fetch("/api/import-dish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isUrl ? { url: input } : { text: input }),
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

  // Build a real B1 Dish from the matched lines ONLY – nutrition is recomputed by
  // the engine from mapped commodities, never trusted from the source recipe.
  const previewDish: Dish | null = useMemo(() => {
    if (!parsed) return null;
    const matched = parsed.lines.filter((l) => l.matched);
    if (!matched.length) return null;
    return {
      id: `imp_${slug(parsed.vnName)}`,
      vnName: parsed.vnName,
      proteinType: parsed.proteinType as ProteinType,
      method: parsed.method as CookMethod,
      slot: parsed.slot as Slot,
      quick: false,
      baseServings: 4,
      lines: matched.map((l) => ({ commodityId: l.commodityId, qtyBase: l.qtyBase, unit: l.unit })),
      origin: "B1",
    };
  }, [parsed]);

  const matchedCount = parsed?.lines.filter((l) => l.matched).length ?? 0;
  const totalCount = parsed?.lines.length ?? 0;
  const unmatchedNames = parsed?.lines.filter((l) => !l.matched).map((l) => l.commodityId) ?? [];

  const save = () => {
    if (!previewDish) return;
    addB1Dish({ ...previewDish, id: `imp_${crypto.randomUUID()}` });
    setSaved(true);
    setTimeout(() => { onClose(); setText(""); setParsed(null); setSaved(false); }, 700);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={t("dishes.add")}>
      <div className="space-y-3">
        <p className="text-xs text-muted">{t("import.hint")}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("import.placeholder")}
          className="h-24 w-full resize-none rounded-lg border border-hairline bg-bg p-3 text-sm outline-none focus:border-brand"
        />
        <button
          onClick={submit}
          disabled={loading || text.trim().length < 4}
          className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white active:bg-brand-hover disabled:opacity-40"
        >
          {loading ? t("import.parsing") : t("import.parse")}
        </button>

        {error && <p className="text-xs text-danger">⚠ {error}</p>}

        {parsed && (
          <div className="rounded-lg border border-hairline bg-surface/40 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">{parsed.vnName}</h3>
                <p className="text-[11px] text-muted">{parsed.slot} · {parsed.method} · {parsed.proteinType}</p>
              </div>
              {previewDish && (
                <ProvenanceChip display={dishDisplay(previewDish, household, commodity)} field="kcal" unit="kcal" />
              )}
            </div>

            {/* Honest denominator: nutrition covers only the mapped ingredients. */}
            <p className="mt-2 text-[11px] text-tertiary">
              {t("import.matched", { n: matchedCount, m: totalCount })}
            </p>

            <ul className="mt-2 space-y-1">
              {parsed.lines.map((l, i) => (
                <li key={i} className="flex items-center justify-between text-xs">
                  <span className={l.matched ? "" : "text-amber"}>{l.matched ? "" : "＊ "}{l.commodityId}</span>
                  <span className="tnum text-muted">{l.qtyBase} {l.unit}</span>
                </li>
              ))}
            </ul>

            {unmatchedNames.length > 0 && (
              <p className="mt-2 text-[11px] text-amber">{t("import.excluded", { names: unmatchedNames.join(", ") })}</p>
            )}
            {parsed.source === "mock" && <p className="mt-1 text-[11px] text-tertiary">{t("import.mock")}</p>}

            <button
              onClick={save}
              disabled={!previewDish || saved}
              className="mt-3 w-full rounded-lg border border-brand bg-brand-weak py-2 text-sm font-medium text-brand-ink active:bg-brand-weak/70 disabled:opacity-40"
            >
              {saved ? t("import.saved") : t("import.save")}
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
