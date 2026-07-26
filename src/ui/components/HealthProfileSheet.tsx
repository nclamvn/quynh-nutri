"use client";

import { useState, useEffect } from "react";
import { BottomSheet } from "./BottomSheet";
import { HealthDisclaimer } from "./HealthDisclaimer";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import { canSetMaternalStage } from "@/domain/health";
import type { Member, LifeStage } from "@/domain/types";

// S1 — set a member's life stage (T1). Wellness mode only; NO clinical fields
// (no cap inputs, no disease codes) — that seam ships dormant.
const MATERNAL_STAGES: LifeStage[] = ["pregnant_t1", "pregnant_t2", "pregnant_t3", "lactating_0_6", "lactating_7_12"];

export function HealthProfileSheet({ member, onClose }: { member: Member | null; onClose: () => void }) {
  const { updateMemberHealthProfile } = useStore();
  const { t } = useI18n();
  const [stage, setStage] = useState<LifeStage>("none");

  useEffect(() => {
    setStage(member?.healthProfile?.lifeStage ?? "none");
  }, [member]);

  if (!member) return null;
  const maternal = canSetMaternalStage(member);
  const options: LifeStage[] = maternal ? ["none", ...MATERNAL_STAGES] : ["none"];

  const save = () => {
    updateMemberHealthProfile(member.id, stage === "none" ? null : { lifeStage: stage, mode: "wellness" });
    onClose();
  };

  return (
    <BottomSheet open={!!member} onClose={onClose} title={t("health.title")}>
      <div className="space-y-4">
        <p className="text-sm text-muted">
          {member.role === "adult" ? (member.sex === "M" ? "Người lớn (Nam)" : "Người lớn (Nữ)") : `Trẻ ${member.ageBand ?? ""}`}
        </p>

        {!maternal ? (
          <p className="rounded-[12px] border border-hairline bg-surface/50 px-3 py-3 text-sm text-muted">{t("health.notEligible")}</p>
        ) : (
          <div>
            <p className="mb-2 text-sm font-medium">{t("health.stage")}</p>
            <div className="flex flex-col gap-1.5">
              {options.map((s) => (
                <button
                  key={s}
                  onClick={() => setStage(s)}
                  className={`flex items-center justify-between rounded-[12px] border px-3.5 py-2.5 text-left text-sm ${
                    stage === s ? "border-brand bg-brand-weak text-brand-ink" : "border-hairline text-ink"
                  }`}
                >
                  <span>{t(`health.stage.${s}`)}</span>
                  {stage === s && <span className="text-brand">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-[11px] text-tertiary">{t("health.sourceNote")}</p>
        <HealthDisclaimer />

        <button onClick={save} className="cta-primary w-full rounded-full py-2.5 text-sm font-medium text-white">
          {t("health.save")}
        </button>
      </div>
    </BottomSheet>
  );
}
