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

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ExternalLink,
  Library,
  Lock,
  Save,
} from "lucide-react";
import {
  saveChoiceAnswer,
  saveClozeAnswer,
  saveOrderingAnswer,
  saveTextAnswer,
  saveTrueFalseAnswer,
  toggleReadingDone,
} from "../_actions";
import { MatchTaskDnD } from "./match-task";
import { TaskCard, type TaskCardStatus } from "./task-card";
import {
  isChoiceCorrect,
  isClozeCorrect,
  isGapCorrect,
  isOrderingCorrect,
  isTrueFalseCorrect,
  type ChoiceOption,
  type ClozeGap,
  type TrueFalseStatement,
} from "@/lib/lehrkurs-grading";
import { routes } from "@/lib/routes";
import type { LessonTask } from "@/lib/repositories/courses";

type Status = TaskCardStatus;

type TaskRendererProps = {
  task: LessonTask;
  moduleOrder: number;
  lessonOrder: number;
  /** 1-basierte Position der Aufgabe in der Lektion (rein für die Anzeige). */
  number: number;
};

export function TaskRenderer(props: TaskRendererProps) {
  switch (props.task.type) {
    // --- Auto-bewertbar ---
    case "A1_true_false":
      return <TrueFalseTask {...props} />;
    case "A2_cloze":
      return <ClozeTask {...props} />;
    case "A3_match":
      return <MatchTask {...props} />;
    case "A5_ordering":
      return <OrderingTask {...props} />;
    case "A6_choice":
      return <ChoiceTask {...props} />;

    // --- Selbstbewertete Texteingabe (B/C-Typen unterscheiden sich nur in
    //     Textarea-Höhe und Hint im Placeholder) ---
    case "B1_short_open":
      return <TextTask {...props} variant="short" />;
    case "B2_list":
      return (
        <TextTask
          {...props}
          variant="list"
          placeholder="Ein Eintrag pro Zeile"
        />
      );
    case "B3_definition":
      return (
        <TextTask
          {...props}
          variant="short"
          placeholder="Deine Definition…"
        />
      );
    case "B4_verse_meaning":
      return (
        <TextTask
          {...props}
          variant="short"
          placeholder="Was sagt die Stelle aus?"
        />
      );
    case "C1_long_open":
    case "C2_essay":
    case "C3_compare":
    case "C4_application":
    case "C5_summary":
      return <TextTask {...props} variant="long" />;

    // --- Private Reflexion (D-Typen, immer mit Privat-Hinweis) ---
    case "D1_personal_meaning":
    case "D2_personal_impact":
    case "D3_personal_excitement":
      return <TextTask {...props} variant="private" />;

    // --- Verhalten ---
    case "E1_verse_memorize":
    case "E2_passage_memorize":
      return <VerseMemorizeTask {...props} />;
    case "E3_order_memorize":
      return <OrderMemorizeTask {...props} />;
    case "E4_reading":
      return <ReadingTask {...props} />;
    case "E5_choice_xor":
      // XOR-Wahlaufgaben werden über task_groups gesteuert — eine eigene
      // Renderkomponente folgt mit der task_groups-UI. Vorerst als Hinweis.
      return (
        <TaskCard {...props} status="idle">
          <p className="text-sm text-muted-foreground">
            Wahlaufgabe — XOR-Logik wird mit dem Task-Groups-System
            ergänzt.
          </p>
        </TaskCard>
      );

    // --- Sonstiges ---
    case "F1_external_research":
      return <ExternalResearchTask {...props} />;
    case "F2_thinking":
      return <ThinkingTask {...props} />;

    // A4 Tabelle kommt später — selten gebraucht, eigene komplexere UI nötig.
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
// Text-Antworten — B1/B2/B3/B4 (short/list), C1-C5 (long), D1-D3 (private)
// ====================================================================

type TextVariant = "short" | "long" | "private" | "list";

const TEXT_ROWS_FOR_VARIANT: Record<TextVariant, number> = {
  short: 3,
  long: 6,
  private: 4,
  list: 5,
};

function TextTask({
  task,
  moduleOrder,
  lessonOrder,
  number,
  variant,
  placeholder,
}: TaskRendererProps & {
  variant: TextVariant;
  placeholder?: string;
}) {
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
        rows={TEXT_ROWS_FOR_VARIANT[variant]}
        placeholder={placeholder ?? "Deine Antwort…"}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="no-print flex justify-end">
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
        <div className="no-print flex justify-end">
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
// A3 — Match (Drag&Drop-Variante in match-task.tsx ausgelagert)
//
// Die TaskCard-Hülle bleibt hier, der DnD-Body kommt aus MatchTaskDnD.
// Status-Anzeige im TaskCard-Header wäre redundant — die TaskCard rendert
// daher mit "idle", die Status-Information (richtig/falsch) zeigt
// MatchTaskDnD inline durch die Farbgebung der Slots.
// ====================================================================

function MatchTask(props: TaskRendererProps) {
  return (
    <TaskCard {...props} status="idle">
      <MatchTaskDnD
        task={props.task}
        moduleOrder={props.moduleOrder}
        lessonOrder={props.lessonOrder}
      />
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

// ====================================================================
// F1 — Externe Recherche (Hinweis + optionales Notiz-Feld)
// ====================================================================

function ExternalResearchTask(props: TaskRendererProps) {
  return (
    <TaskCard {...props} status="idle">
      <div className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Diese Aufgabe verlangt eine Recherche außerhalb der App — z.B.
          in einem Bibellexikon oder den empfohlenen Büchern. Die Notiz
          unten ist nur für dich.
        </span>
      </div>
      <NotesField {...props} placeholder="Deine Notizen aus der Recherche…" />
    </TaskCard>
  );
}

// ====================================================================
// E1 / E2 — Vers / Versblock auswendig lernen
// (Verweis auf das eigenständige SRS-Vers-Lernsystem)
// ====================================================================

function VerseMemorizeTask(props: TaskRendererProps) {
  return (
    <TaskCard {...props} status="idle">
      <div className="flex items-start gap-3 rounded-md border bg-background px-3 py-3">
        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Vers auswendig lernen</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Diese Aufgabe wird über das Vers-Lernsystem (Spaced Repetition)
            erledigt. Wenn der Vers in deinem Lernpensum ist, taucht er dort
            automatisch auf.
          </p>
          <Link
            href={routes.verse.overview()}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Zu Verse lernen
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </TaskCard>
  );
}

// ====================================================================
// E3 — Reihenfolge auswendig (Bücher der Bibel)
// (Verweis auf die Bücher-Übung)
// ====================================================================

function OrderMemorizeTask(props: TaskRendererProps) {
  return (
    <TaskCard {...props} status="idle">
      <div className="flex items-start gap-3 rounded-md border bg-background px-3 py-3">
        <Library className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Reihenfolge auswendig</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Die kanonische Reihenfolge der biblischen Bücher übst du in der
            Bücher-Übung — Sortieren, Zuordnen oder freies Schreiben.
          </p>
          <Link
            href={routes.uebungen.bookOrder.selection()}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Zur Bücher-Übung
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </TaskCard>
  );
}

// ====================================================================
// E4 — Reading: Checkbox „gelesen" + optionales Notizfeld
// ====================================================================

function ReadingTask({
  task,
  moduleOrder,
  lessonOrder,
  number,
}: TaskRendererProps) {
  const stored = task.answer?.answer as { done?: boolean } | undefined;
  const [done, setDone] = useState<boolean>(stored?.done === true);
  const [status, setStatus] = useState<Status>(stored?.done ? "saved" : "idle");
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !done;
    setDone(next);
    setStatus("saving");
    startTransition(async () => {
      try {
        await toggleReadingDone({
          taskId: task.id,
          moduleOrder,
          lessonOrder,
          done: next,
        });
        setStatus("saved");
      } catch {
        setStatus("error");
        setDone(!next); // optimistisches Update zurückrollen
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
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={
          "flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors disabled:cursor-not-allowed " +
          (done
            ? "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200"
            : "bg-background hover:bg-muted")
        }
        aria-pressed={done}
      >
        <span
          className={
            "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 " +
            (done
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-muted-foreground/40")
          }
        >
          {done && <Check className="h-3 w-3" />}
        </span>
        <span className="text-left">
          {done ? "Gelesen — du kannst hier später erneut hinklicken." : "Ich habe diesen Abschnitt gelesen."}
        </span>
      </button>
    </TaskCard>
  );
}

// ====================================================================
// A6 — Multiple Choice (Single oder Multi je nach config.multi)
// ====================================================================

function ChoiceTask({
  task,
  moduleOrder,
  lessonOrder,
  number,
}: TaskRendererProps) {
  const cfg = (task.config as
    | { options?: ChoiceOption[]; multi?: boolean }
    | null) ?? {};
  const options = cfg.options ?? [];
  const multi = cfg.multi === true;

  const stored =
    (task.answer?.answer as { selected?: string[] } | undefined)?.selected ?? [];

  const [selected, setSelected] = useState<Set<string>>(new Set(stored));
  const [revealed, setRevealed] = useState(stored.length > 0);
  const [status, setStatus] = useState<Status>(
    revealed
      ? isChoiceCorrect(stored, options)
        ? "auto_correct"
        : "auto_incorrect"
      : "idle",
  );
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (multi) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else {
        next.clear();
        next.add(id);
      }
      return next;
    });
  };

  const onSubmit = () => {
    if (selected.size === 0) return;
    setStatus("saving");
    startTransition(async () => {
      try {
        const res = await saveChoiceAnswer({
          taskId: task.id,
          moduleOrder,
          lessonOrder,
          selected: Array.from(selected),
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
      <p className="text-xs text-muted-foreground">
        {multi
          ? "Mehrere Antworten können richtig sein."
          : "Genau eine Antwort ist richtig."}
      </p>
      <div className="space-y-1.5">
        {options.map((o) => {
          const isSel = selected.has(o.id);
          const correct = revealed && o.correct;
          const wrongSel = revealed && isSel && !o.correct;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => !revealed && toggle(o.id)}
              disabled={revealed}
              className={
                "flex w-full items-start gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors " +
                (correct
                  ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20"
                  : wrongSel
                    ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
                    : isSel
                      ? "border-primary bg-primary/5"
                      : "bg-background hover:bg-muted") +
                (revealed ? " cursor-default" : " cursor-pointer")
              }
              aria-pressed={isSel}
            >
              <span
                className={
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border-2 " +
                  (multi ? "rounded-sm" : "rounded-full") +
                  " " +
                  (isSel
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40")
                }
              >
                {isSel && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
              </span>
              <span className="flex-1">{o.text}</span>
            </button>
          );
        })}
      </div>
      {!revealed && (
        <div className="no-print flex justify-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={selected.size === 0 || pending}
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
// A2 — Cloze (Lückentext mit Eingabefeldern)
// ====================================================================
//
// Config-Form:
//   {
//     kind: "cloze",
//     text: "Die Bibel wurde auf {hebr} und {grie} geschrieben.",
//     gaps: [
//       { id: "hebr", answer: "Hebräisch", accept: ["hebraisch"] },
//       { id: "grie", answer: "Griechisch" }
//     ]
//   }
//
// Der Text wird an {id}-Platzhaltern gesplittet, je Stück kommt eine
// Input-Box. Tolerante Auto-Bewertung über normalizeForCloze (siehe action).


function parseClozeText(
  text: string,
): { kind: "text"; value: string }[] | { kind: "gap"; id: string }[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [];
  const regex = /\{([a-zA-Z0-9_-]+)\}/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parts.push({ kind: "text", value: text.slice(lastIdx, m.index) });
    }
    parts.push({ kind: "gap", id: m[1] });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) {
    parts.push({ kind: "text", value: text.slice(lastIdx) });
  }
  return parts;
}

function ClozeTask({
  task,
  moduleOrder,
  lessonOrder,
  number,
}: TaskRendererProps) {
  const cfg = (task.config as
    | { text?: string; gaps?: ClozeGap[] }
    | null) ?? {};
  const text = cfg.text ?? "";
  const gaps = cfg.gaps ?? [];
  const parts = parseClozeText(text);

  const initialFills =
    (task.answer?.answer as { fills?: Record<string, string> } | undefined)
      ?.fills ?? {};

  const [fills, setFills] = useState<Record<string, string>>(initialFills);
  const [revealed, setRevealed] = useState(Object.keys(initialFills).length > 0);
  const [status, setStatus] = useState<Status>(
    revealed
      ? isClozeCorrect(initialFills, gaps)
        ? "auto_correct"
        : "auto_incorrect"
      : "idle",
  );
  const [pending, startTransition] = useTransition();

  const allFilled = gaps.every((g) => (fills[g.id] ?? "").trim().length > 0);

  const onSubmit = () => {
    if (!allFilled) return;
    setStatus("saving");
    startTransition(async () => {
      try {
        const res = await saveClozeAnswer({
          taskId: task.id,
          moduleOrder,
          lessonOrder,
          fills,
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
      <p className="flex flex-wrap items-baseline gap-x-1 gap-y-2 text-sm leading-relaxed">
        {parts.map((p, idx) => {
          if (p.kind === "text") {
            return <span key={idx}>{p.value}</span>;
          }
          const gap = gaps.find((g) => g.id === p.id);
          const userValue = fills[p.id] ?? "";
          const correct =
            revealed &&
            gap &&
            isGapCorrect(userValue, gap);
          const wrong = revealed && !correct;
          return (
            <span key={idx} className="inline-flex flex-col">
              <input
                type="text"
                value={userValue}
                onChange={(e) =>
                  setFills({ ...fills, [p.id]: e.target.value })
                }
                disabled={revealed}
                className={
                  "min-w-[6rem] rounded border-b-2 bg-transparent px-1 py-0.5 text-center font-medium focus:outline-none disabled:cursor-not-allowed " +
                  (correct
                    ? "border-emerald-500 text-emerald-700 dark:text-emerald-400"
                    : wrong
                      ? "border-amber-500 text-amber-700 dark:text-amber-400"
                      : "border-muted-foreground/40 focus:border-primary")
                }
                aria-label={`Lücke ${p.id}`}
              />
              {wrong && gap && (
                <span className="mt-0.5 text-xs text-muted-foreground">
                  → {gap.answer}
                </span>
              )}
            </span>
          );
        })}
      </p>
      {!revealed && (
        <div className="no-print flex justify-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!allFilled || pending}
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
// A5 — Ordering (Items in die richtige Reihenfolge bringen)
//
// MVP: Up/Down-Buttons statt Drag&Drop. Reicht für 3-6 Items, deutlich
// einfacher als komplette dnd-kit-Integration und auf Mobile robuster.
// ====================================================================

function OrderingTask({
  task,
  moduleOrder,
  lessonOrder,
  number,
}: TaskRendererProps) {
  const cfg = (task.config as { items?: string[] } | null) ?? {};
  const correctOrder = cfg.items ?? [];

  // Stored Order oder gemischte Initial-Reihenfolge
  const storedOrder =
    (task.answer?.answer as { order?: string[] } | undefined)?.order;

  const [order, setOrder] = useState<string[]>(() => {
    if (storedOrder && storedOrder.length === correctOrder.length) {
      return storedOrder;
    }
    return shuffleStable(correctOrder, task.id);
  });
  const [revealed, setRevealed] = useState(!!storedOrder);
  const [status, setStatus] = useState<Status>(
    revealed
      ? isOrderingCorrect(storedOrder ?? [], correctOrder)
        ? "auto_correct"
        : "auto_incorrect"
      : "idle",
  );
  const [pending, startTransition] = useTransition();

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[idx], next[j]] = [next[j], next[idx]];
    setOrder(next);
  };

  const onSubmit = () => {
    setStatus("saving");
    startTransition(async () => {
      try {
        const res = await saveOrderingAnswer({
          taskId: task.id,
          moduleOrder,
          lessonOrder,
          order,
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
      <p className="text-xs text-muted-foreground">
        Bring die Items mit den Pfeilen in die richtige Reihenfolge.
      </p>
      <ol className="space-y-1.5">
        {order.map((item, idx) => {
          const correctPosition = correctOrder[idx] === item;
          return (
            <li
              key={item}
              className={
                "flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm " +
                (revealed && correctPosition
                  ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20"
                  : revealed
                    ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
                    : "")
              }
            >
              <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {idx + 1}.
              </span>
              <span className="flex-1">{item}</span>
              {!revealed && (
                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="rounded-md border bg-background px-2 py-0.5 text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Nach oben"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, 1)}
                    disabled={idx === order.length - 1}
                    className="rounded-md border bg-background px-2 py-0.5 text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Nach unten"
                  >
                    ↓
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {revealed && (
        <p className="text-xs text-muted-foreground">
          Richtige Reihenfolge: {correctOrder.join(" → ")}
        </p>
      )}
      {!revealed && (
        <div className="no-print flex justify-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Auflösen
          </button>
        </div>
      )}
    </TaskCard>
  );
}

/**
 * Deterministischer Pseudo-Shuffle anhand der Task-ID — beim Reload sieht
 * der Lerner die gleiche Anfangs-Reihenfolge (statt jedes Mal eine neue),
 * was viel weniger frustrierend ist.
 */
function shuffleStable(arr: string[], seed: string): string[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  const a = [...arr];
  // Fisher-Yates mit deterministischem PRNG (Mulberry32)
  let s = h >>> 0 || 1;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Falls zufällig identisch zur Eingabe: 1 swap erzwingen.
  if (a.length > 1 && a.every((x, i) => x === arr[i])) {
    [a[0], a[1]] = [a[1], a[0]];
  }
  return a;
}

// ====================================================================
// NotesField — kleines wiederverwendbares Eingabefeld für Recherche-Notizen
// ====================================================================

function NotesField({
  task,
  moduleOrder,
  lessonOrder,
  placeholder,
}: Omit<TaskRendererProps, "number"> & { placeholder: string }) {
  const initial =
    typeof (task.answer?.answer as { text?: string } | undefined)?.text === "string"
      ? ((task.answer!.answer as { text: string }).text)
      : "";

  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(initial.length > 0);
  const [pending, startTransition] = useTransition();

  const onSave = () => {
    startTransition(async () => {
      try {
        await saveTextAnswer({
          taskId: task.id,
          moduleOrder,
          lessonOrder,
          text,
        });
        setSaved(true);
      } catch {
        setSaved(false);
      }
    });
  };

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (saved) setSaved(false);
        }}
        rows={3}
        placeholder={placeholder}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {saved ? "Notiz gespeichert." : ""}
        </span>
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
    </div>
  );
}
