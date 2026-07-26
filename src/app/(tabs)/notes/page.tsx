"use client";

import { useState } from "react";
import { useStore } from "@/ui/store";
import { useI18n } from "@/i18n/context";
import { NoteIcon } from "@/ui/components/icons";
import { Blossom } from "@/ui/components/Blossom";
import { PageContainer } from "@/ui/components/PageContainer";
import { PageHeader } from "@/ui/components/PageHeader";

export default function NotesPage() {
  const { userNotes, addNote, deleteNote } = useStore();
  const { t } = useI18n();
  const [text, setText] = useState("");

  const submit = () => {
    addNote(text);
    setText("");
  };

  return (
    <PageContainer>
      <PageHeader title={t("notes.title")} subtitle={userNotes.length ? t("notes.count", { n: userNotes.length }) : undefined} />

      <div className="mx-auto mb-6 flex max-w-2xl gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={t("notes.placeholder")}
          className="min-w-0 flex-1 rounded-full border border-hairline bg-surface/40 px-4 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          onClick={submit}
          disabled={text.trim().length === 0}
          className="cta-primary shrink-0 rounded-full px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {t("notes.add")}
        </button>
      </div>

      {userNotes.length === 0 ? (
        <div className="relative grid min-h-[40vh] place-content-center justify-items-center text-center">
          <Blossom size={120} className="pointer-events-none absolute -top-2 text-brand/10" />
          <span className="relative mb-3 text-tertiary">
            <NoteIcon className="h-12 w-12" />
          </span>
          <p className="relative text-sm text-muted">{t("notes.empty")}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {userNotes.map((n) => (
            <li key={n.id} className="card flex items-start gap-2 p-3.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <span className="flex-1 text-sm">{n.text}</span>
              <button onClick={() => deleteNote(n.id)} aria-label={t("notes.delete")} className="shrink-0 rounded p-1 text-tertiary active:text-danger">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
