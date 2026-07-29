"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  KitchenAgenda,
  KitchenAgendaPriority,
  KitchenAgendaTask,
} from "@/domain/kitchen-execution/kitchen-agenda";
import { useI18n } from "@/i18n/context";
import { useStore } from "@/ui/store";
import { BottomSheet } from "@/ui/components/BottomSheet";

const groups: { priority: KitchenAgendaPriority; key: string }[] = [
  { priority: "now", key: "agenda.group.now" },
  { priority: "today", key: "agenda.group.today" },
  { priority: "next", key: "agenda.group.next" },
];

const priorityStyle: Record<KitchenAgendaPriority, string> = {
  now: "bg-danger/10 text-danger",
  today: "bg-amber/15 text-amber-700",
  next: "bg-brand-weak text-brand",
};

export function KitchenAgendaCard({ agenda }: { agenda: KitchenAgenda }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const counts = Object.fromEntries(
    groups.map(({ priority }) => [
      priority,
      agenda.tasks.filter((task) => task.priority === priority).length,
    ]),
  ) as Record<KitchenAgendaPriority, number>;

  return (
    <>
      <section
        aria-labelledby="kitchen-agenda-card-title"
        data-testid="kitchen-agenda-card"
        className="card mb-5 overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 border-b border-hairline bg-gradient-to-r from-brand-weak/65 to-accent-weak/35 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
              {t("agenda.eyebrow")}
            </p>
            <h2 id="kitchen-agenda-card-title" className="mt-0.5 text-base font-semibold">
              {t("agenda.title")}
            </h2>
          </div>
          <div className="flex gap-1 text-[10px]">
            {groups.map(({ priority, key }) => counts[priority] > 0 && (
              <span key={priority} className={`rounded-full px-2 py-1 ${priorityStyle[priority]}`}>
                {t(key)} · {counts[priority]}
              </span>
            ))}
          </div>
        </div>

        {agenda.tasks.length === 0 ? (
          <div className="px-4 py-5">
            <p className="text-sm font-medium">{t("agenda.empty")}</p>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
              {t("agenda.emptyBody")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/week"
                className="rounded-full border border-hairline px-3 py-1.5 text-xs font-semibold text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {t("agenda.emptyWeekAction")} →
              </Link>
              <Link
                href="/pantry"
                className="rounded-full border border-hairline px-3 py-1.5 text-xs font-semibold text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {t("agenda.emptyPantryAction")} →
              </Link>
            </div>
          </div>
        ) : (
          <ol className="divide-y divide-hairline px-4">
            {agenda.tasks.slice(0, 3).map((task) => (
              <AgendaRow key={task.id} task={task} compact />
            ))}
          </ol>
        )}

        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="text-[10px] text-muted">
            {t("agenda.derivedNote")}
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-full bg-brand-weak px-3 py-1.5 text-xs font-semibold text-brand"
          >
            {t("agenda.viewAll")}
          </button>
        </div>
      </section>

      <KitchenAgendaSheet
        agenda={agenda}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function KitchenAgendaSheet({
  agenda,
  open,
  onClose,
}: {
  agenda: KitchenAgenda;
  open: boolean;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  return (
    <BottomSheet open={open} onClose={onClose} title={t("agenda.title")}>
      <div className="space-y-5" data-testid="kitchen-agenda-sheet">
        <p className="text-xs leading-relaxed text-muted">{t("agenda.sheetIntro")}</p>

        {agenda.tasks.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-hairline p-4 text-sm text-muted">
            {t("agenda.empty")}
          </div>
        ) : groups.map(({ priority, key }) => {
          const tasks = agenda.tasks.filter((task) => task.priority === priority);
          if (tasks.length === 0) return null;
          return (
            <section key={priority} aria-labelledby={`agenda-${priority}`}>
              <h3 id={`agenda-${priority}`} className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                {t(key)}
              </h3>
              <ol className="divide-y divide-hairline rounded-[16px] border border-hairline px-3">
                {tasks.map((task) => (
                  <AgendaRow key={task.id} task={task} onNavigate={onClose} />
                ))}
              </ol>
            </section>
          );
        })}

        {agenda.unsupported.length > 0 && (
          <details className="rounded-[14px] bg-surface/45 p-3 text-xs">
            <summary className="cursor-pointer font-medium">
              {t("agenda.unsupportedTitle", { n: agenda.unsupported.length })}
            </summary>
            <ul className="mt-2 space-y-1 text-muted">
              {agenda.unsupported.map((signal) => (
                <li key={signal.id}>
                  {t(signal.reasonKey, signal.evidence)}
                </li>
              ))}
            </ul>
          </details>
        )}

        <p className="text-[10px] leading-relaxed text-muted">
          {t("agenda.updatedAt", {
            time: new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en", {
              dateStyle: "short",
              timeStyle: "short",
            }).format(new Date(agenda.generatedAt)),
          })}
        </p>
        <p className="text-[10px] leading-relaxed text-muted">{t("agenda.noDone")}</p>
      </div>
    </BottomSheet>
  );
}

function AgendaRow({
  task,
  compact = false,
  onNavigate,
}: {
  task: KitchenAgendaTask;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const { t, lang } = useI18n();
  const { commodity } = useStore();
  const evidence = { ...task.evidence };
  if (typeof evidence.commodityId === "string") {
    const item = commodity(evidence.commodityId);
    evidence.name = item
      ? lang === "en" && item.labelEn
        ? item.labelEn
        : item.canonicalVn
      : evidence.commodityId;
  }
  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${priorityStyle[task.priority]}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t(task.titleKey, evidence)}</p>
          <p className={`mt-0.5 text-xs leading-relaxed text-muted ${compact ? "line-clamp-1" : ""}`}>
            {t(task.reasonKey, evidence)}
          </p>
          {!compact && (
            <p className="mt-1 text-[10px] text-tertiary">
              {t("agenda.createdFrom")}: {t(task.sourceKey)}
            </p>
          )}
        </div>
        {!compact && (
          <Link
            href={task.actionHref}
            onClick={onNavigate}
            className="shrink-0 rounded-full border border-hairline px-2.5 py-1.5 text-[11px] font-semibold text-brand"
          >
            {t(task.actionKey)} →
          </Link>
        )}
      </div>
    </li>
  );
}
