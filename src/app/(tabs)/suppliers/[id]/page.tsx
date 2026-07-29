"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import { PageContainer } from "@/ui/components/PageContainer";
import { PageHeader } from "@/ui/components/PageHeader";
import { SupplierSheet } from "@/ui/components/SupplierSheet";
import { SupplierMapView } from "@/ui/components/SupplierMapView";
import { directionsUrl, hasMapPin, supplierTone } from "@/domain/supplier";
import { channelCapability } from "@/domain/order";
import type { ChannelKind } from "@/domain/types";

const TYPE_LABEL: Record<string, string> = { cho: "Chợ", sieu_thi: "Siêu thị", tiem: "Tiệm", online: "Online" };
const TONE_DOT: Record<string, string> = { accent: "text-accent", amber: "text-amber", muted: "text-tertiary" };
const CHANNEL_LABEL: Record<ChannelKind, string> = {
  zalo_chat: "Zalo", phone_sms: "Điện thoại / SMS", hotline: "Tổng đài", their_zalo_oa: "Zalo OA", their_app_web: "App / Web",
};
const capNote: Record<string, string> = {
  push: "App soạn sẵn đơn, bạn gửi qua kênh này.",
  call: "Gọi để đặt — app hiện đơn cho bạn đọc.",
  open: "App chỉ mở app/web của họ, bạn tự chọn hàng.",
};

function channelHref(kind: ChannelKind, value: string): string | null {
  if (kind === "phone_sms" || kind === "hotline") return `tel:${value.replace(/\s/g, "")}`;
  if (kind === "zalo_chat") return /^https?:\/\//i.test(value) ? value : `https://zalo.me/${value.replace(/[^\d]/g, "") || value}`;
  return /^https?:\/\//i.test(value) ? value : /^[\w.-]+\.\w{2,}(\/.*)?$/.test(value) ? `https://${value}` : null;
}

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const { suppliers, hydrated } = useStore();
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);

  const s = suppliers.find((x) => x.id === params.id);

  if (!s) {
    return (
      <PageContainer>
        <Link href="/suppliers" className="text-sm text-brand">← {t("supplier.detail.back")}</Link>
        <p className="mt-8 text-center text-sm text-muted">{hydrated ? "Không tìm thấy điểm mua này." : "Đang tải…"}</p>
      </PageContainer>
    );
  }

  const tone = supplierTone(s);
  const dir = directionsUrl(s);
  const shipText = s.shipFee || s.shipArea;

  return (
    <PageContainer>
      <Link href="/suppliers" className="mb-5 inline-flex text-sm text-brand">
        ← {t("supplier.detail.back")}
      </Link>
      <PageHeader
        title={s.name}
        subtitle={TYPE_LABEL[s.type]}
        actions={
          <>
            <span aria-hidden className={`text-xs ${TONE_DOT[tone]}`}>●</span>
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 rounded-full border border-hairline px-3 py-1.5 text-xs text-muted hover:bg-surface"
            >
              Sửa
            </button>
          </>
        }
      />

      {s.needsVerify && (
        <div className="rounded-[12px] border border-amber/30 bg-amber-weak px-3.5 py-2.5 text-xs text-amber">
          ⚠ {t("supplier.detail.verify")}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Map / location */}
        <div className="card overflow-hidden p-0">
          {hasMapPin(s) ? (
            <SupplierMapView location={s.location} height={220} className="rounded-none border-0" />
          ) : (
            <div className="grid h-[140px] place-content-center bg-surface/50 text-center text-xs text-tertiary">
              {s.storeLocatorUrl ? "Chuỗi nhiều chi nhánh — dùng trang tìm chi nhánh bên dưới." : "Chưa đặt vị trí bản đồ."}
            </div>
          )}
          <div className="space-y-1.5 px-4 py-3 text-sm">
            {s.address && <p className="text-ink">📍 {s.address}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              {dir && (
                <a href={dir} target="_blank" rel="noopener" className="cta-primary rounded-full px-3 py-1.5 text-xs font-medium text-white">
                  {t("supplier.detail.directions")}
                </a>
              )}
              {s.storeLocatorUrl && (
                <a href={s.storeLocatorUrl} target="_blank" rel="noopener" className="rounded-full border border-hairline px-3 py-1.5 text-xs text-ink hover:bg-surface">
                  {t("supplier.detail.locator")}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="card space-y-3 p-4 text-sm">
          <Row label={t("supplier.detail.hours")} value={s.hours} t={t} />
          <Row label={t("supplier.detail.ship")} value={shipText} t={t} />
          {s.handles && s.handles.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted">{t("supplier.detail.handles")}</p>
              <div className="flex flex-wrap gap-1">
                {s.handles.map((h) => <span key={h} className="rounded-full bg-surface px-2 py-0.5 text-[11px] capitalize text-ink">{h}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Channels */}
      <div className="card mt-4 p-4">
        <p className="mb-2 text-sm font-semibold">{t("supplier.detail.channels")}</p>
        <ul className="space-y-2.5">
          {s.channels.map((c, i) => {
            const cap = channelCapability(c.kind);
            const href = channelHref(c.kind, c.value);
            return (
              <li key={i} className="flex items-start justify-between gap-3 rounded-[12px] border border-hairline p-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{c.label || CHANNEL_LABEL[c.kind]}</p>
                  <p className="truncate text-xs text-muted">{c.value}</p>
                  <p className={`mt-1 text-[11px] ${cap === "open" ? "text-amber" : "text-tertiary"}`}>{capNote[cap]}</p>
                </div>
                {href && (
                  <a href={href} target={c.kind === "phone_sms" || c.kind === "hotline" ? undefined : "_blank"} rel="noopener" className="shrink-0 rounded-full border border-hairline px-3 py-1.5 text-xs text-ink hover:bg-surface">
                    {cap === "call" ? t("supplier.detail.call") : "Mở"}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Sources (provenance) */}
      {s.sources && s.sources.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-tertiary">{t("supplier.detail.sources")}</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
            {s.sources.map((src) => <li key={src}>· {src}</li>)}
          </ul>
        </div>
      )}

      <Link href="/shopping" className="mt-6 inline-block text-sm font-medium text-brand">{t("supplier.detail.order")} →</Link>

      <SupplierSheet supplier={editing ? s : null} onClose={() => setEditing(false)} />
    </PageContainer>
  );
}

function Row({ label, value, t }: { label: string; value?: string; t: (k: string) => string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs font-medium text-muted">{label}</span>
      <span className={value ? "text-right text-ink" : "text-right text-tertiary"}>{value || t("supplier.detail.noneField")}</span>
    </div>
  );
}
