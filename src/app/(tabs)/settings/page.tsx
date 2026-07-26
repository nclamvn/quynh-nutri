"use client";

import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import { useTheme } from "@/ui/theme";
import type { DayName, Household } from "@/domain/types";

const DAYS: DayName[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MARKET_MODES: Household["marketMode"][] = ["traditional", "mixed", "supermarket"];

export default function SettingsPage() {
  const { household, updateHousehold } = useStore();
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();

  const toggleBusy = (d: DayName) => {
    const has = household.busyDays.includes(d);
    updateHousehold({ busyDays: has ? household.busyDays.filter((x) => x !== d) : [...household.busyDays, d] });
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 border-b border-hairline bg-bg/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-semibold">{t("settings.title")}</h1>
      </header>

      <div className="space-y-5 px-4 py-4">
        {/* Language */}
        <Row label={t("settings.language")}>
          <Segmented
            options={[
              ["vi", "Tiếng Việt"],
              ["en", "English"],
            ]}
            value={lang}
            onChange={(v) => setLang(v as "vi" | "en")}
          />
        </Row>

        {/* Theme */}
        <Row label={t("settings.theme")}>
          <Segmented
            options={[
              ["light", t("settings.themeLight")],
              ["dark", t("settings.themeDark")],
            ]}
            value={theme}
            onChange={(v) => setTheme(v as "light" | "dark")}
          />
        </Row>

        <hr className="border-hairline" />

        {/* Household size */}
        <Row label={t("settings.size")}>
          <div className="flex items-center gap-3">
            <Stepper value={household.size} onChange={(n) => updateHousehold({ size: Math.max(1, n) })} />
          </div>
        </Row>

        {/* Members */}
        <div>
          <p className="mb-2 text-sm font-medium">{t("settings.members")}</p>
          <ul className="space-y-1.5">
            {household.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-lg border border-hairline px-3 py-2 text-sm">
                <span>{m.role === "adult" ? (m.sex === "M" ? "Người lớn (Nam)" : "Người lớn (Nữ)") : `Trẻ ${m.ageBand}`}</span>
                <span className="text-xs text-muted">{m.activity}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Market mode */}
        <Row label={t("settings.marketMode")}>
          <Segmented
            options={MARKET_MODES.map((m) => [m, m] as [string, string])}
            value={household.marketMode}
            onChange={(v) => updateHousehold({ marketMode: v as Household["marketMode"] })}
          />
        </Row>

        {/* Busy days */}
        <div>
          <p className="mb-2 text-sm font-medium">{t("settings.busyDays")}</p>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((d, i) => {
              const on = household.busyDays.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleBusy(d)}
                  className={`rounded-full border px-3 py-1 text-xs ${on ? "border-amber bg-amber-weak text-amber" : "border-hairline text-muted"}`}
                >
                  {t(`day.${i}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lactating */}
        <Row label={t("settings.lactating")}>
          <button
            onClick={() => updateHousehold({ lactatingMember: !household.lactatingMember })}
            className={`relative h-6 w-11 rounded-full transition ${household.lactatingMember ? "bg-brand" : "bg-hairline"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                household.lactatingMember ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </Row>

        <p className="pt-2 text-[11px] text-muted">
          Hộ này là một cụ thể hoá (instance) của repertoire chung (B0). Chỉnh ở đây tạo lớp B1 ghi đè khi bạn sửa món.
        </p>
      </div>
    </div>
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
          className={`rounded-md px-3 py-1 text-xs ${value === val ? "bg-brand text-white" : "text-muted"}`}
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
