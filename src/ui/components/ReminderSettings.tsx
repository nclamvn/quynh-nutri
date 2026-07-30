"use client";

import { useEffect, useMemo, useState } from "react";
import {
  disableKitchenReminders,
  enableKitchenReminders,
  loadReminderSettings,
} from "@/app/actions";
import type { ReminderSettings } from "@/data/repo/reminders";
import { useI18n } from "@/i18n/context";

type UiState =
  | "loading"
  | "ready"
  | "unsupported"
  | "denied"
  | "missing-config"
  | "error";

const COMMON_TIME_ZONES = [
  "Asia/Ho_Chi_Minh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "America/New_York",
];

const toApplicationServerKey = (value: string): Uint8Array<ArrayBuffer> => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(base64), (character) =>
    character.charCodeAt(0));
  return new Uint8Array(bytes.buffer);
};

const browserSupportsPush = () =>
  "serviceWorker" in navigator
  && "PushManager" in window
  && "Notification" in window;

export function ReminderSettingsCard() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [publicKey, setPublicKey] = useState("");
  const [timeZone, setTimeZone] = useState("Asia/Ho_Chi_Minh");
  const [reminderHour, setReminderHour] = useState(7);
  const [uiState, setUiState] = useState<UiState>("loading");
  const [busy, setBusy] = useState(false);

  const zones = useMemo(() => {
    const detected = typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "";
    return [...new Set([detected, ...COMMON_TIME_ZONES].filter(Boolean))];
  }, []);

  useEffect(() => {
    let active = true;
    loadReminderSettings()
      .then(({ settings: next, publicKey: key }) => {
        if (!active) return;
        setSettings(next);
        setPublicKey(key);
        setTimeZone(next.timeZone);
        setReminderHour(next.reminderHour);
        if (!browserSupportsPush()) setUiState("unsupported");
        else if (Notification.permission === "denied") setUiState("denied");
        else if (!key) setUiState("missing-config");
        else setUiState("ready");
      })
      .catch(() => active && setUiState("error"));
    return () => {
      active = false;
    };
  }, []);

  const enable = async () => {
    if (!browserSupportsPush()) {
      setUiState("unsupported");
      return;
    }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setUiState("denied");
        return;
      }
      if (!publicKey) {
        setUiState("missing-config");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toApplicationServerKey(publicKey),
      });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
        throw new Error("INVALID_PUSH_SUBSCRIPTION");
      }
      const next = await enableKitchenReminders({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        userAgent: navigator.userAgent,
        timeZone,
        reminderHour,
      });
      setSettings(next);
      setUiState("ready");
    } catch {
      setUiState("error");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager?.getSubscription();
        await subscription?.unsubscribe();
      }
      await disableKitchenReminders();
      setSettings((current) => current
        ? { ...current, enabled: false, subscriptionCount: 0 }
        : current);
      setUiState(browserSupportsPush() ? "ready" : "unsupported");
    } catch {
      setUiState("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card p-5" aria-labelledby="reminder-settings-title">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2
            id="reminder-settings-title"
            className="text-[11px] font-semibold uppercase tracking-wider text-tertiary"
          >
            {t("settings.reminders")}
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
            {t("settings.remindersBody")}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
          settings?.enabled
            ? "bg-brand-weak text-brand"
            : "bg-surface text-muted"
        }`}>
          {settings?.enabled
            ? t("settings.remindersOn")
            : t("settings.remindersOff")}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-muted">
          {t("settings.timeZone")}
          <select
            value={timeZone}
            onChange={(event) => setTimeZone(event.target.value)}
            disabled={busy || settings?.enabled}
            className="mt-1.5 min-h-10 w-full rounded-[12px] border border-hairline bg-surface px-3 text-sm text-foreground"
          >
            {zones.map((zone) => <option key={zone}>{zone}</option>)}
          </select>
        </label>
        <label className="text-xs text-muted">
          {t("settings.reminderHour")}
          <select
            value={reminderHour}
            onChange={(event) => setReminderHour(Number(event.target.value))}
            disabled={busy || settings?.enabled}
            className="mt-1.5 min-h-10 w-full rounded-[12px] border border-hairline bg-surface px-3 text-sm text-foreground"
          >
            {Array.from({ length: 24 }, (_, hour) => (
              <option key={hour} value={hour}>
                {String(hour).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </label>
      </div>

      {uiState !== "ready" && uiState !== "loading" && (
        <p role="status" className="mt-3 text-xs leading-relaxed text-amber">
          {t(`settings.reminderState.${uiState}`)}
        </p>
      )}

      <button
        type="button"
        disabled={busy || uiState === "loading" || uiState === "unsupported"
          || uiState === "missing-config"}
        onClick={settings?.enabled ? disable : enable}
        className={`mt-4 min-h-10 rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          settings?.enabled
            ? "border border-hairline text-muted hover:text-foreground"
            : "bg-brand text-white shadow-brand hover:brightness-105"
        }`}
      >
        {busy
          ? t("settings.remindersSaving")
          : settings?.enabled
            ? t("settings.remindersDisable")
            : t("settings.remindersEnable")}
      </button>
      <p className="mt-3 text-[11px] leading-relaxed text-tertiary">
        {t("settings.remindersTrust")}
      </p>
    </section>
  );
}
