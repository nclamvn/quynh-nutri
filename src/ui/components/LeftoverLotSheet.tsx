"use client";

import { useState } from "react";
import type {
  LeftoverLot,
  LeftoverMovementKind,
  RecordLeftoverMovementInput,
} from "@/domain/types";
import {
  evaluateLeftoverGuidance,
  LEFTOVER_POLICY_SOURCES,
} from "@/domain/kitchen-execution/leftover-safety";
import { useI18n } from "@/i18n/context";
import { BottomSheet } from "@/ui/components/BottomSheet";
import { fmt } from "@/ui/format";

const toLocalDateTime = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export function LeftoverLotSheet({
  lot,
  onClose,
  onRecord,
}: {
  lot: LeftoverLot;
  onClose: () => void;
  onRecord: (input: RecordLeftoverMovementInput) => Promise<unknown>;
}) {
  const { t, lang } = useI18n();
  const [kind, setKind] = useState<LeftoverMovementKind>("consumed");
  const [servings, setServings] = useState(String(lot.remainingServings));
  const [occurredAt, setOccurredAt] = useState(toLocalDateTime());
  const [note, setNote] = useState("");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const servingsNumber = Number(servings);
  const after = kind === "corrected"
    ? servingsNumber
    : lot.remainingServings - servingsNumber;
  const valid = Number.isFinite(servingsNumber)
    && (kind === "corrected" ? servingsNumber >= 0 : servingsNumber > 0)
    && (kind === "corrected" || servingsNumber <= lot.remainingServings)
    && Math.abs(after - lot.remainingServings) > Number.EPSILON
    && Boolean(occurredAt)
    && !submitting;
  const guidance = evaluateLeftoverGuidance({
    chilledAt: lot.chilledAt,
    storageLocation: lot.storageLocation,
    now: new Date(),
  });

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError("");
    try {
      await onRecord({
        idempotencyKey,
        lotId: lot.id,
        kind,
        servings: servingsNumber,
        occurredAt: new Date(occurredAt).toISOString(),
        note: note.trim() || undefined,
      });
      onClose();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(
        message.includes("INSUFFICIENT_LEFTOVER")
          ? t("leftover.errorBalance")
          : t("leftover.errorSave"),
      );
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet open onClose={onClose} title={t("leftover.sheetTitle")}>
      <div className="space-y-4">
        <div className="rounded-[16px] bg-brand-weak/55 p-3">
          <p className="font-semibold">{lot.dishLabelSnapshot}</p>
          <p className="mt-1 text-xs text-muted">
            {t("leftover.balance")}: {fmt(lot.remainingServings)} {t("leftover.servingUnit")} ·{" "}
            {t(`leftover.storage.${lot.storageLocation}`)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {t("leftover.chilledAt")}:{" "}
            {new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en", {
              dateStyle: "short",
              timeStyle: "short",
            }).format(new Date(lot.chilledAt))}
          </p>
          <p className="mt-1 text-xs font-medium text-accent">
            {t(`leftover.signal.${guidance.signal}`)}
          </p>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t("leftover.activity")}</legend>
          <div className="grid grid-cols-3 gap-2">
            {(["consumed", "discarded", "corrected"] as LeftoverMovementKind[]).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={kind === value}
                onClick={() => {
                  setKind(value);
                  setServings(String(lot.remainingServings));
                }}
                className={`rounded-full border px-2 py-2 text-xs ${
                  kind === value
                    ? "border-brand bg-brand text-white"
                    : "border-hairline bg-surface/45 text-muted"
                }`}
              >
                {t(`leftover.kind.${value}`)}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium">
              {kind === "corrected" ? t("leftover.newBalance") : t("leftover.servings")}
            </span>
            <input
              autoFocus
              type="number"
              min={kind === "corrected" ? "0" : "0.25"}
              max="100"
              step="0.25"
              value={servings}
              onChange={(event) => setServings(event.target.value)}
              className="w-full rounded-[12px] border border-hairline bg-surface/45 px-3 py-2.5 outline-none"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">{t("leftover.occurredAt")}</span>
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
            {t("leftover.note")} · {t("leftover.optional")}
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
          <span className="text-muted">{t("leftover.after")}</span>
          <strong className="tnum">{fmt(Math.max(0, Number.isFinite(after) ? after : lot.remainingServings))} {t("leftover.servingUnit")}</strong>
        </div>

        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button
          type="button"
          disabled={!valid}
          onClick={submit}
          className="w-full rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white disabled:opacity-45"
        >
          {submitting ? t("leftover.saving") : t("leftover.confirm")}
        </button>

        <aside className="rounded-[16px] border border-amber-200 bg-amber-50/75 p-3 text-xs leading-relaxed text-amber-950">
          <p className="font-semibold">{t("leftover.reheatTitle")}</p>
          <p className="mt-1">{t("leftover.reheatBody")}</p>
          <a
            href={LEFTOVER_POLICY_SOURCES[0]}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block underline underline-offset-2"
          >
            {t("leftover.officialSource")}
          </a>
        </aside>
        <p className="text-[11px] leading-relaxed text-muted">{t("leftover.disclaimer")}</p>
      </div>
    </BottomSheet>
  );
}
