"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Music, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { flatValidationMessage } from "@/lib/action-helpers";
import { MAX_AUDIO_BYTES } from "@/lib/audio-upload";
import type { ManagedVerseRow } from "@/lib/repositories/verses";
import { createVerse, deleteVerse, updateVerse } from "../_actions";

type BookOption = { id: number; nameDe: string; abbr: string };
type TranslationOption = { id: string; fullName: string };

type FormState = {
  bookId: string;
  chapter: string;
  verseFrom: string;
  verseTo: string;
  translationId: string;
  text: string;
  visibility: "public" | "private" | "group";
  attributionOverride: string;
};

const emptyForm = (
  firstBookId: number,
  firstTranslationId: string,
  isAdmin: boolean,
): FormState => ({
  bookId: String(firstBookId),
  chapter: "1",
  verseFrom: "1",
  verseTo: "1",
  translationId: firstTranslationId,
  text: "",
  visibility: isAdmin ? "public" : "private",
  attributionOverride: "",
});

function errMessage(e: unknown): string {
  return (
    flatValidationMessage(e) ??
    (e instanceof Error ? e.message : "Unbekannter Fehler")
  );
}

export function VerseManager({
  verses,
  books,
  translations,
  isAdmin,
}: {
  verses: ManagedVerseRow[];
  books: BookOption[];
  translations: TranslationOption[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(
    emptyForm(books[0]?.id ?? 1, translations[0]?.id ?? "", isAdmin),
  );
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm(books[0]?.id ?? 1, translations[0]?.id ?? "", isAdmin));
    setAudioFile(null);
    if (audioInputRef.current) audioInputRef.current.value = "";
  }

  function startEdit(v: ManagedVerseRow) {
    setEditingId(v.id);
    setForm({
      bookId: String(v.bookId),
      chapter: String(v.chapter),
      verseFrom: String(v.verseFrom),
      verseTo: String(v.verseTo),
      translationId: v.translationId,
      text: v.text,
      visibility: v.visibility,
      attributionOverride: v.attributionOverride ?? "",
    });
    setAudioFile(null);
    setError(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  async function uploadAudio(verseId: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/verse/${verseId}/audio`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Audio-Upload fehlgeschlagen.");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (audioFile && audioFile.size > MAX_AUDIO_BYTES) {
      setError(
        `Lied zu groß (max. ${(MAX_AUDIO_BYTES / 1024 / 1024).toFixed(0)} MB).`,
      );
      return;
    }

    const payload = {
      bookId: form.bookId,
      chapter: form.chapter,
      verseFrom: form.verseFrom,
      verseTo: form.verseTo,
      translationId: form.translationId,
      text: form.text,
      visibility: form.visibility,
      attributionOverride: form.attributionOverride,
    };

    startTransition(async () => {
      try {
        let verseId = editingId;
        if (editingId) {
          await updateVerse({ id: editingId, data: payload });
        } else {
          const res = await createVerse(payload);
          verseId = res.id;
        }
        if (verseId && audioFile) {
          await uploadAudio(verseId, audioFile);
        }
        resetForm();
        router.refresh();
      } catch (err) {
        setError(errMessage(err));
      }
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("Diesen Vers wirklich löschen?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteVerse({ id });
        if (editingId === id) resetForm();
        router.refresh();
      } catch (err) {
        setError(errMessage(err));
      }
    });
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border bg-card p-5 sm:p-6"
      >
        <h2 className="font-serif text-lg font-semibold">
          {editingId ? "Vers bearbeiten" : "Neuen Vers anlegen"}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Buch">
            <select
              value={form.bookId}
              onChange={(e) => set("bookId", e.target.value)}
              className={selectCls}
            >
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nameDe} ({b.abbr})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Übersetzung">
            <select
              value={form.translationId}
              onChange={(e) => set("translationId", e.target.value)}
              className={selectCls}
            >
              {translations.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Kapitel">
            <input
              type="number"
              min={1}
              value={form.chapter}
              onChange={(e) => set("chapter", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Vers von">
            <input
              type="number"
              min={1}
              value={form.verseFrom}
              onChange={(e) => set("verseFrom", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Vers bis">
            <input
              type="number"
              min={1}
              value={form.verseTo}
              onChange={(e) => set("verseTo", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Vers-Text">
          <textarea
            value={form.text}
            onChange={(e) => set("text", e.target.value)}
            rows={4}
            className={`${inputCls} font-serif leading-relaxed`}
            placeholder="Den Wortlaut hier eingeben …"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          {isAdmin && (
            <Field label="Sichtbarkeit">
              <select
                value={form.visibility}
                onChange={(e) =>
                  set("visibility", e.target.value as FormState["visibility"])
                }
                className={selectCls}
              >
                <option value="public">Öffentlich (alle Lernenden)</option>
                <option value="private">Privat (nur ich)</option>
                <option value="group">Gruppe</option>
              </select>
            </Field>
          )}
          <Field label="Quellenangabe überschreiben (optional)">
            <input
              type="text"
              value={form.attributionOverride}
              onChange={(e) => set("attributionOverride", e.target.value)}
              className={inputCls}
              placeholder="Leer = Standard-Attribution der Übersetzung"
            />
          </Field>
        </div>

        {!isAdmin && (
          <p className="text-xs text-muted-foreground">
            Deine Verse sind privat und nur für dich sichtbar.
          </p>
        )}

        {isAdmin && (
          <Field label="Lied (MP3/WAV, optional)">
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/mpeg,audio/wav,audio/x-wav,.mp3,.wav"
              onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
            />
            {editingId && (
              <p className="mt-1 text-xs text-muted-foreground">
                Nur nötig, wenn du das Lied ersetzen willst.
              </p>
            )}
          </Field>
        )}

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {editingId ? "Änderungen speichern" : "Vers anlegen"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              <X className="h-4 w-4" />
              Abbrechen
            </button>
          )}
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold">
          Vorhandene Verse{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({verses.length})
          </span>
        </h2>
        {verses.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
            Noch keine Verse — lege oben den ersten an.
          </p>
        ) : (
          <ul className="space-y-2">
            {verses.map((v) => (
              <VerseRow
                key={v.id}
                verse={v}
                isAdmin={isAdmin}
                disabled={pending}
                onEdit={() => startEdit(v)}
                onDelete={() => handleDelete(v.id)}
                onAudioChanged={() => router.refresh()}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function VerseRow({
  verse,
  isAdmin,
  disabled,
  onEdit,
  onDelete,
  onAudioChanged,
}: {
  verse: ManagedVerseRow;
  isAdmin: boolean;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAudioChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  async function removeAudio() {
    if (!window.confirm("Lied zu diesem Vers entfernen?")) return;
    setBusy(true);
    setRowError(null);
    try {
      const res = await fetch(`/api/verse/${verse.id}/audio`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Entfernen fehlgeschlagen.");
      }
      onAudioChanged();
    } catch (e) {
      setRowError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setBusy(false);
    }
  }

  const ref =
    verse.verseFrom === verse.verseTo
      ? `${verse.bookAbbr} ${verse.chapter},${verse.verseFrom}`
      : `${verse.bookAbbr} ${verse.chapter},${verse.verseFrom}–${verse.verseTo}`;

  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-serif font-semibold">{ref}</span>
            <span className="text-xs text-muted-foreground">
              {verse.translationFullName}
            </span>
            <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              {verse.visibility}
            </span>
            {verse.hasAudio && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Music className="h-3 w-3" /> Lied
              </span>
            )}
          </p>
          <p className="mt-1 line-clamp-2 font-serif text-sm text-muted-foreground">
            {verse.text}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            disabled={disabled || busy}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent disabled:opacity-50"
            aria-label="Bearbeiten"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={disabled || busy}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-red-700 hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/30"
            aria-label="Löschen"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isAdmin &&
        (verse.hasAudio ? (
          <div className="mt-3 space-y-2 border-t pt-3">
            <audio
              controls
              preload="none"
              className="w-full"
              src={`/api/verse/${verse.id}/audio`}
            />
            <button
              type="button"
              onClick={removeAudio}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-xs text-red-700 hover:underline disabled:opacity-50 dark:text-red-300"
            >
              <Trash2 className="h-3 w-3" />
              Lied entfernen
            </button>
          </div>
        ) : (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Upload className="h-3 w-3" />
            Lied über „Bearbeiten“ hochladen.
          </p>
        ))}
      {rowError && (
        <p className="mt-2 text-xs text-red-700 dark:text-red-300">
          {rowError}
        </p>
      )}
    </li>
  );
}

const inputCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
const selectCls = inputCls;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
