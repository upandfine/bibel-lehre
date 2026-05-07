"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BookCardInline } from "./book-card";
import { DropIndicator } from "./drop-indicator";
import { storageKeyFor, type Book } from "./types";
import { shuffle } from "./utils";

export function SortStage({
  books,
  testament,
}: {
  books: Book[];
  testament: "AT" | "NT";
}) {
  const router = useRouter();
  const [userOrder, setUserOrder] = useState<number[]>(() =>
    shuffle(books.map((b) => b.id)),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const byId = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);

  // Inline-Suche
  const [searchAt, setSearchAt] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Drop-Indicator
  const [activeId, setActiveId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);

  function toggleSearchAt(index: number) {
    if (searchAt === index) closeSearch();
    else {
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
    setUserOrder(next);
    closeSearch();
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as number);
    setOverId((e.active.id as number) ?? null);
  }
  function handleDragOver(e: DragOverEvent) {
    setOverId((e.over?.id as number | undefined) ?? null);
  }
  function resetDrag() {
    setActiveId(null);
    setOverId(null);
  }
  function handleDragEnd(e: DragEndEvent) {
    resetDrag();
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = userOrder.indexOf(active.id as number);
    const newIndex = userOrder.indexOf(over.id as number);
    setUserOrder(arrayMove(userOrder, oldIndex, newIndex));
  }

  const insertionIndex = (() => {
    if (activeId === null || overId === null || activeId === overId)
      return null;
    const fromIdx = userOrder.indexOf(activeId);
    const toIdx = userOrder.indexOf(overId);
    if (fromIdx === -1 || toIdx === -1) return null;
    return fromIdx < toIdx ? toIdx + 1 : toIdx;
  })();

  function handleCheck() {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        storageKeyFor(testament, "sortieren"),
        JSON.stringify({ mode: "sortieren", userOrder }),
      );
    }
    router.push(
      `/uebungen/buecher-reihenfolge/${testament}/sortieren/auswertung`,
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Bringe die {userOrder.length} Bücher in die kanonische Reihenfolge —
        ziehe sie an den Griff oder klicke auf ein Buch, um an dieser Stelle
        nach einem anderen zu suchen.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={resetDrag}
      >
        <SortableContext
          items={userOrder}
          strategy={verticalListSortingStrategy}
        >
          <ol className="space-y-1.5">
            <DropIndicator active={insertionIndex === 0} />
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
                  <DropIndicator active={insertionIndex === index + 1} />
                </Fragment>
              );
            })}
          </ol>
        </SortableContext>
      </DndContext>

      <div className="sticky bottom-0 -mx-3 mt-2 flex items-center justify-end gap-3 border-t bg-background/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4">
        <button
          type="button"
          onClick={handleCheck}
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
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-md border bg-card p-2 pr-3 transition-opacity",
        isDragging && "z-10 shadow-md ring-2 ring-foreground/20",
        isSearchActive && "ring-2 ring-primary",
        isDimmed && "pointer-events-none opacity-30",
      )}
    >
      <button
        type="button"
        className="-my-1 inline-flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Zum Sortieren ziehen"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
        {index}.
      </span>
      <button
        type="button"
        onClick={onClick}
        className="min-w-0 flex-1 rounded py-1 text-left hover:bg-accent/50"
        aria-label={`Suche unter ${book.nameDe} öffnen`}
      >
        <BookCardInline book={book} showColor={false} />
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
          className="min-w-0 flex-1 bg-transparent text-base outline-none sm:text-sm"
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
