"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  finishHouseholdOnboarding,
  startHouseholdOnboarding,
} from "@/app/actions";
import {
  ONBOARDING_DAYS,
  ONBOARDING_RESTRICTIONS,
} from "@/domain/onboarding";
import type { DayName, DietRestriction, Household } from "@/domain/types";
import { useI18n } from "@/i18n/context";
import { useStore } from "@/ui/store";
import { FlowerLogo } from "./FlowerLogo";

const MARKET_MODES: Household["marketMode"][] = [
  "traditional",
  "mixed",
  "supermarket",
];

const dayLabels = {
  vi: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

const copy = {
  vi: {
    eyebrow: "Kê khai bếp nhà mình",
    title: "Để bà quản gia bắt đầu đúng",
    intro: "Ba bước ngắn, chỉ những điều cần thiết để tính khẩu phần và nhịp đi chợ.",
    step: "Bước",
    peopleTitle: "Nhà mình có bao nhiêu người?",
    peopleHint: "Chưa cần tên hay thông tin sức khỏe.",
    adults: "Người lớn",
    children: "Trẻ em",
    restrictionsTitle: "Cả nhà thường tránh gì?",
    restrictionsHint: "Có thể bỏ qua. Dị ứng riêng của từng người thêm sau trong Cài đặt.",
    none: "Không có kiêng chung",
    rhythmTitle: "Nhịp bếp của gia đình",
    rhythmHint: "Chọn ngày bận để ưu tiên món gọn và cách nhà mình thường đi chợ.",
    busyDays: "Ngày bận",
    marketMode: "Cách đi chợ",
    traditional: "Chợ truyền thống",
    mixed: "Kết hợp",
    supermarket: "Siêu thị",
    review: "Xác nhận kê khai",
    truth: "Chưa có thực đơn hay danh sách chợ nào được áp dụng. Sau bước này, bạn sẽ xem đề xuất tuần dưới dạng diff và tự xác nhận.",
    back: "Quay lại",
    next: "Tiếp tục",
    finish: "Hoàn tất và xem đề xuất",
    saving: "Đang lưu...",
    error: "Chưa lưu được kê khai. Dữ liệu bạn vừa chọn vẫn được giữ để thử lại.",
    adultShort: "người lớn",
    childShort: "trẻ em",
  },
  en: {
    eyebrow: "Set up your kitchen",
    title: "Give your housekeeper the right start",
    intro: "Three short steps with only what is needed for portions and shopping rhythm.",
    step: "Step",
    peopleTitle: "How many people are at home?",
    peopleHint: "No names or health details are needed.",
    adults: "Adults",
    children: "Children",
    restrictionsTitle: "What does the whole household avoid?",
    restrictionsHint: "Optional. Personal allergies can be added later in Settings.",
    none: "No household restriction",
    rhythmTitle: "Your household rhythm",
    rhythmHint: "Choose busy days for simpler meals and how you usually shop.",
    busyDays: "Busy days",
    marketMode: "Shopping style",
    traditional: "Traditional market",
    mixed: "Mixed",
    supermarket: "Supermarket",
    review: "Confirm setup",
    truth: "No menu or shopping list has been applied. Next, you will review a weekly proposal as a diff and confirm it yourself.",
    back: "Back",
    next: "Continue",
    finish: "Finish and review proposal",
    saving: "Saving...",
    error: "Setup could not be saved. Your selections are still here so you can retry.",
    adultShort: "adults",
    childShort: "children",
  },
} as const;

export function HouseholdOnboarding() {
  const { hydrated, household } = useStore();
  const { lang, t } = useI18n();
  const c = copy[lang];
  const [step, setStep] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [restrictions, setRestrictions] = useState<DietRestriction[]>([]);
  const [busyDays, setBusyDays] = useState<DayName[]>([]);
  const [marketMode, setMarketMode] = useState<Household["marketMode"]>("mixed");
  const [requestId] = useState(() => crypto.randomUUID());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const needsOnboarding = hydrated && household.members.length === 0;
  const memberCount = adults + children;

  useEffect(() => {
    if (!needsOnboarding) return;
    void startHouseholdOnboarding().catch(() => undefined);
  }, [needsOnboarding]);

  useEffect(() => {
    if (!needsOnboarding) {
      if (sessionStorage.getItem("qk-open-proposal-after-onboarding") === "1") {
        sessionStorage.removeItem("qk-open-proposal-after-onboarding");
        window.dispatchEvent(new Event("open-assistant"));
      }
      return;
    }
    titleRef.current?.focus();
  }, [needsOnboarding, step]);

  useEffect(() => {
    if (!needsOnboarding) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [needsOnboarding]);

  const places = useMemo(() => [
    ...Array.from({ length: adults }, (_, index) => ({
      key: `adult-${index}`,
      kind: "adult" as const,
    })),
    ...Array.from({ length: children }, (_, index) => ({
      key: `child-${index}`,
      kind: "child" as const,
    })),
  ], [adults, children]);

  if (!needsOnboarding) return null;

  const changeCount = (
    kind: "adults" | "children",
    delta: number,
  ) => {
    const current = kind === "adults" ? adults : children;
    const next = Math.max(0, current + delta);
    if (next + (kind === "adults" ? children : adults) > 12) return;
    if (kind === "adults") setAdults(next);
    else setChildren(next);
    setError("");
  };

  const toggleRestriction = (restriction: DietRestriction) => {
    setRestrictions((current) =>
      current.includes(restriction)
        ? current.filter((item) => item !== restriction)
        : [...current, restriction],
    );
  };

  const toggleBusyDay = (day: DayName) => {
    setBusyDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day],
    );
  };

  const goNext = () => {
    if (step === 1 && memberCount < 1) {
      setError(lang === "vi" ? "Hãy kê khai ít nhất một thành viên." : "Add at least one household member.");
      return;
    }
    setError("");
    setStep((current) => Math.min(3, current + 1));
  };

  const finish = async () => {
    if (saving || memberCount < 1) return;
    setSaving(true);
    setError("");
    try {
      await finishHouseholdOnboarding({
        requestId,
        adults,
        children,
        restrictions,
        busyDays,
        marketMode,
      });
      sessionStorage.setItem("qk-open-proposal-after-onboarding", "1");
      window.location.assign("/overview");
    } catch {
      setError(c.error);
      setSaving(false);
    }
  };

  return (
    <div
      data-testid="household-onboarding"
      className="fixed inset-0 z-[80] overflow-y-auto bg-bg/96 px-4 py-4 backdrop-blur-xl sm:grid sm:place-items-center sm:px-6 sm:py-8"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="card mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-[720px] flex-col overflow-hidden sm:min-h-0"
      >
        <header className="border-b border-hairline px-5 pb-4 pt-5 sm:px-8 sm:pt-7">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-brand"><FlowerLogo size={24} /></span>
              Q&apos;s Kitchen
            </span>
            <span className="text-xs font-semibold text-brand">
              {c.step} {step}/3
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-1.5" aria-hidden>
            {[1, 2, 3].map((item) => (
              <span
                key={item}
                className={`h-1 rounded-full transition-colors ${
                  item <= step ? "bg-brand" : "bg-hairline"
                }`}
              />
            ))}
          </div>
        </header>

        <div className="flex flex-1 flex-col px-5 py-6 sm:px-8 sm:py-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
            {c.eyebrow}
          </p>
          <h1
            id="onboarding-title"
            ref={titleRef}
            tabIndex={-1}
            className="mt-2 max-w-xl font-serif text-[28px] font-semibold leading-tight tracking-[-0.03em] outline-none sm:text-[38px]"
          >
            {step === 1
              ? c.peopleTitle
              : step === 2
                ? c.restrictionsTitle
                : c.rhythmTitle}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            {step === 1
              ? c.peopleHint
              : step === 2
                ? c.restrictionsHint
                : c.rhythmHint}
          </p>

          {step === 1 && (
            <div className="mt-7">
              <div
                aria-live="polite"
                className="mb-6 flex min-h-20 flex-wrap items-end justify-center gap-2 rounded-[18px] border border-hairline bg-surface/45 px-4 py-4"
              >
                {places.length === 0 ? (
                  <span className="text-sm text-muted">
                    {lang === "vi" ? "Bàn ăn đang trống" : "The table is empty"}
                  </span>
                ) : places.map((place) => (
                  <span
                    key={place.key}
                    className={`relative grid place-items-center rounded-full border border-brand/20 bg-brand-weak text-brand ${
                      place.kind === "adult" ? "h-12 w-12" : "h-9 w-9"
                    }`}
                    aria-label={place.kind === "adult" ? c.adultShort : c.childShort}
                  >
                    <span className={place.kind === "adult" ? "text-lg" : "text-sm"} aria-hidden>
                      {place.kind === "adult" ? "●" : "•"}
                    </span>
                  </span>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Counter
                  label={c.adults}
                  value={adults}
                  onDecrease={() => changeCount("adults", -1)}
                  onIncrease={() => changeCount("adults", 1)}
                />
                <Counter
                  label={c.children}
                  value={children}
                  onDecrease={() => changeCount("children", -1)}
                  onIncrease={() => changeCount("children", 1)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-7 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={restrictions.length === 0}
                onClick={() => setRestrictions([])}
                className={`min-h-12 rounded-[14px] border px-4 text-left text-sm font-medium ${
                  restrictions.length === 0
                    ? "border-brand bg-brand-weak text-brand"
                    : "border-hairline bg-raised text-muted"
                }`}
              >
                {restrictions.length === 0 ? "✓ " : ""}{c.none}
              </button>
              {ONBOARDING_RESTRICTIONS.map((restriction) => {
                const selected = restrictions.includes(restriction);
                return (
                  <button
                    key={restriction}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleRestriction(restriction)}
                    className={`min-h-12 rounded-[14px] border px-4 text-left text-sm font-medium ${
                      selected
                        ? "border-brand bg-brand-weak text-brand"
                        : "border-hairline bg-raised text-muted"
                    }`}
                  >
                    {selected ? "✓ " : ""}{t(`restriction.${restriction}`)}
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="mt-7 space-y-6">
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">{c.busyDays}</legend>
                <div className="flex flex-wrap gap-2">
                  {ONBOARDING_DAYS.map((day, index) => {
                    const selected = busyDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleBusyDay(day)}
                        className={`control-chip rounded-full border px-3 text-xs ${
                          selected
                            ? "border-amber bg-amber-weak text-amber"
                            : "border-hairline bg-raised text-muted"
                        }`}
                      >
                        {dayLabels[lang][index]}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">{c.marketMode}</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {MARKET_MODES.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={marketMode === mode}
                      onClick={() => setMarketMode(mode)}
                      className={`min-h-11 rounded-[12px] border px-3 text-sm font-medium ${
                        marketMode === mode
                          ? "border-brand bg-brand text-white"
                          : "border-hairline bg-raised text-muted"
                      }`}
                    >
                      {c[mode]}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="rounded-[16px] border border-accent/25 bg-accent-weak px-4 py-3">
                <p className="text-sm font-semibold text-accent">{c.review}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {adults} {c.adultShort} · {children} {c.childShort} · {busyDays.length} {c.busyDays.toLocaleLowerCase(lang)}
                </p>
              </div>
              <p className="rounded-[14px] border border-hairline px-4 py-3 text-xs leading-relaxed text-muted">
                {c.truth}
              </p>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-danger">
              {error}
            </p>
          )}

          <footer className="mt-auto flex items-center justify-between gap-3 pt-8">
            {step > 1 ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setError("");
                  setStep((current) => Math.max(1, current - 1));
                }}
                className="min-h-11 rounded-full border border-hairline px-5 text-sm font-semibold text-muted disabled:opacity-50"
              >
                {c.back}
              </button>
            ) : <span />}
            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="cta-primary min-h-11 rounded-full px-6 text-sm font-semibold text-white"
              >
                {c.next} →
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => void finish()}
                className="cta-primary min-h-11 rounded-full px-6 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
              >
                {saving ? c.saving : c.finish} →
              </button>
            )}
          </footer>
        </div>
      </section>
    </div>
  );
}

function Counter({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="flex min-h-16 items-center justify-between rounded-[16px] border border-hairline bg-raised px-4">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`${label}: −`}
          onClick={onDecrease}
          className="grid h-9 w-9 place-items-center rounded-full border border-hairline text-lg text-muted"
        >
          −
        </button>
        <output className="tnum w-6 text-center text-lg font-semibold">{value}</output>
        <button
          type="button"
          aria-label={`${label}: +`}
          onClick={onIncrease}
          className="grid h-9 w-9 place-items-center rounded-full border border-hairline text-lg text-brand"
        >
          +
        </button>
      </div>
    </div>
  );
}
