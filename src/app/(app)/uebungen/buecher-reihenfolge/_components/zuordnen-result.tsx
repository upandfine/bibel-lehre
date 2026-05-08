"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Shuffle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import { BookCardInline } from "./book-card";
import { ResultActions } from "./result-actions";
import {
  POOL_ID,
  storageKeyFor,
  type AssignmentMap,
  type Book,
} from "./types";
import { encouragement, groupsInOrder } from "./utils";

type ZuordnenEvaluation = {
  book: Book;
  userContainer: string | null;
  userPositionInContainer: number | null;
  isInCorrectGroup: boolean;
  isInCorrectPosition: boolean;
};

function evaluateZuordnen(
  books: Book[],
  assignments: AssignmentMap,
): ZuordnenEvaluation[] {
  const expectedOrderByGroup = new Map<string, number[]>();
  for (const b of books) {
    const arr = expectedOrderByGroup.get(b.groupName) ?? [];
    arr.push(b.id);
    expectedOrderByGroup.set(b.groupName, arr);
  }

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

function labelForContainer(container: string | null): string {
  if (container === null) return "nirgends abgelegt";
  if (container === POOL_ID) return "noch im Pool";
  return `unter „${container}"`;
}

export function ZuordnenResult({
  books,
  testament,
}: {
  books: Book[];
  testament: "AT" | "NT";
}) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentMap | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(
      storageKeyFor(testament, "zuordnen"),
    );
    if (!raw) {
      router.replace(routes.uebungen.bookOrder.play(testament, "zuordnen"));
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.mode === "zuordnen" && parsed.assignments) {
        setAssignments(parsed.assignments);
      } else {
        router.replace(routes.uebungen.bookOrder.play(testament, "zuordnen"));
      }
    } catch {
      router.replace(routes.uebungen.bookOrder.play(testament, "zuordnen"));
    }
  }, [router, testament]);

  if (!assignments) {
    return (
      <p className="text-sm text-muted-foreground">Lade Auswertung …</p>
    );
  }

  const evaluations = evaluateZuordnen(books, assignments);
  const inGroup = evaluations.filter((e) => e.isInCorrectGroup).length;
  const inGroupAndPosition = evaluations.filter(
    (e) => e.isInCorrectPosition,
  ).length;
  const total = evaluations.length;
  const percent = Math.round((inGroupAndPosition / total) * 100);

  const groups = groupsInOrder(books);
  const colorByGroup = new Map(
    books.map((b) => [b.groupName, b.groupColor ?? null]),
  );
  const evalByGroup = new Map<string, ZuordnenEvaluation[]>();
  for (const g of groups) evalByGroup.set(g, []);
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
        {groups.map((g) => {
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

      <ResultActions
        retryHref={routes.uebungen.bookOrder.play(testament, "zuordnen")}
        selectionHref={routes.uebungen.bookOrder.selection()}
      />
    </div>
  );
}
