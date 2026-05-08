import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      <h1 className="font-serif text-3xl font-bold tracking-tight">
        Seite nicht gefunden
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Diese Adresse kennen wir nicht. Vielleicht stammt der Link aus einer
        älteren Version oder hat sich verschrieben.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          href="/"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Zur Startseite
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Zum Dashboard
        </Link>
      </div>
    </main>
  );
}
