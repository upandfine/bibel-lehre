"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { previewIntervals, type SrsGrade, type SrsState } from "@/lib/srs";
import { recordVerseReview, type DueVerse } from "../../_actions";
import {
  GradeButton,
  ProgressBar,
  SessionDone,
  gradeOrder,
} from "../../_components/session-shared";

type Phase = "front" | "back";

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
      <SessionDone doneCount={doneCount} onRestart={() => router.refresh()} />
    );
  }

  function handleGrade(grade: SrsGrade) {
    const verseId = current!.id;
    startTransition(async () => {
      await recordVerseReview({ verseId, grade });
      setDoneCount((c) => c + 1);
      setIndex(index + 1);
      setPhase("front");
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
            <p className="font-serif text-lg leading-relaxed">
              {current.text}
            </p>
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
            <GradeButton
              key={g}
              grade={g}
              intervalDays={intervals[g]}
              disabled={pending}
              onClick={() => handleGrade(g)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
