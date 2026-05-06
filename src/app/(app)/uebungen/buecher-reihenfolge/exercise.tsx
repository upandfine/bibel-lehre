"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  GripVertical,
  LayoutGrid,
  Pencil,
  RotateCcw,
  Search,
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
import { ZuordnenStep } from "./step-zuordnen";

// ====================================================================
// Typen
// ====================================================================

export type Book = {
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

type Selection = {
  kind: "testament";
  value: "AT" | "NT";
  label: string;
  count: number;
};

type Mode = "zuordnen" | "sort" | "write";
type Step = "select" | "mode" | "play" | "result";

/**
 * Zuordnen-Modus: pro Container (Pool oder Abschnittsname) eine Liste der
 * book.ids in der vom User gewählten Reihenfolge.
 */
export type AssignmentMap = Record<string, number[]>;
export const POOL_ID = "__pool";

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
  // Bewusst nur deutscher Name + Abkürzung — Originalname/Transliteration werden
  // angezeigt, sollen aber nicht als Eingabe akzeptiert werden (sonst kein echter
  // Recall des deutschen Namens).
  return [book.nameDe, book.abbr].map(normalize).filter((x) => x.length > 0);
}

function isInputCorrect(input: string, book: Book): boolean {
  const n = normalize(input);
  if (!n) return false;
  return aliasesFor(book).includes(n);
}

function buildSelections(books: Book[]): Selection[] {
  const at = books.filter((b) => b.testament === "AT").length;
  const nt = books.filter((b) => b.testament === "NT").length;
  return [
    {
      kind: "testament",
      value: "AT",
      label: "Altes Testament",
      count: at,
    },
    {
      kind: "testament",
      value: "NT",
      label: "Neues Testament",
      count: nt,
    },
  ];
}

function applySelection(books: Book[], sel: Selection): Book[] {
  return books.filter((b) => b.testament === sel.value);
}

/** Gruppennamen in kanonischer Reihenfolge, wie sie in den Büchern erstmals auftreten. */
function groupsInOrder(books: Book[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const b of books) {
    if (seen.has(b.groupName)) continue;
    seen.add(b.groupName);
    out.push(b.groupName);
  }
  return out;
}

function emptyAssignments(books: Book[]): AssignmentMap {
  const groups = groupsInOrder(books);
  const map: AssignmentMap = { [POOL_ID]: shuffle(books.map((b) => b.id)) };
  for (const g of groups) map[g] = [];
  return map;
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
  const [userAssignments, setUserAssignments] = useState<AssignmentMap>({});

  const selections = useMemo(() => buildSelections(books), [books]);
  const filteredBooks = useMemo(
    () => (selection ? applySelection(books, selection) : []),
    [books, selection],
  );

  function startMode(m: Mode) {
    setMode(m);
    if (m === "sort") {
      setUserOrder(shuffle(filteredBooks.map((b) => b.id)));
    } else if (m === "write") {
      setUserInputs(filteredBooks.map(() => ""));
    } else {
      setUserAssignments(emptyAssignments(filteredBooks));
    }
    setStep("play");
  }

  function backToSelection() {
    setStep("select");
    setSelection(null);
    setMode(null);
    setUserOrder([]);
    setUserInputs([]);
    setUserAssignments({});
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

  if (step === "play" && mode === "zuordnen" && selection) {
    return (
      <ZuordnenStep
        books={filteredBooks}
        groups={groupsInOrder(filteredBooks)}
        assignments={userAssignments}
        onChange={setUserAssignments}
        onCheck={() => setStep("result")}
        onBack={() => setStep("mode")}
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
        userAssignments={userAssignments}
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
        Welchen Teil der Bibel willst du üben?
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {selections.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onSelect(s)}
            className="group rounded-lg border bg-card p-5 text-left transition-colors hover:border-foreground/40 hover:bg-accent"
          >
            <p className="font-medium">{s.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {s.count} Bücher
            </p>
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
          {count} Bücher. Wähle, wie du üben möchtest.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onMode("zuordnen")}
          className="group flex flex-col gap-2 rounded-lg border bg-card p-5 text-left transition-colors hover:border-foreground/40"
        >
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="font-medium">Zuordnen</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Ordne jedes Buch dem richtigen Abschnitt zu (Pentateuch, Geschichte
            …) — und sortiere es innerhalb des Abschnitts.
          </p>
        </button>

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
            komplette kanonische Reihenfolge.
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

  // Inline-Suche zur schnellen Positionierung — Klick auf eine Karte öffnet
  // die Suche unter ihr; ein Treffer tauscht das gewählte Buch an diese Stelle.
  const [searchAt, setSearchAt] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  function toggleSearchAt(index: number) {
    if (searchAt === index) {
      closeSearch();
    } else {
      setSearchAt(index);
      setSearchTerm("");
    }
  }

  function closeSearch() {
    setSearchAt(null);
    setSearchTerm("");
  }

  function pickFromSearch(targetIndex: number, pickedBookId: number) {
    const fromIndex = userOrder.indexOf(pickedBookId);
    if (fromIndex === -1 || fromIndex === targetIndex) {
      closeSearch();
      return;
    }
    const next = [...userOrder];
    [next[targetIndex], next[fromIndex]] = [next[fromIndex], next[targetIndex]];
    onChange(next);
    closeSearch();
  }

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
        ziehe sie an den Griff oder klicke auf ein Buch, um an dieser Stelle
        nach einem anderen zu suchen.
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
              const isSearchActive = searchAt === index;
              const isOtherDimmed = searchAt !== null && !isSearchActive;
              return (
                <Fragment key={bookId}>
                  <SortableBookRow
                    index={index + 1}
                    book={book}
                    isSearchActive={isSearchActive}
                    isDimmed={isOtherDimmed}
                    onClick={() => toggleSearchAt(index)}
                  />
                  {isSearchActive && (
                    <li>
                      <SortSearchPanel
                        books={books}
                        currentBookId={bookId}
                        term={searchTerm}
                        onTermChange={setSearchTerm}
                        onSelect={(id) => pickFromSearch(index, id)}
                        onClose={closeSearch}
                      />
                    </li>
                  )}
                </Fragment>
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

function SortableBookRow({
  book,
  index,
  isSearchActive,
  isDimmed,
  onClick,
}: {
  book: Book;
  index: number;
  isSearchActive: boolean;
  isDimmed: boolean;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: book.id, disabled: isDimmed });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex items-center gap-3 rounded-md border bg-card p-2 pr-3 transition-opacity",
        isDragging && "z-10 shadow-md ring-2 ring-foreground/20",
        isSearchActive && "ring-2 ring-primary",
        isDimmed && "pointer-events-none opacity-30",
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
      <button
        type="button"
        onClick={onClick}
        className="-mx-1 flex-1 rounded px-1 py-0.5 text-left hover:bg-accent/50"
        aria-label={`Suche unter ${book.nameDe} öffnen`}
      >
        <BookCardInline book={book} />
      </button>
    </li>
  );
}

function SortSearchPanel({
  books,
  currentBookId,
  term,
  onTermChange,
  onSelect,
  onClose,
}: {
  books: Book[];
  currentBookId: number;
  term: string;
  onTermChange: (v: string) => void;
  onSelect: (bookId: number) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const trimmed = term.trim().toLowerCase();
  const results = trimmed
    ? books
        .filter((b) => b.id !== currentBookId)
        .filter(
          (b) =>
            b.nameDe.toLowerCase().includes(trimmed) ||
            b.abbr.toLowerCase().includes(trimmed),
        )
        .slice(0, 12)
    : [];

  return (
    <div className="rounded-md border-2 border-primary bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={term}
          onChange={(e) => onTermChange(e.target.value)}
          placeholder={'Buch suchen — z. B. "je", "mose", "1th" …'}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Suche schließen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {trimmed && (
        <div className="mt-2.5">
          {results.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              Keine Treffer für „{term}".
            </p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {results.map((book) => (
                <li key={book.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(book.id)}
                    className="rounded-md border bg-background px-2.5 py-1 text-sm hover:border-primary hover:bg-accent"
                  >
                    {book.nameDe}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
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
        Deutscher Name oder gängige Abkürzung — z. B. „1. Mose" oder „1Mo".
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

type ZuordnenEvaluation = {
  book: Book;
  userContainer: string | null; // POOL_ID, groupName oder null wenn nirgends
  userPositionInContainer: number | null; // 1-basiert
  isInCorrectGroup: boolean;
  isInCorrectPosition: boolean;
};

function evaluateZuordnen(
  books: Book[],
  assignments: AssignmentMap,
): ZuordnenEvaluation[] {
  // Pro Gruppe: erwartete Reihenfolge der Bücher
  const expectedOrderByGroup = new Map<string, number[]>();
  for (const b of books) {
    const arr = expectedOrderByGroup.get(b.groupName) ?? [];
    arr.push(b.id);
    expectedOrderByGroup.set(b.groupName, arr);
  }

  // Pro Buch: in welchem Container liegt es?
  const containerByBookId = new Map<number, string>();
  for (const [container, ids] of Object.entries(assignments)) {
    for (const id of ids) containerByBookId.set(id, container);
  }

  return books.map((book) => {
    const userContainer = containerByBookId.get(book.id) ?? null;
    const isInCorrectGroup = userContainer === book.groupName;
    let userPositionInContainer: number | null = null;
    let isInCorrectPosition = false;

    if (userContainer && userContainer !== POOL_ID) {
      const idsInContainer = assignments[userContainer] ?? [];
      const idx = idsInContainer.indexOf(book.id);
      if (idx !== -1) userPositionInContainer = idx + 1;

      if (isInCorrectGroup) {
        const expected = expectedOrderByGroup.get(book.groupName) ?? [];
        const expectedIdx = expected.indexOf(book.id);
        isInCorrectPosition = idx === expectedIdx;
      }
    }

    return {
      book,
      userContainer,
      userPositionInContainer,
      isInCorrectGroup,
      isInCorrectPosition,
    };
  });
}

function ResultStep({
  books,
  mode,
  userOrder,
  userInputs,
  userAssignments,
  onAgain,
  onReset,
}: {
  books: Book[];
  mode: Mode;
  userOrder: number[];
  userInputs: string[];
  userAssignments: AssignmentMap;
  onAgain: () => void;
  onReset: () => void;
}) {
  if (mode === "zuordnen") {
    return (
      <ZuordnenResult
        books={books}
        assignments={userAssignments}
        onAgain={onAgain}
        onReset={onReset}
      />
    );
  }

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

      <ResultActions onAgain={onAgain} onReset={onReset} />
    </div>
  );
}

function ZuordnenResult({
  books,
  assignments,
  onAgain,
  onReset,
}: {
  books: Book[];
  assignments: AssignmentMap;
  onAgain: () => void;
  onReset: () => void;
}) {
  const evaluations = evaluateZuordnen(books, assignments);
  const inGroup = evaluations.filter((e) => e.isInCorrectGroup).length;
  const inGroupAndPosition = evaluations.filter(
    (e) => e.isInCorrectPosition,
  ).length;
  const total = evaluations.length;
  const percent = Math.round((inGroupAndPosition / total) * 100);

  // Gruppen-Reihenfolge bestimmen
  const groupsInOrder: string[] = [];
  const seen = new Set<string>();
  for (const b of books) {
    if (!seen.has(b.groupName)) {
      seen.add(b.groupName);
      groupsInOrder.push(b.groupName);
    }
  }
  const colorByGroup = new Map(
    books.map((b) => [b.groupName, b.groupColor ?? null]),
  );
  const evalByGroup = new Map<string, ZuordnenEvaluation[]>();
  for (const g of groupsInOrder) evalByGroup.set(g, []);
  for (const e of evaluations) {
    evalByGroup.get(e.book.groupName)?.push(e);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">Ergebnis</p>
        <p className="mt-1 font-serif text-2xl font-semibold">
          {inGroupAndPosition} von {total} vollständig richtig{" "}
          <span className="text-muted-foreground">({percent}%)</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Im richtigen Abschnitt: <strong>{inGroup}</strong> · davon in
          richtiger Reihenfolge: <strong>{inGroupAndPosition}</strong>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {encouragement(percent)}
        </p>
      </div>

      <div className="space-y-3">
        {groupsInOrder.map((g) => {
          const evalsForGroup = evalByGroup.get(g) ?? [];
          return (
            <div
              key={g}
              className="overflow-hidden rounded-lg border-l-4 bg-card"
              style={{ borderLeftColor: colorByGroup.get(g) ?? "#94a3b8" }}
            >
              <h3 className="border-b px-3 py-2 text-sm font-medium">{g}</h3>
              <ul className="divide-y">
                {evalsForGroup.map((e, idx) => (
                  <li
                    key={e.book.id}
                    className={cn(
                      "flex items-start gap-3 px-3 py-2",
                      !e.isInCorrectGroup &&
                        "bg-red-50/40 dark:bg-red-950/10",
                      e.isInCorrectGroup &&
                        !e.isInCorrectPosition &&
                        "bg-amber-50/40 dark:bg-amber-950/10",
                    )}
                  >
                    <span className="mt-0.5 w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {idx + 1}.
                    </span>
                    <span className="mt-0.5 shrink-0">
                      {e.isInCorrectPosition ? (
                        <Check className="h-4 w-4 text-green-700 dark:text-green-400" />
                      ) : e.isInCorrectGroup ? (
                        <Shuffle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                      ) : (
                        <X className="h-4 w-4 text-red-700 dark:text-red-400" />
                      )}
                    </span>
                    <div className="flex-1">
                      <BookCardInline book={e.book} />
                      {!e.isInCorrectGroup && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Du hattest es{" "}
                          <span className="font-medium text-foreground">
                            {labelForContainer(e.userContainer)}
                          </span>
                          .
                        </p>
                      )}
                      {e.isInCorrectGroup && !e.isInCorrectPosition && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Im richtigen Abschnitt, aber an Position{" "}
                          <span className="font-medium text-foreground">
                            {e.userPositionInContainer}
                          </span>{" "}
                          statt {idx + 1}.
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <ResultActions onAgain={onAgain} onReset={onReset} />
    </div>
  );
}

function labelForContainer(container: string | null): string {
  if (container === null) return "nirgends abgelegt";
  if (container === POOL_ID) return "noch im Pool";
  return `unter „${container}"`;
}

function ResultActions({
  onAgain,
  onReset,
}: {
  onAgain: () => void;
  onReset: () => void;
}) {
  return (
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

export function BookCardInline({ book }: { book: Book }) {
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
