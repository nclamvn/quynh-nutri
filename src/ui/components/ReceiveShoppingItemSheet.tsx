"use client";

import { useMemo, useState } from "react";
import type { Commodity, ReceiveShoppingItemInput, StorageLocation } from "@/domain/types";
import type { ShoppingItem } from "@/domain/shopping";
import { kitchenGuideFor } from "@/data/seed/kitchen-guides";
import { localize } from "@/domain/kitchen-execution";
import { useI18n } from "@/i18n/context";
import { BottomSheet } from "@/ui/components/BottomSheet";
import { fmt } from "@/ui/format";

const toLocalDateTime = (iso?: string) => {
  const date = iso ? new Date(iso) : new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const fromLocalDateTime = (value: string) => new Date(value).toISOString();

export function ReceiveShoppingItemSheet({
  item,
  weekRef,
  commodity,
  initialDraft,
  captureSource,
  onClose,
  onReceive,
}: {
  item: ShoppingItem;
  weekRef: string;
  commodity: Commodity | undefined;
  initialDraft?: {
    actualQty?: number;
    pricePaid?: number;
    bestBefore?: string;
  };
  captureSource?: {
    kind: "receipt" | "label" | "voice";
    rawName: string;
    capturedUnit?: string;
  };
  onClose: () => void;
  onReceive: (input: ReceiveShoppingItemInput) => Promise<unknown>;
}) {
  const { t, lang } = useI18n();
  const [actualQty, setActualQty] = useState(String(
    initialDraft?.actualQty ?? item.fulfillment?.actualQty ?? item.qtyTotal,
  ));
  const [boughtAt, setBoughtAt] = useState(toLocalDateTime(item.fulfillment?.boughtAt));
  const [pricePaid, setPricePaid] = useState(
    initialDraft?.pricePaid
      ? String(initialDraft.pricePaid)
      : item.fulfillment?.pricePaid
        ? String(item.fulfillment.pricePaid)
        : "",
  );
  const [addToPantry, setAddToPantry] = useState(true);
  const [storageLocation, setStorageLocation] = useState<StorageLocation>(item.kind === "dry" ? "pantry" : "fridge");
  const [bestBefore, setBestBefore] = useState(initialDraft?.bestBefore ?? "");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const guide = useMemo(() => kitchenGuideFor(commodity), [commodity]);
  const name = commodity
    ? lang === "en" && commodity.labelEn
      ? commodity.labelEn
      : commodity.canonicalVn
    : item.commodityId;
  const lotAlreadyCreated = Boolean(item?.fulfillment?.inventoryLotId);
  const qtyNumber = Number(actualQty);
  const canSubmit =
    Boolean(idempotencyKey && boughtAt) &&
    Number.isFinite(qtyNumber) &&
    qtyNumber > 0 &&
    (!addToPantry || Boolean(storageLocation)) &&
    !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      await onReceive({
        idempotencyKey,
        weekRef,
        commodityId: item.commodityId,
        vendor: item.vendor,
        plannedQty: item.qtyTotal,
        actualQty: qtyNumber,
        unit: item.unit,
        boughtAt: fromLocalDateTime(boughtAt),
        pricePaid: pricePaid ? Number(pricePaid) : undefined,
        addToPantry,
        storageLocation: addToPantry ? storageLocation : undefined,
        bestBefore: bestBefore ? new Date(`${bestBefore}T23:59:59`).toISOString() : undefined,
      });
      onClose();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(
        message.includes("LOT_ALREADY_CREATED")
          ? t("receive.errorLotExists")
          : t("receive.errorSave"),
      );
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet open onClose={onClose} title={t("receive.title")}>
      <div className="space-y-4">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("detail.close")}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-hairline bg-surface/75 text-lg text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            ×
          </button>

          <div className="rounded-[16px] bg-brand-weak/55 p-3">
            <p className="font-semibold">{name}</p>
            <p className="mt-1 text-xs text-muted">
              {t("receive.planned")}: {fmt(item.qtyTotal)} {item.unit} · {item.vendor}
            </p>
            {item.fulfillment && (
              <p className="mt-1 text-xs font-medium text-accent">{t("receive.existing")}</p>
            )}
          </div>

          {captureSource && (
            <section
              aria-label="Thay đổi được đề xuất"
              className="rounded-[16px] border border-amber/35 bg-amber/8 p-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber">
                Đề xuất từ {captureSource.kind === "receipt" ? "hóa đơn" : captureSource.kind === "label" ? "nhãn hàng" : "giọng nói"} · cần bạn kiểm tra
              </p>
              <p className="mt-1.5 text-sm">
                “{captureSource.rawName}” → <strong>{name}</strong>
              </p>
              <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
                <span className="rounded-lg bg-surface/65 px-2.5 py-2 text-muted">
                  {fmt(item.qtyTotal)} {item.unit} theo kế hoạch
                </span>
                <span aria-hidden className="text-brand">→</span>
                <span className="rounded-lg border border-brand/20 bg-brand-weak/45 px-2.5 py-2 font-medium text-brand-ink">
                  {initialDraft?.actualQty
                    ? `${fmt(initialDraft.actualQty)} ${item.unit}`
                    : "Bạn nhập lượng thực mua"}
                </span>
              </div>
              {captureSource.capturedUnit && captureSource.capturedUnit !== item.unit && (
                <p className="mt-2 text-[11px] leading-relaxed text-amber">
                  Đơn vị đọc được là “{captureSource.capturedUnit}”, khác “{item.unit}” trong kế hoạch nên ứng dụng không tự quy đổi.
                </p>
              )}
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                Chưa có dữ liệu nào được lưu. Bạn có thể sửa toàn bộ trường bên dưới trước khi xác nhận.
              </p>
            </section>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium">{t("receive.actualQty")}</span>
              <div className="flex items-center rounded-[12px] border border-hairline bg-surface/45">
                <input
                  autoFocus
                  type="number"
                  min="0.01"
                  step="1"
                  value={actualQty}
                  onChange={(event) => setActualQty(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 outline-none"
                />
                <span className="pr-3 text-xs text-muted">{item.unit}</span>
              </div>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">{t("receive.boughtAt")}</span>
              <input
                type="datetime-local"
                value={boughtAt}
                onChange={(event) => setBoughtAt(event.target.value)}
                className="w-full rounded-[12px] border border-hairline bg-surface/45 px-3 py-2.5 outline-none"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t("receive.pricePaid")}</span>
            <div className="flex items-center rounded-[12px] border border-hairline bg-surface/45">
              <input
                type="number"
                min="1"
                step="1000"
                value={pricePaid}
                onChange={(event) => setPricePaid(event.target.value)}
                placeholder={t("receive.priceOptional")}
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 outline-none"
              />
              <span className="pr-3 text-xs text-muted">₫</span>
            </div>
          </label>

          <section className="rounded-[16px] border border-hairline p-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={addToPantry}
                disabled={lotAlreadyCreated}
                onChange={(event) => setAddToPantry(event.target.checked)}
                className="mt-1 h-4 w-4 accent-[var(--brand)]"
              />
              <span>
                <span className="block text-sm font-medium">{t("receive.addToPantry")}</span>
                <span className="block text-xs text-muted">
                  {lotAlreadyCreated ? t("receive.lotAlreadyCreated") : t("receive.addToPantryHint")}
                </span>
              </span>
            </label>

            {addToPantry && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium">{t("receive.storage")}</span>
                  <select
                    value={storageLocation}
                    onChange={(event) => setStorageLocation(event.target.value as StorageLocation)}
                    className="w-full rounded-[12px] border border-hairline bg-surface/45 px-3 py-2.5 outline-none"
                  >
                    <option value="pantry">{t("receive.storage.pantry")}</option>
                    <option value="fridge">{t("receive.storage.fridge")}</option>
                    <option value="freezer">{t("receive.storage.freezer")}</option>
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium">{t("receive.bestBefore")}</span>
                  <input
                    type="date"
                    value={bestBefore}
                    onChange={(event) => setBestBefore(event.target.value)}
                    className="w-full rounded-[12px] border border-hairline bg-surface/45 px-3 py-2.5 outline-none"
                  />
                  <span className="mt-1 block text-[11px] text-muted">{t("receive.bestBeforeHint")}</span>
                </label>
              </div>
            )}
          </section>

          {guide?.guide.storage[0] && (
            <div className="rounded-[14px] border border-brand/20 bg-brand-weak/35 p-3 text-xs leading-relaxed text-muted">
              <p className="mb-1 font-semibold text-brand-ink">{t("receive.storageGuide")}</p>
              {localize(guide.guide.storage[0], lang)}
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-[12px] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="w-full rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white disabled:opacity-45"
          >
            {submitting ? t("receive.saving") : t("receive.confirm")}
          </button>
      </div>
    </BottomSheet>
  );
}
