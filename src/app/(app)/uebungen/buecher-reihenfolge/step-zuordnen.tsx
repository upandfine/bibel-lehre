"use client";

import { useState } from "react";
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
import { ArrowLeft, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  POOL_ID,
  BookCardInline,
  type AssignmentMap,
  type Book,
} from "./exercise";

/**
 * Pointer-First Collision-Detection für Multi-Container.
 * `pointerWithin` triggert auch über leeren Containern (im Gegensatz zu `closestCorners`,
 * das auf Items abzielt). Falls der Pointer mal außerhalb aller Container ist,
 * fällt es auf `rectIntersection` zurück.
 */
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return rectIntersection(args);
};

type Props = {
  books: Book[];
  groups: string[];
  assignments: AssignmentMap;
  onChange: (next: AssignmentMap) => void;
  onCheck: () => void;
  onBack: () => void;
};

export function ZuordnenStep({
  books,
  groups,
  assignments,
  onChange,
  onCheck,
  onBack,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const byId = new Map(books.map((b) => [b.id, b]));
  const colorByGroup = new Map(
    books.map((b) => [b.groupName, b.groupColor ?? null]),
  );

  function findContainer(id: UniqueIdentifier): string | null {
    if (typeof id === "string" && id in assignments) return id;
    for (const [key, ids] of Object.entries(assignments)) {
      if (ids.includes(id as number)) return key;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const fromContainer = findContainer(active.id);
    const toContainer = findContainer(over.id);
    if (!fromContainer || !toContainer) return;

    if (fromContainer === toContainer) {
      const items = assignments[fromContainer];
      const oldIndex = items.indexOf(active.id as number);
      const newIndex = items.indexOf(over.id as number);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        onChange({
          ...assignments,
          [fromContainer]: arrayMove(items, oldIndex, newIndex),
        });
      }
      return;
    }

    // Über Container-Grenzen: Item entfernen und am Zielindex einfügen
    const fromItems = assignments[fromContainer].filter(
      (id) => id !== active.id,
    );
    const toItems = [...assignments[toContainer]];
    const overIndex =
      typeof over.id === "string"
        ? toItems.length
        : toItems.indexOf(over.id as number);
    toItems.splice(overIndex < 0 ? toItems.length : overIndex, 0, active.id as number);

    onChange({
      ...assignments,
      [fromContainer]: fromItems,
      [toContainer]: toItems,
    });
  }

  const poolItems = assignments[POOL_ID] ?? [];

  return (
    <div className="space-y-4">
      <BackButton onClick={onBack} />
      <p className="text-sm text-muted-foreground">
        Ziehe jedes Buch in den passenden Abschnitt — und sortiere es innerhalb
        des Abschnitts in der kanonischen Reihenfolge.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <PoolContainer items={poolItems} byId={byId} />

        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <SectionContainer
              key={g}
              id={g}
              title={g}
              color={colorByGroup.get(g) ?? null}
              items={assignments[g] ?? []}
              byId={byId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeId !== null && byId.get(activeId as number) ? (
            <DragOverlayCard book={byId.get(activeId as number)!} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="sticky bottom-4 flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          {poolItems.length === 0
            ? "Alle Bücher zugeordnet."
            : `Noch ${poolItems.length} im Pool.`}
        </p>
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
// Pool — horizontaler "Vorrat" der noch zuzuordnenden Bücher
// ====================================================================

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
        "cursor-grab touch-none rounded-md border bg-card px-2.5 py-1 text-sm shadow-sm hover:bg-accent active:cursor-grabbing",
        isDragging && "opacity-30",
      )}
      aria-label={`${book.nameDe} ziehen`}
    >
      {book.nameDe}
    </li>
  );
}

// ====================================================================
// Abschnitt-Box
// ====================================================================

function SectionContainer({
  id,
  title,
  color,
  items,
  byId,
}: {
  id: string;
  title: string;
  color: string | null;
  items: number[];
  byId: Map<number, Book>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[8rem] flex-col rounded-lg border-l-4 bg-card transition-colors",
        isOver && "ring-2 ring-foreground/20",
      )}
      style={{ borderLeftColor: color ?? "#94a3b8" }}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? "Buch" : "Bücher"}
        </span>
      </div>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-1 flex-col gap-1 p-2">
          {items.map((bookId, index) => {
            const book = byId.get(bookId);
            if (!book) return null;
            return (
              <SortableSectionRow
                key={bookId}
                book={book}
                index={index + 1}
              />
            );
          })}
          {items.length === 0 && (
            <li className="flex flex-1 items-center justify-center px-2 py-3 text-xs italic text-muted-foreground">
              hierher ziehen
            </li>
          )}
        </ul>
      </SortableContext>
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
        className="cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label={`${book.nameDe} ziehen`}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {index}.
      </span>
      <BookCardInline book={book} showColor={false} />
    </li>
  );
}

/**
 * Was während des Drags am Cursor schwebt — bewusst groß und konsistent,
 * damit der User die Buchkarte gut sehen kann, egal woher gezogen wurde.
 */
function DragOverlayCard({ book }: { book: Book }) {
  return (
    <div className="flex cursor-grabbing items-center gap-2 rounded-md border-2 border-foreground/30 bg-card p-1.5 pr-2 shadow-2xl">
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      <BookCardInline book={book} showColor={false} />
    </div>
  );
}

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
