"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  GripVertical,
  Pencil,
  RotateCcw,
  Shuffle,
  X,
} from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

// ====================================================================
// Typen
// ====================================================================

type Book = {
  id: number;
  abbr: string;
  nameDe: string;
  nameOriginal: string | null;
  nameOriginalTransliterated: string | null;
  testament: "AT" | "NT";
  groupName: string;
  groupColor: string | null;
  orderIndex: number;
};

type Selection =
  | { kind: "all"; label: string }
  | { kind: "testament"; value: "AT" | "NT"; label: string }
  | { kind: "group"; value: string; label: string };

type Mode = "sort" | "write";
type Step = "select" | "mode" | "play" | "result";

// ====================================================================
// Helper
// ====================================================================

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Falls zufällig identisch zur Eingabe: nochmal mischen.
  if (a.length > 1 && a.every((x, i) => x === arr[i])) return shuffle(arr);
  return a;
}

/** Vergleichsfreundliche Form: lowercase, ohne Akzente, ohne Whitespace/Satzzeichen. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s.,;:'"`\-_]/g, "");
}

function aliasesFor(book: Book): string[] {
  const candidates = [
    book.nameDe,
    book.abbr,
    book.nameOriginalTransliterated ?? "",
    book.nameOriginal ?? "",
  ];
  return candidates.map(normalize).filter((x) => x.length > 0);
}

function isInputCorrect(input: string, book: Book): boolean {
  const n = normalize(input);
  if (!n) return false;
  return aliasesFor(book).includes(n);
}

function buildSelections(books: Book[]): Selection[] {
  const result: Selection[] = [
    { kind: "all", label: `Ganze Bibel (${books.length})` },
    {
      kind: "testament",
      value: "AT",
      label: `Altes Testament (${books.filter((b) => b.testament === "AT").length})`,
    },
    {
      kind: "testament",
      value: "NT",
      label: `Neues Testament (${books.filter((b) => b.testament === "NT").length})`,
    },
  ];

  // Gruppen in kanonischer Reihenfolge, in der sie zum ersten Mal auftauchen
  const seen = new Set<string>();
  for (const b of books) {
    if (seen.has(b.groupName)) continue;
    seen.add(b.groupName);
    const count = books.filter((x) => x.groupName === b.groupName).length;
    if (count < 3) continue; // 1–2 Bücher sind keine Reihenfolge-Übung
    result.push({
      kind: "group",
      value: b.groupName,
      label: `${b.groupName} (${count})`,
    });
  }
  return result;
}

function applySelection(books: Book[], sel: Selection): Book[] {
  if (sel.kind === "all") return books;
  if (sel.kind === "testament")
    return books.filter((b) => b.testament === sel.value);
  return books.filter((b) => b.groupName === sel.value);
}

// ====================================================================
// Hauptkomponente
// ====================================================================

export function BookOrderExercise({ books }: { books: Book[] }) {
  const [step, setStep] = useState<Step>("select");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [userOrder, setUserOrder] = useState<number[]>([]);
  const [userInputs, setUserInputs] = useState<string[]>([]);

  const selections = useMemo(() => buildSelections(books), [books]);
  const filteredBooks = useMemo(
    () => (selection ? applySelection(books, selection) : []),
    [books, selection],
  );

  function startMode(m: Mode) {
    setMode(m);
    if (m === "sort") {
      setUserOrder(shuffle(filteredBooks.map((b) => b.id)));
    } else {
      setUserInputs(filteredBooks.map(() => ""));
    }
    setStep("play");
  }

  function backToSelection() {
    setStep("select");
    setSelection(null);
    setMode(null);
    setUserOrder([]);
    setUserInputs([]);
  }

  if (step === "select") {
    return (
      <SelectionStep
        selections={selections}
        onSelect={(s) => {
          setSelection(s);
          setStep("mode");
        }}
      />
    );
  }

  if (step === "mode" && selection) {
    return (
      <ModeStep
        selection={selection}
        count={filteredBooks.length}
        onMode={startMode}
        onBack={backToSelection}
      />
    );
  }

  if (step === "play" && mode === "sort" && selection) {
    return (
      <SortStep
        books={filteredBooks}
        userOrder={userOrder}
        onChange={setUserOrder}
        onCheck={() => setStep("result")}
        onBack={() => setStep("mode")}
      />
    );
  }

  if (step === "play" && mode === "write" && selection) {
    return (
      <WriteStep
        books={filteredBooks}
        userInputs={userInputs}
        onChange={setUserInputs}
        onCheck={() => setStep("result")}
        onBack={() => setStep("mode")}
      />
    );
  }

  if (step === "result" && mode && selection) {
    return (
      <ResultStep
        books={filteredBooks}
        mode={mode}
        userOrder={userOrder}
        userInputs={userInputs}
        onAgain={() => startMode(mode)}
        onReset={backToSelection}
      />
    );
  }

  return null;
}

// ====================================================================
// Step 1 — Auswahl
// ====================================================================

function SelectionStep({
  selections,
  onSelect,
}: {
  selections: Selection[];
  onSelect: (s: Selection) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground">
        Welche Bücher willst du üben?
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {selections.map((s) => (
          <button
            key={`${s.kind}-${"value" in s ? s.value : "all"}`}
            type="button"
            onClick={() => onSelect(s)}
            className="rounded-lg border bg-card px-4 py-3 text-left text-sm font-medium transition-colors hover:border-foreground/40 hover:bg-accent"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ====================================================================
// Step 2 — Modus-Wahl
// ====================================================================

function ModeStep({
  selection,
  count,
  onMode,
  onBack,
}: {
  selection: Selection;
  count: number;
  onMode: (m: Mode) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <BackButton onClick={onBack} />
      <div>
        <h2 className="font-medium">{selection.label}</h2>
        <p className="text-sm text-muted-foreground">
          Wie willst du üben? {count} Bücher in der richtigen Reihenfolge.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onMode("sort")}
          className="group flex flex-col gap-2 rounded-lg border bg-card p-5 text-left transition-colors hover:border-foreground/40"
        >
          <div className="flex items-center gap-2">
            <Shuffle className="h-4 w-4" />
            <span className="font-medium">Sortieren</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Die Bücher liegen gemischt vor — bringe sie per Drag&amp;Drop in die
            richtige Reihenfolge.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onMode("write")}
          className="group flex flex-col gap-2 rounded-lg border bg-card p-5 text-left transition-colors hover:border-foreground/40"
        >
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            <span className="font-medium">Schreiben</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Schreibe die Bücher der Reihenfolge nach selbst auf — aktiver Recall
            statt Wiedererkennen.
          </p>
        </button>
      </div>
    </div>
  );
}

// ====================================================================
// Step 3a — Sortieren
// ====================================================================

function SortStep({
  books,
  userOrder,
  onChange,
  onCheck,
  onBack,
}: {
  books: Book[];
  userOrder: number[];
  onChange: (next: number[]) => void;
  onCheck: () => void;
  onBack: () => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const byId = new Map(books.map((b) => [b.id, b]));

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = userOrder.indexOf(active.id as number);
    const newIndex = userOrder.indexOf(over.id as number);
    onChange(arrayMove(userOrder, oldIndex, newIndex));
  }

  return (
    <div className="space-y-4">
      <BackButton onClick={onBack} />
      <p className="text-sm text-muted-foreground">
        Bringe die {userOrder.length} Bücher in die kanonische Reihenfolge —
        ziehe sie an den Griff oder wähle sie mit Tab und sortiere mit
        Pfeiltasten + Leertaste.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={userOrder}
          strategy={verticalListSortingStrategy}
        >
          <ol className="space-y-1.5">
            {userOrder.map((bookId, index) => {
              const book = byId.get(bookId);
              if (!book) return null;
              return (
                <SortableBookRow
                  key={bookId}
                  index={index + 1}
                  book={book}
                />
              );
            })}
          </ol>
        </SortableContext>
      </DndContext>

      <div className="sticky bottom-4 flex justify-end pt-2">
        <button
          type="button"
          onClick={onCheck}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Prüfen
        </button>
      </div>
    </div>
  );
}

function SortableBookRow({ book, index }: { book: Book; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: book.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex items-center gap-3 rounded-md border bg-card p-2 pr-3",
        isDragging && "z-10 shadow-md ring-2 ring-foreground/20",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Zum Sortieren ziehen"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-7 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
        {index}.
      </span>
      <BookCardInline book={book} />
    </li>
  );
}

// ====================================================================
// Step 3b — Schreiben
// ====================================================================

function WriteStep({
  books,
  userInputs,
  onChange,
  onCheck,
  onBack,
}: {
  books: Book[];
  userInputs: string[];
  onChange: (next: string[]) => void;
  onCheck: () => void;
  onBack: () => void;
}) {
  function setAt(index: number, value: string) {
    const next = [...userInputs];
    next[index] = value;
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <BackButton onClick={onBack} />
      <p className="text-sm text-muted-foreground">
        Schreibe die {books.length} Bücher der Reihenfolge nach in die Felder.
        Abkürzungen, Schreibweisen und Originalnamen werden akzeptiert (z.B.
        „1Mo", „1. Mose" oder „Bereschit").
      </p>

      <ol className="space-y-1.5">
        {books.map((_, idx) => (
          <li
            key={idx}
            className="flex items-center gap-3 rounded-md border bg-card p-2 pr-3"
          >
            <span className="w-7 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
              {idx + 1}.
            </span>
            <input
              type="text"
              value={userInputs[idx] ?? ""}
              onChange={(e) => setAt(idx, e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="flex-1 rounded-sm bg-transparent px-2 py-1 text-sm outline-none focus:bg-accent"
              placeholder="..."
            />
          </li>
        ))}
      </ol>

      <div className="sticky bottom-4 flex justify-end pt-2">
        <button
          type="button"
          onClick={onCheck}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Prüfen
        </button>
      </div>
    </div>
  );
}

// ====================================================================
// Step 4 — Auswertung
// ====================================================================

function ResultStep({
  books,
  mode,
  userOrder,
  userInputs,
  onAgain,
  onReset,
}: {
  books: Book[];
  mode: Mode;
  userOrder: number[];
  userInputs: string[];
  onAgain: () => void;
  onReset: () => void;
}) {
  const byId = new Map(books.map((b) => [b.id, b]));

  // Pro Position: war die Antwort an dieser Position richtig?
  const evaluations = books.map((expected, idx) => {
    if (mode === "sort") {
      const placedId = userOrder[idx];
      const placed = byId.get(placedId);
      return {
        expected,
        userLabel: placed?.nameDe ?? "—",
        isCorrect: placedId === expected.id,
      };
    }
    const input = userInputs[idx] ?? "";
    return {
      expected,
      userLabel: input.trim() || "(leer)",
      isCorrect: isInputCorrect(input, expected),
    };
  });

  const correctCount = evaluations.filter((e) => e.isCorrect).length;
  const total = evaluations.length;
  const percent = Math.round((correctCount / total) * 100);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">Ergebnis</p>
        <p className="mt-1 font-serif text-2xl font-semibold">
          {correctCount} von {total} richtig{" "}
          <span className="text-muted-foreground">({percent}%)</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {encouragement(percent)}
        </p>
      </div>

      <ol className="space-y-1.5">
        {evaluations.map((e, idx) => (
          <li
            key={e.expected.id}
            className={cn(
              "flex items-start gap-3 rounded-md border p-2 pr-3",
              e.isCorrect
                ? "border-green-200 bg-green-50/60 dark:border-green-900/40 dark:bg-green-950/20"
                : "border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/20",
            )}
          >
            <span className="mt-0.5 w-7 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
              {idx + 1}.
            </span>
            <span className="mt-0.5 shrink-0">
              {e.isCorrect ? (
                <Check className="h-4 w-4 text-green-700 dark:text-green-400" />
              ) : (
                <X className="h-4 w-4 text-red-700 dark:text-red-400" />
              )}
            </span>
            <div className="flex-1">
              <BookCardInline book={e.expected} />
              {!e.isCorrect && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Du hattest:{" "}
                  <span className="font-medium text-foreground">
                    {e.userLabel}
                  </span>
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onAgain}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <RotateCcw className="h-4 w-4" />
          Nochmal mit gleicher Auswahl
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Andere Auswahl
        </button>
      </div>
    </div>
  );
}

function encouragement(percent: number): string {
  if (percent === 100) return "Vollständig richtig — herausragend.";
  if (percent >= 90) return "Sehr nah dran. Schau dir die Stellen an, an denen du noch ins Stolpern kommst.";
  if (percent >= 70) return "Gute Grundlage. Vertiefe die Stellen, die du verwechselt hast.";
  if (percent >= 50) return "Du bist auf dem Weg. Wiederholung hilft — versuch es gleich nochmal.";
  return "Kein Stress — Reihenfolgen sitzen erst nach mehrfachem Üben. Schau die richtigen Plätze in Ruhe an.";
}

// ====================================================================
// Geteilte Karten-Darstellung
// ====================================================================

function BookCardInline({ book }: { book: Book }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      <span
        aria-hidden
        className="h-6 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: book.groupColor ?? "#94a3b8" }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{book.nameDe}</p>
        {book.nameOriginal && (
          <p className="truncate text-xs text-muted-foreground">
            <span dir="auto">{book.nameOriginal}</span>
            {book.nameOriginalTransliterated && (
              <span> · {book.nameOriginalTransliterated}</span>
            )}
          </p>
        )}
      </div>
      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
        {book.abbr}
      </span>
    </div>
  );
}

// ====================================================================
// Mini-Helfer
// ====================================================================

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Zurück
    </button>
  );
}
