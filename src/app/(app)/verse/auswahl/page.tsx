import type { Metadata } from "next";
import { BackLink } from "@/app/(app)/uebungen/buecher-reihenfolge/_components/back-button";
import { getUserIdOrThrow } from "@/lib/session";
import { findVisibleVerses } from "@/lib/repositories/verses";
import { VerseSelector } from "./_components/verse-selector";

export const metadata: Metadata = {
  title: "Eigene Auswahl üben",
};

export default async function VerseAuswahlPage() {
  const userId = await getUserIdOrThrow();
  const verses = await findVisibleVerses(userId);

  return (
    <div className="space-y-6">
      <BackLink href="/verse" label="Zurück zur Übersicht" />
      <header>
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          Eigene Auswahl üben
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wähle gezielt Verse aus und übe sie frei durch — ohne dass deine
          normale Wiederholungs-Planung dadurch verändert wird.
        </p>
      </header>

      {verses.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          Noch keine Verse vorhanden.
        </div>
      ) : (
        <VerseSelector
          verses={verses.map((v) => ({
            id: v.id,
            reference:
              v.verseFrom === v.verseTo
                ? `${v.bookAbbr} ${v.chapter},${v.verseFrom}`
                : `${v.bookAbbr} ${v.chapter},${v.verseFrom}–${v.verseTo}`,
            text: v.text,
            translationLabel: v.translationFullName,
            attribution: v.attribution,
            hasAudio: v.hasAudio,
          }))}
        />
      )}
    </div>
  );
}
