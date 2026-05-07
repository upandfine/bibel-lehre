import type { Metadata } from "next";
import Link from "next/link";
import { BackLink } from "@/app/(app)/uebungen/buecher-reihenfolge/_components/back-button";
import { getDueVerses } from "../_actions";
import { ClozeSession } from "./_components/cloze-session";

export const metadata: Metadata = {
  title: "Lückentext",
};

export default async function VerseClozePage() {
  const verses = await getDueVerses();

  if (verses.length === 0) {
    return (
      <div className="space-y-4">
        <BackLink href="/verse" label="Zurück zur Übersicht" />
        <div className="rounded-xl border bg-card p-6">
          <p className="font-serif text-xl font-semibold">
            Heute keine Verse fällig.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Komm morgen gerne wieder.
          </p>
          <Link
            href="/verse"
            className="mt-4 inline-flex rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Zurück zur Übersicht
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BackLink href="/verse" label="Zurück zur Übersicht" />
      <ClozeSession verses={verses} />
    </div>
  );
}
