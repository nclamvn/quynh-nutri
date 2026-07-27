import type { Supplier, SupplierChannel, ChannelKind, OrderLine } from "@/domain/types";
import type { ShoppingItem } from "@/domain/shopping";

// ── Channel capability (the L-1 honesty invariant) ──────────────────────────
// The 5 channel kinds are NOT equal. The app can compose the order text and
// hand it to the first three ("carry"); `their_*` only launches the shop's own
// surface (their cart/app) — the app can NOT push an order there and must never
// claim it sent one. `channelCarriesOrder` is the single gate the UI reads.
export type ChannelCapability = "push" | "call" | "open";

export function channelCapability(kind: ChannelKind): ChannelCapability {
  switch (kind) {
    case "zalo_chat":
    case "phone_sms":
      return "push"; // OS carries the composed text (share / sms body)
    case "hotline":
      return "call"; // dialer opens; the text is shown on screen to read aloud
    case "their_zalo_oa":
    case "their_app_web":
      return "open"; // only opens their cart — no order text goes with it
  }
}

/** True when the app can attach/compose the order for this channel. `open`
 *  channels return false → the UI shows "mở [tên] để bạn tự chọn hàng". */
export function channelCarriesOrder(kind: ChannelKind): boolean {
  return channelCapability(kind) !== "open";
}

/** The channel a supplier order should default to: prefer one that carries the
 *  order text; otherwise the first (open-only) channel. */
export function bestChannel(s: Supplier): SupplierChannel | undefined {
  return s.channels.find((c) => channelCarriesOrder(c.kind)) ?? s.channels[0];
}

export interface SupplierOrder {
  supplier: Supplier;
  lines: OrderLine[];
  /** true if ANY channel can carry the order text (push/call); false = open-only. */
  canCarry: boolean;
}

export interface OrderSplit {
  orders: SupplierOrder[];
  /** Items no active supplier handles — surfaced, never silently dropped. */
  unmatched: OrderLine[];
}

function supplierHandles(s: Supplier, item: ShoppingItem, group: string | undefined): boolean {
  if (!s.handles || s.handles.length === 0) return false;
  return s.handles.includes(item.commodityId) || (group !== undefined && s.handles.includes(group));
}

/**
 * Split a week's shopping items into per-supplier orders. Each item goes to the
 * FIRST supplier (in the given order) that handles its commodity group — a
 * deterministic assignment. Items nobody handles land in `unmatched` so the UI
 * can show them rather than lose them.
 *
 * qtyGross carries through the ShoppingItem's already-grossed-up qtyTotal
 * (PURCHASED grams, edibleYield applied upstream) — the order layer never
 * re-derives mass, so it can't drift from the shopping list.
 */
export function splitOrders(
  items: ShoppingItem[],
  suppliers: Supplier[],
  group: (commodityId: string) => string | undefined,
): OrderSplit {
  const byId = new Map<string, SupplierOrder>();
  for (const s of suppliers) {
    byId.set(s.id, { supplier: s, lines: [], canCarry: s.channels.some((c) => channelCarriesOrder(c.kind)) });
  }
  const unmatched: OrderLine[] = [];
  for (const it of items) {
    const g = group(it.commodityId);
    const s = suppliers.find((sup) => supplierHandles(sup, it, g));
    const line: OrderLine = { commodityId: it.commodityId, qtyGross: it.qtyTotal, unit: it.unit };
    if (s) byId.get(s.id)!.lines.push(line);
    else unmatched.push(line);
  }
  return {
    orders: [...byId.values()].filter((o) => o.lines.length > 0),
    unmatched,
  };
}

function fmtQty(q: number, unit: string): string {
  const n = Math.round(q);
  return unit === "g" ? `${n}g` : `${n} ${unit}`;
}

/**
 * Compose the human-readable order text for a supplier — the message the user
 * pastes/reads via a push/call channel. Lines are gram MUA. NO prices: we don't
 * fabricate market prices into a message, so it states only what and how much.
 */
export function orderMessage(
  order: SupplierOrder,
  name: (commodityId: string) => string,
  opts?: { note?: string; greeting?: string },
): string {
  const greet = opts?.greeting ?? "Chào shop, cho mình đặt:";
  const lines = order.lines.map((l) => `• ${name(l.commodityId)}: ${fmtQty(l.qtyGross, l.unit)}`);
  const note = opts?.note?.trim();
  return [greet, ...lines, ...(note ? ["", note] : [])].join("\n");
}
