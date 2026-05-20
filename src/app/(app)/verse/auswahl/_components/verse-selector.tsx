"use client";

import { useMemo, useState } from "react";
import { Music, Play } from "lucide-react";
import { PracticeSession, type PracticeVerse } from "./practice-session";

export function VerseSelector({ verses }: { verses: PracticeVerse[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [started, setStarted] = useState(false);

  const chosen = useMemo(
    () => verses.filter((v) => selected.has(v.id)),
    [verses, selected],
  );

  if (started && chosen.length > 0) {
    return (
      <PracticeSession verses={chosen} onExit={() => setStarted(false)} />
    );
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(verses.map((v) => v.id)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={selectAll}
          className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          Alle auswählen
        </button>
        <button
          type="button"
          onClick={() => setSelected(new Set())}
          className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          Auswahl leeren
        </button>
        <span className="text-sm text-muted-foreground">
          {selected.size} ausgewählt
        </span>
      </div>

      <ul className="space-y-2">
        {verses.map((v) => {
          const isSel = selected.has(v.id);
          return (
            <li key={v.id}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                  isSel
                    ? "border-primary/50 bg-accent"
                    : "bg-card hover:bg-accent/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => toggle(v.id)}
                  className="mt-1 h-4 w-4 shrink-0"
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-serif font-semibold">
                      {v.reference}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {v.translationLabel}
                    </span>
                    {v.hasAudio && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Music className="h-3 w-3" /> Lied
                      </span>
                    )}
                  </span>
                  <span className="mt-1 line-clamp-2 block font-serif text-sm text-muted-foreground">
                    {v.text}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-0 -mx-3 flex items-center justify-end gap-3 border-t bg-background/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4">
        <button
          type="button"
          onClick={() => setStarted(true)}
          disabled={selected.size === 0}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          Übungs-Session starten ({selected.size})
        </button>
      </div>
    </div>
  );
}
