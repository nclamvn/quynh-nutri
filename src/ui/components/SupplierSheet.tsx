"use client";

import { useState, useEffect } from "react";
import { BottomSheet } from "./BottomSheet";
import { SupplierMapView } from "./SupplierMapView";
import { useStore, type SupplierInput } from "@/ui/store";
import { channelCapability } from "@/domain/order";
import type { Supplier, SupplierType, ChannelKind, SupplierChannel, GeoPoint } from "@/domain/types";

// Household supplier editor. Registry chains are seeded suggestions elsewhere;
// this is where the household adds its own shops (the high-value zalo_chat case).
const TYPES: { v: SupplierType; label: string }[] = [
  { v: "cho", label: "Chợ / hàng quen" },
  { v: "sieu_thi", label: "Siêu thị" },
  { v: "tiem", label: "Tiệm / cửa hàng" },
  { v: "online", label: "Đặt online" },
];

const CHANNELS: { v: ChannelKind; label: string; placeholder: string }[] = [
  { v: "zalo_chat", label: "Zalo (chat)", placeholder: "SĐT hoặc link Zalo của shop" },
  { v: "phone_sms", label: "Điện thoại / SMS", placeholder: "Số điện thoại" },
  { v: "hotline", label: "Tổng đài", placeholder: "Số tổng đài" },
  { v: "their_zalo_oa", label: "Zalo OA của họ", placeholder: "Tên/OA Zalo" },
  { v: "their_app_web", label: "App / Web của họ", placeholder: "Link app hoặc web" },
];

const GROUPS = ["thịt", "cá", "hải sản", "rau", "trái cây", "ngũ cốc", "gia vị", "trứng", "đậu"];

const capNote: Record<string, string> = {
  push: "App soạn sẵn đơn, bạn gửi qua kênh này.",
  call: "App hiện đơn để bạn đọc khi gọi.",
  open: "App chỉ mở app/web của họ — bạn tự chọn hàng, app không gửi đơn hộ.",
};

export function SupplierSheet({ supplier, seed, onClose }: {
  supplier: Supplier | null; // editing an existing household supplier
  seed?: SupplierInput | null; // prefill (e.g. from a registry suggestion)
  onClose: () => void;
}) {
  const { saveSupplier } = useStore();
  const open = supplier !== null || seed != null;
  const [name, setName] = useState("");
  const [type, setType] = useState<SupplierType>("cho");
  const [channels, setChannels] = useState<SupplierChannel[]>([{ kind: "zalo_chat", value: "" }]);
  const [handles, setHandles] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<GeoPoint | undefined>(undefined);
  const [hours, setHours] = useState("");
  const [shipInfo, setShipInfo] = useState("");
  const [storeLocatorUrl, setStoreLocatorUrl] = useState("");
  // Provenance carried through untouched — the sheet never fabricates or clears it.
  const [prov, setProv] = useState<{ sources?: string[]; needsVerify?: boolean }>({});

  useEffect(() => {
    const s = supplier ?? seed;
    if (!open) return;
    setName(s?.name ?? "");
    setType(s?.type ?? "cho");
    setChannels(s?.channels?.length ? s.channels.map((c) => ({ ...c })) : [{ kind: "zalo_chat", value: "" }]);
    setHandles(s?.handles ?? []);
    setAddress(s?.address ?? "");
    setLocation(s?.location);
    setHours(s?.hours ?? "");
    setShipInfo(s?.shipFee ?? s?.shipArea ?? "");
    setStoreLocatorUrl(s?.storeLocatorUrl ?? "");
    setProv({ sources: s?.sources, needsVerify: s?.needsVerify });
  }, [supplier, seed, open]);

  if (!open) return null;

  const toggleHandle = (g: string) => setHandles((xs) => (xs.includes(g) ? xs.filter((x) => x !== g) : [...xs, g]));
  const setChannel = (i: number, patch: Partial<SupplierChannel>) =>
    setChannels((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const addChannel = () => setChannels((cs) => [...cs, { kind: "phone_sms", value: "" }]);
  const removeChannel = (i: number) => setChannels((cs) => (cs.length > 1 ? cs.filter((_, j) => j !== i) : cs));

  const canSave = name.trim().length > 0 && channels.some((c) => c.value.trim()) && handles.length > 0;

  const save = () => {
    if (!canSave) return;
    const input: SupplierInput = {
      id: supplier?.id ?? "",
      name: name.trim(),
      type,
      channels: channels.filter((c) => c.value.trim()).map((c) => ({ kind: c.kind, value: c.value.trim(), label: c.label })),
      handles,
      address: address.trim() || undefined,
      location,
      hours: hours.trim() || undefined,
      shipFee: shipInfo.trim() || undefined,
      storeLocatorUrl: storeLocatorUrl.trim() || undefined,
      sources: prov.sources,
      needsVerify: prov.needsVerify,
    };
    saveSupplier(input);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={supplier ? "Sửa điểm mua" : "Thêm điểm mua"}>
      <div className="space-y-5">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Tên điểm mua</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Chị Ba rau, BHX Nguyễn Trãi…"
            className="w-full rounded-[12px] border border-hairline bg-raised px-3.5 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>

        {/* Type */}
        <div>
          <p className="mb-2 text-sm font-medium">Loại</p>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((tp) => (
              <button
                key={tp.v}
                onClick={() => setType(tp.v)}
                aria-pressed={type === tp.v}
                className={`rounded-full border px-3 py-1.5 text-xs ${type === tp.v ? "border-brand bg-brand-weak text-brand-ink" : "border-hairline text-muted"}`}
              >
                {tp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Channels */}
        <div>
          <p className="mb-2 text-sm font-medium">Kênh liên hệ</p>
          <div className="space-y-2.5">
            {channels.map((c, i) => {
              const cap = channelCapability(c.kind);
              return (
                <div key={i} className="rounded-[12px] border border-hairline p-2.5">
                  <div className="flex gap-2">
                    <select
                      value={c.kind}
                      onChange={(e) => setChannel(i, { kind: e.target.value as ChannelKind })}
                      className="rounded-lg border border-hairline bg-raised px-2 py-2 text-xs outline-none focus:border-brand"
                    >
                      {CHANNELS.map((ch) => (
                        <option key={ch.v} value={ch.v}>{ch.label}</option>
                      ))}
                    </select>
                    <input
                      value={c.value}
                      onChange={(e) => setChannel(i, { value: e.target.value })}
                      placeholder={CHANNELS.find((ch) => ch.v === c.kind)?.placeholder}
                      className="min-w-0 flex-1 rounded-lg border border-hairline bg-raised px-3 py-2 text-sm outline-none focus:border-brand"
                    />
                    {channels.length > 1 && (
                      <button onClick={() => removeChannel(i)} className="shrink-0 px-1.5 text-tertiary hover:text-danger" aria-label="Xoá kênh">✕</button>
                    )}
                  </div>
                  <p className={`mt-1.5 text-[11px] ${cap === "open" ? "text-amber" : "text-tertiary"}`}>{capNote[cap]}</p>
                </div>
              );
            })}
          </div>
          <button onClick={addChannel} className="mt-2 text-xs font-medium text-brand">+ Thêm kênh</button>
        </div>

        {/* Handles */}
        <div>
          <p className="mb-2 text-sm font-medium">Bán những nhóm hàng</p>
          <div className="flex flex-wrap gap-1.5">
            {GROUPS.map((g) => {
              const on = handles.includes(g);
              return (
                <button
                  key={g}
                  onClick={() => toggleHandle(g)}
                  aria-pressed={on}
                  className={`rounded-full border px-3 py-1.5 text-xs capitalize ${on ? "border-accent bg-accent-weak text-accent" : "border-hairline text-muted"}`}
                >
                  {on ? "✓ " : ""}{g}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-tertiary">Dùng để tự chia đơn đi chợ theo từng điểm mua.</p>
        </div>

        {/* Address + optional details */}
        <div className="space-y-2.5">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Địa chỉ <span className="font-normal text-tertiary">(không bắt buộc)</span></label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Số nhà, đường, quận…"
              className="w-full rounded-[12px] border border-hairline bg-raised px-3.5 py-2.5 text-sm outline-none focus:border-brand"
            />
          </div>
          <div className="flex gap-2">
            <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Giờ mở cửa" className="min-w-0 flex-1 rounded-[12px] border border-hairline bg-raised px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
            <input value={shipInfo} onChange={(e) => setShipInfo(e.target.value)} placeholder="Giao hàng / phí ship" className="min-w-0 flex-1 rounded-[12px] border border-hairline bg-raised px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
          </div>
          {(type === "sieu_thi" || type === "online") && (
            <input value={storeLocatorUrl} onChange={(e) => setStoreLocatorUrl(e.target.value)} placeholder="Trang tìm chi nhánh (chuỗi)" className="w-full rounded-[12px] border border-hairline bg-raised px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
          )}
        </div>

        {/* Map pin — household ground truth. Chains span many branches → skip. */}
        {(type === "cho" || type === "tiem") && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-sm font-medium">Vị trí trên bản đồ</p>
              {location && <button onClick={() => setLocation(undefined)} className="text-[11px] text-tertiary hover:text-danger">Xoá ghim</button>}
            </div>
            <SupplierMapView location={location} editable onChange={setLocation} height={190} />
            <p className="mt-1.5 text-[11px] text-tertiary">{location ? "Kéo ghim để chỉnh vị trí." : "Chạm lên bản đồ để đặt ghim vị trí điểm mua."}</p>
          </div>
        )}

        <button
          onClick={save}
          disabled={!canSave}
          className="cta-primary w-full rounded-full py-2.5 text-sm font-medium text-white disabled:opacity-40"
        >
          Lưu điểm mua
        </button>
      </div>
    </BottomSheet>
  );
}
