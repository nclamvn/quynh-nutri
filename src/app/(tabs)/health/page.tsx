"use client";

import { useState } from "react";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import { PageContainer } from "@/ui/components/PageContainer";
import { PageHeader } from "@/ui/components/PageHeader";
import { HealthProfileSheet } from "@/ui/components/HealthProfileSheet";
import { HealthDisclaimer } from "@/ui/components/HealthDisclaimer";
import type { Member } from "@/domain/types";

const CLINICAL = ["Tiểu đường type 2", "Tăng huyết áp", "Mỡ máu", "Gout", "Bệnh thận"];

export default function HealthPage() {
  const { household } = useStore();
  const { t } = useI18n();
  const [editing, setEditing] = useState<Member | null>(null);

  const memberName = (m: Member) =>
    m.role === "adult" ? (m.sex === "M" ? "Người lớn (Nam)" : "Người lớn (Nữ)") : `Trẻ ${m.ageBand ?? ""}`;

  return (
    <PageContainer>
      <PageHeader title={t("health.pageTitle")} subtitle={t("health.pageSub")} />

      {/* Life stage + allergies per member — the discoverable T1 entry */}
      <section className="mb-6">
        <h2 className="mb-2 px-1 text-xs font-medium text-muted">{t("health.membersTitle")}</h2>
        <ul data-stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {household.members.map((m, i) => {
            const ls = m.healthProfile?.lifeStage;
            const nAllergy = m.allergies?.length ?? 0;
            return (
              <li key={m.id} style={{ "--i": i } as React.CSSProperties}>
                <button
                  onClick={() => setEditing(m)}
                  className="card card-interactive flex w-full items-center gap-3 p-4 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-weak text-sm font-medium text-brand-ink">
                    {m.role === "adult" ? (m.sex === "M" ? "B" : "M") : "T"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{memberName(m)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {ls && ls !== "none" ? (
                        <span className="rounded-full bg-brand-weak px-2 py-0.5 text-[10px] text-brand-ink">{t(`health.stage.${ls}`)}</span>
                      ) : (
                        <span className="text-[11px] text-tertiary">{t("health.noStage")}</span>
                      )}
                      {nAllergy > 0 && (
                        <span className="rounded-full bg-danger-weak px-2 py-0.5 text-[10px] text-danger">⚠ {nAllergy} {t("health.allergies").toLowerCase()}</span>
                      )}
                    </div>
                  </div>
                  <span aria-hidden className="shrink-0 text-sm font-medium text-brand">{t("health.setProfile")}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Clinical diets — visible but gated (execute, not prescribe) */}
      <section className="mb-6">
        <div className="card p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t("health.clinicalTitle")}</h2>
            <span className="rounded-full bg-amber-weak px-2 py-0.5 text-[10px] text-amber">{t("health.clinicalSoon")}</span>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {CLINICAL.map((c) => (
              <span key={c} className="rounded-full border border-hairline px-2.5 py-1 text-xs text-muted">{c}</span>
            ))}
          </div>
          <p className="text-[12px] leading-relaxed text-tertiary">{t("health.clinicalNote")}</p>
        </div>
      </section>

      <HealthDisclaimer />

      <HealthProfileSheet member={editing} onClose={() => setEditing(null)} />
    </PageContainer>
  );
}
