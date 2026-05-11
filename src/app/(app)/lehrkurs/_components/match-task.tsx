"use client";

/**
 * A3_match Aufgabentyp mit Drag&Drop. Konsistente UX zur Bücher-Zuordnen-
 * Übung — Items aus einem Pool in benannte Drop-Slots ziehen.
 *
 * Layout: zweispaltig auf Desktop, untereinander auf Mobile (Pool oben,
 * Slots unten). Jeder Slot hat genau eine Belegung — wer was Neues
 * reinzieht, ersetzt das Bestehende; ersetztes Item geht zurück in den
 * Pool. Slot wieder leeren via Drag-zurück in den Pool.
 *
 * config-Form: { kind: "match", pairs: [{ left, right }] }
 */

import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { saveMatchAnswer } from "../_actions";
import { cn } from "@/lib/utils";
import type { LessonTask } from "@/lib/repositories/courses";

const POOL_ID = "__match_pool";

type MatchPair = { left: string; right: string };

type Status =
  | "idle"
  | "saving"
  | "auto_correct"
  | "auto_incorrect"
  | "error";

const collisionDetection: CollisionDetection = (args) => {
  const pc = pointerWithin(args);
  if (pc.length > 0) return pc;
  return rectIntersection(args);
};

export function MatchTaskDnD({
  task,
  moduleOrder,
  lessonOrder,
}: {
  task: LessonTask;
  moduleOrder: number;
  lessonOrder: number;
}) {
  const cfg = (task.config as { pairs?: MatchPair[] } | null) ?? {};
  const pairs = cfg.pairs ?? [];
  const rightOptions = Array.from(new Set(pairs.map((p) => p.right)));

  /**
   * Mehrere DndContext-Instanzen auf einer Seite kollidieren beim
   * Hydration mit den internen `aria-describedby="DndDescribedBy-N"`-
   * IDs (zähler ist global, Server- und Client-Render zählen anders).
   * Lösung: DndContext erst nach dem Mount rendern. Vorm Mount ein
   * statischer Fallback, der dasselbe Layout zeigt, aber ohne Drag-
   * Funktionalität.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const initial =
    (task.answer?.answer as { matches?: Record<string, string> } | undefined)
      ?.matches ?? {};

  const [matches, setMatches] = useState<Record<string, string>>(initial);
  const [activeId, setActiveId] = useState<string | null>(null);
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Pool = alle rightOptions, die noch nicht zugeordnet sind
  const assignedRights = new Set(Object.values(matches));
  const poolItems = rightOptions.filter((r) => !assignedRights.has(r));

  const allAssigned = pairs.every((p) => matches[p.left]);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over || revealed) return;

    const draggedRight = String(active.id);
    const targetId = String(over.id);

    setMatches((prev) => {
      const next: Record<string, string> = { ...prev };

      // Den gezogenen rightLabel aus allen Slots entfernen (falls schon drin)
      for (const k of Object.keys(next)) {
        if (next[k] === draggedRight) delete next[k];
      }

      // Zielslot bestimmen
      if (targetId === POOL_ID) {
        // Item ist jetzt im Pool — nichts weiter zu tun
        return next;
      }

      if (pairs.some((p) => p.left === targetId)) {
        // Item in einen Slot fallen lassen — ersetzt evtl. bestehende Belegung
        next[targetId] = draggedRight;
        return next;
      }

      return next;
    });
  }

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

  // Vor dem Mount: identisches Layout, aber keine DndContext-IDs, die mit
  // Server- vs Client-Counter kollidieren könnten.
  if (!mounted) {
    return (
      <>
        <p className="text-xs text-muted-foreground">
          Ziehe die rechten Einträge auf die passenden linken Felder.
        </p>
        <div className="rounded-lg border-2 border-dashed bg-muted/30 p-2">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Verfügbar ({poolItems.length})
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {poolItems.map((item) => (
              <li
                key={item}
                className="inline-flex min-h-9 items-center rounded-md border bg-card px-3 py-1.5 text-sm shadow-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          {pairs.map((p) => (
            <div
              key={p.left}
              className="flex items-center gap-3 rounded-md border bg-background px-3 py-2 text-sm"
            >
              <p className="flex-1 font-medium">{p.left}</p>
              <span className="text-muted-foreground">→</span>
              <span className="min-h-9 min-w-[10rem] rounded-md border-2 border-dashed border-muted-foreground/30 px-2 py-1">
                {matches[p.left] ?? (
                  <span className="block px-1 py-1 text-xs italic text-muted-foreground">
                    lädt…
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <DndContext
        // Eindeutige ID pro Task-Instanz — sonst kollidieren mehrere Match-
        // Tasks auf derselben Seite bei der dnd-kit-internen aria-describedby
        // (Server-Side-Render zählt anders als Client-Side → Hydration-
        // Mismatch).
        id={`match-${task.id}`}
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <p className="text-xs text-muted-foreground">
          Ziehe die rechten Einträge auf die passenden linken Felder.
        </p>

        {/* Pool — verfügbare rechte Begriffe */}
        <PoolContainer items={poolItems} disabled={revealed} />

        {/* Slots — links die festen Begriffe, rechts das Drop-Feld */}
        <div className="space-y-2">
          {pairs.map((p) => {
            const sel = matches[p.left];
            const correct = revealed && sel === p.right;
            const wrong = revealed && sel !== undefined && sel !== p.right;
            return (
              <div
                key={p.left}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-2 text-sm",
                  correct
                    ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20"
                    : wrong
                      ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
                      : "bg-background",
                )}
              >
                <p className="flex-1 font-medium">{p.left}</p>
                <span className="text-muted-foreground">→</span>
                <SlotContainer
                  slotId={p.left}
                  assignedItem={sel}
                  disabled={revealed}
                  revealed={revealed}
                />
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeId && <ItemChip label={activeId} dragOverlay />}
        </DragOverlay>
      </DndContext>

      {revealed && (
        <p className="mt-2 text-xs text-muted-foreground">
          {pairs
            .filter((pp) => matches[pp.left] !== pp.right)
            .map((pp) => `Richtige Zuordnung für „${pp.left}": ${pp.right}`)
            .join(" · ") || "Alles richtig zugeordnet."}
        </p>
      )}

      {!revealed && (
        <div className="mt-2 flex justify-end">
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

      <input type="hidden" data-status={status} />
    </>
  );
}

// ====================================================================
// Pool-Container — verfügbare right-Items
// ====================================================================

function PoolContainer({
  items,
  disabled,
}: {
  items: string[];
  disabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: POOL_ID, disabled });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border-2 border-dashed bg-muted/30 p-2 transition-colors",
        isOver && !disabled && "border-foreground/40 bg-muted/60",
      )}
    >
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Verfügbar ({items.length})
      </p>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <DraggableChip key={item} label={item} disabled={disabled} />
          ))}
          {items.length === 0 && (
            <li className="px-2 py-1 text-xs italic text-muted-foreground">
              alles zugeordnet.
            </li>
          )}
        </ul>
      </SortableContext>
    </div>
  );
}

// ====================================================================
// Slot-Container — eine einzelne Drop-Zone für genau ein Item
// ====================================================================

function SlotContainer({
  slotId,
  assignedItem,
  disabled,
  revealed,
}: {
  slotId: string;
  assignedItem: string | undefined;
  disabled: boolean;
  revealed: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: slotId, disabled });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-9 min-w-[10rem] rounded-md border-2 border-dashed px-2 py-1 transition-colors",
        isOver && !disabled && "border-foreground/40 bg-muted/60",
        !assignedItem && "border-muted-foreground/30",
        assignedItem && "border-transparent bg-transparent p-0",
      )}
    >
      {assignedItem ? (
        <DraggableChip
          label={assignedItem}
          disabled={disabled || revealed}
          variant="filled"
        />
      ) : (
        <span className="block px-1 py-1 text-xs italic text-muted-foreground">
          hierher ziehen
        </span>
      )}
    </div>
  );
}

// ====================================================================
// Draggable Chip — ein right-Item, das überall hingezogen werden kann
// ====================================================================

function DraggableChip({
  label,
  disabled,
  variant = "pool",
}: {
  label: string;
  disabled: boolean;
  variant?: "pool" | "filled";
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: label, disabled });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        "inline-flex min-h-9 cursor-grab touch-none items-center rounded-md border px-3 py-1.5 text-sm shadow-sm transition-colors active:cursor-grabbing",
        variant === "pool"
          ? "bg-card hover:bg-accent"
          : "bg-primary/5 border-primary/30",
        disabled && "cursor-not-allowed opacity-70",
        isDragging && "opacity-30",
      )}
      aria-label={`${label} ziehen`}
    >
      {label}
    </li>
  );
}

function ItemChip({
  label,
  dragOverlay = false,
}: {
  label: string;
  dragOverlay?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border bg-card px-3 py-1.5 text-sm",
        dragOverlay && "cursor-grabbing border-2 border-foreground/30 shadow-2xl",
      )}
    >
      {label}
    </span>
  );
}
