import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lehrkurs",
};

export default function LehrkursPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl font-bold tracking-tight">Lehrkurs</h1>
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        <p className="text-foreground">Bald verfügbar.</p>
        <p className="mt-2">
          Hier wirst du den biblischen Lehrkurs Modul für Modul durcharbeiten —
          mit Lektionen, Aufgaben zum Selbststudium und Vorbereitung für die
          Treffen.
        </p>
      </div>
    </div>
  );
}
