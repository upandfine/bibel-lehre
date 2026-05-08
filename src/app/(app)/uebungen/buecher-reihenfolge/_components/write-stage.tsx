"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";
import { storageKeyFor, type Book } from "./types";

export function WriteStage({
  books,
  testament,
}: {
  books: Book[];
  testament: "AT" | "NT";
}) {
  const router = useRouter();
  const [userInputs, setUserInputs] = useState<string[]>(() =>
    books.map(() => ""),
  );

  function setAt(index: number, value: string) {
    const next = [...userInputs];
    next[index] = value;
    setUserInputs(next);
  }

  function handleCheck() {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        storageKeyFor(testament, "schreiben"),
        JSON.stringify({ mode: "schreiben", userInputs }),
      );
    }
    router.push(routes.uebungen.bookOrder.result(testament, "schreiben"));
  }

  return (
    <div className="space-y-4">
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
              className="flex-1 rounded-sm bg-transparent px-2 py-2 text-base outline-none focus:bg-accent sm:py-1 sm:text-sm"
              placeholder="..."
            />
          </li>
        ))}
      </ol>

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
