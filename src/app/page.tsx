export default function HomePage() {
  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="max-w-2xl space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Bib-Inside
        </h1>
        <p className="text-lg text-muted-foreground">
          Lern-App für strukturierte biblische Lehrkurse — Verse, Bücher-Reihenfolge,
          Karteikarten und mehr.
        </p>
        <div className="rounded-lg border bg-card p-6 text-left text-sm text-card-foreground">
          <p className="font-medium">Setup steht.</p>
          <p className="mt-2 text-muted-foreground">
            Nächste Schritte: Auth.js konfigurieren, erste Migrations laufen lassen,
            Bibelbücher als Seed importieren, dann das erste Modul „Bibliologie"
            anlegen.
          </p>
        </div>
      </div>
    </main>
  );
}
