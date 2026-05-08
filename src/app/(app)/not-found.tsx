import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="rounded-xl border bg-card p-6">
      <h1 className="font-serif text-2xl font-bold tracking-tight">
        Diese Seite kennen wir nicht
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Vielleicht gehört die Adresse zu einer Funktion, die noch nicht
        implementiert ist — oder der Link ist veraltet.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/dashboard"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Zum Dashboard
        </Link>
        <Link
          href="/uebungen"
          className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Übungen
        </Link>
      </div>
    </div>
  );
}
