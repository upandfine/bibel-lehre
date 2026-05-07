"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCheck, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  gradeLabels,
  previewIntervals,
  type SrsGrade,
  type SrsState,
} from "@/lib/srs";
import { recordVerseReview, type DueVerse } from "../../_actions";
import {
  isWordCorrect,
  pickGapIndices,
  tokenize,
  type Token,
} from "../../_components/cloze";

type Phase = "filling" | "checked";

const gradeOrder: SrsGrade[] = ["again", "hard", "good", "easy"];

const gradeStyles: Record<SrsGrade, string> = {
  again:
    "border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30",
  hard: "border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/30",
  good: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/30",
  easy: "border-sky-200 bg-sky-50 hover:bg-sky-100 dark:border-sky-900/40 dark:bg-sky-950/30",
};

export function ClozeSession({ verses }: { verses: DueVerse[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("filling");
  const [pending, startTransition] = useTransition();
  const [doneCount, setDoneCount] = useState(0);

  const total = verses.length;
  const current = verses[index];

  // Pro Vers: deterministische Tokens und Lücken-Indizes
  const { tokens, gapIndices, gapTokenIndexList } = useMemo(() => {
    if (!current)
      return {
        tokens: [] as Token[],
        gapIndices: new Set<number>(),
        gapTokenIndexList: [] as number[],
      };
    const tks = tokenize(current.text);
    const gaps = pickGapIndices(tks);
    const list = [...gaps].sort((a, b) => a - b);
    return { tokens: tks, gapIndices: gaps, gapTokenIndexList: list };
  }, [current]);

  // Inputs pro Lücke (Index relativ zu gapTokenIndexList).
  // Reset wenn neuer Vers kommt = Anzahl Lücken ändert sich.
  const [inputs, setInputs] = useState<string[]>([]);
  useEffect(() => {
    setInputs(new Array(gapTokenIndexList.length).fill(""));
  }, [gapTokenIndexList.length]);

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

  function setInputAt(i: number, value: string) {
    setInputs((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }

  function handleCheck() {
    setPhase("checked");
  }

  function handleGrade(grade: SrsGrade) {
    const verseId = current!.id;
    startTransition(async () => {
      await recordVerseReview(verseId, grade);
      const nextIndex = index + 1;
      setDoneCount((c) => c + 1);
      setIndex(nextIndex);
      setPhase("filling");
    });
  }

  // Auswertung pro Lücke (nur sichtbar in checked-Phase)
  const evaluation = gapTokenIndexList.map((tokenIdx, gapIdx) => {
    const expected = (tokens[tokenIdx] as { kind: "word"; text: string }).text;
    const userInput = inputs[gapIdx] ?? "";
    return {
      tokenIdx,
      expected,
      userInput,
      isCorrect: isWordCorrect(userInput, expected),
    };
  });

  const correctGaps = evaluation.filter((e) => e.isCorrect).length;
  const totalGaps = evaluation.length;
  const allCorrect = totalGaps > 0 && correctGaps === totalGaps;

  // Mapping Token-Index → Gap-Index für Render
  const gapIdxByTokenIdx = new Map(
    gapTokenIndexList.map((tIdx, gapIdx) => [tIdx, gapIdx] as const),
  );

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

        <p className="font-serif text-lg leading-relaxed">
          {tokens.map((token, i) => {
            if (token.kind === "sep") {
              return <span key={i}>{token.text}</span>;
            }
            const gapIdx = gapIdxByTokenIdx.get(i);
            if (gapIdx === undefined) {
              return <span key={i}>{token.text}</span>;
            }
            // Lücke
            const e = evaluation[gapIdx];
            if (phase === "filling") {
              return (
                <ClozeInput
                  key={i}
                  expectedLength={token.text.length}
                  value={inputs[gapIdx] ?? ""}
                  onChange={(v) => setInputAt(gapIdx, v)}
                />
              );
            }
            // checked
            return (
              <ClozeChecked
                key={i}
                expected={e.expected}
                userInput={e.userInput}
                isCorrect={e.isCorrect}
              />
            );
          })}
        </p>

        {phase === "checked" && (
          <div className="mt-4 border-t pt-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground tabular-nums">
                {correctGaps} / {totalGaps}
              </strong>{" "}
              Lücken richtig.{" "}
              {allCorrect
                ? "Sehr stark."
                : "Schau die markierten Stellen in Ruhe an, bewerte selbst."}
            </p>
            {current.attribution && (
              <p className="mt-2 text-xs">{current.attribution}</p>
            )}
          </div>
        )}
      </article>

      {phase === "filling" ? (
        <div className="sticky bottom-0 -mx-3 mt-2 flex items-center justify-end gap-3 border-t bg-background/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4">
          <button
            type="button"
            onClick={handleCheck}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCheck className="h-4 w-4" />
            Prüfen
          </button>
        </div>
      ) : (
        intervals && (
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
        )
      )}
    </div>
  );
}

function ClozeInput({
  expectedLength,
  value,
  onChange,
}: {
  expectedLength: number;
  value: string;
  onChange: (v: string) => void;
}) {
  // Schwankende Breite je nach Wortlänge — Mindest- und Höchstwert für Mobile
  const ch = Math.max(4, Math.min(14, expectedLength + 2));
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
      autoCapitalize="off"
      spellCheck={false}
      style={{ width: `${ch}ch` }}
      className="mx-0.5 inline-block rounded-sm border-b-2 border-primary/40 bg-transparent px-1 align-baseline text-base font-medium focus:border-primary focus:outline-none sm:text-base"
    />
  );
}

function ClozeChecked({
  expected,
  userInput,
  isCorrect,
}: {
  expected: string;
  userInput: string;
  isCorrect: boolean;
}) {
  if (isCorrect) {
    return (
      <span className="rounded-sm bg-green-100 px-1 font-medium text-green-900 dark:bg-green-950/50 dark:text-green-200">
        {expected}
      </span>
    );
  }
  return (
    <span className="inline-flex items-baseline gap-1 rounded-sm bg-red-100 px-1 dark:bg-red-950/40">
      <span className="font-medium text-red-900 dark:text-red-200">
        {expected}
      </span>
      {userInput.trim().length > 0 && (
        <span className="text-xs italic text-red-800/80 line-through dark:text-red-300/70">
          {userInput.trim()}
        </span>
      )}
    </span>
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
