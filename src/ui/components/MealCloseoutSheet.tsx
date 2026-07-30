"use client";

import { useMemo, useState } from "react";
import type { Dish, MealCompletion, MealOccasion } from "@/domain/types";
import type { MealRunSession } from "@/domain/kitchen-execution/meal-coordination";
import { BottomSheet } from "@/ui/components/BottomSheet";
import { useI18n } from "@/i18n/context";
import { useStore } from "@/ui/store";

export function MealCloseoutSheet({
  day,
  occasion,
  session,
  dishes,
  expectedSessionVersion,
  onCancel,
  onConfirmed,
}: {
  day: number;
  occasion: MealOccasion;
  session: MealRunSession;
  dishes: Dish[];
  expectedSessionVersion: number;
  onCancel: () => void;
  onConfirmed: (completion: MealCompletion) => void;
}) {
  const { lang } = useI18n();
  const {
    plan,
    pantry,
    commodity,
    confirmMealCloseout,
  } = useStore();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [completedAt] = useState(() => new Date().toISOString());
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState<MealCompletion>();
  const completedDishes = useMemo(
    () => session.tasks.flatMap((task) => {
      const dish = dishes.find((item) => item.id === task.dishId);
      return task.completedAt && dish ? [dish] : [];
    }),
    [dishes, session.tasks],
  );
  const relevantCommodityIds = useMemo(
    () => new Set(completedDishes.flatMap((dish) => dish.lines.map((line) => line.commodityId))),
    [completedDishes],
  );
  const relevantLots = useMemo(
    () =>
      pantry.filter(
        (lot) =>
          Boolean(lot.id)
          && lot.qty > 0
          && relevantCommodityIds.has(lot.commodityId),
      ),
    [pantry, relevantCommodityIds],
  );
  const dishName = (dish: Dish) =>
    lang === "en" && dish.enLabel ? dish.enLabel : dish.vnName;
  const invalidSelection = relevantLots.some((lot) => {
    if (!lot.id || !selected[lot.id]) return false;
    const qty = Number(quantities[lot.id]);
    return !Number.isFinite(qty) || qty <= 0 || qty > lot.qty;
  });

  const submit = async () => {
    if (submitting || invalidSelection) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await confirmMealCloseout({
        idempotencyKey,
        weekRef: plan.weekStart,
        day,
        occasion,
        expectedSessionVersion,
        completedAt,
        consumptions: relevantLots.flatMap((lot) => {
          if (!lot.id || !selected[lot.id]) return [];
          return [{ lotId: lot.id, qty: Number(quantities[lot.id]) }];
        }),
      });
      if (!result.ok) {
        setConflict(result.completion);
        return;
      }
      onConfirmed(result.completion);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(
        message.includes("INSUFFICIENT_STOCK")
          ? "Số lượng trong kho vừa thay đổi. Hãy kiểm tra lại trước khi xác nhận."
          : "Chưa thể ghi nhận bữa ăn. Phiên nấu vẫn được giữ nguyên.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet open onClose={onCancel} title="Xác nhận bữa ăn">
      <div className="space-y-4" data-testid="meal-closeout">
        <section className="rounded-[18px] border border-hairline bg-surface/55 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
            Món đã hoàn thành
          </p>
          <p className="mt-2 text-sm font-semibold">
            {completedDishes.map(dishName).join(" · ")}
          </p>
        </section>

        <section>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold">Nguyên liệu đã dùng</h3>
            <span className="text-[11px] text-muted">Không chọn sẵn</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Chỉ chọn lô bạn thực sự đã dùng. Ứng dụng không tự suy đoán số lượng.
          </p>
          {relevantLots.length === 0 ? (
            <p className="mt-3 rounded-[14px] border border-dashed border-hairline p-3 text-xs text-muted">
              Kho chưa có lô nguyên liệu liên quan được ghi nhận.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {relevantLots.map((lot) => {
                const lotId = lot.id!;
                const checked = Boolean(selected[lotId]);
                const qty = Number(quantities[lotId]);
                const after = checked && Number.isFinite(qty) ? lot.qty - qty : lot.qty;
                const label = commodity(lot.commodityId)?.canonicalVn ?? lot.commodityId;
                return (
                  <li key={lotId} className="rounded-[14px] border border-hairline p-3">
                    <label className="flex min-w-0 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          const next = event.target.checked;
                          setSelected((current) => ({ ...current, [lotId]: next }));
                          if (next && !quantities[lotId]) {
                            setQuantities((current) => ({ ...current, [lotId]: "" }));
                          }
                        }}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
                      <span className="tnum shrink-0 text-xs text-muted">
                        {lot.qty} {lot.unit}
                      </span>
                    </label>
                    {checked && (
                      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pl-6">
                        <input
                          aria-label={`Số lượng ${label} đã dùng`}
                          type="number"
                          min="0.01"
                          max={lot.qty}
                          step="0.01"
                          value={quantities[lotId] ?? ""}
                          onChange={(event) =>
                            setQuantities((current) => ({
                              ...current,
                              [lotId]: event.target.value,
                            }))
                          }
                          placeholder={`Tối đa ${lot.qty}`}
                          className="min-w-0 rounded-[12px] border border-hairline bg-bg px-3 py-2 text-sm outline-none"
                        />
                        <span className="tnum whitespace-nowrap text-xs text-muted">
                          {lot.qty} → {Math.max(0, after)} {lot.unit}
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {conflict && (
          <div className="rounded-[14px] bg-brand-weak/60 p-3 text-sm">
            Bữa ăn này đã được xác nhận trên thiết bị khác.
          </div>
        )}
        {error && <p role="alert" className="text-xs text-danger">{error}</p>}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-full border border-hairline px-4 text-sm font-semibold"
          >
            Quay lại
          </button>
          {conflict ? (
            <button
              type="button"
              onClick={() => onConfirmed(conflict)}
              className="h-11 rounded-full bg-brand px-4 text-sm font-semibold text-white"
            >
              Tiếp tục
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting || invalidSelection}
              onClick={submit}
              className="h-11 rounded-full bg-brand px-4 text-sm font-semibold text-white disabled:opacity-40"
            >
              {submitting ? "Đang ghi nhận…" : "Xác nhận"}
            </button>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
