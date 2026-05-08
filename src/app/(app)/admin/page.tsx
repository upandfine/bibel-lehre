import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Admin-Bereich",
};

export default async function AdminPage() {
  await requireAdmin();

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl font-bold tracking-tight">
        Admin-Bereich
      </h1>
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        <p className="text-foreground">Bald verfügbar.</p>
        <p className="mt-2">
          Hier wirst du Lehrkurse, Module, Lektionen und Aufgaben verwalten —
          das wird das größte Phase-1-Modul.
        </p>
      </div>
    </div>
  );
}
