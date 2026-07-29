"use client";

import { useState } from "react";
import type {
  InventoryLot,
  InventoryMovementKind,
  RecordInventoryMovementInput,
} from "@/domain/types";
import { expirySignal } from "@/domain/kitchen-execution/inventory";
import { useI18n } from "@/i18n/context";
import { BottomSheet } from "@/ui/components/BottomSheet";
import { fmt } from "@/ui/format";

const toLocalDateTime = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export function InventoryLotSheet({
  lot,
  name,
  onClose,
  onRecord,
}: {
  lot: InventoryLot;
  name: string;
  onClose: () => void;
  onRecord: (input: RecordInventoryMovementInput) => Promise<unknown>;
}) {
  const { t, lang } = useI18n();
  const [kind, setKind] = useState<InventoryMovementKind>("consumed");
  const [qty, setQty] = useState(String(lot.qty));
  const [occurredAt, setOccurredAt] = useState(toLocalDateTime());
  const [note, setNote] = useState("");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const qtyNumber = Number(qty);
  const after = Number.isFinite(qtyNumber) ? Math.max(0, lot.qty - qtyNumber) : lot.qty;
  const valid =
    qtyNumber > 0 &&
    qtyNumber <= lot.qty &&
    Boolean(occurredAt) &&
    !submitting;
  const signal = expirySignal(lot);

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError("");
    try {
      await onRecord({
        idempotencyKey,
        lotId: lot.id,
        kind,
        qty: qtyNumber,
        occurredAt: new Date(occurredAt).toISOString(),
        note: note.trim() || undefined,
      });
      onClose();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(
        message.includes("INSUFFICIENT_STOCK")
          ? t("inventory.errorStock")
          : t("inventory.errorSave"),
      );
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet open onClose={onClose} title={t("inventory.sheetTitle")}>
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
            {t("inventory.balance")}: {fmt(lot.qty)} {lot.unit} ·{" "}
            {t(`receive.storage.${lot.storageLocation}`)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {lot.bestBefore
              ? `${t("inventory.labelDate")}: ${new Intl.DateTimeFormat(
                  lang === "vi" ? "vi-VN" : "en",
                ).format(new Date(lot.bestBefore))}`
              : t("inventory.noLabelDate")}
          </p>
          <p className="mt-1 text-xs font-medium text-accent">
            {t(`inventory.signal.${signal}`)}
          </p>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t("inventory.kind")}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["consumed", "discarded"] as InventoryMovementKind[]).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={kind === value}
                onClick={() => setKind(value)}
                className={`rounded-full border px-3 py-2 text-sm ${
                  kind === value
                    ? "border-brand bg-brand text-white"
                    : "border-hairline bg-surface/45 text-muted"
                }`}
              >
                {t(`inventory.kind.${value}`)}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium">{t("inventory.quantity")}</span>
            <div className="flex items-center rounded-[12px] border border-hairline bg-surface/45">
              <input
                autoFocus
                type="number"
                min="0.01"
                max={lot.qty}
                step="1"
                value={qty}
                onChange={(event) => setQty(event.target.value)}
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 outline-none"
              />
              <span className="pr-3 text-xs text-muted">{lot.unit}</span>
            </div>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">{t("inventory.occurredAt")}</span>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
              className="w-full rounded-[12px] border border-hairline bg-surface/45 px-3 py-2.5 outline-none"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">
            {t("inventory.note")} · {t("inventory.noteOptional")}
          </span>
          <textarea
            value={note}
            maxLength={500}
            rows={2}
            onChange={(event) => setNote(event.target.value)}
            className="w-full resize-none rounded-[12px] border border-hairline bg-surface/45 px-3 py-2.5 outline-none"
          />
        </label>

        <div className="flex items-center justify-between rounded-[14px] bg-surface/55 px-3 py-2 text-sm">
          <span className="text-muted">{t("inventory.after")}</span>
          <strong className="tnum">{fmt(after)} {lot.unit}</strong>
        </div>

        {qtyNumber > lot.qty && (
          <p role="alert" className="text-sm text-danger">{t("inventory.errorStock")}</p>
        )}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}

        <button
          type="button"
          disabled={!valid}
          onClick={submit}
          className="w-full rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white disabled:opacity-45"
        >
          {submitting ? t("inventory.saving") : t("inventory.confirm")}
        </button>

        <p className="text-[11px] leading-relaxed text-muted">
          {t("inventory.labelDisclaimer")}
        </p>
      </div>
    </BottomSheet>
  );
}
