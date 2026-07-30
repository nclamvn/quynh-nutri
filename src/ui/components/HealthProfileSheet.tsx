"use client";

import { useState, useEffect } from "react";
import { BottomSheet } from "./BottomSheet";
import { HealthDisclaimer } from "./HealthDisclaimer";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import { canSetMaternalStage } from "@/domain/health";
import type { Member, LifeStage, Allergen } from "@/domain/types";

// Member editor: allergies (everyone) + life stage (adult females, T1 wellness).
// NO clinical fields – that seam ships dormant.
const MATERNAL_STAGES: LifeStage[] = ["pregnant_t1", "pregnant_t2", "pregnant_t3", "lactating_0_6", "lactating_7_12"];
const ALLERGENS: Allergen[] = ["shellfish", "fish", "egg", "soy", "dairy", "gluten", "peanut"];

export function HealthProfileSheet({ member, onClose }: { member: Member | null; onClose: () => void }) {
  const { updateMemberHealthProfile, updateMemberAllergies } = useStore();
  const { t } = useI18n();
  const [stage, setStage] = useState<LifeStage>("none");
  const [allergies, setAllergies] = useState<Allergen[]>([]);

  useEffect(() => {
    // Controlled sheet draft must reset when the selected member changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStage(member?.healthProfile?.lifeStage ?? "none");
    setAllergies(member?.allergies ?? []);
  }, [member]);

  if (!member) return null;
  const maternal = canSetMaternalStage(member);
  const memberName = member.role === "adult" ? (member.sex === "M" ? "Người lớn (Nam)" : "Người lớn (Nữ)") : `Trẻ ${member.ageBand ?? ""}`;
  const toggleAllergen = (a: Allergen) => setAllergies((xs) => (xs.includes(a) ? xs.filter((x) => x !== a) : [...xs, a]));

  const save = () => {
    updateMemberAllergies(member.id, allergies);
    updateMemberHealthProfile(member.id, stage === "none" ? null : { lifeStage: stage, mode: "wellness" });
    onClose();
  };

  return (
    <BottomSheet open={!!member} onClose={onClose} title={t("health.memberTitle")}>
      <div className="space-y-5">
        <p className="text-sm font-medium">{memberName}</p>

        {/* Allergies – for everyone (hard exclusion) */}
        <div>
          <p className="mb-2 text-sm font-medium">{t("health.allergies")}</p>
          <div className="flex flex-wrap gap-1.5">
            {ALLERGENS.map((a) => {
              const on = allergies.includes(a);
              return (
                <button
                  key={a}
                  onClick={() => toggleAllergen(a)}
                  aria-pressed={on}
                  className={`rounded-full border px-3 py-1.5 text-xs ${on ? "border-danger bg-danger-weak text-danger" : "border-hairline text-muted"}`}
                >
                  {on ? "✓ " : ""}{t(`allergen.${a}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Life stage – adult females only */}
        {maternal && (
          <div>
            <p className="mb-2 text-sm font-medium">{t("health.stage")}</p>
            <div className="flex flex-col gap-1.5">
              {(["none", ...MATERNAL_STAGES] as LifeStage[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStage(s)}
                  aria-pressed={stage === s}
                  className={`flex items-center justify-between rounded-[12px] border px-3.5 py-2.5 text-left text-sm ${
                    stage === s ? "border-brand bg-brand-weak text-brand-ink" : "border-hairline text-ink"
                  }`}
                >
                  <span>{t(`health.stage.${s}`)}</span>
                  {stage === s && <span className="text-brand">✓</span>}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-tertiary">{t("health.sourceNote")}</p>
            {stage !== "none" && <HealthDisclaimer className="mt-2" />}
          </div>
        )}

        <button onClick={save} className="cta-primary w-full rounded-full py-2.5 text-sm font-medium text-white">
          {t("health.save")}
        </button>
      </div>
    </BottomSheet>
  );
}
