/**
 * Gemeinsame Hülle für alle Aufgaben: Nummer, Prompt, Status-Badge.
 * Wird von allen Aufgabentyp-Renderern (TextTask, ChoiceTask, MatchTaskDnD,
 * etc.) verwendet — extrahiert in eigene Datei, damit auch ausgelagerte
 * Renderer wie `match-task.tsx` sie ohne Zirkelimport nutzen können.
 */

import { Check, CheckCircle2, XCircle } from "lucide-react";
import { LessonText } from "./lesson-text";
import type { LessonTask } from "@/lib/repositories/courses";

export type TaskCardStatus =
  | "idle"
  | "saving"
  | "saved"
  | "auto_correct"
  | "auto_incorrect"
  | "error";

export function TaskCard({
  task,
  number,
  status,
  children,
  footer,
}: {
  task: LessonTask;
  number: number;
  status: TaskCardStatus;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Tolerant gegenüber Spread-Props der Renderer-Funktionen. */
  [extra: string]: unknown;
}) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-xs font-semibold text-primary">
          {number}
        </div>
        <div className="min-w-0 flex-1">
          <LessonText markdown={task.promptMd} />
        </div>
        <TaskStatusBadge status={status} />
      </div>
      <div className="ml-9 space-y-3">{children}</div>
      {footer && <div className="ml-9">{footer}</div>}
    </div>
  );
}

export function TaskStatusBadge({ status }: { status: TaskCardStatus }) {
  if (status === "idle") return null;
  if (status === "saving") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        speichert…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
        <Check className="h-3 w-3" />
        gespeichert
      </span>
    );
  }
  if (status === "auto_correct") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        richtig
      </span>
    );
  }
  if (status === "auto_incorrect") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
        <XCircle className="h-3 w-3" />
        nochmal anschauen
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
      Fehler
    </span>
  );
}
