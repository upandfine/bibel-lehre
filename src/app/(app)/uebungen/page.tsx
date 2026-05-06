import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Übungen",
};

export default function UebungenPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          Übungen
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kleine Trainingseinheiten ohne Druck — übe, was du gerade vertiefen
          möchtest.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/uebungen/buecher-reihenfolge"
          className="group rounded-xl border bg-card p-6 transition-colors hover:border-foreground/40"
        >
          <h2 className="font-medium">Bücher der Bibel</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Bringe die 66 Bücher in die richtige Reihenfolge — wahlweise per
            Sortieren oder freiem Schreiben.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground">
            Jetzt üben
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <div className="rounded-xl border border-dashed bg-card/50 p-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Weitere Übungen</p>
          <p className="mt-2">
            Karteikarten und kleine Quizze folgen in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}
