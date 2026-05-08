"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import { BookCardInline } from "./book-card";
import { ResultActions } from "./result-actions";
import { storageKeyFor, type Book } from "./types";
import { encouragement, isInputCorrect } from "./utils";

export function WriteResult({
  books,
  testament,
}: {
  books: Book[];
  testament: "AT" | "NT";
}) {
  const router = useRouter();
  const [userInputs, setUserInputs] = useState<string[] | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(
      storageKeyFor(testament, "schreiben"),
    );
    if (!raw) {
      router.replace(routes.uebungen.bookOrder.play(testament, "schreiben"));
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.mode === "schreiben" && Array.isArray(parsed.userInputs)) {
        setUserInputs(parsed.userInputs);
      } else {
        router.replace(routes.uebungen.bookOrder.play(testament, "schreiben"));
      }
    } catch {
      router.replace(routes.uebungen.bookOrder.play(testament, "schreiben"));
    }
  }, [router, testament]);

  if (!userInputs) {
    return (
      <p className="text-sm text-muted-foreground">Lade Auswertung …</p>
    );
  }

  const evaluations = books.map((expected, idx) => {
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

      <ResultActions
        retryHref={routes.uebungen.bookOrder.play(testament, "schreiben")}
        selectionHref={routes.uebungen.bookOrder.selection()}
      />
    </div>
  );
}
