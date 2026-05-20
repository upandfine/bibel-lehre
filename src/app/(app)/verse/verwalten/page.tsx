import type { Metadata } from "next";
import { BackLink } from "@/app/(app)/uebungen/buecher-reihenfolge/_components/back-button";
import { requireUser } from "@/lib/session";
import { findAllBooks } from "@/lib/repositories/books";
import { findAllTranslations } from "@/lib/repositories/translations";
import { findManagedVerses } from "@/lib/repositories/verses";
import { VerseManager } from "./_components/verse-manager";

export const metadata: Metadata = {
  title: "Verse verwalten",
};

export default async function VerseVerwaltenPage() {
  const user = await requireUser("/verse/verwalten");
  const isAdmin = user.role === "admin";

  const [verses, books, translations] = await Promise.all([
    findManagedVerses(user.id),
    findAllBooks(),
    findAllTranslations(),
  ]);

  return (
    <div className="space-y-6">
      <BackLink href="/verse" label="Zurück zur Übersicht" />
      <header>
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          Verse verwalten
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAdmin
            ? "Eigene Lernverse anlegen — Stelle, Übersetzung und Text. Optional ein Lied (MP3/WAV) zum Vers. Öffentliche Verse stehen allen Lernenden im SRS zur Verfügung, genau wie die mitgelieferten."
            : "Eigene Lernverse anlegen — Stelle, Übersetzung und Text. Deine Verse sind privat und nur für dich sichtbar."}
        </p>
      </header>

      <VerseManager
        isAdmin={isAdmin}
        verses={verses}
        books={books.map((b) => ({
          id: b.id,
          nameDe: b.nameDe,
          abbr: b.abbr,
        }))}
        translations={translations.map((t) => ({
          id: t.id,
          fullName: t.fullName,
        }))}
      />
    </div>
  );
}
