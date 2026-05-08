"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  gradeLabels,
  previewIntervals,
  type SrsGrade,
  type SrsState,
} from "@/lib/srs";
import { recordVerseReview, type DueVerse } from "../../_actions";

type Phase = "front" | "back";

const gradeOrder: SrsGrade[] = ["again", "hard", "good", "easy"];

const gradeStyles: Record<SrsGrade, string> = {
  again:
    "border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30",
  hard: "border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/30",
  good: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/30",
  easy: "border-sky-200 bg-sky-50 hover:bg-sky-100 dark:border-sky-900/40 dark:bg-sky-950/30",
};

export function LearnSession({ verses }: { verses: DueVerse[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("front");
  const [pending, startTransition] = useTransition();
  const [doneCount, setDoneCount] = useState(0);

  const total = verses.length;
  const current = verses[index];

  const srsState: SrsState | null = useMemo(() => {
    if (!current) return null;
    return {
      easeFactor: current.easeFactor ?? 250,
      intervalDays: current.intervalDays ?? 0,
      repetitions: current.repetitions ?? 0,
    };
  }, [current]);

  const intervals = useMemo(
    () => (srsState ? previewIntervals(srsState) : null),
    [srsState],
  );

  if (!current) {
    return (
      <SessionDone
        doneCount={doneCount}
        onRestart={() => router.refresh()}
      />
    );
  }

  function handleGrade(grade: SrsGrade) {
    const verseId = current!.id;
    startTransition(async () => {
      await recordVerseReview({ verseId, grade });
      const nextIndex = index + 1;
      setDoneCount((c) => c + 1);
      if (nextIndex >= total) {
        // Letzter Vers fertig — Done-State zeigen
        setIndex(nextIndex);
      } else {
        setIndex(nextIndex);
        setPhase("front");
      }
    });
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

        {phase === "front" ? (
          <div className="flex min-h-[14rem] flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">
              Versuche, den Text aus dem Gedächtnis aufzusagen.
            </p>
            <button
              type="button"
              onClick={() => setPhase("back")}
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
          </div>
        )}
      </article>

      {phase === "back" && intervals && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {gradeOrder.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => handleGrade(g)}
              disabled={pending}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md border-2 px-3 py-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                gradeStyles[g],
              )}
            >
              <span className="font-medium text-foreground">
                {gradeLabels[g]}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatInterval(intervals[g])}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ position, total }: { position: number; total: number }) {
  const percent = Math.min(100, Math.round((position / total) * 100));
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {Math.min(position, total)} / {total}
      </p>
    </div>
  );
}

function SessionDone({
  doneCount,
  onRestart,
}: {
  doneCount: number;
  onRestart: () => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <p className="font-serif text-xl font-semibold">
        Schön — {doneCount}{" "}
        {doneCount === 1 ? "Vers durchgegangen" : "Verse durchgegangen"}.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Die nächste Wiederholung passiert dann, wenn dein Gedächtnis sie braucht
        — kein Druck.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/verse"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Zur Übersicht
        </Link>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-1.5 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <RotateCcw className="h-4 w-4" />
          Auf neue Fälligkeiten prüfen
        </button>
      </div>
    </div>
  );
}

function formatInterval(days: number): string {
  if (days <= 0) return "heute nochmal";
  if (days === 1) return "morgen";
  if (days < 30) return `in ${days} T.`;
  if (days < 365) return `in ${Math.round(days / 30)} Mon.`;
  return `in ${Math.round(days / 365)} J.`;
}
