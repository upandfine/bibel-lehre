"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { gradeLabels, type SrsGrade } from "@/lib/srs";

/** Anki-Layout: Rot = nochmal, Bernstein = schwer, Grün = gut, Blau = leicht. */
export const gradeOrder: SrsGrade[] = ["again", "hard", "good", "easy"];

export const gradeStyles: Record<SrsGrade, string> = {
  again:
    "border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30",
  hard: "border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/30",
  good: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/30",
  easy: "border-sky-200 bg-sky-50 hover:bg-sky-100 dark:border-sky-900/40 dark:bg-sky-950/30",
};

export function ProgressBar({
  position,
  total,
}: {
  position: number;
  total: number;
}) {
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

export function SessionDone({
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

export function GradeButton({
  grade,
  intervalDays,
  disabled,
  onClick,
}: {
  grade: SrsGrade;
  intervalDays: number;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-md border-2 px-3 py-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        gradeStyles[grade],
      )}
    >
      <span className="font-medium text-foreground">{gradeLabels[grade]}</span>
      <span className="text-xs text-muted-foreground">
        {formatInterval(intervalDays)}
      </span>
    </button>
  );
}

export function formatInterval(days: number): string {
  if (days <= 0) return "heute nochmal";
  if (days === 1) return "morgen";
  if (days < 30) return `in ${days} T.`;
  if (days < 365) return `in ${Math.round(days / 30)} Mon.`;
  return `in ${Math.round(days / 365)} J.`;
}
