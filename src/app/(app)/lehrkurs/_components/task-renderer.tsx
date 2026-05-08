"use client";

/**
 * Aufgabentyp-Renderer für die Bibliologie-Lektion.
 *
 * Aktuell unterstützt: A1 (true_false), A3 (match), B1, C1, D2 (Text),
 * F2 (rein Reflexion ohne Speichern).
 *
 * Architektur:
 *   - Eine Wrapper-Component <TaskCard> regelt Status (Speichern, OK-Badge)
 *   - Pro Typ eine kleine Sub-Component, die ihre eigene Server-Action ruft
 *   - Speicher-Status optimistisch („wird gespeichert..." → „gespeichert ✓")
 */

import { useState, useTransition } from "react";
import { Check, CheckCircle2, Lock, Save, XCircle } from "lucide-react";
import {
  saveMatchAnswer,
  saveTextAnswer,
  saveTrueFalseAnswer,
} from "../_actions";
import { LessonText } from "./lesson-text";
import type { LessonTask } from "@/lib/repositories/courses";

type TaskRendererProps = {
  task: LessonTask;
  moduleOrder: number;
  lessonOrder: number;
  /** 1-basierte Position der Aufgabe in der Lektion (rein für die Anzeige). */
  number: number;
};

export function TaskRenderer(props: TaskRendererProps) {
  switch (props.task.type) {
    case "A1_true_false":
      return <TrueFalseTask {...props} />;
    case "A3_match":
      return <MatchTask {...props} />;
    case "B1_short_open":
    case "C1_long_open":
      return <TextTask {...props} variant="short" />;
    case "D2_personal_impact":
      return <TextTask {...props} variant="private" />;
    case "F2_thinking":
      return <ThinkingTask {...props} />;
    default:
      return (
        <TaskCard {...props} status="idle">
          <p className="text-sm text-muted-foreground">
            Dieser Aufgabentyp ({props.task.type}) ist im MVP noch nicht
            implementiert. Wird in der nächsten Iteration ergänzt.
          </p>
        </TaskCard>
      );
  }
}

// ====================================================================
// TaskCard — gemeinsame Hülle (Header, Prompt, Status)
// ====================================================================

type Status =
  | "idle"
  | "saving"
  | "saved"
  | "auto_correct"
  | "auto_incorrect"
  | "error";

function TaskCard({
  task,
  number,
  status,
  children,
  footer,
}: TaskRendererProps & {
  status: Status;
  children: React.ReactNode;
  footer?: React.ReactNode;
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
        <StatusBadge status={status} />
      </div>
      <div className="ml-9 space-y-3">{children}</div>
      {footer && <div className="ml-9">{footer}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
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

// ====================================================================
// B1 / C1 / D2 — Textantwort (mit optionalem „privat"-Hinweis)
// ====================================================================

function TextTask({
  task,
  moduleOrder,
  lessonOrder,
  number,
  variant,
}: TaskRendererProps & { variant: "short" | "private" }) {
  const initialText =
    typeof (task.answer?.answer as { text?: string } | undefined)?.text === "string"
      ? ((task.answer!.answer as { text: string }).text)
      : "";

  const [text, setText] = useState(initialText);
  const [status, setStatus] = useState<Status>(initialText ? "saved" : "idle");
  const [pending, startTransition] = useTransition();

  const onSave = () => {
    setStatus("saving");
    startTransition(async () => {
      try {
        await saveTextAnswer({
          taskId: task.id,
          moduleOrder,
          lessonOrder,
          text,
        });
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    });
  };

  return (
    <TaskCard
      task={task}
      moduleOrder={moduleOrder}
      lessonOrder={lessonOrder}
      number={number}
      status={status}
    >
      {variant === "private" && (
        <div className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Diese Antwort bleibt <strong>privat</strong> — sie wird nicht
            eingereicht oder mit anderen geteilt. Nur du siehst sie.
          </span>
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (status === "saved") setStatus("idle");
        }}
        rows={variant === "private" ? 4 : 3}
        placeholder="Deine Antwort…"
        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={pending || text.trim() === ""}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          Speichern
        </button>
      </div>
    </TaskCard>
  );
}

// ====================================================================
// A1 — true/false mit Erklärung beim Auflösen
// ====================================================================

type TrueFalseStatement = {
  id: string;
  text: string;
  answer: boolean;
  explanation?: string;
};

function TrueFalseTask({
  task,
  moduleOrder,
  lessonOrder,
  number,
}: TaskRendererProps) {
  const cfg = (task.config as { statements?: TrueFalseStatement[] } | null) ?? {};
  const statements = cfg.statements ?? [];

  const initialAnswers =
    (task.answer?.answer as { answers?: Record<string, boolean> } | undefined)
      ?.answers ?? {};

  const [answers, setAnswers] =
    useState<Record<string, boolean | undefined>>(initialAnswers);
  const [revealed, setRevealed] = useState(
    Object.keys(initialAnswers).length === statements.length && statements.length > 0,
  );
  const [status, setStatus] = useState<Status>(
    revealed
      ? statements.every((s) => initialAnswers[s.id] === s.answer)
        ? "auto_correct"
        : "auto_incorrect"
      : "idle",
  );
  const [pending, startTransition] = useTransition();

  const allAnswered =
    statements.length > 0 &&
    statements.every((s) => typeof answers[s.id] === "boolean");

  const onSubmit = () => {
    if (!allAnswered) return;
    setStatus("saving");
    startTransition(async () => {
      try {
        const res = await saveTrueFalseAnswer({
          taskId: task.id,
          moduleOrder,
          lessonOrder,
          answers: answers as Record<string, boolean>,
        });
        setStatus(res.isAutoCorrect ? "auto_correct" : "auto_incorrect");
        setRevealed(true);
      } catch {
        setStatus("error");
      }
    });
  };

  return (
    <TaskCard
      task={task}
      moduleOrder={moduleOrder}
      lessonOrder={lessonOrder}
      number={number}
      status={status}
    >
      <div className="space-y-2">
        {statements.map((s) => {
          const userAnswer = answers[s.id];
          const isCorrect = revealed && userAnswer === s.answer;
          const isWrong = revealed && userAnswer !== undefined && userAnswer !== s.answer;
          return (
            <div
              key={s.id}
              className={
                "rounded-md border px-3 py-2 text-sm " +
                (isCorrect
                  ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20"
                  : isWrong
                    ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
                    : "bg-background")
              }
            >
              <div className="flex items-start gap-3">
                <p className="flex-1">{s.text}</p>
                <div className="flex shrink-0 gap-1">
                  <TfButton
                    label="R"
                    selected={userAnswer === true}
                    disabled={revealed}
                    onClick={() => setAnswers({ ...answers, [s.id]: true })}
                  />
                  <TfButton
                    label="F"
                    selected={userAnswer === false}
                    disabled={revealed}
                    onClick={() => setAnswers({ ...answers, [s.id]: false })}
                  />
                </div>
              </div>
              {revealed && s.explanation && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {userAnswer === s.answer ? "Richtig — " : "Lösung — "}
                  {s.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {!revealed && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!allAnswered || pending}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Auflösen
          </button>
        </div>
      )}
    </TaskCard>
  );
}

function TfButton({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "h-7 w-7 rounded-md border text-sm font-semibold transition-colors " +
        (selected
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background hover:bg-muted") +
        (disabled ? " cursor-not-allowed opacity-60" : "")
      }
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}

// ====================================================================
// A3 — match (Dropdown-Variante; Drag&Drop kommt später)
// ====================================================================

type MatchPair = { left: string; right: string };

function MatchTask({
  task,
  moduleOrder,
  lessonOrder,
  number,
}: TaskRendererProps) {
  const cfg = (task.config as { pairs?: MatchPair[] } | null) ?? {};
  const pairs = cfg.pairs ?? [];
  const rightOptions = Array.from(new Set(pairs.map((p) => p.right)));

  const initial =
    (task.answer?.answer as { matches?: Record<string, string> } | undefined)
      ?.matches ?? {};

  const [matches, setMatches] = useState<Record<string, string>>(initial);
  const [revealed, setRevealed] = useState(
    Object.keys(initial).length === pairs.length && pairs.length > 0,
  );
  const [status, setStatus] = useState<Status>(
    revealed
      ? pairs.every((p) => initial[p.left] === p.right)
        ? "auto_correct"
        : "auto_incorrect"
      : "idle",
  );
  const [pending, startTransition] = useTransition();

  const allAssigned = pairs.every((p) => matches[p.left]);

  const onSubmit = () => {
    if (!allAssigned) return;
    setStatus("saving");
    startTransition(async () => {
      try {
        const res = await saveMatchAnswer({
          taskId: task.id,
          moduleOrder,
          lessonOrder,
          matches,
        });
        setStatus(res.isAutoCorrect ? "auto_correct" : "auto_incorrect");
        setRevealed(true);
      } catch {
        setStatus("error");
      }
    });
  };

  return (
    <TaskCard
      task={task}
      moduleOrder={moduleOrder}
      lessonOrder={lessonOrder}
      number={number}
      status={status}
    >
      <div className="space-y-2">
        {pairs.map((p) => {
          const sel = matches[p.left] ?? "";
          const correct = revealed && sel === p.right;
          const wrong = revealed && sel !== "" && sel !== p.right;
          return (
            <div
              key={p.left}
              className={
                "flex items-center gap-3 rounded-md border px-3 py-2 text-sm " +
                (correct
                  ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20"
                  : wrong
                    ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
                    : "bg-background")
              }
            >
              <p className="flex-1 font-medium">{p.left}</p>
              <span className="text-muted-foreground">→</span>
              <select
                value={sel}
                disabled={revealed}
                onChange={(e) =>
                  setMatches({ ...matches, [p.left]: e.target.value })
                }
                className="rounded-md border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
              >
                <option value="">— wähle —</option>
                {rightOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
      {revealed && (
        <p className="text-xs text-muted-foreground">
          {pairs
            .filter((p) => matches[p.left] !== p.right)
            .map(
              (p) => `Richtige Zuordnung für „${p.left}": ${p.right}`,
            )
            .join(" · ") || "Alles richtig zugeordnet."}
        </p>
      )}
      {!revealed && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!allAssigned || pending}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Auflösen
          </button>
        </div>
      )}
    </TaskCard>
  );
}

// ====================================================================
// F2 — Frage zum Nachdenken (kein Save, nur Hinweis)
// ====================================================================

function ThinkingTask({
  task,
  moduleOrder,
  lessonOrder,
  number,
}: TaskRendererProps) {
  return (
    <TaskCard
      task={task}
      moduleOrder={moduleOrder}
      lessonOrder={lessonOrder}
      number={number}
      status="idle"
    >
      <p className="text-xs text-muted-foreground">
        Zum Nachdenken — keine Eingabe nötig. Nimm dir Zeit für die Frage,
        bevor du weitermachst.
      </p>
    </TaskCard>
  );
}
