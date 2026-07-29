"use client";

import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import { useTheme } from "@/ui/theme";
import { PageContainer } from "@/ui/components/PageContainer";
import { PageHeader } from "@/ui/components/PageHeader";
import { MemberSheet, type MemberSubject } from "@/ui/components/MemberSheet";
import { useState } from "react";
import type { DietRestriction } from "@/domain/types";
import type { DayName, Household } from "@/domain/types";

const DIET_RESTRICTIONS: DietRestriction[] = ["vegetarian", "pescatarian", "no_pork", "no_beef"];

const DAYS: DayName[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MARKET_MODES: Household["marketMode"][] = ["traditional", "mixed", "supermarket"];

export default function SettingsPage() {
  const { household, updateHousehold } = useStore();
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [subject, setSubject] = useState<MemberSubject>(null);

  const toggleBusy = (d: DayName) => {
    const has = household.busyDays.includes(d);
    updateHousehold({ busyDays: has ? household.busyDays.filter((x) => x !== d) : [...household.busyDays, d] });
  };

  return (
    <PageContainer>
      <PageHeader title={t("settings.title")} />

      <div data-settings-grid className="grid w-full gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <Section title={t("settings.secAppearance")}>
            <Row label={t("settings.language")}>
              <Segmented options={[["vi", "Tiếng Việt"], ["en", "English"]]} value={lang} onChange={(v) => setLang(v as "vi" | "en")} />
            </Row>
            <Row label={t("settings.theme")}>
              <Segmented
                options={[["light", t("settings.themeLight")], ["dark", t("settings.themeDark")]]}
                value={theme}
                onChange={(v) => setTheme(v as "light" | "dark")}
              />
            </Row>
          </Section>

          <Section title={t("settings.secRhythm")}>
            <Row label={t("settings.marketMode")}>
              <Segmented
                options={MARKET_MODES.map((m) => [m, m] as [string, string])}
                value={household.marketMode}
                onChange={(v) => updateHousehold({ marketMode: v as Household["marketMode"] })}
              />
            </Row>
            <div>
              <p className="mb-2 text-sm font-medium">{t("settings.busyDays")}</p>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((d, i) => {
                  const on = household.busyDays.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleBusy(d)}
                      className={`control-chip rounded-full border px-3 text-xs ${on ? "border-amber bg-amber-weak text-amber" : "border-hairline text-muted"}`}
                    >
                      {t(`day.${i}`)}
                    </button>
                  );
                })}
              </div>
            </div>
            <Row label={t("settings.lactating")}>
              <button
                onClick={() => updateHousehold({ lactatingMember: !household.lactatingMember })}
                className={`relative h-6 w-11 rounded-full transition ${household.lactatingMember ? "bg-brand" : "bg-hairline"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${household.lactatingMember ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </Row>
          </Section>
        </div>

        <div className="space-y-5">
          <Section title={t("settings.secHousehold")}>
            <Row label={t("settings.size")}>
              <Stepper value={household.size} onChange={(n) => updateHousehold({ size: Math.max(1, n) })} />
            </Row>
            <div>
              <p className="mb-2 text-sm font-medium">{t("settings.members")}</p>
              <ul className="space-y-1.5">
                {household.members.map((m) => {
                  const nm = m.name?.trim() || (m.role === "adult" ? (m.sex === "M" ? "Người lớn (Nam)" : "Người lớn (Nữ)") : `Trẻ ${m.ageBand ?? ""}`);
                  return (
                    <li key={m.id}>
                      <button
                        onClick={() => setSubject(m)}
                        className="flex min-h-10 w-full items-center gap-3 rounded-[12px] border border-hairline bg-surface/40 px-3 py-2 text-left text-sm transition-colors hover:bg-surface"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-weak text-[11px] font-medium text-brand-ink">
                          {m.role === "adult" ? (m.sex === "M" ? "B" : "M") : "T"}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{nm}</span>
                        {m.allergies && m.allergies.length > 0 && (
                          <span className="shrink-0 rounded-full bg-amber-weak px-2 py-0.5 text-[10px] text-amber">cần tránh {m.allergies.length}</span>
                        )}
                        <span aria-hidden className="shrink-0 text-tertiary">›</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button onClick={() => setSubject("new")} className="mt-2 min-h-10 w-full rounded-[12px] border border-dashed border-hairline px-3 text-sm font-medium text-brand">
                + Thêm thành viên
              </button>
            </div>
          </Section>

          <Section title={t("settings.diet")}>
            <div className="flex flex-wrap gap-1.5">
              {DIET_RESTRICTIONS.map((r) => {
                const on = (household.restrictions ?? []).includes(r);
                return (
                  <button
                    key={r}
                    aria-pressed={on}
                    onClick={() => {
                      const cur = household.restrictions ?? [];
                      updateHousehold({ restrictions: on ? cur.filter((x) => x !== r) : [...cur, r] });
                    }}
                    className={`control-chip rounded-full border px-3 text-xs ${on ? "border-brand bg-brand-weak text-brand" : "border-hairline text-muted"}`}
                  >
                    {on ? "✓ " : ""}{t(`restriction.${r}`)}
                  </button>
                );
              })}
            </div>
          </Section>
        </div>

        <p className="text-[11px] leading-relaxed text-muted xl:col-span-2">
          Hộ này là một cụ thể hoá (instance) của repertoire chung (B0). Chỉnh ở đây tạo lớp B1 ghi đè khi bạn sửa món.
        </p>
      </div>

      <MemberSheet subject={subject} onClose={() => setSubject(null)} />
    </PageContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-tertiary">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}

function Segmented({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex rounded-lg border border-hairline p-0.5">
      {options.map(([val, label]) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`h-8 rounded-md px-3 text-xs ${value === val ? "bg-brand text-white" : "text-muted"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => onChange(value - 1)} className="h-8 w-8 rounded-full border border-hairline text-lg">
        −
      </button>
      <span className="tnum w-6 text-center text-sm">{value}</span>
      <button onClick={() => onChange(value + 1)} className="h-8 w-8 rounded-full border border-hairline text-lg">
        +
      </button>
    </div>
  );
}
