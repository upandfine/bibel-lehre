import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getVerseStats } from "./_actions";

export const metadata: Metadata = {
  title: "Verse lernen",
};

export default async function VersePage() {
  const stats = await getVerseStats();

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
        <Link
          href="/verse/lernen"
          className="group block rounded-xl border bg-card p-6 transition-colors hover:border-foreground/40 hover:bg-accent"
        >
          <p className="text-sm text-muted-foreground">Bereit?</p>
          <p className="mt-1 font-serif text-xl font-semibold">
            {stats.due} {stats.due === 1 ? "Vers" : "Verse"} jetzt lernen
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-foreground">
            Lern-Session starten
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ) : (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          {stats.total === 0 ? (
            <>
              <p className="text-foreground">Noch keine Verse angelegt.</p>
              <p className="mt-2">
                Im MVP-Stand sind die Verse aus dem Seed automatisch verfügbar
                (sichtbar als „public" im Katalog). Eigene Verse anlegen kannst
                du in der nächsten Phase.
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
