"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import { BookCardInline } from "./book-card";
import { ResultActions } from "./result-actions";
import { storageKeyFor, type Book } from "./types";
import { encouragement, lisIndices } from "./utils";

export function SortResult({
  books,
  testament,
}: {
  books: Book[];
  testament: "AT" | "NT";
}) {
  const router = useRouter();
  const [userOrder, setUserOrder] = useState<number[] | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(
      storageKeyFor(testament, "sortieren"),
    );
    if (!raw) {
      router.replace(routes.uebungen.bookOrder.play(testament, "sortieren"));
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.mode === "sortieren" && Array.isArray(parsed.userOrder)) {
        setUserOrder(parsed.userOrder);
      } else {
        router.replace(routes.uebungen.bookOrder.play(testament, "sortieren"));
      }
    } catch {
      router.replace(routes.uebungen.bookOrder.play(testament, "sortieren"));
    }
  }, [router, testament]);

  if (!userOrder) {
    return (
      <p className="text-sm text-muted-foreground">Lade Auswertung …</p>
    );
  }

  const byId = new Map(books.map((b) => [b.id, b]));
  const userBooks = userOrder
    .map((id) => byId.get(id))
    .filter((b): b is Book => Boolean(b));

  const orderIndices = userBooks.map((b) => b.orderIndex);
  const lisSet = lisIndices(orderIndices);
  const positionInBooks = new Map(books.map((b, i) => [b.id, i + 1]));

  const total = userBooks.length;
  const correctCount = lisSet.size;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const misplacedCount = total - correctCount;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">Ergebnis</p>
        <p className="mt-1 font-serif text-2xl font-semibold">
          {correctCount} von {total} in passender Reihenfolge{" "}
          <span className="text-muted-foreground">({percent}%)</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {misplacedCount === 0
            ? "Kein Buch verschoben."
            : `${misplacedCount} ${
                misplacedCount === 1 ? "Buch ist" : "Bücher sind"
              } verschoben — die anderen stehen relativ zueinander richtig.`}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {encouragement(percent)}
        </p>
      </div>

      <ol className="space-y-1.5">
        {userBooks.map((book, idx) => {
          const isCorrect = lisSet.has(idx);
          const correctPos = positionInBooks.get(book.id);
          return (
            <li
              key={book.id}
              className={cn(
                "flex items-start gap-3 rounded-md border p-2 pr-3",
                isCorrect
                  ? "border-green-200 bg-green-50/60 dark:border-green-900/40 dark:bg-green-950/20"
                  : "border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/20",
              )}
            >
              <span className="mt-0.5 w-7 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                {idx + 1}.
              </span>
              <span className="mt-0.5 shrink-0">
                {isCorrect ? (
                  <Check className="h-4 w-4 text-green-700 dark:text-green-400" />
                ) : (
                  <X className="h-4 w-4 text-red-700 dark:text-red-400" />
                )}
              </span>
              <div className="flex-1">
                <BookCardInline book={book} />
                {!isCorrect && correctPos !== undefined && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Kanonisch an Position {correctPos}.
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <ResultActions
        retryHref={routes.uebungen.bookOrder.play(testament, "sortieren")}
        selectionHref={routes.uebungen.bookOrder.selection()}
      />
    </div>
  );
}
