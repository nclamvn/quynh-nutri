"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore, type SupplierInput } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import { PageContainer } from "@/ui/components/PageContainer";
import { PageHeader } from "@/ui/components/PageHeader";
import { SupplierSheet } from "@/ui/components/SupplierSheet";
import { Blossom } from "@/ui/components/Blossom";
import { StoreIcon } from "@/ui/components/icons";
import { supplierTone } from "@/domain/supplier";
import { SUPPLIER_REGISTRY } from "@/data/seed/suppliers";
import type { Supplier } from "@/domain/types";

const TYPE_LABEL: Record<string, string> = { cho: "Chợ", sieu_thi: "Siêu thị", tiem: "Tiệm", online: "Online" };
const TONE_DOT: Record<string, string> = { accent: "text-accent", amber: "text-amber", muted: "text-tertiary" };

export default function SuppliersPage() {
  const { suppliers } = useStore();
  const { t } = useI18n();
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [seed, setSeed] = useState<SupplierInput | null>(null);

  const existingNames = new Set(suppliers.map((s) => s.name.toLowerCase()));
  const suggestions = SUPPLIER_REGISTRY.filter((s) => !existingNames.has(s.name.toLowerCase())).slice(0, 8);

  return (
    <PageContainer>
      <PageHeader
        title={t("supplier.title")}
        subtitle={suppliers.length ? t("supplier.meta", { count: suppliers.length }) : undefined}
        actions={
          <button
            onClick={() => setSeed({ id: "", name: "", type: "cho", channels: [], handles: [] })}
            className="cta-primary rounded-full px-3.5 py-2 text-sm font-medium text-white"
          >
            + {t("supplier.add")}
          </button>
        }
      />

      {suppliers.length === 0 ? (
        <div className="relative grid min-h-[38vh] place-content-center justify-items-center text-center">
          <Blossom size={110} className="pointer-events-none absolute -top-2 text-brand/10" />
          <span className="relative mb-3 text-brand/50"><StoreIcon className="h-12 w-12" /></span>
          <p className="relative max-w-xs text-sm text-muted">{t("supplier.empty")}</p>
        </div>
      ) : (
        <div data-stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((s, i) => {
            const tone = supplierTone(s);
            return (
              <Link
                key={s.id}
                href={`/suppliers/${s.id}`}
                style={{ "--i": i } as React.CSSProperties}
                className="card card-interactive h-fit p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] ${TONE_DOT[tone]}`}>●</span>
                      <h2 className="truncate text-sm font-semibold">{s.name}</h2>
                    </div>
                    <span className="mt-0.5 inline-block rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted">{TYPE_LABEL[s.type]}</span>
                    {s.needsVerify && <span className="ml-1 rounded-full border border-amber/40 bg-amber-weak px-2 py-0.5 text-[10px] text-amber">cần xác minh</span>}
                  </div>
                  <span className="shrink-0 text-tertiary">→</span>
                </div>
                {s.address && <p className="mt-2 line-clamp-1 text-xs text-muted">📍 {s.address}</p>}
                {s.hours && <p className="mt-0.5 text-xs text-muted">🕕 {s.hours}</p>}
                {s.handles && s.handles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.handles.slice(0, 5).map((h) => (
                      <span key={h} className="rounded-full bg-surface px-2 py-0.5 text-[10px] capitalize text-muted">{h}</span>
                    ))}
                    {s.handles.length > 5 && <span className="text-[10px] text-tertiary">+{s.handles.length - 5}</span>}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-6">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-tertiary">{t("supplier.suggestions")}</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSeed({ id: "", name: s.name, type: s.type, channels: s.channels.map((c) => ({ ...c })), handles: s.handles ?? [], storeLocatorUrl: s.storeLocatorUrl, sources: s.sources, needsVerify: s.needsVerify })}
                className="rounded-full border border-hairline px-3 py-1.5 text-xs text-muted hover:bg-surface"
              >
                + {s.name}{s.needsVerify ? " ⚠" : ""}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-tertiary">{t("supplier.suggestNote")}</p>
        </div>
      )}

      <SupplierSheet supplier={editing} seed={seed} onClose={() => { setEditing(null); setSeed(null); }} />
    </PageContainer>
  );
}
