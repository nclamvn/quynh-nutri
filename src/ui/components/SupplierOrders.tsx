"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore, type SupplierInput } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import { fmt } from "@/ui/format";
import { toast } from "@/ui/toast";
import { SupplierSheet } from "./SupplierSheet";
import { PurchaseLogSheet, type PurchaseDraftLine } from "./PurchaseLogSheet";
import { channelCapability, channelCarriesOrder, orderMessage, type SupplierOrder } from "@/domain/order";
import { SUPPLIER_REGISTRY } from "@/data/seed/suppliers";
import type { Supplier, SupplierChannel, ChannelKind, OrderStatus } from "@/domain/types";

const TYPE_LABEL: Record<string, string> = { cho: "Chợ", sieu_thi: "Siêu thị", tiem: "Tiệm", online: "Online" };
const CHANNEL_LABEL: Record<ChannelKind, string> = {
  zalo_chat: "Zalo", phone_sms: "SMS", hotline: "Gọi", their_zalo_oa: "Zalo OA", their_app_web: "App/Web",
};
// Honest status ladder – the app only ever asserts up to "đã mở kênh".
const STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  draft: { label: "Chưa gửi", cls: "border-hairline text-muted" },
  sent: { label: "Đã mở kênh", cls: "border-brand/40 bg-brand-weak text-brand-ink" },
  confirmed: { label: "Shop đã xác nhận", cls: "border-accent/40 bg-accent-weak text-accent" },
  delivered: { label: "Đã nhận hàng", cls: "border-accent/40 bg-accent-weak text-accent" },
};

function toUrl(v: string): string | null {
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w.-]+\.\w{2,}(\/.*)?$/.test(v)) return `https://${v}`;
  return null;
}
function zaloUrl(v: string): string {
  return /^https?:\/\//i.test(v) ? v : `https://zalo.me/${v.replace(/[^\d]/g, "") || v}`;
}

// P2-4 – push the order via the OS share sheet (where the user picks Zalo and the
// text lands in the chat). Robust either way the P2-0 spike lands: on a device
// where share works the text goes straight in; where it's absent/refused we
// return a signal so the caller can fall back to copy→zalo.me. Never asserts the
// order was delivered – only that the sheet was opened.
type ShareResult = "shared" | "cancelled" | "unsupported";
async function shareOrderText(text: string): Promise<ShareResult> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return "unsupported";
  try {
    if (navigator.canShare && !navigator.canShare({ text })) return "unsupported";
    await navigator.share({ text });
    return "shared";
  } catch (e) {
    return e instanceof DOMException && e.name === "AbortError" ? "cancelled" : "unsupported";
  }
}

export function SupplierOrders() {
  const { suppliers, deleteSupplier, orderSplit, orderFor, markChannelOpened, setOrderStatus, commodity } = useStore();
  const { lang } = useI18n();
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [seed, setSeed] = useState<SupplierInput | null>(null);
  const [logTarget, setLogTarget] = useState<{ supplierId: string; supplierName: string; orderRef?: string; lines: PurchaseDraftLine[] } | null>(null);

  const name = (id: string) => {
    const c = commodity(id);
    return c ? (lang === "en" && c.labelEn ? c.labelEn : c.canonicalVn) : id;
  };

  const withItems = new Set(orderSplit.orders.map((o) => o.supplier.id));
  const idleSuppliers = suppliers.filter((s) => !withItems.has(s.id));
  const existingNames = new Set(suppliers.map((s) => s.name.toLowerCase()));
  const suggestions = SUPPLIER_REGISTRY.filter((s) => !existingNames.has(s.name.toLowerCase())).slice(0, 6);

  const copyThenOpenZalo = async (text: string, value: string) => {
    try {
      await navigator.clipboard?.writeText(text);
      toast("Đã copy đơn – dán vào khung chat Zalo.", "info");
    } catch { /* clipboard may be blocked; opening Zalo is still useful */ }
    window.open(zaloUrl(value), "_blank");
  };

  const openChannel = async (ch: SupplierChannel, so: SupplierOrder) => {
    const cap = channelCapability(ch.kind);
    const text = orderMessage(so, name, { note: "Cảm ơn shop ạ!" });
    if (cap === "open") {
      const url = toUrl(ch.value);
      if (url) window.open(url, "_blank");
      else toast("Điểm mua này chỉ có tên kênh – mở app của họ và tự chọn hàng.", "info");
      // NOT marked sent: the app didn't send anything, the user picks in their cart.
      return;
    }
    if (ch.kind === "phone_sms") {
      window.open(`sms:${ch.value}?body=${encodeURIComponent(text)}`);
    } else if (ch.kind === "hotline") {
      window.open(`tel:${ch.value.replace(/\s/g, "")}`);
    } else if (ch.kind === "zalo_chat") {
      // Share-sheet first (P2-4); fall back to copy→zalo.me where share is absent.
      const r = await shareOrderText(text);
      if (r === "cancelled") return; // user backed out – nothing opened, don't mark
      if (r === "unsupported") await copyThenOpenZalo(text, ch.value);
    }
    markChannelOpened(so.supplier.id, ch.kind);
  };

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Đặt hàng theo điểm mua</h2>
          <p className="text-xs text-muted">Chia đơn tuần này theo từng shop · số ghi là lượng MUA</p>
        </div>
        <button
          onClick={() => setSeed({ id: "", name: "", type: "cho", channels: [], handles: [] })}
          className="cta-primary rounded-full px-3.5 py-2 text-xs font-medium text-white"
        >
          + Điểm mua
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="card p-4 text-center">
          <p className="text-sm font-medium">Chưa có điểm mua nào</p>
          <p className="mt-1 text-xs text-muted">Thêm chợ/hàng quen để app tự chia đơn đi chợ theo từng nơi.</p>
        </div>
      ) : (
        <div data-stagger className="grid gap-4 md:grid-cols-2">
          {orderSplit.orders.map((so, i) => {
            const s = so.supplier;
            const order = orderFor(s.id);
            const status = order?.status ?? "draft";
            const st = STATUS[status];
            return (
              <div key={s.id} style={{ "--i": i } as React.CSSProperties} className="card h-fit overflow-hidden">
                <div className="flex items-start justify-between gap-2 border-b border-hairline px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold">{s.name}</h3>
                      <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted">{TYPE_LABEL[s.type]}</span>
                    </div>
                    <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] ${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Link href={`/suppliers/${s.id}`} className="rounded-lg px-2 py-1 text-xs text-brand hover:bg-surface">Chi tiết</Link>
                    <button onClick={() => setEditing(s)} className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-surface" aria-label="Sửa">✎</button>
                    <button onClick={() => confirm(`Xoá "${s.name}"?`) && deleteSupplier(s.id)} className="rounded-lg px-2 py-1 text-xs text-tertiary hover:text-danger" aria-label="Xoá">🗑</button>
                  </div>
                </div>

                <ul className="px-4 py-2">
                  {so.lines.map((l) => (
                    <li key={l.commodityId} className="flex items-baseline justify-between gap-3 py-1 text-sm">
                      <span className="text-ink">{name(l.commodityId)}</span>
                      <span className="tnum text-xs text-muted">{fmt(l.qtyGross)} {l.unit}</span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-hairline px-4 py-3">
                  {!so.canCarry && (
                    <p className="mb-2 text-[11px] text-amber">
                      App không gửi đơn hộ nơi này – bấm để mở app/web của họ, bạn tự chọn hàng.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {s.channels.map((ch, ci) => {
                      const carries = channelCarriesOrder(ch.kind);
                      return (
                        <button
                          key={ci}
                          onClick={() => openChannel(ch, so)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                            carries ? "cta-primary text-white" : "border border-hairline text-ink hover:bg-surface"
                          }`}
                        >
                          {carries ? "Soạn & mở · " : "Mở · "}{CHANNEL_LABEL[ch.kind]}
                        </button>
                      );
                    })}
                  </div>

                  {/* Manual status – the app never auto-advances past "đã mở kênh". */}
                  {status === "sent" && (
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      <button onClick={() => setOrderStatus(s.id, "confirmed")} className="rounded-full border border-hairline px-2.5 py-1 text-muted hover:bg-surface">Shop đã xác nhận</button>
                      <button onClick={() => setOrderStatus(s.id, "delivered")} className="rounded-full border border-hairline px-2.5 py-1 text-muted hover:bg-surface">Đã nhận hàng</button>
                      <button onClick={() => setOrderStatus(s.id, "draft")} className="rounded-full px-2.5 py-1 text-tertiary hover:text-ink">Soạn lại</button>
                    </div>
                  )}
                  {status === "delivered" && (
                    <button
                      onClick={() => setLogTarget({ supplierId: s.id, supplierName: s.name, orderRef: order?.id || undefined, lines: so.lines.map((l) => ({ commodityId: l.commodityId, qty: l.qtyGross, unit: l.unit })) })}
                      className="mt-2 mr-3 text-[11px] font-medium text-brand hover:underline"
                    >
                      Ghi lại lần mua?
                    </button>
                  )}
                  {(status === "confirmed" || status === "delivered") && (
                    <button onClick={() => setOrderStatus(s.id, "draft")} className="mt-2 text-[11px] text-tertiary hover:text-ink">Đặt lại trạng thái</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Items no supplier handles – surfaced, not dropped. */}
      {orderSplit.unmatched.length > 0 && (
        <div className="card mt-4 border-amber/30 p-4">
          <p className="text-sm font-medium text-amber">Chưa có điểm mua cho {orderSplit.unmatched.length} mặt hàng</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {orderSplit.unmatched.map((l) => (
              <li key={l.commodityId}>{name(l.commodityId)} · {fmt(l.qtyGross)} {l.unit}</li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-tertiary">Thêm một điểm mua có bán các nhóm hàng này để app gán vào đơn.</p>
        </div>
      )}

      {/* Household suppliers with nothing to buy this week */}
      {idleSuppliers.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-tertiary">Điểm mua khác (tuần này không có hàng)</p>
          <div className="flex flex-wrap gap-1.5">
            {idleSuppliers.map((s) => (
              <button key={s.id} onClick={() => setEditing(s)} className="rounded-full border border-hairline px-3 py-1.5 text-xs text-muted hover:bg-surface">
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Registry suggestions – chains are seed-only; adding copies into the household. */}
      {suggestions.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-tertiary">Gợi ý thêm nhanh</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSeed({ id: "", name: s.name, type: s.type, channels: s.channels.map((c) => ({ ...c })), handles: s.handles ?? [] })}
                className="rounded-full border border-hairline px-3 py-1.5 text-xs text-muted hover:bg-surface"
              >
                + {s.name}{s.needsVerify ? " ⚠" : ""}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-tertiary">⚠ = nguồn có thể cũ, kiểm tra lại kênh trước khi dùng.</p>
        </div>
      )}

      <SupplierSheet
        supplier={editing}
        seed={seed}
        onClose={() => { setEditing(null); setSeed(null); }}
      />
      <PurchaseLogSheet
        open={logTarget !== null}
        onClose={() => setLogTarget(null)}
        supplierId={logTarget?.supplierId}
        supplierName={logTarget?.supplierName}
        orderRef={logTarget?.orderRef}
        lines={logTarget?.lines ?? []}
      />
    </section>
  );
}
