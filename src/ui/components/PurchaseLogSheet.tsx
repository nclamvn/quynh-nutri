"use client";

import { useState, useEffect } from "react";
import { BottomSheet } from "./BottomSheet";
import { useStore } from "@/ui/store";
import { toast } from "@/ui/toast";
import { fmt } from "@/ui/format";
import type { OnTime, PurchaseLine } from "@/domain/types";

// Light, OPTIONAL purchase log. Real price paid = B1 ground truth; leaving it blank
// is honest-null, not a debt. No gamify, no nagging. "Đúng hẹn/trễ" is the
// household's own observation, framed as such.

export interface PurchaseDraftLine { commodityId: string; qty: number; unit: string; }

const ONTIME: { v: OnTime; label: string }[] = [
  { v: "on_time", label: "Đúng hẹn" },
  { v: "late", label: "Trễ" },
  { v: "no_show", label: "Không giao" },
];

export function PurchaseLogSheet({
  open,
  onClose,
  supplierId,
  supplierName,
  orderRef,
  lines,
}: {
  open: boolean;
  onClose: () => void;
  supplierId?: string;
  supplierName?: string;
  orderRef?: string;
  lines: PurchaseDraftLine[];
}) {
  const { addPurchase, commodity } = useStore();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [onTime, setOnTime] = useState<OnTime | undefined>(undefined);
  const [note, setNote] = useState("");

  useEffect(() => {
    // A fresh purchase draft is required every time this controlled sheet opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) { setPrices({}); setOnTime(undefined); setNote(""); }
  }, [open]);

  const name = (id: string) => commodity(id)?.canonicalVn ?? id;

  const save = () => {
    const outLines: PurchaseLine[] = lines.map((l) => {
      const raw = prices[l.commodityId]?.replace(/[^\d]/g, "");
      const pricePaid = raw ? Number(raw) : undefined; // blank → honest-null
      return { commodityId: l.commodityId, qty: l.qty, unit: l.unit, pricePaid: pricePaid && pricePaid > 0 ? pricePaid : undefined };
    });
    addPurchase({
      date: new Date().toISOString(),
      orderRef,
      supplierId,
      lines: outLines,
      onTime,
      note: note.trim() || undefined,
    });
    toast("Đã ghi lại lần mua. Cảm ơn bạn.", "info");
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Ghi lại lần mua">
      <div className="space-y-4">
        {supplierName && <p className="text-sm font-medium">{supplierName}</p>}
        <p className="text-xs leading-relaxed text-muted">
          Tuỳ chọn — giá thực trả giúp Báo cáo &amp; gợi ý sau này chính xác hơn. Để trống cũng được, không sao.
        </p>

        <ul className="space-y-2">
          {lines.map((l) => (
            <li key={l.commodityId} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{name(l.commodityId)}</p>
                <p className="text-xs text-muted">{fmt(l.qty)} {l.unit}</p>
              </div>
              <div className="flex items-center gap-1">
                <input
                  value={prices[l.commodityId] ?? ""}
                  onChange={(e) => setPrices((p) => ({ ...p, [l.commodityId]: e.target.value }))}
                  inputMode="numeric"
                  placeholder="giá trả"
                  className="w-24 rounded-lg border border-hairline bg-raised px-2.5 py-2 text-right text-sm outline-none focus:border-brand"
                />
                <span className="text-xs text-muted">đ</span>
              </div>
            </li>
          ))}
        </ul>

        <div>
          <p className="mb-1.5 text-sm font-medium">Giao hàng <span className="font-normal text-tertiary">(cảm nhận của bạn)</span></p>
          <div className="flex flex-wrap gap-1.5">
            {ONTIME.map((o) => (
              <button
                key={o.v}
                onClick={() => setOnTime((cur) => (cur === o.v ? undefined : o.v))}
                aria-pressed={onTime === o.v}
                className={`rounded-full border px-3 py-1.5 text-xs ${onTime === o.v ? "border-brand bg-brand-weak text-brand-ink" : "border-hairline text-muted"}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Ghi chú (tuỳ chọn)"
          className="w-full resize-none rounded-[12px] border border-hairline bg-raised px-3.5 py-2.5 text-sm outline-none focus:border-brand"
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full border border-hairline py-2.5 text-sm text-muted hover:bg-surface">Bỏ qua</button>
          <button onClick={save} className="cta-primary flex-1 rounded-full py-2.5 text-sm font-medium text-white">Lưu lần mua</button>
        </div>
      </div>
    </BottomSheet>
  );
}
