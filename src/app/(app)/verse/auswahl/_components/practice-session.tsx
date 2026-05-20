"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, RotateCcw } from "lucide-react";
import { ProgressBar } from "../../_components/session-shared";
import { VerseAudio } from "../../_components/verse-audio";

export type PracticeVerse = {
  id: string;
  reference: string;
  text: string;
  translationLabel: string;
  attribution: string | null;
  hasAudio: boolean;
};

/**
 * Freies Durchüben einer selbst gewählten Vers-Menge. Bewusst OHNE
 * SRS-Persistenz: kein recordVerseReview, kein userProgress-Schreiben —
 * die normale Wiederholungs-Planung bleibt unberührt.
 */
export function PracticeSession({
  verses,
  onExit,
}: {
  verses: PracticeVerse[];
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const total = verses.length;
  const current = verses[index];
  const isLast = index >= total - 1;

  function next() {
    if (isLast) return;
    setIndex((i) => i + 1);
    setRevealed(false);
  }

  function prev() {
    if (index === 0) return;
    setIndex((i) => i - 1);
    setRevealed(false);
  }

  function restart() {
    setIndex(0);
    setRevealed(false);
  }

  return (
    <div className="space-y-4">
      <ProgressBar position={index + 1} total={total} />

      <article className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <header className="mb-4 flex items-baseline justify-between gap-3">
          <p className="font-serif text-xl font-semibold tracking-tight">
            {current.reference}
          </p>
          <p className="text-xs text-muted-foreground">
            {current.translationLabel}
          </p>
        </header>

        {!revealed ? (
          <div className="flex min-h-[14rem] flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">
              Versuche, den Text aus dem Gedächtnis aufzusagen.
            </p>
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Eye className="h-4 w-4" />
              Vers anzeigen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="font-serif text-lg leading-relaxed">{current.text}</p>
            {current.attribution && (
              <p className="text-xs text-muted-foreground">
                {current.attribution}
              </p>
            )}
            {current.hasAudio && <VerseAudio verseId={current.id} />}
          </div>
        )}
      </article>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          className="inline-flex items-center gap-1.5 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </button>

        {isLast ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-1.5 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              <RotateCcw className="h-4 w-4" />
              Von vorn
            </button>
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Auswahl beenden
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Weiter
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
