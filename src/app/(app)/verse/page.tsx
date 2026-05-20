import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Eye, ListChecks, Pencil, Settings } from "lucide-react";
import { getOptionalUser } from "@/lib/session";
import { getVerseStats } from "./_actions";

export const metadata: Metadata = {
  title: "Verse lernen",
};

export default async function VersePage() {
  const [stats, user] = await Promise.all([
    getVerseStats(),
    getOptionalUser(),
  ]);
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          Verse lernen
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bibelverse mit zeitversetzter Wiederholung lernen — jeden Tag genau so
          viel, wie dein Gedächtnis braucht.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Heute fällig" value={stats.due} highlight />
        <StatCard label="Noch nie geübt" value={stats.neverLearned} />
        <StatCard label="Insgesamt" value={stats.total} />
      </section>

      {stats.due > 0 ? (
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Bereit? {stats.due} {stats.due === 1 ? "Vers" : "Verse"} fällig —
            wähle, wie du heute üben willst.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/verse/lernen"
              className="group flex flex-col gap-2 rounded-xl border bg-card p-5 transition-colors hover:border-foreground/40 hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="font-medium">Standard</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Stelle ansehen, im Kopf aufsagen, Vers aufdecken, selbst
                bewerten.
              </p>
              <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-foreground">
                Starten
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>

            <Link
              href="/verse/lueckentext"
              className="group flex flex-col gap-2 rounded-xl border bg-card p-5 transition-colors hover:border-foreground/40 hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                <span className="font-medium">Lückentext</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Ein Teil der Wörter ist ausgeblendet — fülle die Lücken
                selbst aus.
              </p>
              <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-foreground">
                Starten
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </section>
      ) : (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          {stats.total === 0 ? (
            <>
              <p className="text-foreground">Noch keine Verse angelegt.</p>
              <p className="mt-2">
                Die mitgelieferten Verse sind automatisch verfügbar. Eigene
                Verse legst du unter „Verse verwalten“ an.
              </p>
            </>
          ) : (
            <>
              <p className="text-foreground">
                Heute keine Verse fällig — gut gemacht.
              </p>
              <p className="mt-2">
                Schau morgen wieder vorbei, oder lerne an einem anderen Tag in
                Ruhe weiter.
              </p>
            </>
          )}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/verse/auswahl"
          className="group flex flex-col gap-2 rounded-xl border bg-card p-5 transition-colors hover:border-foreground/40 hover:bg-accent"
        >
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            <span className="font-medium">Eigene Auswahl üben</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Bestimmte Verse gezielt durchgehen — ohne Einfluss auf die
            zeitversetzte Wiederholung.
          </p>
          <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-foreground">
            Auswählen
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          href="/verse/verwalten"
          className="group flex flex-col gap-2 rounded-xl border bg-card p-5 transition-colors hover:border-foreground/40 hover:bg-accent"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="font-medium">Verse verwalten</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Eigene Lernverse anlegen, bearbeiten und ein Lied (MP3/WAV) zum Vers hinterlegen."
              : "Eigene private Lernverse anlegen und bearbeiten."}
          </p>
          <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-foreground">
            Öffnen
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-lg border-2 border-primary/30 bg-card p-4"
          : "rounded-lg border bg-card p-4"
      }
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}
