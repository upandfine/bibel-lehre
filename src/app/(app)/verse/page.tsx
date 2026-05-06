import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verse lernen",
};

export default function VersePage() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl font-bold tracking-tight">
        Verse lernen
      </h1>
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        <p className="text-foreground">Bald verfügbar.</p>
        <p className="mt-2">
          Hier wirst du Bibelverse mit zeitversetzter Wiederholung lernen —
          jeden Tag genau so viel, wie dein Gedächtnis braucht, um sie behalten
          zu können.
        </p>
      </div>
    </div>
  );
}
