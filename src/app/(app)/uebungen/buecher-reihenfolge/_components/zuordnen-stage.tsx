"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, ChevronDown, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import { BookCardInline } from "./book-card";
import { DropIndicator } from "./drop-indicator";
import {
  POOL_ID,
  storageKeyFor,
  type AssignmentMap,
  type Book,
} from "./types";
import { emptyAssignments, groupsInOrder, isGroupComplete } from "./utils";

const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return rectIntersection(args);
};

export function ZuordnenStage({
  books,
  testament,
}: {
  books: Book[];
  testament: "AT" | "NT";
}) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentMap>(() =>
    emptyAssignments(books),
  );
  const groups = useMemo(() => groupsInOrder(books), [books]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);

  /**
   * UX-Optimierung für mobile: Lerner kann einen fertig befüllten Kasten
   * zuklappen. Beim Klick auf „Fertig?" prüfen wir vorher, ob alle
   * Bücher der Gruppe in der richtigen Reihenfolge drin sind. Bei OK
   * kollabiert der Kasten + bekommt einen Haken; bei nicht-OK erscheint
   * ein neutraler Hinweis (ohne die konkrete Lösung zu spoilern).
   */
  const [closedGroups, setClosedGroups] = useState<Set<string>>(
    () => new Set<string>(),
  );
  const [groupHints, setGroupHints] = useState<Record<string, string>>({});

  const expectedCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of books) m.set(b.groupName, (m.get(b.groupName) ?? 0) + 1);
    return m;
  }, [books]);

  const byId = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);
  const colorByGroup = useMemo(
    () => new Map(books.map((b) => [b.groupName, b.groupColor ?? null])),
    [books],
  );

  function clearHint(groupId: string) {
    setGroupHints((prev) => {
      if (!prev[groupId]) return prev;
      const { [groupId]: _omit, ...rest } = prev;
      return rest;
    });
  }

  function handleTryClose(groupId: string) {
    const items = assignments[groupId] ?? [];
    if (isGroupComplete(items, groupId, books)) {
      setClosedGroups((prev) => {
        const next = new Set(prev);
        next.add(groupId);
        return next;
      });
      clearHint(groupId);
    } else {
      setGroupHints((prev) => ({
        ...prev,
        [groupId]:
          "Da scheint noch etwas nicht zu passen — schau die Reihenfolge und Zuordnung nochmal an.",
      }));
    }
  }

  function handleReopen(groupId: string) {
    setClosedGroups((prev) => {
      const next = new Set(prev);
      next.delete(groupId);
      return next;
    });
    clearHint(groupId);
  }

  function findContainer(id: UniqueIdentifier): string | null {
    if (typeof id === "string" && id in assignments) return id;
    for (const [key, ids] of Object.entries(assignments)) {
      if (ids.includes(id as number)) return key;
    }
    return null;
  }

  function getInsertionIndexFor(
    containerId: string,
    containerItems: number[],
  ): number | null {
    if (activeId === null || overId === null) return null;
    const overContainer = findContainer(overId);
    if (overContainer !== containerId) return null;
    const activeContainer = findContainer(activeId);

    if (activeContainer !== containerId) {
      if (typeof overId === "string") return containerItems.length;
      return containerItems.indexOf(overId as number);
    }

    if (typeof overId === "string") return containerItems.length;
    if (activeId === overId) return null;
    const fromIdx = containerItems.indexOf(activeId as number);
    const toIdx = containerItems.indexOf(overId as number);
    if (fromIdx === -1 || toIdx === -1) return null;
    return fromIdx < toIdx ? toIdx + 1 : toIdx;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
    setOverId(event.active.id);
  }
  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over?.id ?? null);
  }
  function handleDragCancel() {
    setActiveId(null);
    setOverId(null);
  }
  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    setOverId(null);
    const { active, over } = event;
    if (!over) return;

    const fromContainer = findContainer(active.id);
    const toContainer = findContainer(over.id);
    if (!fromContainer || !toContainer) return;

    // Sobald sich an einem Container etwas ändert, ist ein eventueller
    // alter Hint nicht mehr relevant.
    clearHint(fromContainer);
    clearHint(toContainer);

    if (fromContainer === toContainer) {
      const items = assignments[fromContainer];
      const oldIndex = items.indexOf(active.id as number);
      const newIndex = items.indexOf(over.id as number);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setAssignments({
          ...assignments,
          [fromContainer]: arrayMove(items, oldIndex, newIndex),
        });
      }
      return;
    }

    const fromItems = assignments[fromContainer].filter(
      (id) => id !== active.id,
    );
    const toItems = [...assignments[toContainer]];
    const overIndex =
      typeof over.id === "string"
        ? toItems.length
        : toItems.indexOf(over.id as number);
    toItems.splice(
      overIndex < 0 ? toItems.length : overIndex,
      0,
      active.id as number,
    );

    setAssignments({
      ...assignments,
      [fromContainer]: fromItems,
      [toContainer]: toItems,
    });
  }

  function handleCheck() {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        storageKeyFor(testament, "zuordnen"),
        JSON.stringify({ mode: "zuordnen", assignments }),
      );
    }
    router.push(routes.uebungen.bookOrder.result(testament, "zuordnen"));
  }

  const poolItems = assignments[POOL_ID] ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ziehe jedes Buch in den passenden Abschnitt — und sortiere es innerhalb
        des Abschnitts in der kanonischen Reihenfolge.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <PoolContainer items={poolItems} byId={byId} />

        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => {
            const items = assignments[g] ?? [];
            const expected = expectedCounts.get(g) ?? 0;
            const closed = closedGroups.has(g);
            return (
              <SectionContainer
                key={g}
                id={g}
                title={g}
                color={colorByGroup.get(g) ?? null}
                items={items}
                byId={byId}
                insertionIndex={getInsertionIndexFor(g, items)}
                expectedCount={expected}
                closed={closed}
                hint={groupHints[g] ?? null}
                onTryClose={() => handleTryClose(g)}
                onReopen={() => handleReopen(g)}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeId !== null && byId.get(activeId as number) ? (
            <DragOverlayCard book={byId.get(activeId as number)!} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="sticky bottom-0 -mx-3 mt-2 flex items-center justify-between gap-3 border-t bg-background/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4">
        <p className="text-sm text-muted-foreground">
          {poolItems.length === 0
            ? "Alle Bücher zugeordnet."
            : `Noch ${poolItems.length} im Pool.`}
        </p>
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

function PoolContainer({
  items,
  byId,
}: {
  items: number[];
  byId: Map<number, Book>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: POOL_ID });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border-2 border-dashed bg-muted/30 p-3",
        isOver && "border-foreground/40 bg-muted/60",
      )}
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Noch zuzuordnen ({items.length})
      </p>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-wrap gap-1.5">
          {items.map((bookId) => {
            const book = byId.get(bookId);
            if (!book) return null;
            return <SortableChip key={bookId} book={book} />;
          })}
          {items.length === 0 && (
            <li className="px-2 py-1 text-xs italic text-muted-foreground">
              leer — alles bereits zugeordnet.
            </li>
          )}
        </ul>
      </SortableContext>
    </div>
  );
}

function SortableChip({ book }: { book: Book }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: book.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        "min-h-9 cursor-grab touch-none rounded-md border bg-card px-3 py-1.5 text-sm shadow-sm hover:bg-accent active:cursor-grabbing",
        isDragging && "opacity-30",
      )}
      aria-label={`${book.nameDe} ziehen`}
    >
      {book.nameDe}
    </li>
  );
}

function SectionContainer({
  id,
  title,
  color,
  items,
  byId,
  insertionIndex,
  expectedCount,
  closed,
  hint,
  onTryClose,
  onReopen,
}: {
  id: string;
  title: string;
  color: string | null;
  items: number[];
  byId: Map<number, Book>;
  insertionIndex: number | null;
  expectedCount: number;
  closed: boolean;
  hint: string | null;
  onTryClose: () => void;
  onReopen: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: closed });
  const showEmptyHint =
    !closed && items.length === 0 && insertionIndex === null;
  const isFull = items.length === expectedCount && expectedCount > 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg border-l-4 bg-card transition-colors",
        !closed && "min-h-[8rem]",
        isOver && !closed && "ring-2 ring-foreground/20",
        closed && "border-emerald-300/70",
      )}
      style={{
        borderLeftColor: closed ? "#10b981" : (color ?? "#94a3b8"),
      }}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {closed && (
            <Check
              className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
          )}
          <h3
            className={cn(
              "truncate text-sm font-medium",
              closed && "text-emerald-700 dark:text-emerald-400",
            )}
          >
            {title}
          </h3>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {items.length} / {expectedCount}
        </span>
        {closed ? (
          <button
            type="button"
            onClick={onReopen}
            className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={`${title} wieder öffnen`}
          >
            <ChevronDown className="h-3.5 w-3.5" />
            Erneut anschauen
          </button>
        ) : (
          isFull && (
            <button
              type="button"
              onClick={onTryClose}
              className="inline-flex items-center gap-1 rounded-md bg-foreground/90 px-2 py-1 text-xs font-medium text-background hover:bg-foreground"
            >
              Fertig?
            </button>
          )
        )}
      </div>

      {!closed && (
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-1 flex-col gap-1 p-2">
            <DropIndicator active={insertionIndex === 0} />
            {items.map((bookId, index) => {
              const book = byId.get(bookId);
              if (!book) return null;
              return (
                <Fragment key={bookId}>
                  <SortableSectionRow book={book} index={index + 1} />
                  <DropIndicator active={insertionIndex === index + 1} />
                </Fragment>
              );
            })}
            {showEmptyHint && (
              <li className="flex flex-1 items-center justify-center px-2 py-3 text-xs italic text-muted-foreground">
                hierher ziehen
              </li>
            )}
          </ul>
        </SortableContext>
      )}

      {hint && !closed && (
        <div className="border-t px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          {hint}
        </div>
      )}
    </div>
  );
}

function SortableSectionRow({ book, index }: { book: Book; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: book.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-background p-1.5 pr-2",
        isDragging && "opacity-30",
      )}
    >
      <button
        type="button"
        className="inline-flex h-8 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label={`${book.nameDe} ziehen`}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {index}.
      </span>
      <BookCardInline book={book} showColor={false} />
    </li>
  );
}

function DragOverlayCard({ book }: { book: Book }) {
  return (
    <div className="flex cursor-grabbing items-center gap-2 rounded-md border-2 border-foreground/30 bg-card p-1.5 pr-2 shadow-2xl">
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      <BookCardInline book={book} />
    </div>
  );
}

