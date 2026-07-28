"use client";

import { useI18n } from "@/i18n/context";
import { PageContainer } from "@/ui/components/PageContainer";
import { PageHeader } from "@/ui/components/PageHeader";
import { HealthDisclaimer } from "@/ui/components/HealthDisclaimer";
import { FamilySpaceView } from "@/ui/components/FamilySpaceView";

const CLINICAL = ["Tiểu đường type 2", "Tăng huyết áp", "Mỡ máu", "Gout", "Bệnh thận"];

export default function HealthPage() {
  const { t } = useI18n();

  return (
    <PageContainer>
      <PageHeader title={t("health.pageTitle")} subtitle={t("health.pageSub")} />

      {/* Declare the family + see the whole household in one frame (add / edit /
          remove members, allergies, today's states). */}
      <section className="mb-6">
        <FamilySpaceView />
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
    </PageContainer>
  );
}
