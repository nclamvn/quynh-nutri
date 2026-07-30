"use client";

import { useMemo, useState } from "react";
import type {
  Dish,
  MealCompletion,
  MealEffortFit,
  MealPortionFit,
  MealRepeatIntent,
} from "@/domain/types";
import { useI18n } from "@/i18n/context";
import { BottomSheet } from "@/ui/components/BottomSheet";
import { useStore } from "@/ui/store";

type Draft = {
  repeatIntent?: MealRepeatIntent;
  portionFit?: MealPortionFit;
  effortFit?: MealEffortFit;
};

const OPTIONS = {
  repeatIntent: ["repeat", "neutral", "avoid"] as const,
  portionFit: ["too_little", "right", "too_much"] as const,
  effortFit: ["easy", "manageable", "too_much"] as const,
};

export function MealReflectionSheet({
  completion,
  dishes,
  initialDishRef,
  onClose,
}: {
  completion: MealCompletion;
  dishes: Dish[];
  initialDishRef?: string;
  onClose: () => void;
}) {
  const { lang } = useI18n();
  const { mealFeedback, saveMealFeedback } = useStore();
  const completedDishes = useMemo(
    () => completion.dishRefs.flatMap((dishRef) => {
      const dish = dishes.find((item) => item.id === dishRef);
      return dish ? [dish] : [];
    }),
    [completion.dishRefs, dishes],
  );
  const initialIndex = Math.max(
    0,
    completedDishes.findIndex((dish) => dish.id === initialDishRef),
  );
  const [index, setIndex] = useState(initialIndex);
  const dish = completedDishes[index];
  const existing = mealFeedback.find(
    (item) =>
      item.mealCompletionId === completion.id
      && item.dishRef === dish?.id,
  );
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(
      completedDishes.map((item) => {
        const feedback = mealFeedback.find(
          (row) =>
            row.mealCompletionId === completion.id
            && row.dishRef === item.id,
        );
        return [item.id, feedback ? {
          repeatIntent: feedback.repeatIntent,
          portionFit: feedback.portionFit,
          effortFit: feedback.effortFit,
        } : {}];
      }),
    ),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const draft = dish ? drafts[dish.id] ?? {} : {};
  const answered = Boolean(
    draft.repeatIntent || draft.portionFit || draft.effortFit,
  );
  const isLast = index === completedDishes.length - 1;
  const vn = lang !== "en";
  const dishName = dish
    ? lang === "en" && dish.enLabel
      ? dish.enLabel
      : dish.vnName
    : "";

  const label = (value: string) => {
    const labels: Record<string, [string, string]> = {
      repeat: ["Muốn ăn lại", "Have again"],
      neutral: ["Bình thường", "Neutral"],
      avoid: ["Không hợp nhà", "Avoid"],
      too_little: ["Hơi ít", "Too little"],
      right: ["Vừa đủ", "Just right"],
      too_much: ["Hơi nhiều", "Too much"],
      easy: ["Nhẹ nhàng", "Easy"],
      manageable: ["Vừa sức", "Manageable"],
      too_much_effort: ["Quá công", "Too much work"],
    };
    return labels[value]?.[vn ? 0 : 1] ?? value;
  };

  const choose = <K extends keyof Draft>(key: K, value: NonNullable<Draft[K]>) => {
    if (!dish) return;
    setDrafts((current) => ({
      ...current,
      [dish.id]: {
        ...current[dish.id],
        [key]: current[dish.id]?.[key] === value ? undefined : value,
      },
    }));
    setError("");
  };

  const advance = () => {
    if (isLast) onClose();
    else {
      setIndex((current) => current + 1);
      setError("");
    }
  };

  const submit = async () => {
    if (!dish || !answered || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await saveMealFeedback({
        idempotencyKey: crypto.randomUUID(),
        mealCompletionId: completion.id,
        dishRef: dish.id,
        ...draft,
        expectedVersion: existing?.version ?? null,
      });
      if (!result.ok) {
        setDrafts((current) => ({
          ...current,
          [dish.id]: {
            repeatIntent: result.canonical.repeatIntent,
            portionFit: result.canonical.portionFit,
            effortFit: result.canonical.effortFit,
          },
        }));
        setError(vn
          ? "Phản hồi đã đổi trên thiết bị khác. Bản mới nhất đã được nạp lại."
          : "Feedback changed on another device. The latest version is now loaded.");
        return;
      }
      advance();
    } catch {
      setError(vn
        ? "Chưa lưu được cảm nhận. Hãy thử lại."
        : "Could not save this reflection. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!dish) return null;

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={vn ? "Phiếu nếm bữa cơm" : "Meal reflection"}
    >
      <div className="space-y-5" data-testid="meal-reflection">
        <div className="rounded-[18px] border border-brand/15 bg-brand-weak/35 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
                {vn ? `Món ${index + 1}/${completedDishes.length}` : `Dish ${index + 1}/${completedDishes.length}`}
              </p>
              <p className="mt-1 truncate text-base font-semibold">{dishName}</p>
            </div>
            {existing && (
              <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-[10px] text-muted">
                {vn ? "Đã ghi" : "Saved"}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {vn
              ? "Chỉ chọn điều gia đình thật sự cảm nhận. Bỏ qua nếu chưa muốn đánh giá."
              : "Choose only what your household actually felt. Skip if you are not ready to answer."}
          </p>
        </div>

        <ChoiceGroup
          title={vn ? "Nhà mình có muốn ăn lại?" : "Would your household have it again?"}
          values={OPTIONS.repeatIntent}
          selected={draft.repeatIntent}
          label={label}
          onChoose={(value) => choose("repeatIntent", value)}
        />
        <ChoiceGroup
          title={vn ? "Lượng món hôm nay thế nào?" : "How was the portion?"}
          values={OPTIONS.portionFit}
          selected={draft.portionFit}
          label={label}
          onChoose={(value) => choose("portionFit", value)}
        />
        <ChoiceGroup
          title={vn ? "Công chuẩn bị có vừa sức?" : "How did the effort feel?"}
          values={OPTIONS.effortFit}
          selected={draft.effortFit}
          label={(value) => label(value === "too_much" ? "too_much_effort" : value)}
          onChoose={(value) => choose("effortFit", value)}
        />

        {error && (
          <p role="alert" className="text-xs leading-relaxed text-danger">{error}</p>
        )}
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
          <button
            type="button"
            onClick={advance}
            className="min-h-11 rounded-full px-4 text-sm text-muted"
          >
            {vn ? "Bỏ qua" : "Skip"}
          </button>
          <button
            type="button"
            disabled={!answered || submitting}
            onClick={submit}
            className="min-h-11 rounded-full bg-brand px-5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {submitting
              ? vn ? "Đang lưu…" : "Saving…"
              : isLast
                ? vn ? "Lưu & hoàn tất" : "Save & finish"
                : vn ? "Lưu & món tiếp" : "Save & next"}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

function ChoiceGroup<T extends string>({
  title,
  values,
  selected,
  label,
  onChoose,
}: {
  title: string;
  values: readonly T[];
  selected?: T;
  label: (value: T) => string;
  onChoose: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold">{title}</legend>
      <div className="grid grid-cols-3 gap-2">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={selected === value}
            onClick={() => onChoose(value)}
            className={`min-h-10 rounded-full border px-2 text-[11px] font-medium transition ${
              selected === value
                ? "border-brand bg-brand-weak text-brand-ink"
                : "border-hairline bg-surface/45 text-muted"
            }`}
          >
            {label(value)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
